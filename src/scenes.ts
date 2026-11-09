import Phaser from 'phaser';
import {
  CLASSIC_AIR_ROWS, CLASSIC_ACTOR_MOVE_TICKS, CLASSIC_BASE_TICK_MS, CLASSIC_CELL_WIDTH,
  CLASSIC_TORPEDO_MOVE_TICKS, CLASSIC_SURFACE_MOVE_TICKS, DYNAMIC_TORPEDO_SPEED,
  CLASSIC_ROW_Y, COLOURS, ENTRY_STEP_MS, LIVES, PLAYER_COLUMNS, PLAYER_DEPTHS, SCREEN,
  advanceWarpCode, canFire, chooseBest, classicPlaneRow, classicTickMs, speedScale,
  planePoseForMotion,
  torpedoUnlocked,
  stageAfter, stageGoal, stageTarget,
  type BestRun, type GameMode, type StageNumber, type StagePosition,
} from './config';
import { installSprites, createEtchedImage } from './sprites';
import { sweptBoxesOverlap, type Box } from './collision';
import { LcdHud } from './lcd';
import { drawLcdBackdrop } from './lcd-background';
import { droppedBombAppearance } from './drop-appearance';
import { applyScore, INTERCEPT_POINTS } from './scoring';
import { chooseEntryDirection, exitEdge, type ScreenEdge } from './spawn-continuity';
import { addLabel } from './labels';
import {
  keyToControl, setControlScreen, setPauseOpen, subscribeControls, type GameControl,
} from './controls';
import {
  CLASSIC_COLUMNS, CLASSIC_HALF_COLUMNS, CLASSIC_HALF_ROWS, CLASSIC_QUARTER_COLUMNS,
  CLASSIC_SURFACE_ROW, CLASSIC_SUB_ROWS, classicHalfColumnX, classicQuarterColumnX,
  classicHalfRowY, classicHalfHitsCell, classicQuarterHitsCell, classicMissileBombContact,
  classicMissileQuarterBombContact,
  classicSubAction, classicTorpedoDirection, classicTorpedoY,
  classicTorpedoesContact, chooseSubPattern, dynamicSubAction, dynamicSubDepthProgress,
  classicBombFlight, classicBombQuarterStep, classicPlaneCanRelease,
  classicAdjacentBombThreat, type ClassicBombFlight, type SubPattern,
} from './classic-grid';

// Shared across runs within this browser page, but never persisted to storage.
let sessionBest: BestRun = { score: 0, cycle: 1, stage: 1 };

type EnemyKind = 'plane' | 'sweeper' | 'sub';
type ShotKind = 'missile' | 'torpedo' | 'bomb' | 'charge' | 'enemyTorpedo';

type Enemy = {
  kind: EnemyKind;
  image: Phaser.GameObjects.Image;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  baseY: number;
  direction: -1 | 1;
  speed: number;
  phase: number;
  nextShotAt: number;
  shot: Shot | null;
  ticksAlive: number;
  gridColumn: number;
  gridRow: number;
  shotsFired: number;
  reconnaissance: boolean;
  activeBombs: number;
  subPattern: SubPattern;
  spawnedAt: number;
  initialGridRow: number;
};

type Shot = {
  kind: ShotKind;
  image: Phaser.GameObjects.Image;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  owner: Enemy | null;
  halfColumn: number;
  quarterColumn: number;
  prevQuarterColumn: number;
  halfRow: number;
  stepColumn: number;
  stepRow: number;
  bombFlight: ClassicBombFlight;
  driftDirection: -1 | 1;
  ticksInFlight: number;
  emergencyIntercept: Shot | null;
  prevHalfColumn: number;
};

function drawLandscape(scene: Phaser.Scene): void {
  drawLcdBackdrop(scene);
}


export class MenuScene extends Phaser.Scene {
  constructor() { super('menu'); }

  preload(): void {
    this.load.image('coverArt', './cover.webp');
  }

  create(): void {
    setPauseOpen(false);
    setControlScreen('menu');
    this.cameras.main.setBackgroundColor(COLOURS.background);
    // The original cover is a static title illustration, not a game sprite.
    this.add.image(480, 197, 'coverArt').setDisplaySize(690, 388);
    const frame = this.add.graphics();
    frame.lineStyle(3, COLOURS.dark, 0.9).strokeRoundedRect(133, 1, 694, 392, 6);

    const modeButton = (x: number, mode: 'classic' | 'modern',
      number: string, title: string, description: string): void => {
      const button = this.add.rectangle(x, 451, 276, 80, COLOURS.dark)
        .setStrokeStyle(2, COLOURS.mid)
        .setInteractive({ useHandCursor: true });
      button.on('pointerdown', () => this.startMode(mode));
      addLabel(this, x, 433, `${number}   ${title}`, 25, '#f7efd6').setOrigin(0.5);
      addLabel(this, x, 465, description, 15, '#d5dac8').setOrigin(0.5);
    };
    modeButton(321, 'classic', '1', 'CLASSIC', 'LCD HANDHELD STYLE');
    modeButton(639, 'modern', '2', 'MODERN', 'ARCADE STYLE');
    addLabel(this, 480, 518, 'TAP A MODE OR PRESS 1 / 2', 15).setOrigin(0.5);
    let warpSequence = '';
    const onKey = (event: KeyboardEvent): void => {
      if (event.repeat) return;
      const warp = advanceWarpCode(warpSequence, event.code);
      warpSequence = warp.sequence;
      // At the menu, a warp begins a Classic game at the requested stage.
      if (warp.target) {
        this.scene.start('battle', { mode: 'classic', warp: warp.target });
        return;
      }
      if (warpSequence) return;
      const control = keyToControl(event.code);
      if (control === 'classic' || control === 'modern') this.startMode(control);
    };
    const stopTouch = subscribeControls(control => {
      if (control === 'classic' || control === 'modern') this.startMode(control);
    });
    this.input.keyboard?.on('keydown', onKey);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown', onKey);
      stopTouch();
    });
  }

  private startMode(control: 'classic' | 'modern'): void {
    this.scene.start('battle', { mode: control === 'classic' ? 'classic' : 'dynamic' });
  }
}

