import { PLAYER_COLUMNS, PLAYER_DEPTHS, type GameMode, type StageNumber } from './config.ts';

export const ATTRACT_IDLE_MS = 15_000;
export const DEMO_RUN_MS = 60_000;
export const DEMO_GAME_OVER_MS = 2_800;

export type DemoAction = 'left' | 'right' | 'up' | 'down' | 'missile' | 'torpedo';
export type DemoEnemy = { kind: 'plane' | 'sweeper' | 'sub'; x: number; y: number };
export type DemoShot = { kind: 'bomb' | 'charge' | 'enemyTorpedo'; x: number; y: number };
export type DemoSnapshot = {
  mode: GameMode;
  stage: StageNumber;
  column: number;
  depth: number;
  facing: -1 | 1;
  enemies: readonly DemoEnemy[];
  shots: readonly DemoShot[];
  missileReady: boolean;
  torpedoReady: boolean;
};

/** Small repeatable RNG. Only demo runs use it; player games keep Math.random. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let x = state;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function demoSelection(seed: number): { mode: GameMode; stage: StageNumber } {
  const random = seededRandom(seed);
  return {
    mode: random() < 0.5 ? 'classic' : 'dynamic',
    stage: (1 + Math.floor(random() * 3)) as StageNumber,
  };
}

/**
 * A fallible arcade player. It sees only visible enemies and projectiles,
 * makes a decision every few hundred milliseconds, and uses ordinary inputs.
 * It does not predict trajectories, steer shots, or change the game rules.
 */
export class DemoController {
  private readonly random: () => number;
  private nextDecisionAt = 0;
  private nextRetargetAt = 0;
  private aimColumn = 2;

  constructor(seed: number) {
    // Keep decisions independent of the seeded enemy-spawn stream.
    this.random = seededRandom(seed ^ 0xa541d9bb);
  }

  decide(snapshot: DemoSnapshot, elapsedMs: number): DemoAction[] {
    if (elapsedMs < this.nextDecisionAt) return [];
    this.nextDecisionAt = elapsedMs + 340 + this.random() * 440;
    const actions: DemoAction[] = [];
    const playerX = PLAYER_COLUMNS[snapshot.column];
    const playerY = PLAYER_DEPTHS[snapshot.depth];

    // Choose what seems interesting, and stick with it briefly.
    if (elapsedMs >= this.nextRetargetAt) {
      const priorities = snapshot.stage === 3 && this.random() < 0.65
        ? ['sub', 'plane', 'sweeper'] : snapshot.stage >= 2 && this.random() < 0.67
          ? ['sweeper', 'plane', 'sub'] : ['plane', 'sweeper', 'sub'];
      const target = priorities.flatMap(kind =>
        snapshot.enemies.filter(enemy => enemy.kind === kind)).at(0);
      if (target) {
        const roughColumn = Math.round((target.x - PLAYER_COLUMNS[0]) / 150);
        // Imperfect aim: aim at the observed position, sometimes one cell off.
        const error = this.random() < 0.22 ? (this.random() < 0.5 ? -1 : 1) : 0;
        this.aimColumn = Math.max(0, Math.min(PLAYER_COLUMNS.length - 1, roughColumn + error));
      } else {
        this.aimColumn = Math.max(0, Math.min(PLAYER_COLUMNS.length - 1,
          snapshot.column + (this.random() < 0.5 ? -2 : 2)));
      }
      this.nextRetargetAt = elapsedMs + 900 + this.random() * 1800;
    }

    // Notice danger late and sometimes react the wrong way (or not at all).
    const danger = snapshot.shots.find(shot =>
      shot.kind !== 'enemyTorpedo' &&
      Math.abs(shot.x - playerX) < 95 &&
      shot.y > 190 && shot.y < playerY + 35);
    if (danger && this.random() < 0.58) {
      const dodge = snapshot.column === 0 ? 1 :
        snapshot.column === PLAYER_COLUMNS.length - 1 ? -1 :
          this.random() < 0.5 ? -1 : 1;
      actions.push(dodge < 0 ? 'left' : 'right');
      // Reacting to a threat takes the whole decision.
      return actions;
    }

    const sub = snapshot.enemies.find(enemy => enemy.kind === 'sub');
    if (snapshot.stage === 3 && sub && this.random() < 0.38) {
      const wantedDepth = Math.abs(sub.y - PLAYER_DEPTHS[0]) <
        Math.abs(sub.y - PLAYER_DEPTHS[1]) ? 0 : 1;
      if (snapshot.depth !== wantedDepth) actions.push(wantedDepth === 0 ? 'up' : 'down');
    }

    // One grid step per decision. Occasionally hesitate instead.
    if (snapshot.column !== this.aimColumn && this.random() < 0.8) {
      actions.push(snapshot.column < this.aimColumn ? 'right' : 'left');
    }

    // Fire at visible targets with rough alignment; also occasionally miss.
    const aligned = snapshot.enemies.some(enemy =>
      enemy.kind !== 'sub' && Math.abs(enemy.x - playerX) < 90);
    if (snapshot.missileReady &&
      (aligned ? this.random() < 0.66 : this.random() < 0.09)) {
      actions.push('missile');
    }

    if (snapshot.stage === 3 && sub && snapshot.torpedoReady) {
      const sameDepth = Math.abs(sub.y - playerY) < 46;
      const facingTarget = (sub.x - playerX) * snapshot.facing > 45;
      if (sameDepth && (snapshot.mode === 'classic' || facingTarget) &&
          this.random() < 0.6) actions.push('torpedo');
    }
    return actions;
  }
}
