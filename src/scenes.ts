import Phaser from 'phaser';
import {
  CLASSIC_AIR_ROWS, CLASSIC_ACTOR_MOVE_TICKS, CLASSIC_BASE_TICK_MS, CLASSIC_CELL_WIDTH,
  CLASSIC_ROW_Y, ENTRY_STEP_MS, COLOURS, LIVES, PLAYER_COLUMNS, PLAYER_DEPTHS, SCREEN,
  canFire, chooseBest, classicPlaneStep, classicTickMs, speedScale,
  stageAfter, stageGoal, stageTarget,
  type BestRun, type GameMode, type StageNumber,
} from './config';
import { installSprites } from './sprites';
import { overlapsBox, sweptBoxesOverlap, type Box } from './collision';
import { LcdHud } from './lcd';
import {
  CLASSIC_COLUMNS, CLASSIC_HALF_COLUMNS, CLASSIC_HALF_ROWS,
  CLASSIC_SURFACE_ROW, CLASSIC_SUB_ROWS, classicHalfColumnX,
  classicHalfRowY, classicHalfHitsCell, classicShotsMeet,
  classicSubAction, classicTorpedoDirection,
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
  airRow: number;
  ticksAlive: number;
  gridColumn: number;
  gridRow: number;
  shotsFired: number;
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
  halfRow: number;
  stepColumn: number;
  stepRow: number;
};

function addLabel(scene: Phaser.Scene, x: number, y: number, contents: string, size: number, colour = '#26372d'): Phaser.GameObjects.Text {
  return scene.add.text(x, y, contents, {
    fontFamily: 'monospace', fontSize: `${size}px`, color: colour,
  }).setResolution(2);
}

function drawLandscape(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(-10);
  g.fillStyle(COLOURS.background).fillRect(0, 0, SCREEN.width, SCREEN.height);
  // Quiet LCD-style background detail. Avoid clutter behind interactive objects.
  g.fillStyle(COLOURS.light, 0.5);
  g.fillTriangle(50, SCREEN.waterline - 13, 180, SCREEN.waterline - 65, 310, SCREEN.waterline - 13);
  g.fillTriangle(270, SCREEN.waterline - 13, 390, SCREEN.waterline - 44, 515, SCREEN.waterline - 13);
  g.fillTriangle(725, SCREEN.waterline - 13, 820, SCREEN.waterline - 55, 930, SCREEN.waterline - 13);
  for (const [x, y] of [[97, 81], [382, 104], [711, 70], [838, 126]]) {
    g.fillRect(x, y, 48, 5).fillRect(x + 9, y - 5, 26, 5);
  }
  g.lineStyle(3, COLOURS.dark, 0.9);
  g.beginPath().moveTo(0, SCREEN.waterline);
  for (let x = 0; x <= SCREEN.width; x += 12) g.lineTo(x, SCREEN.waterline + (x % 24 === 0 ? 0 : 3));
  g.strokePath();
  g.lineStyle(1, COLOURS.mid, 0.33);
  for (const y of PLAYER_DEPTHS) g.lineBetween(18, y + 20, SCREEN.width - 18, y + 20);
  g.lineStyle(3, COLOURS.mid, 0.7).lineBetween(0, SCREEN.seafloor, SCREEN.width, SCREEN.seafloor);
  g.fillStyle(COLOURS.mid, 0.52);
  for (const x of [38, 64, 182, 511, 620, 837, 908]) {
    g.fillTriangle(x, SCREEN.seafloor, x + 8, SCREEN.seafloor - 17, x + 17, SCREEN.seafloor);
    g.fillTriangle(x + 12, SCREEN.seafloor, x + 19, SCREEN.seafloor - 10, x + 25, SCREEN.seafloor);
  }
}

export class MenuScene extends Phaser.Scene {
  constructor() { super('menu'); }