export class BattleScene extends Phaser.Scene {
  private mode: GameMode = 'classic';
  private elapsed = 0;
  private classicAccumulator = 0;
  private cycle = 1;
  private stage: StageNumber = 1;
  private columns = 2;
  private depth = 1;
  private facing: -1 | 1 = 1;
  private player!: Phaser.GameObjects.Image;
  private enemies: Enemy[] = [];
  private shots: Shot[] = [];
  private missile: Shot | null = null;
  private torpedo: Shot | null = null;
  private playerLives = LIVES;
  private score = 0;
  private state: 'entering' | 'playing' | 'exploding' | 'gameOver' = 'entering';
  private stageKills = 0;
  private pendingStageAdvance = false;
  private nextPlane = 0;
  private nextSweeper = 0;
  private nextEnemySub = 0;
  private lastLaunchX = 0;
  private lastLaunchTime = -100000;
  private lastPlaneExit: { edge: ScreenEdge; at: number } | null = null;
  private hud!: LcdHud;
  private gameOverHint!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;
  private warpSequence = '';
  private startWarp: StagePosition | null = null;
  private entryTone: OscillatorNode | null = null;
  private paused = false;

  constructor() { super('battle'); }

  init(data: { mode?: GameMode; warp?: StagePosition }): void {
    this.mode = data.mode === 'dynamic' ? 'dynamic' : 'classic';
    this.startWarp = data.warp ?? null;
    this.warpSequence = '';
    this.entryTone = null;
    this.paused = false;
    this.cycle = 1;
    this.stage = 1;
    this.columns = 2;
    this.depth = 1;
    this.facing = 1;
    this.enemies = [];
    this.shots = [];
    this.missile = null;
    this.torpedo = null;
    this.playerLives = LIVES;
    this.score = 0;
    this.lastPlaneExit = null;
    this.state = 'entering';
    this.stageKills = 0;
    this.pendingStageAdvance = false;
    this.resetSpawns();
  }

