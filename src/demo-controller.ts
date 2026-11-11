import { PLAYER_COLUMNS, PLAYER_DEPTHS, type GameMode, type StageNumber } from './config.ts';

export const ATTRACT_IDLE_MS = 15_000;
export const DEMO_RUN_MS = 60_000;
export const DEMO_GAME_OVER_MS = 2_800;

/** Only unsigned 32-bit decimal seeds are accepted in the demo URL. */
export function parseDemoSeed(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null;
  const seed = Number(value);
  return Number.isSafeInteger(seed) && seed <= 0xffffffff ? seed : null;
}

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
  private nextMissileAt = 0;
  private nextRetargetAt = 0;
  private aimColumn = 2;

  constructor(seed: number) {
    // Keep decisions independent of the seeded enemy-spawn stream.
    this.random = seededRandom(seed ^ 0xa541d9bb);
  }

  decide(snapshot: DemoSnapshot, elapsedMs: number): DemoAction[] {
    const actions: DemoAction[] = [];
    const playerX = PLAYER_COLUMNS[snapshot.column];
    const playerY = PLAYER_DEPTHS[snapshot.depth];

    // This is a shoot-first arcade game. Launch whenever the existing weapon
    // lockout permits it, even with no visible target or while dodging.
    // A small independent key-press interval keeps the input human-sized.
    if (snapshot.missileReady && elapsedMs >= this.nextMissileAt) {
      actions.push('missile');
      this.nextMissileAt = elapsedMs + 170 + this.random() * 220;
    }

    // Aiming and evasive movement are slower, separate decisions. Neither
    // should block a ready missile from being launched.
    if (elapsedMs < this.nextDecisionAt) return actions;
    this.nextDecisionAt = elapsedMs + 270 + this.random() * 340;

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

    // It occasionally notices a nearby falling weapon, but doesn't spend
    // the game fleeing distant bombs or interrupt firing to evade them.
    const danger = snapshot.shots.find(shot =>
      shot.kind !== 'enemyTorpedo' &&
      Math.abs(shot.x - playerX) < 80 &&
      shot.y > playerY - 105 && shot.y < playerY + 35);
    if (danger && this.random() < 0.17) {
      const dodge = snapshot.column === 0 ? 1 :
        snapshot.column === PLAYER_COLUMNS.length - 1 ? -1 :
          this.random() < 0.5 ? -1 : 1;
      actions.push(dodge < 0 ? 'left' : 'right');
      // The movement decision is spent, but missile firing already happened.
      return actions;
    }

    const sub = snapshot.enemies.find(enemy => enemy.kind === 'sub');
    if (snapshot.stage === 3 && sub && this.random() < 0.38) {
      const wantedDepth = Math.abs(sub.y - PLAYER_DEPTHS[0]) <
        Math.abs(sub.y - PLAYER_DEPTHS[1]) ? 0 : 1;
      if (snapshot.depth !== wantedDepth) actions.push(wantedDepth === 0 ? 'up' : 'down');
    }

    // One grid step per decision. Still occasionally hesitate or aim badly.
    if (snapshot.column !== this.aimColumn && this.random() < 0.88) {
      actions.push(snapshot.column < this.aimColumn ? 'right' : 'left');
    }

    if (snapshot.stage === 3 && sub && snapshot.torpedoReady) {
      const sameDepth = Math.abs(sub.y - playerY) < 46;
      const facingTarget = (sub.x - playerX) * snapshot.facing > 45;
      if (sameDepth && (snapshot.mode === 'classic' || facingTarget) &&
          this.random() < 0.82) actions.push('torpedo');
    }
    return actions;
  }
}
