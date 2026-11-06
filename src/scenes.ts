import Phaser from 'phaser';
import {
  COLOURS, LIVES, PLAYER_COLUMNS, PLAYER_DEPTHS, SCREEN,
  canFire, speedScale, stageAt,
  type GameMode, type StageNumber,
} from './config';
import { installSprites } from './sprites';

type EnemyKind = 'plane' | 'sweeper' | 'sub';
type ShotKind = 'missile' | 'torpedo' | 'bomb' | 'charge' | 'enemyTorpedo';

type Enemy = {
  kind: EnemyKind;
  image: Phaser.GameObjects.Image;
  x: number;
  y: number;
  baseY: number;
  direction: -1 | 1;
  speed: number;
  phase: number;
  nextShotAt: number;
  shot: Shot | null;
};

type Shot = {
  kind: ShotKind;
  image: Phaser.GameObjects.Image;
  x: number;
  y: number;
  vx: number;
  vy: number;
  owner: Enemy | null;
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
    addLabel(this, 180, 76, 'DEPTH WATCH', 57);
    addLabel(this, 245, 149, 'AN IMAGINARY LCD GAME', 22);
    this.add.image(315, 354, 'player').setScale(1.8);
    this.add.image(650, 250, 'plane').setScale(1.45).setFlipX(true);
    addLabel(this, 268, 392, '1  CLASSIC  -  STEPPED LCD WORLD', 21);
    addLabel(this, 268, 426, '2  DYNAMIC  -  THE LCD COMES ALIVE', 21);
    addLabel(this, 268, 466, 'ARROWS/WASD: MOVE     SPACE: MISSILE     X: TORPEDO', 14);
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.code === 'Digit1' || event.code === 'Numpad1') this.scene.start('battle', { mode: 'classic' });
      if (event.code === 'Digit2' || event.code === 'Numpad2') this.scene.start('battle', { mode: 'dynamic' });
    });
  }
}

export class BattleScene extends Phaser.Scene {
  private mode: GameMode = 'classic';
  private elapsed = 0;
  private cycle = 1;
  private stage: StageNumber = 1;
  private columns = 4;
  private depth = 0;
  private facing: -1 | 1 = 1;
  private player!: Phaser.GameObjects.Image;
  private enemies: Enemy[] = [];
  private shots: Shot[] = [];
  private missile: Shot | null = null;
  private torpedo: Shot | null = null;
  private playerLives = LIVES;
  private score = 0;
  private invulnerableUntil = 0;
  private gameOver = false;
  private nextPlane = 0;
  private nextSweeper = 0;
  private nextEnemySub = 0;
  private lastLaunchX = 0;
  private lastLaunchTime = -100000;
  private hud!: Phaser.GameObjects.Text;
  private weaponHud!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;

  constructor() { super('battle'); }

  init(data: { mode?: GameMode }): void {
    this.mode = data.mode === 'dynamic' ? 'dynamic' : 'classic';
    this.elapsed = 0;
    this.cycle = 1;
    this.stage = 1;
    this.columns = 4;
    this.depth = 0;
    this.facing = 1;
    this.enemies = [];
    this.shots = [];
    this.missile = null;
    this.torpedo = null;
    this.playerLives = LIVES;
    this.score = 0;
    this.invulnerableUntil = 0;
    this.gameOver = false;
    this.nextPlane = 850;
    this.nextSweeper = 1800;
    this.nextEnemySub = 3000;
    this.lastLaunchTime = -100000;
  }