  create(): void {
    installSprites(this);
    drawLandscape(this);
    addLabel(this, 320, 76, 'SUBMARINE', 57);
    addLabel(this, 245, 149, 'AN IMAGINARY LCD GAME', 22);
    this.add.image(315, 354, 'player').setScale(1.8);
    this.add.image(650, 250, 'plane').setScale(1.45).setFlipX(true);
    addLabel(this, 268, 392, '1  CLASSIC  -  STEPPED LCD WORLD', 21);
    addLabel(this, 268, 426, '2  DYNAMIC  -  THE LCD COMES ALIVE', 21);
    addLabel(this, 268, 466, 'ARROWS/WASD: MOVE     SPACE: MISSILE     X: TORPEDO', 14);
    const onKey = (event: KeyboardEvent): void => {
      if (event.code === 'Digit1' || event.code === 'Numpad1') this.scene.start('battle', { mode: 'classic' });
      if (event.code === 'Digit2' || event.code === 'Numpad2') this.scene.start('battle', { mode: 'dynamic' });
    };
    this.input.keyboard?.on('keydown', onKey);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.keyboard?.off('keydown', onKey));
  }
}

export class BattleScene extends Phaser.Scene {
  private mode: GameMode = 'classic';
  private elapsed = 0;
  private classicAccumulator = 0;
  private cycle = 1;
  private stage: StageNumber = 1;
  private columns = 2;
  private depth = 0;
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
  private hud!: LcdHud;
  private gameOverHint!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;

  constructor() { super('battle'); }

  init(data: { mode?: GameMode }): void {
    this.mode = data.mode === 'dynamic' ? 'dynamic' : 'classic';
    this.elapsed = 0;
    this.classicAccumulator = 0;
    this.cycle = 1;
    this.stage = 1;
    this.columns = 2;
    this.depth = 0;
    this.facing = 1;
    this.enemies = [];
    this.shots = [];
    this.missile = null;
    this.torpedo = null;
    this.playerLives = LIVES;
    this.score = 0;
    this.state = 'entering';
    this.stageKills = 0;
    this.pendingStageAdvance = false;
    this.nextPlane = 850;
    this.nextSweeper = 1800;
    this.nextEnemySub = 3000;
    this.lastLaunchTime = -100000;
  }