  create(): void {
    setPauseOpen(false);
    setControlScreen('battle');
    if (!this.textures.exists('player')) installSprites(this);
    drawLandscape(this);
    this.hud = new LcdHud(this, this.mode);
    this.player = createEtchedImage(this, PLAYER_COLUMNS[4], PLAYER_DEPTHS[1], 'player').setDepth(5);
    this.banner = addLabel(this, 230, 235, '', 25).setDepth(30);
    this.gameOverHint = addLabel(this, 370, 509, 'ESC  PAUSE / MENU', 16).setDepth(30).setVisible(false);
    this.drawHud();
    if (this.startWarp) {
      this.warpTo(this.startWarp);
    } else {
      this.showStageBanner();
      this.beginEntry();
    }

    const onKey = (event: KeyboardEvent): void => {
      const control = keyToControl(event.code);
      if (control && ['left', 'right', 'up', 'down', 'missile'].includes(control)) {
        event.preventDefault();
      }
      if (control === 'menu') { this.handleControl('menu', event.repeat); return; }
      if (this.paused) return;

      // Stage warps are keyboard-only and may be entered during submarine entry.
      if (!event.repeat && (this.state === 'entering' || this.state === 'playing')) {
        const warp = advanceWarpCode(this.warpSequence, event.code);
        this.warpSequence = warp.sequence;
        if (warp.target) { this.warpTo(warp.target); return; }
        if (this.warpSequence) return;
      }
      if (control) this.handleControl(control, event.repeat);
    };
    const stopTouch = subscribeControls((control, repeated) => this.handleControl(control, repeated));
    this.input.keyboard?.on('keydown', onKey);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.paused = false;
      setPauseOpen(false);
      this.input.keyboard?.off('keydown', onKey);
      stopTouch();
    });
  }

  private handleControl(control: GameControl, repeated = false): void {
    if (control === 'menu') {
      if (repeated) return;
      if (this.paused) this.resumeGame();
      else this.pauseGame();
      return;
    }
    if (control === 'resume') { if (this.paused) this.resumeGame(); return; }
    if (control === 'quit') { if (this.paused) this.returnToMenu(); return; }
    if (this.paused || this.state !== 'playing') return;
    if (control === 'left') {
      this.columns = Math.max(0, this.columns - 1);
      this.facing = -1;
    } else if (control === 'right') {
      this.columns = Math.min(PLAYER_COLUMNS.length - 1, this.columns + 1);
      this.facing = 1;
    } else if (control === 'up') {
      this.depth = 0;
    } else if (control === 'down') {
      this.depth = 1;
    } else if (control === 'missile' && !repeated) {
      this.firePlayerMissile();
    } else if (control === 'torpedo' && !repeated) {
      this.firePlayerTorpedo();
    } else {
      return;
    }
    this.player.setPosition(PLAYER_COLUMNS[this.columns], PLAYER_DEPTHS[this.depth]);
    this.player.setFlipX(this.facing === -1);
  }

  private pauseGame(): void {
    if (this.paused) return;
    this.paused = true;
    // Pause the scene clock and tweens, including delayed entry and death callbacks.
    this.scene.pause();
    setPauseOpen(true);
  }

  private resumeGame(): void {
    if (!this.paused) return;
    this.paused = false;
    setPauseOpen(false);
    this.scene.resume();
  }

  private returnToMenu(): void {
    // Resume before transitioning so the old scene can shut down normally.
    this.paused = false;
    setPauseOpen(false);
    this.scene.resume();
    this.scene.start('menu');
  }

  private drawHud(): void {
    this.hud.render(this.cycle, this.stage, this.score, this.playerLives, sessionBest, this.state === 'gameOver');
  }

  private resetSpawns(): void {
    this.elapsed = 0;
    this.classicAccumulator = 0;
    this.nextPlane = 850;
    this.nextSweeper = 1800;
    this.nextEnemySub = 3000;
    this.lastLaunchTime = -100000;
    this.lastPlaneExit = null;
  }

  private clearBattlefield(): void {
    for (const shot of [...this.shots]) this.destroyShot(shot);
    for (const enemy of [...this.enemies]) this.removeEnemy(enemy, false);
    this.enemies = [];
    this.shots = [];
    this.missile = null;
    this.torpedo = null;
  }

  private playEntryChirp(pose: 0 | 1 | 2): void {
    // Emit one short oscillator chirp for each submarine entry position.
    const audio = this.sound as Phaser.Sound.WebAudioSoundManager;
    const context = audio.context;
    if (!context || context.state !== 'running') return;
    const tone = context.createOscillator();
    const volume = context.createGain();
    const time = context.currentTime;
    const pitch = [410, 430, 370][pose];
    const duration = pose === 2 ? 0.22 : 0.16;
    tone.type = 'square';
    tone.frequency.setValueAtTime(pitch, time);
    tone.frequency.setValueAtTime(pitch * 0.92, time + 0.055);
    tone.frequency.exponentialRampToValueAtTime(pitch * 0.71, time + duration);
    volume.gain.setValueAtTime(0.0001, time);
    volume.gain.linearRampToValueAtTime(0.012, time + 0.008);
    volume.gain.setValueAtTime(0.010, time + 0.045);
    volume.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    tone.connect(volume);
    volume.connect(context.destination);
    tone.start(time);
    tone.stop(time + duration + 0.012);
    this.entryTone = tone;
    tone.onended = () => { if (this.entryTone === tone) this.entryTone = null; };
  }

  private beginEntry(): void {
    // Every new submarine enters on the lower lane: 5 -> 4 -> 3, then controls unlock.
    this.state = 'entering';
    this.stageKills = 0;
    this.pendingStageAdvance = false;
    this.resetSpawns();
    this.columns = 4;
    this.depth = 1;
    this.facing = -1;
    this.player.setVisible(true).setAlpha(1).setFlipX(true);
    this.player.setPosition(PLAYER_COLUMNS[4], PLAYER_DEPTHS[1]);
    this.gameOverHint.setVisible(false);
    this.drawHud();
    this.playEntryChirp(0);
    this.time.delayedCall(ENTRY_STEP_MS, () => {
      if (this.state !== 'entering') return;
      this.columns = 3;
      this.player.x = PLAYER_COLUMNS[3];
      this.playEntryChirp(1);
    });
    this.time.delayedCall(ENTRY_STEP_MS * 2, () => {
      if (this.state !== 'entering') return;
      this.columns = 2;
      this.player.x = PLAYER_COLUMNS[2];
      this.playEntryChirp(2);
    });
    this.time.delayedCall(ENTRY_STEP_MS * 3, () => {
      if (this.state !== 'entering') return;
      this.state = 'playing';
    });
  }

  private warpTo(target: StagePosition): void {
    if (this.state === 'exploding' || this.state === 'gameOver') return;
    // Stop the current chirp when a stage warp interrupts entry.
    if (this.entryTone) {
      try { this.entryTone.stop(); } catch { /* Audio may have already stopped. */ }
      this.entryTone = null;
    }
    this.clearBattlefield();
    this.cycle = target.cycle;
    this.stage = target.stage;
    this.stageKills = 0;
    this.pendingStageAdvance = false;
    this.resetSpawns();
    this.warpSequence = '';
    this.columns = 2;
    this.depth = 1;
    this.facing = 1;
    this.player.setPosition(PLAYER_COLUMNS[this.columns], PLAYER_DEPTHS[this.depth])
      .setVisible(true).setAlpha(1).setFlipX(false);
    this.gameOverHint.setVisible(false);
    this.state = 'playing';
    this.drawHud();
    this.showStageBanner();
  }

  private advanceStage(): void {
    this.pendingStageAdvance = false;
    this.clearBattlefield();
    const next = stageAfter(this.cycle, this.stage);
    this.cycle = next.cycle;
    this.stage = next.stage;
    this.stageKills = 0;
    this.resetSpawns();
    this.drawHud();
    this.showStageBanner();
  }

  private showStageBanner(): void {
    const headings = ['AIR ATTACK', 'SURFACE SWEEPERS', 'ENEMY SUBMARINES'];
    this.banner.setText(`${this.cycle}-${this.stage}   ${headings[this.stage - 1]}    0/${stageGoal(this.cycle, this.stage)}`);
    this.tweens.killTweensOf(this.banner);
    this.banner.setVisible(true).setAlpha(1);
    this.tweens.add({ targets: this.banner, alpha: 0, delay: 1500, duration: 250 });
  }

  private spawnEnemy(kind: EnemyKind): void {
    const direction: -1 | 1 = kind === 'plane'
      ? chooseEntryDirection(
          Math.random(), this.lastPlaneExit?.edge ?? null,
          this.lastPlaneExit === null ? Infinity : this.elapsed * 1000 - this.lastPlaneExit.at,
        )
      : Math.random() < 0.5 ? 1 : -1;
    const isSub = kind === 'sub';
    const airRow = Math.floor(Math.random() * CLASSIC_AIR_ROWS.length);
    const gridColumn = direction === 1 ? 0 : CLASSIC_COLUMNS - 1;
    const gridRow = kind === 'plane' ? airRow :
      kind === 'sweeper' ? CLASSIC_SURFACE_ROW : CLASSIC_SUB_ROWS[Math.random() < 0.5 ? 0 : 1];
    const y = this.mode === 'classic' ? CLASSIC_ROW_Y[gridRow] :
      kind === 'plane' ? Phaser.Utils.Array.GetRandom([105, 146, 186]) :
        kind === 'sweeper' ? SCREEN.waterline - 13 : CLASSIC_ROW_Y[gridRow];
    const x = this.mode === 'classic' ? PLAYER_COLUMNS[gridColumn] :
      isSub ? (direction === 1 ? 29 : SCREEN.width - 29) :
        (direction === 1 ? -65 : SCREEN.width + 65);
    const enemy: Enemy = {
      kind,
      image: createEtchedImage(this, x, y, kind === 'sub' ? 'enemySub' : kind).setDepth(3),
      x, y, prevX: x, prevY: y, baseY: y, direction,
      speed: kind === 'plane' ? 94 : kind === 'sweeper' ? 39 : 41,
      phase: Math.random() * Math.PI * 2,
      nextShotAt: this.elapsed * 1000 + (kind === 'sub' ? 1400 : 800) + Math.random() * 1200,
      shot: null, ticksAlive: 0, gridColumn, gridRow, shotsFired: 0,
      // Some Classic flights are reconnaissance and never release bombs.
      reconnaissance: kind === 'plane' && this.mode === 'classic' && Math.random() < 0.30,
      activeBombs: 0,
      subPattern: chooseSubPattern(Math.random()),
      spawnedAt: this.elapsed * 1000,
      initialGridRow: gridRow,
    };
    enemy.image.setFlipX(direction === -1);
    this.enemies.push(enemy);
  }

  private addShot(kind: ShotKind, x: number, y: number, vx: number, vy: number, owner: Enemy | null): Shot {
    const texture = kind === 'missile' ? 'missile' : kind === 'torpedo' || kind === 'enemyTorpedo' ? 'torpedo' : 'bomb';
    const shot: Shot = {
      kind, image: createEtchedImage(this, x, y, texture).setDepth(4),
      x, y, prevX: x, prevY: y, vx, vy, owner,
      halfColumn: -1, quarterColumn: -1, prevQuarterColumn: -1,
      halfRow: -1, stepColumn: 0, stepRow: 0,
      bombFlight: 'straight', driftDirection: 1, ticksInFlight: 0,
      emergencyIntercept: null,
      prevHalfColumn: -1,
    };
    shot.image.setFlipX(vx < 0);
    this.shots.push(shot);
    if (owner) {
      // Unlike enemy torpedoes, Classic aircraft bombs may overlap in flight.
      if (this.mode === 'classic' && owner.kind === 'plane' && kind === 'bomb') {
        owner.activeBombs++;
      } else if (owner.kind !== 'sub') {
        // A submarine's planned second attack is independent of its first torpedo.
        owner.shot = shot;
      }
    }
    return shot;
  }

  private addClassicShot(
    kind: ShotKind, halfColumn: number, halfRow: number,
    stepColumn: number, stepRow: number, owner: Enemy | null,
  ): Shot {
    const shot = this.addShot(kind, classicHalfColumnX(halfColumn),
      classicHalfRowY(halfRow), 0, 0, owner);
    shot.halfColumn = halfColumn;
    shot.halfRow = halfRow;
    shot.prevHalfColumn = halfColumn;
    shot.stepColumn = stepColumn;
    shot.stepRow = stepRow;
    if (kind === 'torpedo' || kind === 'enemyTorpedo') {
      shot.y = classicTorpedoY(halfRow);
      shot.image.setPosition(shot.x, shot.y);
    }
    shot.image.setFlipX(stepColumn < 0);
    return shot;
  }

  private firePlayerMissile(): void {
    if (!canFire('missile', this.missile !== null, this.torpedo !== null)) return;
    if (this.mode === 'classic') {
      // Missile launches from one half of the current submarine cell.
      // Turning the sub (by moving left/right) selects its fore/aft half.
      const halfColumn = this.columns * 2 + (this.facing === 1 ? 1 : 0);
      this.missile = this.addClassicShot('missile', halfColumn, (4 + this.depth) * 2, 0, -1, null);
      // A diagonal bomb can otherwise be impossible to intercept with a
      // vertical-only missile. If it will hit from the neighbouring cell,
      // arm an emergency interception for the next shared clock tick.
      this.missile.emergencyIntercept = this.shots.find((shot) =>
        shot.kind === 'bomb' && classicAdjacentBombThreat(
          shot.quarterColumn, shot.halfRow, shot.bombFlight,
          shot.ticksInFlight, shot.driftDirection, this.columns, 4 + this.depth,
        ),
      ) ?? null;
    } else {
      this.missile = this.addShot('missile', PLAYER_COLUMNS[this.columns],
        PLAYER_DEPTHS[this.depth] - 26, 0, -330, null);
    }
    this.lastLaunchX = PLAYER_COLUMNS[this.columns];
    this.lastLaunchTime = this.elapsed * 1000;
  }

  private firePlayerTorpedo(): void {
    if (!torpedoUnlocked(this.cycle, this.stage) ||
        !canFire('torpedo', this.missile !== null, this.torpedo !== null)) return;
    if (this.mode === 'classic') {
      const target = this.enemies.find((enemy) => enemy.kind === 'sub');
      const direction = classicTorpedoDirection(
        this.columns, target?.gridColumn ?? null, this.facing,
      );
      this.torpedo = this.addClassicShot(
        'torpedo', this.columns * 2 + (direction === 1 ? 1 : 0),
        (4 + this.depth) * 2 + 1, direction, 0, null,
      );
    } else {
      this.torpedo = this.addShot(
        'torpedo', PLAYER_COLUMNS[this.columns] + this.facing * 43,
        PLAYER_DEPTHS[this.depth], this.facing * DYNAMIC_TORPEDO_SPEED, 0, null,
      );
    }
    this.lastLaunchX = PLAYER_COLUMNS[this.columns];
    this.lastLaunchTime = this.elapsed * 1000;
  }

  private setBombAppearance(shot: Shot, flight: ClassicBombFlight | null, lateralSpeed: number): void {
    if (shot.kind !== 'bomb') return;
    const appearance = droppedBombAppearance(flight, lateralSpeed);
    shot.image.setTexture(appearance.texture)
      .setDisplaySize(appearance.texture === 'angledBomb' ? 18 : 12, 12)
      .setAngle(appearance.angle);
  }

  private fireEnemy(enemy: Enemy): void {
    if (this.mode === 'classic' && enemy.kind === 'plane') {
      if (!classicPlaneCanRelease(enemy.reconnaissance, enemy.activeBombs)) return;
    } else if (enemy.shot && enemy.kind !== 'sub') return;

    const kind: ShotKind = enemy.kind === 'sub' ? 'enemyTorpedo' :
      enemy.kind === 'plane' ? 'bomb' : 'charge';
    if (this.mode === 'classic') {
      const halfColumn = enemy.gridColumn * 2 +
        (enemy.kind === 'sub' ? (enemy.gridColumn === 0 ? 1 : 0) : Math.floor(Math.random() * 2));
      const horizontal = enemy.kind === 'sub' ? (enemy.gridColumn === 0 ? 1 : -1) : 0;
      const vertical = enemy.kind === 'sub' ? 0 : 1;
      const shot = this.addClassicShot(kind, halfColumn, enemy.gridRow * 2 + 1,
        horizontal, vertical, enemy);
      if (enemy.kind === 'plane') {
        // Start near the centre of the releasing aircraft's cell, rather than
        // jumping a half-column sideways on the first rendered frame.
        shot.quarterColumn = halfColumn * 2 + (halfColumn % 2 === 0 ? 1 : 0);
        shot.prevQuarterColumn = shot.quarterColumn;
        shot.x = classicQuarterColumnX(shot.quarterColumn);
        shot.image.setPosition(shot.x, shot.y);
        shot.bombFlight = classicBombFlight(Math.random());
        shot.driftDirection = Math.random() < 0.5 ? -1 : 1;
        this.setBombAppearance(shot, shot.bombFlight, shot.driftDirection);
      }
      if (enemy.kind === 'sub') enemy.shotsFired++;
    } else {
      let vx = 0;
      let vy = 0;
      let x = enemy.x;
      let y = enemy.y;
      const cycleScale = speedScale(this.cycle);
      if (enemy.kind === 'sub') {
        const direction = enemy.x < SCREEN.width / 2 ? 1 : -1;
        x += direction * 36;
        vx = direction * DYNAMIC_TORPEDO_SPEED * 0.92 * cycleScale;
        enemy.shotsFired++;
      } else {
        y += enemy.kind === 'plane' ? 13 : 16;
        vy = 109 * cycleScale;
        vx = (Math.random() - 0.5) * 24;
      }
      const shot = this.addShot(kind, x, y, vx, vy, enemy);
      this.setBombAppearance(shot, null, vx);
    }
    enemy.nextShotAt = this.mode === 'classic' && enemy.kind === 'plane'
      ? this.elapsed * 1000 + (5 + Math.floor(Math.random() * 5)) * classicTickMs(this.cycle)
      : this.elapsed * 1000 + 1500 + Math.random() * 2200;
  }

  private destroyShot(shot: Shot): void {
    shot.image.destroy();
    this.shots = this.shots.filter((s) => s !== shot);
    if (shot === this.missile) this.missile = null;
    if (shot === this.torpedo) this.torpedo = null;
    if (this.mode === 'classic' && shot.kind === 'bomb' && shot.owner?.kind === 'plane') {
      shot.owner.activeBombs = Math.max(0, shot.owner.activeBombs - 1);
    }
    if (shot.owner?.shot === shot) shot.owner.shot = null;
  }

  private awardPoints(points: number): void {
    const result = applyScore(this.score, this.playerLives, points, LIVES);
    this.score = result.score;
    this.playerLives = result.lives;
    sessionBest = chooseBest(sessionBest, { score: this.score, cycle: this.cycle, stage: this.stage });
    this.drawHud();
  }

  private removeEnemy(enemy: Enemy, destroyed: boolean): void {
    this.enemies = this.enemies.filter((e) => e !== enemy);
    if (enemy.kind === 'plane' && !destroyed) {
      this.lastPlaneExit = { edge: exitEdge(enemy.direction), at: this.elapsed * 1000 };
    }
    enemy.image.destroy();
    if (enemy.kind === 'sub') {
      this.nextEnemySub = this.elapsed * 1000 + 1400 + Math.random() * 1800;
    }
    if (destroyed) {
      this.awardPoints(enemy.kind === 'plane' ? 100 : enemy.kind === 'sweeper' ? 150 : 200);
      this.explode(enemy.x, enemy.y);
      if (enemy.kind === stageTarget(this.stage)) {
        this.stageKills++;
        if (this.stageKills >= stageGoal(this.cycle, this.stage)) this.pendingStageAdvance = true;
      }
      this.drawHud();
    }
    // Shots already fired by destroyed enemies continue their journeys.
  }

  private explode(x: number, y: number): void {
    const star = this.add.image(x, y, 'star').setDepth(12).setScale(1.4);
    this.tweens.add({ targets: star, scale: 0.7, duration: 200, onComplete: () => star.destroy() });
  }

  private hitPlayer(): void {
    if (this.state !== 'playing') return;
    this.state = 'exploding';
    this.tweens.killTweensOf(this.banner);
    this.banner.setVisible(false);
    this.playerLives--;
    this.explode(this.player.x, this.player.y);
    this.player.setVisible(false);
    this.drawHud();

    if (this.playerLives === 0) {
      // Freeze all enemies/projectiles at their final displayed positions.
      this.time.delayedCall(430, () => {
        if (this.state !== 'exploding') return;
        this.state = 'gameOver';
        this.gameOverHint.setVisible(true);
        this.drawHud();
      });
    } else {
      this.time.delayedCall(650, () => {
        if (this.state !== 'exploding') return;
        this.clearBattlefield();
        this.showStageBanner();
        this.beginEntry(); // Reset stage progress without resetting score or lives.
      });
    }
  }

  private shotBox(shot: Shot, previous = false): Box {
    // Game objects use the full logical segment rectangle, not opaque pixels.
    const width = shot.kind === 'torpedo' || shot.kind === 'enemyTorpedo' ? 26 :
      shot.kind === 'missile' ? 12 : 12;
    const height = shot.kind === 'missile' ? 18 :
      shot.kind === 'torpedo' || shot.kind === 'enemyTorpedo' ? 8 : 12;
    return { x: previous ? shot.prevX : shot.x, y: previous ? shot.prevY : shot.y, width, height };
  }

  private enemyBox(enemy: Enemy, previous = false): Box {
    return {
      x: previous ? enemy.prevX : enemy.x,
      y: previous ? enemy.prevY : enemy.y,
      width: enemy.kind === 'plane' ? 76 : 72,
      height: enemy.kind === 'plane' ? 38 : enemy.kind === 'sweeper' ? 22 : 24,
    };
  }

  private intersects(shot: Shot, enemy: Enemy): boolean {
    if (this.mode === 'classic') {
      return classicHalfHitsCell(shot.halfColumn, shot.halfRow, enemy.gridColumn, enemy.gridRow);
    }
    return sweptBoxesOverlap(
      this.shotBox(shot, true), this.shotBox(shot),
      this.enemyBox(enemy, true), this.enemyBox(enemy),
    );
  }

  private updateEnemies(dt: number): void {
    const now = this.elapsed * 1000;
    const scale = speedScale(this.cycle);
    for (const enemy of [...this.enemies]) {
      enemy.prevX = enemy.x;
      enemy.prevY = enemy.y;

      if (this.mode === 'classic') {
        enemy.ticksAlive++;
        if (enemy.kind === 'plane' || enemy.kind === 'sweeper') {
          // Aircraft move every four ticks; surface escorts every eight.
          const poseTicks = enemy.kind === 'sweeper' ?
            CLASSIC_SURFACE_MOVE_TICKS : CLASSIC_ACTOR_MOVE_TICKS;
          if (enemy.ticksAlive % poseTicks === 0) {
            if (enemy.kind === 'plane') {
              const delta = (Math.floor(Math.random() * 3) - 1) as -1 | 0 | 1;
              const nextRow = classicPlaneRow(enemy.gridRow, delta);
              const actualVertical = nextRow - enemy.gridRow;
              enemy.gridRow = nextRow;
              enemy.y = CLASSIC_ROW_Y[nextRow];
              const pose = planePoseForMotion(actualVertical, enemy.direction);
              enemy.image.setTexture(pose.texture).setFlipX(pose.flipX);
            }
            enemy.gridColumn += enemy.direction;
            enemy.x = PLAYER_COLUMNS[Math.max(0, Math.min(CLASSIC_COLUMNS - 1, enemy.gridColumn))] +
              (enemy.gridColumn < 0 ? -CLASSIC_CELL_WIDTH :
                enemy.gridColumn >= CLASSIC_COLUMNS ? CLASSIC_CELL_WIDTH : 0);
          }
          if (enemy.gridColumn < 0 || enemy.gridColumn >= CLASSIC_COLUMNS) {
            this.removeEnemy(enemy, false);
            continue;
          }
        } else {
          // A single intermittent enemy sub: appear, fire, optionally change
          // depth and fire again, then disappear. Shots persist when it vanishes.
          const action = classicSubAction(
            enemy.ticksAlive, enemy.shotsFired, enemy.subPattern,
          );
          if (action === 'disappear') {
            this.removeEnemy(enemy, false);
            continue;
          }
          if (action === 'change-depth') {
            enemy.gridRow = enemy.gridRow === CLASSIC_SUB_ROWS[0] ?
              CLASSIC_SUB_ROWS[1] : CLASSIC_SUB_ROWS[0];
            enemy.y = CLASSIC_ROW_Y[enemy.gridRow];
          }
          if (action === 'fire') this.fireEnemy(enemy);
        }
        enemy.image.setPosition(enemy.x, enemy.y);
        if (enemy.kind !== 'plane') enemy.image.setFlipX(enemy.direction === -1);
        if (enemy.kind === 'sub') continue;
      } else {
        // Dynamic remains continuous; only the shared player grid changes.
        const motion = 0.78 + 0.22 * Math.sin(now * 0.003 + enemy.phase);
        if (enemy.kind !== 'sub') {
          enemy.x += enemy.direction * enemy.speed * scale * motion * dt;
          if (enemy.kind === 'plane') {
            const angle = now * 0.0018 + enemy.phase;
            enemy.y = enemy.baseY + Math.sin(angle) * 15;
            // Choose climbing, descending or level mask from vertical motion.
            const riseFall = Math.cos(angle);
            const pose = planePoseForMotion(
              riseFall > 0.6 ? 1 : riseFall < -0.6 ? -1 : 0, enemy.direction,
            );
            enemy.image.setTexture(pose.texture).setFlipX(pose.flipX);
          }
          if (enemy.x < -90 || enemy.x > SCREEN.width + 90) {
            this.removeEnemy(enemy, false);
            continue;
          }
        } else {
          const age = now - enemy.spawnedAt;
          const action = dynamicSubAction(age, enemy.shotsFired, enemy.subPattern);
          if (action === 'disappear') {
            this.removeEnemy(enemy, false);
            continue;
          }
          const progress = dynamicSubDepthProgress(age, enemy.subPattern);
          const from = CLASSIC_ROW_Y[enemy.initialGridRow];
          const toRow = enemy.initialGridRow === CLASSIC_SUB_ROWS[0] ?
            CLASSIC_SUB_ROWS[1] : CLASSIC_SUB_ROWS[0];
          const eased = progress * progress * (3 - 2 * progress);
          enemy.y = from + (CLASSIC_ROW_Y[toRow] - from) * eased;
          if (progress >= 1) enemy.gridRow = toRow;
          enemy.image.setPosition(enemy.x, enemy.y).setFlipX(enemy.direction === -1);
          if (action === 'fire') this.fireEnemy(enemy);
          continue;
        }
        enemy.image.setPosition(enemy.x, enemy.y);
        if (enemy.kind !== 'plane') enemy.image.setFlipX(enemy.direction === -1);
      }

      if (now < enemy.nextShotAt || enemy.shot) continue;
      if (this.mode === 'dynamic') {
        const recentlyRevealed = now - this.lastLaunchTime < 3300;
        const interest = Math.min(0.65, 0.15 + this.cycle * 0.065);
        if (recentlyRevealed && Math.random() < interest && Math.abs(enemy.x - this.lastLaunchX) > 65) {
          enemy.nextShotAt = now + 170;
          continue;
        }
      }
      this.fireEnemy(enemy);
    }
  }

  private updateShots(dt: number): void {
    // Snapshot all projectiles before checking their shared tick collisions.
    for (const shot of [...this.shots]) {
      shot.prevX = shot.x;
      shot.prevY = shot.y;
      if (this.mode === 'classic') {
        shot.ticksInFlight++;
        shot.prevHalfColumn = shot.halfColumn;
        shot.prevQuarterColumn = shot.quarterColumn;
        shot.halfRow += shot.stepRow;
        const isTorpedo = shot.kind === 'torpedo' || shot.kind === 'enemyTorpedo';
        if (!isTorpedo || shot.ticksInFlight % CLASSIC_TORPEDO_MOVE_TICKS === 0) {
          shot.halfColumn += shot.stepColumn;
        }
        if (shot.kind === 'bomb') {
          shot.quarterColumn += classicBombQuarterStep(
            shot.bombFlight, shot.ticksInFlight, shot.driftDirection,
          );
          shot.halfColumn = Math.floor(shot.quarterColumn / 2);
        }
        const outsideColumns = shot.kind === 'bomb'
          ? shot.quarterColumn < 0 || shot.quarterColumn >= CLASSIC_QUARTER_COLUMNS
          : shot.halfColumn < 0 || shot.halfColumn >= CLASSIC_HALF_COLUMNS;
        if (outsideColumns || shot.halfRow < 0 || shot.halfRow >= CLASSIC_HALF_ROWS) {
          this.destroyShot(shot);
          continue;
        }
        shot.x = shot.kind === 'bomb'
          ? classicQuarterColumnX(shot.quarterColumn)
          : classicHalfColumnX(shot.halfColumn);
        shot.y = isTorpedo ? classicTorpedoY(shot.halfRow) : classicHalfRowY(shot.halfRow);
      } else {
        shot.x += shot.vx * dt;
        shot.y += shot.vy * dt;
      }
      shot.image.setPosition(shot.x, shot.y);
    }

    // A missile intercepts a falling bomb/charge in its half-column or either
    // neighbouring slot. Include a vertical row-crossing in the same clock tick.
    for (const shot of [...this.shots]) {
      if (shot.kind !== 'missile') continue;
      const assisted = this.mode === 'classic' && shot.emergencyIntercept !== null &&
        this.shots.includes(shot.emergencyIntercept) ? shot.emergencyIntercept : null;
      const other = assisted ?? this.shots.find((candidate) =>
        (candidate.kind === 'bomb' || candidate.kind === 'charge') &&
        (this.mode === 'classic'
          ? candidate.kind === 'bomb'
            ? classicMissileQuarterBombContact(
              shot.halfColumn, shot.halfRow - shot.stepRow, shot.halfRow,
              candidate.prevQuarterColumn, candidate.quarterColumn,
              candidate.halfRow - candidate.stepRow, candidate.halfRow,
            )
            : classicMissileBombContact(
              shot.halfColumn, shot.halfRow - shot.stepRow, shot.halfRow,
              candidate.halfColumn, candidate.halfRow - candidate.stepRow, candidate.halfRow,
            )
          : sweptBoxesOverlap(
            this.shotBox(shot, true), this.shotBox(shot),
            this.shotBox(candidate, true), this.shotBox(candidate),
          )),
      );
      if (other) {
        // Assisted interceptions use the bomb position; regular hits use the midpoint.
        this.explode(assisted ? other.x : (shot.x + other.x) / 2,
          assisted ? other.y : (shot.y + other.y) / 2);
        this.destroyShot(shot);
        this.destroyShot(other);
        this.awardPoints(INTERCEPT_POINTS);
      }
    }

    // Opposing torpedoes intercept before either can hit a submarine.
    if (this.torpedo) {
      const friendly = this.torpedo;
      const opposing = this.shots.find((shot) => shot.kind === 'enemyTorpedo' &&
        (this.mode === 'classic'
          ? classicTorpedoesContact(
            friendly.prevHalfColumn, friendly.halfColumn, friendly.halfRow,
            shot.prevHalfColumn, shot.halfColumn, shot.halfRow,
          )
          : sweptBoxesOverlap(
            this.shotBox(friendly, true), this.shotBox(friendly),
            this.shotBox(shot, true), this.shotBox(shot),
          )));
      if (opposing) {
        this.explode((friendly.x + opposing.x) / 2, (friendly.y + opposing.y) / 2);
        this.destroyShot(friendly);
        this.destroyShot(opposing);
        this.awardPoints(INTERCEPT_POINTS);
      }
    }

    for (const shot of [...this.shots]) {
      if (this.state !== 'playing' || this.pendingStageAdvance) break;
      if (shot.kind === 'missile' || shot.kind === 'torpedo') {
        const targets: EnemyKind[] = shot.kind === 'missile' ? ['plane', 'sweeper'] : ['sub'];
        const target = this.enemies.find((enemy) => targets.includes(enemy.kind) && this.intersects(shot, enemy));
        if (target) {
          this.destroyShot(shot);
          this.removeEnemy(target, true);
          continue;
        }
      } else if (this.mode === 'classic'
        ? shot.kind === 'bomb'
          ? classicQuarterHitsCell(shot.quarterColumn, shot.halfRow, this.columns, 4 + this.depth)
          : classicHalfHitsCell(shot.halfColumn, shot.halfRow, this.columns, 4 + this.depth)
        : sweptBoxesOverlap(
          this.shotBox(shot, true), this.shotBox(shot),
          { x: PLAYER_COLUMNS[this.columns], y: PLAYER_DEPTHS[this.depth], width: 76, height: 26 },
          { x: PLAYER_COLUMNS[this.columns], y: PLAYER_DEPTHS[this.depth], width: 76, height: 26 },
        )) {
        this.destroyShot(shot);
        this.hitPlayer();
        continue;
      }
      if (this.mode === 'dynamic' &&
          (shot.x < -40 || shot.x > SCREEN.width + 40 ||
           shot.y < 46 || shot.y > SCREEN.seafloor + 12)) {
        this.destroyShot(shot);
      }
    }
  }

  private stepSimulation(movementSeconds: number, clockSeconds: number): void {
    this.elapsed += clockSeconds;
    const now = this.elapsed * 1000;
    const scale = speedScale(this.cycle);
    if (now >= this.nextPlane) {
      if (this.enemies.filter((e) => e.kind === 'plane').length < Math.min(4, 2 + this.cycle)) this.spawnEnemy('plane');
      this.nextPlane = now + (2100 + Math.random() * 800) / scale;
    }
    if (this.stage >= 2 && now >= this.nextSweeper) {
      if (this.enemies.filter((e) => e.kind === 'sweeper').length < 2) this.spawnEnemy('sweeper');
      this.nextSweeper = now + (4000 + Math.random() * 1500) / scale;
    }
    if (this.stage >= 3 && now >= this.nextEnemySub) {
      const subs = this.enemies.filter((e) => e.kind === 'sub').length;
      if (subs < 1) this.spawnEnemy('sub');
      this.nextEnemySub = now + (this.mode === 'classic'
        ? 7000 + Math.random() * 1400
        : (5500 + Math.random() * 1500) / scale);
    }
    this.updateEnemies(movementSeconds);
    this.updateShots(movementSeconds);
    if (this.state === 'playing' && this.pendingStageAdvance) this.advanceStage();
  }

  update(_time: number, delta: number): void {
    if (this.state !== 'playing') return;
    if (this.mode === 'dynamic') {
      const dt = Math.min(delta, 35) / 1000;
      this.stepSimulation(dt, dt);
      return;
    }

    // Classic: one coherent battlefield snapshot per shared clock tick.
    // Only input and the separate submarine entry sequence can change between ticks.
    const interval = classicTickMs(this.cycle);
    this.classicAccumulator = Math.min(
      this.classicAccumulator + Math.min(delta, 50), interval * 3,
    );
    while (this.classicAccumulator >= interval && this.state === 'playing') {
      this.classicAccumulator -= interval;
      this.stepSimulation(CLASSIC_BASE_TICK_MS / 1000, interval / 1000);
      // A stage transition resets the accumulator; don't process more ticks
      // belonging to the old stage in the same browser update.
    }
  }

}