  create(): void {
    if (!this.textures.exists('player')) installSprites(this);
    drawLandscape(this);
    const top = this.add.graphics().setDepth(20);
    top.fillStyle(COLOURS.background).fillRect(0, 0, SCREEN.width, 48);
    top.lineStyle(2, COLOURS.dark).lineBetween(0, 48, SCREEN.width, 48);
    this.hud = addLabel(this, 18, 11, '', 23).setDepth(21);
    this.weaponHud = addLabel(this, 14, 514, '', 14);
    this.player = this.add.image(PLAYER_COLUMNS[this.columns], PLAYER_DEPTHS[this.depth], 'player').setDepth(5);
    this.banner = addLabel(this, 240, 235, '', 25).setDepth(30);
    this.showStageBanner();
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      const key = event.code;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(key)) event.preventDefault();
      if (key === 'Escape') { this.scene.start('menu'); return; }
      if (this.gameOver) {
        if (key === 'KeyR' || key === 'Space') this.scene.restart({ mode: this.mode });
        return;
      }
      if (key === 'ArrowLeft' || key === 'KeyA') { this.columns = Math.max(0, this.columns - 1); this.facing = -1; }
      if (key === 'ArrowRight' || key === 'KeyD') { this.columns = Math.min(7, this.columns + 1); this.facing = 1; }
      if (key === 'ArrowUp' || key === 'KeyW') this.depth = 0;
      if (key === 'ArrowDown' || key === 'KeyS') this.depth = 1;
      if (key === 'Space' && !event.repeat) this.firePlayerMissile();
      if (key === 'KeyX' && !event.repeat) this.firePlayerTorpedo();
      this.player.setPosition(PLAYER_COLUMNS[this.columns], PLAYER_DEPTHS[this.depth]);
      this.player.setFlipX(this.facing === -1);
    });
  }

  private showStageBanner(): void {
    const headings = ['AIR ATTACK', 'SURFACE SWEEPERS', 'ENEMY SUBMARINES'];
    this.banner.setText(`${this.cycle}-${this.stage}   ${headings[this.stage - 1]}`);
    this.banner.setAlpha(1);
    this.tweens.add({ targets: this.banner, alpha: 0, delay: 1500, duration: 250 });
  }

  private spawnEnemy(kind: EnemyKind): void {
    const direction: -1 | 1 = Math.random() < 0.5 ? 1 : -1;
    const isSub = kind === 'sub';
    const y = kind === 'plane' ? Phaser.Utils.Array.GetRandom([105, 146, 186])
      : kind === 'sweeper' ? SCREEN.waterline - 13 : PLAYER_DEPTHS[Math.random() < 0.5 ? 0 : 1];
    const enemy: Enemy = {
      kind,
      image: this.add.image(0, 0, kind === 'sub' ? 'enemySub' : kind).setDepth(3),
      x: isSub ? (direction === 1 ? 29 : SCREEN.width - 29) : (direction === 1 ? -65 : SCREEN.width + 65),
      y,
      baseY: y,
      direction,
      speed: kind === 'plane' ? 94 : kind === 'sweeper' ? 62 : 41,
      phase: Math.random() * Math.PI * 2,
      nextShotAt: this.elapsed * 1000 + (kind === 'sub' ? 1400 : 800) + Math.random() * 1200,
      shot: null,
    };
    enemy.image.setPosition(enemy.x, enemy.y).setFlipX(direction === -1);
    this.enemies.push(enemy);
  }

  private addShot(kind: ShotKind, x: number, y: number, vx: number, vy: number, owner: Enemy | null): Shot {
    const texture = kind === 'missile' ? 'missile' : kind === 'torpedo' || kind === 'enemyTorpedo' ? 'torpedo' : 'bomb';
    const shot: Shot = { kind, image: this.add.image(x, y, texture).setDepth(4), x, y, vx, vy, owner };
    shot.image.setFlipX(vx < 0);
    this.shots.push(shot);
    if (owner) owner.shot = shot;
    return shot;
  }

  private firePlayerMissile(): void {
    if (!canFire('missile', this.missile !== null, this.torpedo !== null)) return;
    const x = PLAYER_COLUMNS[this.columns];
    this.missile = this.addShot('missile', x, PLAYER_DEPTHS[this.depth] - 26, 0, -330, null);
    this.lastLaunchX = x;
    this.lastLaunchTime = this.elapsed * 1000;
  }

  private firePlayerTorpedo(): void {
    if (this.stage < 3 || !canFire('torpedo', this.missile !== null, this.torpedo !== null)) return;
    const x = PLAYER_COLUMNS[this.columns];
    this.torpedo = this.addShot('torpedo', x, PLAYER_DEPTHS[this.depth], this.facing * 285, 0, null);
    this.lastLaunchX = x;
    this.lastLaunchTime = this.elapsed * 1000;
  }

  private fireEnemy(enemy: Enemy): void {
    if (enemy.shot) return; // Each ENEMY has its own independent one-shot slot.
    let kind: ShotKind;
    let vx = 0;
    let vy = 0;
    let x = enemy.x;
    let y = enemy.y;
    const cycleScale = speedScale(this.cycle);
    if (enemy.kind === 'sub') {
      kind = 'enemyTorpedo';
      vx = (enemy.x < SCREEN.width / 2 ? 1 : -1) * 184 * cycleScale;
    } else {
      kind = enemy.kind === 'plane' ? 'bomb' : 'charge';
      y += enemy.kind === 'plane' ? 13 : 16;
      vy = 109 * cycleScale;
      // Dynamic bombs may drift slightly. There is no homing after launch.
      if (this.mode === 'dynamic') vx = (Math.random() - 0.5) * 24;
    }
    this.addShot(kind, x, y, vx, vy, enemy);
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
    if (destroyed) {
      this.score += enemy.kind === 'plane' ? 100 : enemy.kind === 'sweeper' ? 150 : 200;
      this.explode(enemy.x, enemy.y);
    }
    // Already fired projectiles continue in flight, even if their source is gone.
  }

  private explode(x: number, y: number): void {
    const star = this.add.image(x, y, 'star').setDepth(12).setScale(1.4);
    this.tweens.add({ targets: star, scale: 0.7, duration: 200, onComplete: () => star.destroy() });
  }

  private hitPlayer(): void {
    if (this.gameOver || this.elapsed * 1000 < this.invulnerableUntil) return;
    this.playerLives--;
    this.explode(this.player.x, this.player.y);
    this.invulnerableUntil = this.elapsed * 1000 + 1500;
    if (this.playerLives <= 0) {
      this.gameOver = true;
      this.banner.setText('GAME OVER    PRESS R TO RESTART');
      this.banner.setPosition(205, 235).setAlpha(1);
    }
  }

  private intersects(shot: Shot, enemy: Enemy): boolean {
    // Use continuous logical positions, not the stepped drawing position.
    const halfWidth = enemy.kind === 'plane' ? 38 : enemy.kind === 'sweeper' ? 32 : 30;
    const halfHeight = enemy.kind === 'plane' ? 13 : 12;
    return Math.abs(shot.x - enemy.x) < halfWidth && Math.abs(shot.y - enemy.y) < halfHeight;
  }

  private updateEnemies(dt: number): void {
    const now = this.elapsed * 1000;
    const scale = speedScale(this.cycle);
    for (const enemy of [...this.enemies]) {
      const motion = this.mode === 'dynamic' ? 0.78 + 0.22 * Math.sin(now * 0.003 + enemy.phase) : 1;
      if (enemy.kind !== 'sub') {
        enemy.x += enemy.direction * enemy.speed * scale * motion * dt;
        if (enemy.kind === 'plane' && this.mode === 'dynamic') {
          enemy.y = enemy.baseY + Math.sin(now * 0.0018 + enemy.phase) * 15;
          enemy.image.setTexture(Math.cos(now * 0.0018 + enemy.phase) > 0.5 ? 'planeBank' : 'plane');
        }
        if (enemy.x < -90 || enemy.x > SCREEN.width + 90) {
          this.removeEnemy(enemy, false);
          continue;
        }
      } else if (this.mode === 'classic') {
        // Classic subs hop between the two depth rows, never advancing horizontally.
        enemy.y = PLAYER_DEPTHS[Math.floor((now / 1700 + enemy.phase) % 2)];
      } else {
        // Dynamic subs transition vertically but remain at the edges.
        enemy.y = (PLAYER_DEPTHS[0] + PLAYER_DEPTHS[1]) / 2 +
          Math.sin(now * 0.0010 * scale + enemy.phase) * (PLAYER_DEPTHS[1] - PLAYER_DEPTHS[0]) / 2;
      }
      enemy.image.setPosition(
        this.mode === 'classic' ? Math.round(enemy.x / 12) * 12 : enemy.x,
        this.mode === 'classic' ? Math.round(enemy.y / 8) * 8 : enemy.y,
      );
      if (enemy.kind !== 'sub' && this.mode === 'classic') enemy.image.setTexture(enemy.kind === 'plane' ? 'plane' : 'sweeper');
      if (enemy.kind === 'sub' && enemy.direction === -1) enemy.image.setFlipX(true);

      if (now < enemy.nextShotAt || enemy.shot) continue;
      if (this.mode === 'dynamic' && enemy.kind !== 'sub') {
        // Shooting reveals your firing column for a few seconds, not live tracking.
        // As cycles rise, some drops favour that last-known column.
        const recentlyRevealed = now - this.lastLaunchTime < 3300;
        const interest = Math.min(0.65, 0.15 + this.cycle * 0.065);
        if (recentlyRevealed && Math.random() < interest && Math.abs(enemy.x - this.lastLaunchX) > 65) {
          enemy.nextShotAt = now + 170; // Wait briefly to pass the last known location.
          continue;
        }
      }
      this.fireEnemy(enemy);
    }
  }

  private updateShots(dt: number): void {
    for (const shot of [...this.shots]) {
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.image.setPosition(
        this.mode === 'classic' ? Math.round(shot.x / 5) * 5 : shot.x,
        this.mode === 'classic' ? Math.round(shot.y / 5) * 5 : shot.y,
      );
      if (shot.kind === 'missile' || shot.kind === 'torpedo') {
        const targetKinds: EnemyKind[] = shot.kind === 'missile' ? ['plane', 'sweeper'] : ['sub'];
        const target = this.enemies.find((enemy) => targetKinds.includes(enemy.kind) && this.intersects(shot, enemy));
        if (target) {
          this.destroyShot(shot);
          this.removeEnemy(target, true);
          continue;
        }
      } else if (
        Math.abs(shot.x - PLAYER_COLUMNS[this.columns]) < 32 &&
        Math.abs(shot.y - PLAYER_DEPTHS[this.depth]) < 18
      ) {
        this.destroyShot(shot);
        this.hitPlayer();
        continue;
      }
      if (shot.x < -40 || shot.x > SCREEN.width + 40 || shot.y < 46 || shot.y > SCREEN.seafloor + 12) {
        this.destroyShot(shot);
      }
    }
  }

  update(_time: number, delta: number): void {
    if (this.gameOver) return;
    // Bound simulation delta when switching browser tabs to avoid sudden tunnelling.
    const dt = Math.min(delta, 35) / 1000;
    this.elapsed += dt;
    const nextStage = stageAt(this.elapsed);
    if (nextStage.cycle !== this.cycle || nextStage.stage !== this.stage) {
      this.cycle = nextStage.cycle;
      this.stage = nextStage.stage;
      // A new cycle returns to air-only defence. Don't carry submarines,
      // sweepers or their already-fired weapons into the new 1-1 stage.
      if (this.stage === 1) {
        for (const enemy of [...this.enemies]) {
          if (enemy.kind !== 'plane') this.removeEnemy(enemy, false);
        }
        for (const shot of [...this.shots]) {
          if (shot.kind === 'charge' || shot.kind === 'enemyTorpedo') this.destroyShot(shot);
        }
      }
      this.showStageBanner();
    }
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
      if (this.enemies.filter((e) => e.kind === 'sub').length < 2) this.spawnEnemy('sub');
      this.nextEnemySub = now + (5500 + Math.random() * 1500) / scale;
    }
    this.updateEnemies(dt);
    this.updateShots(dt);
    this.player.setAlpha(now < this.invulnerableUntil && Math.floor(now / 120) % 2 ? 0.3 : 1);
    this.hud.setText(`${this.cycle}-${this.stage}     SCORE ${String(this.score).padStart(6, '0')}     HULL ${this.playerLives}     ${this.mode.toUpperCase()}`);
    this.weaponHud.setText(
      `MISSILE ${this.missile ? 'IN FLIGHT' : 'READY'}    TORPEDO ${this.stage < 3 ? 'LOCKED UNTIL 1-3' : this.torpedo ? 'IN FLIGHT' : 'READY'}    ESC MENU`,
    );
  }
}