  create(): void {
    if (!this.textures.exists('player')) installSprites(this);
    drawLandscape(this);
    this.hud = new LcdHud(this, this.mode);
    this.player = this.add.image(PLAYER_COLUMNS[4], PLAYER_DEPTHS[0], 'player').setDepth(5);
    this.banner = addLabel(this, 230, 235, '', 25).setDepth(30);
    this.gameOverHint = addLabel(this, 290, 509, 'ESC  MENU / START AGAIN', 16).setDepth(30).setVisible(false);
    this.drawHud();
    this.showStageBanner();
    this.beginEntry();

    const onKey = (event: KeyboardEvent): void => {
      const key = event.code;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(key)) event.preventDefault();
      if (key === 'Escape') { this.scene.start('menu'); return; }
      // In particular: R, Space and X must NEVER restart a game-over run.
      if (this.state !== 'playing') return;
      if (key === 'ArrowLeft' || key === 'KeyA') {
        this.columns = Math.max(0, this.columns - 1);
        this.facing = -1;
      }
      if (key === 'ArrowRight' || key === 'KeyD') {
        this.columns = Math.min(PLAYER_COLUMNS.length - 1, this.columns + 1);
        this.facing = 1;
      }
      if (key === 'ArrowUp' || key === 'KeyW') this.depth = 0;
      if (key === 'ArrowDown' || key === 'KeyS') this.depth = 1;
      if (key === 'Space' && !event.repeat) this.firePlayerMissile();
      if (key === 'KeyX' && !event.repeat) this.firePlayerTorpedo();
      this.player.setPosition(PLAYER_COLUMNS[this.columns], PLAYER_DEPTHS[this.depth]);
      this.player.setFlipX(this.facing === -1);
    };
    this.input.keyboard?.on('keydown', onKey);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.keyboard?.off('keydown', onKey));
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
  }

  private clearBattlefield(): void {
    for (const shot of [...this.shots]) this.destroyShot(shot);
    for (const enemy of [...this.enemies]) this.removeEnemy(enemy, false);
    this.enemies = [];
    this.shots = [];
    this.missile = null;
    this.torpedo = null;
  }

  private playEntryTone(): void {
    // Original, deliberately plain sustained electronic tone. No game audio samples.
    const audio = this.sound as Phaser.Sound.WebAudioSoundManager;
    const context = audio.context;
    if (!context || context.state !== 'running') return;
    const tone = context.createOscillator();
    const volume = context.createGain();
    const t = context.currentTime;
    tone.type = 'square';
    tone.frequency.value = 440;
    volume.gain.setValueAtTime(0.016, t);
    const duration = ENTRY_STEP_MS * 3 / 1000;
    volume.gain.setValueAtTime(0.013, t + duration - 0.14);
    volume.gain.linearRampToValueAtTime(0.0001, t + duration);
    tone.connect(volume);
    volume.connect(context.destination);
    tone.start(t);
    tone.stop(t + ENTRY_STEP_MS * 3 / 1000);
  }

  private beginEntry(): void {
    // Every new submarine enters on lane 1: 5 -> 4 -> 3, then controls unlock.
    this.state = 'entering';
    this.stageKills = 0;
    this.pendingStageAdvance = false;
    this.resetSpawns();
    this.columns = 4;
    this.depth = 0;
    this.facing = -1;
    this.player.setVisible(true).setAlpha(1).setFlipX(true);
    this.player.setPosition(PLAYER_COLUMNS[4], PLAYER_DEPTHS[0]);
    this.gameOverHint.setVisible(false);
    this.drawHud();
    this.playEntryTone();
    this.time.delayedCall(ENTRY_STEP_MS, () => {
      if (this.state !== 'entering') return;
      this.columns = 3;
      this.player.x = PLAYER_COLUMNS[3];
    });
    this.time.delayedCall(ENTRY_STEP_MS * 2, () => {
      if (this.state !== 'entering') return;
      this.columns = 2;
      this.player.x = PLAYER_COLUMNS[2];
    });
    this.time.delayedCall(ENTRY_STEP_MS * 3, () => {
      if (this.state !== 'entering') return;
      this.state = 'playing';
    });
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
    const direction: -1 | 1 = Math.random() < 0.5 ? 1 : -1;
    const isSub = kind === 'sub';
    const airRow = Math.floor(Math.random() * CLASSIC_AIR_ROWS.length);
    const gridColumn = direction === 1 ? 0 : CLASSIC_COLUMNS - 1;
    const gridRow = kind === 'plane' ? airRow :
      kind === 'sweeper' ? CLASSIC_SURFACE_ROW : CLASSIC_SUB_ROWS[Math.random() < 0.5 ? 0 : 1];
    const y = this.mode === 'classic' ? CLASSIC_ROW_Y[gridRow] :
      kind === 'plane' ? Phaser.Utils.Array.GetRandom([105, 146, 186]) :
        kind === 'sweeper' ? SCREEN.waterline - 13 : PLAYER_DEPTHS[Math.random() < 0.5 ? 0 : 1];
    const x = this.mode === 'classic' ? PLAYER_COLUMNS[gridColumn] :
      isSub ? (direction === 1 ? 29 : SCREEN.width - 29) :
        (direction === 1 ? -65 : SCREEN.width + 65);
    const enemy: Enemy = {
      kind,
      image: this.add.image(x, y, kind === 'sub' ? 'enemySub' : kind).setDepth(3),
      x, y, prevX: x, prevY: y, baseY: y, direction,
      speed: kind === 'plane' ? 94 : kind === 'sweeper' ? 62 : 41,
      phase: Math.random() * Math.PI * 2,
      nextShotAt: this.elapsed * 1000 + (kind === 'sub' ? 1400 : 800) + Math.random() * 1200,
      shot: null, airRow, ticksAlive: 0, gridColumn, gridRow, shotsFired: 0,
    };
    enemy.image.setFlipX(direction === -1);
    this.enemies.push(enemy);
  }

  private addShot(kind: ShotKind, x: number, y: number, vx: number, vy: number, owner: Enemy | null): Shot {
    const texture = kind === 'missile' ? 'missile' : kind === 'torpedo' || kind === 'enemyTorpedo' ? 'torpedo' : 'bomb';
    const shot: Shot = {
      kind, image: this.add.image(x, y, texture).setDepth(4),
      x, y, prevX: x, prevY: y, vx, vy, owner,
      halfColumn: -1, halfRow: -1, stepColumn: 0, stepRow: 0,
    };
    shot.image.setFlipX(vx < 0);
    this.shots.push(shot);
    if (owner) owner.shot = shot;
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
    shot.stepColumn = stepColumn;
    shot.stepRow = stepRow;
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
    } else {
      this.missile = this.addShot('missile', PLAYER_COLUMNS[this.columns],
        PLAYER_DEPTHS[this.depth] - 26, 0, -330, null);
    }
    this.lastLaunchX = PLAYER_COLUMNS[this.columns];
    this.lastLaunchTime = this.elapsed * 1000;
  }

  private firePlayerTorpedo(): void {
    if (this.stage < 3 || !canFire('torpedo', this.missile !== null, this.torpedo !== null)) return;
    if (this.mode === 'classic') {
      const target = this.enemies.find((enemy) => enemy.kind === 'sub');
      const direction = classicTorpedoDirection(this.columns, target?.gridColumn ?? null);
      if (direction === null) return; // Don't waste a torpedo when no sub is visible.
      this.torpedo = this.addClassicShot(
        'torpedo', this.columns * 2 + (direction === 1 ? 1 : 0),
        (4 + this.depth) * 2 + 1, direction, 0, null,
      );
    } else {
      this.torpedo = this.addShot('torpedo', PLAYER_COLUMNS[this.columns],
        PLAYER_DEPTHS[this.depth], this.facing * 285, 0, null);
    }
    this.lastLaunchX = PLAYER_COLUMNS[this.columns];
    this.lastLaunchTime = this.elapsed * 1000;
  }

  private fireEnemy(enemy: Enemy): void {
    if (enemy.shot) return;
    const kind: ShotKind = enemy.kind === 'sub' ? 'enemyTorpedo' :
      enemy.kind === 'plane' ? 'bomb' : 'charge';
    if (this.mode === 'classic') {
      const halfColumn = enemy.gridColumn * 2 +
        (enemy.kind === 'sub' ? (enemy.gridColumn === 0 ? 1 : 0) : Math.floor(Math.random() * 2));
      const horizontal = enemy.kind === 'sub' ? (enemy.gridColumn === 0 ? 1 : -1) : 0;
      const vertical = enemy.kind === 'sub' ? 0 : 1;
      this.addClassicShot(kind, halfColumn, enemy.gridRow * 2 + 1,
        horizontal, vertical, enemy);
      if (enemy.kind === 'sub') enemy.shotsFired++;
    } else {
      let vx = 0;
      let vy = 0;
      const x = enemy.x;
      let y = enemy.y;
      const cycleScale = speedScale(this.cycle);
      if (enemy.kind === 'sub') {
        vx = (enemy.x < SCREEN.width / 2 ? 1 : -1) * 184 * cycleScale;
      } else {
        y += enemy.kind === 'plane' ? 13 : 16;
        vy = 109 * cycleScale;
        vx = (Math.random() - 0.5) * 24;
      }
      this.addShot(kind, x, y, vx, vy, enemy);
    }
    enemy.nextShotAt = this.elapsed * 1000 + 1500 + Math.random() * 2200;
  }

  private destroyShot(shot: Shot): void {
    shot.image.destroy();
    this.shots = this.shots.filter((s) => s !== shot);
    if (shot === this.missile) this.missile = null;
    if (shot === this.torpedo) this.torpedo = null;
    if (shot.owner?.shot === shot) shot.owner.shot = null;
  }

  private removeEnemy(enemy: Enemy, destroyed: boolean): void {
    this.enemies = this.enemies.filter((e) => e !== enemy);
    enemy.image.destroy();
    if (enemy.kind === 'sub' && this.mode === 'classic') {
      this.nextEnemySub = this.elapsed * 1000 + 2000 + Math.random() * 2000;
    }
    if (destroyed) {
      this.score += enemy.kind === 'plane' ? 100 : enemy.kind === 'sweeper' ? 150 : 200;
      this.explode(enemy.x, enemy.y);
      sessionBest = chooseBest(sessionBest, { score: this.score, cycle: this.cycle, stage: this.stage });
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
        this.drawHud(); // Illuminates the previously ghosted GAME OVER segments.
      });
    } else {
      this.time.delayedCall(650, () => {
        if (this.state !== 'exploding') return;
        this.clearBattlefield();
        this.showStageBanner();
        this.beginEntry(); // Same frame, fresh quota. Score/lives are retained.
      });
    }
  }

  private shotBox(shot: Shot, previous = false): Box {
    // These are the full original sprite rectangles, not their drawn pixel masks.
    const width = shot.kind === 'torpedo' || shot.kind === 'enemyTorpedo' ? 24 : 12;
    const height = shot.kind === 'missile' ? 16 : shot.kind === 'torpedo' || shot.kind === 'enemyTorpedo' ? 6 : 12;
    return { x: previous ? shot.prevX : shot.x, y: previous ? shot.prevY : shot.y, width, height };
  }

  private enemyBox(enemy: Enemy, previous = false): Box {
    return {
      x: previous ? enemy.prevX : enemy.x,
      y: previous ? enemy.prevY : enemy.y,
      width: enemy.kind === 'plane' ? 76 : 60,
      height: enemy.kind === 'plane' ? 18 : enemy.kind === 'sweeper' ? 16 : 14,
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
          // An LCD pose persists for four shared-clock ticks.
          if (enemy.ticksAlive % CLASSIC_ACTOR_MOVE_TICKS === 0) {
            if (enemy.kind === 'plane') {
              const delta = (Math.floor(Math.random() * 3) - 1) as -1 | 0 | 1;
              const next = classicPlaneStep(enemy.x, enemy.gridRow, enemy.direction, delta);
              enemy.gridRow = next.row;
              enemy.y = CLASSIC_ROW_Y[next.row];
              enemy.image.setTexture(delta === 0 ? 'plane' : 'planeBank');
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
          const action = classicSubAction(enemy.ticksAlive, enemy.shotsFired, enemy.shot !== null);
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
        enemy.image.setPosition(enemy.x, enemy.y).setFlipX(enemy.direction === -1);
        if (enemy.kind === 'sub') continue;
      } else {
        // Dynamic remains continuous; only the shared player grid changes.
        const motion = 0.78 + 0.22 * Math.sin(now * 0.003 + enemy.phase);
        if (enemy.kind !== 'sub') {
          enemy.x += enemy.direction * enemy.speed * scale * motion * dt;
          if (enemy.kind === 'plane') {
            enemy.y = enemy.baseY + Math.sin(now * 0.0018 + enemy.phase) * 15;
            enemy.image.setTexture(Math.cos(now * 0.0018 + enemy.phase) > 0.5 ? 'planeBank' : 'plane');
          }
          if (enemy.x < -90 || enemy.x > SCREEN.width + 90) {
            this.removeEnemy(enemy, false);
            continue;
          }
        } else {
          enemy.y = (PLAYER_DEPTHS[0] + PLAYER_DEPTHS[1]) / 2 +
            Math.sin(now * 0.0010 * scale + enemy.phase) * (PLAYER_DEPTHS[1] - PLAYER_DEPTHS[0]) / 2;
        }
        enemy.image.setPosition(enemy.x, enemy.y).setFlipX(enemy.direction === -1);
      }

      if (now < enemy.nextShotAt || enemy.shot) continue;
      if (this.mode === 'dynamic' && enemy.kind !== 'sub') {
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
        shot.halfColumn += shot.stepColumn;
        shot.halfRow += shot.stepRow;
        if (shot.halfColumn < 0 || shot.halfColumn >= CLASSIC_HALF_COLUMNS ||
            shot.halfRow < 0 || shot.halfRow >= CLASSIC_HALF_ROWS) {
          this.destroyShot(shot);
          continue;
        }
        shot.x = classicHalfColumnX(shot.halfColumn);
        shot.y = classicHalfRowY(shot.halfRow);
      } else {
        shot.x += shot.vx * dt;
        shot.y += shot.vy * dt;
      }
      shot.image.setPosition(shot.x, shot.y);
    }

    // A missile destroys a falling bomb/charge in the same occupied half-cell.
    for (const shot of [...this.shots]) {
      if (shot.kind !== 'missile') continue;
      const other = this.shots.find((candidate) =>
        (candidate.kind === 'bomb' || candidate.kind === 'charge') &&
        (this.mode === 'classic'
          ? classicShotsMeet(shot.halfColumn, shot.halfRow, candidate.halfColumn, candidate.halfRow)
          : sweptBoxesOverlap(
            this.shotBox(shot, true), this.shotBox(shot),
            this.shotBox(candidate, true), this.shotBox(candidate),
          )),
      );
      if (other) {
        this.explode((shot.x + other.x) / 2, (shot.y + other.y) / 2);
        this.destroyShot(shot);
        this.destroyShot(other);
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
        ? classicHalfHitsCell(shot.halfColumn, shot.halfRow, this.columns, 4 + this.depth)
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
      if (subs < (this.mode === 'classic' ? 1 : 2)) this.spawnEnemy('sub');
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
