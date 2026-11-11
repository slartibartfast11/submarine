import { PLAYER_COLUMNS, PLAYER_DEPTHS, type GameMode, type StageNumber } from './config.ts';

import {
  classicHalfHitsCell, classicQuarterHitsCell, classicBombQuarterStep,
  CLASSIC_HALF_ROWS, CLASSIC_HALF_COLUMNS, CLASSIC_QUARTER_COLUMNS,
  type ClassicBombFlight,
} from './classic-grid.ts';
import { CLASSIC_TORPEDO_MOVE_TICKS, classicTickMs } from './config.ts';
import { submarineOccupiesCell } from './submarine-occupancy.ts';

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
export type DemoEnemy = {
  kind: 'plane' | 'sweeper' | 'sub';
  x: number; y: number;
  gridColumn: number; gridRow: number;
  // Approximate observed horizontal motion, for leading visible targets.
  vx: number;
};
export type DemoShot = {
  kind: 'bomb' | 'charge' | 'enemyTorpedo';
  x: number; y: number;
  vx: number; vy: number;
  // Classic LCD snapshots have logical grid coordinates rather than velocity.
  halfColumn: number;
  quarterColumn: number;
  halfRow: number;
  stepColumn: number;
  stepRow: number;
  ticksInFlight: number;
  bombFlight: ClassicBombFlight;
  driftDirection: -1 | 1;
};
export type DemoSnapshot = {
  mode: GameMode;
  cycle: number;
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

// Look ahead only far enough to judge whether a visible shot is about to
// cross one of the submarine's two depth rows. No future spawns or enemy
// attacks are revealed to the demo player.
const THREAT_HORIZON_MS = 1_500;
const PLAYER_HIT_HALF_WIDTH = 44;
const PLAYER_HIT_HALF_HEIGHT = 19;

function inBounds(column: number): boolean {
  return column >= 0 && column < PLAYER_COLUMNS.length;
}

/** Exactly the same occupancy check that BattleScene applies to human input. */
function occupiedBySub(snapshot: DemoSnapshot, column: number, depth: number): boolean {
  return snapshot.enemies.some(enemy => enemy.kind === 'sub' &&
    submarineOccupiesCell(snapshot.mode, enemy, column, depth));
}

/** Continuous segment against a stationary rectangle expanded by the shot size.
 * Starts at t=0, avoiding gaps between sampled positions on fast frames.
 */
function sweptThreat(x: number, y: number, vx: number, vy: number,
  durationSeconds: number, px: number, py: number, halfWidth: number, halfHeight: number,
): boolean {
  const bounds: Array<[number, number, number, number]> = [
    [x, vx * durationSeconds, px - halfWidth, px + halfWidth],
    [y, vy * durationSeconds, py - halfHeight, py + halfHeight],
  ];
  let enter = 0;
  let exit = 1;
  for (const [start, delta, min, max] of bounds) {
    if (delta === 0) {
      if (start < min || start > max) return false;
      continue;
    }
    const t1 = (min - start) / delta;
    const t2 = (max - start) / delta;
    enter = Math.max(enter, Math.min(t1, t2));
    exit = Math.min(exit, Math.max(t1, t2));
    if (enter > exit) return false;
  }
  return true;
}

/**
 * Approximate whether an existing, visible projectile can reach a proposed
 * grid position. Classic uses the actual discrete flight pattern for bombs
 * (needed to distinguish shallow/diagonal drops). Modern extrapolates the
 * present velocity. This is for navigation, not collision or damage.
 */
export function incomingThreat(
  snapshot: DemoSnapshot, column: number, depth: number,
): boolean {
  if (!inBounds(column) || depth < 0 || depth > 1) return true;
  const px = PLAYER_COLUMNS[column];
  const py = PLAYER_DEPTHS[depth];
  for (const shot of snapshot.shots) {
    if (snapshot.mode === 'dynamic') {
      const halfWidth = shot.kind === 'enemyTorpedo' ? 51 : PLAYER_HIT_HALF_WIDTH;
      const halfHeight = shot.kind === 'enemyTorpedo' ? 17 : PLAYER_HIT_HALF_HEIGHT;
      if (sweptThreat(shot.x, shot.y, shot.vx, shot.vy,
        THREAT_HORIZON_MS / 1000, px, py, halfWidth, halfHeight)) return true;
      continue;
    }

    const interval = classicTickMs(snapshot.cycle);
    const steps = Math.ceil(THREAT_HORIZON_MS / interval);
    let halfCol = shot.halfColumn;
    let quarterCol = shot.quarterColumn;
    let halfRow = shot.halfRow;
    for (let step = 1; step <= steps; step++) {
      const flightTick = shot.ticksInFlight + step;
      halfRow += shot.stepRow;
      if (shot.kind === 'bomb') {
        quarterCol += classicBombQuarterStep(
          shot.bombFlight, flightTick, shot.driftDirection,
        );
        halfCol = Math.floor(quarterCol / 2);
      } else if (shot.kind !== 'enemyTorpedo' ||
                 flightTick % CLASSIC_TORPEDO_MOVE_TICKS === 0) {
        halfCol += shot.stepColumn;
      }
      if (halfRow < 0 || halfRow >= CLASSIC_HALF_ROWS ||
          halfCol < 0 || halfCol >= CLASSIC_HALF_COLUMNS ||
          (shot.kind === 'bomb' && (quarterCol < 0 || quarterCol >= CLASSIC_QUARTER_COLUMNS))) {
        break;
      }
      const impacted = shot.kind === 'bomb'
        ? classicQuarterHitsCell(quarterCol, halfRow, column, 4 + depth)
        : classicHalfHitsCell(halfCol, halfRow, column, 4 + depth);
      if (impacted) return true;
    }
  }
  return false;
}

function prospectiveEnemyX(snapshot: DemoSnapshot, enemy: DemoEnemy, depth: number): number {
  // A rough intercept lead, not an exact path intercept or a lookup of an
  // enemy's future decisions. Deliberately underestimate the travel time.
  const flightMs = snapshot.mode === 'classic'
    ? Math.min(950, Math.max(250, (PLAYER_DEPTHS[depth] - enemy.y) * 3.1))
    : Math.min(850, Math.max(200, (PLAYER_DEPTHS[depth] - enemy.y) * 2.4));
  return enemy.x + enemy.vx * flightMs * 0.00075;
}

function missileOpportunity(snapshot: DemoSnapshot, column: number, depth: number): boolean {
  const px = PLAYER_COLUMNS[column];
  if (snapshot.shots.some(shot => shot.kind !== 'enemyTorpedo') &&
      incomingThreat(snapshot, column, depth)) return true;
  return snapshot.enemies.some(enemy => {
    if (enemy.kind === 'sub') return false;
    const futureX = prospectiveEnemyX(snapshot, enemy, depth);
    return Math.abs(futureX - px) <= (snapshot.mode === 'classic' ? 125 : 85);
  });
}

/** A humanish demo player: purposeful fire, one-grid-step movement, and
 * limited foresight of already visible shots. It remains fallible because it
 * reacts in intervals and cannot know when new attacks will appear.
 */
export class DemoController {
  private readonly random: () => number;
  private nextDecisionAt = 0;
  private nextMissileAt = 0;
  private nextRetargetAt = 0;
  private aimColumn = 2;

  constructor(seed: number) {
    this.random = seededRandom(seed ^ 0xa541d9bb);
  }

  decide(snapshot: DemoSnapshot, elapsedMs: number): DemoAction[] {
    const actions: DemoAction[] = [];
    let nextColumn = snapshot.column;
    let nextDepth = snapshot.depth;
    let nextFacing = snapshot.facing;

    // Do not step blindly into a lane a visible projectile is about to cross.
    // Check candidate movement against holding position first.
    if (elapsedMs >= this.nextDecisionAt) {
      this.nextDecisionAt = elapsedMs + 280 + this.random() * 380;

      const targetKinds = snapshot.stage === 3 && this.random() < 0.65
        ? ['sub', 'plane', 'sweeper'] : snapshot.stage >= 2 && this.random() < 0.65
          ? ['sweeper', 'plane', 'sub'] : ['plane', 'sweeper', 'sub'];
      const target = targetKinds
        .flatMap(kind => snapshot.enemies.filter(enemy => enemy.kind === kind))[0];

      if (elapsedMs >= this.nextRetargetAt) {
        if (target) {
          const roughX = target.kind === 'sub' ? target.x :
            prospectiveEnemyX(snapshot, target, snapshot.depth);
          const error = this.random() < 0.13 ? (this.random() < 0.5 ? -1 : 1) : 0;
          this.aimColumn = Math.max(0, Math.min(PLAYER_COLUMNS.length - 1,
            Math.round((roughX - PLAYER_COLUMNS[0]) / 150) + error));
        } else {
          // Waiting for enemies is much more human than randomly wandering
          // around the playfield and firing at an empty sky.
          this.aimColumn = snapshot.column;
        }
        this.nextRetargetAt = elapsedMs + 600 + this.random() * 900;
      }

      const hereThreat = incomingThreat(snapshot, snapshot.column, snapshot.depth);
      if (hereThreat) {
        // Avoid imminent shots, choosing only a safer *adjacent* grid square.
        // No teleporting, impossible movement, or omniscient escape route.
        const escapes: Array<{ action: DemoAction; column: number; depth: number }> = [
          { action: 'left' as const, column: snapshot.column - 1, depth: snapshot.depth },
          { action: 'right' as const, column: snapshot.column + 1, depth: snapshot.depth },
          { action: (snapshot.depth === 0 ? 'down' : 'up') as DemoAction,
            column: snapshot.column, depth: 1 - snapshot.depth },
        ].filter(option => inBounds(option.column) &&
          !occupiedBySub(snapshot, option.column, option.depth) &&
          !incomingThreat(snapshot, option.column, option.depth));
        if (escapes.length > 0 && this.random() < 0.85) {
          // Prefer a useful direction if more than one escape is safe.
          escapes.sort((a, b) =>
            Math.abs(a.column - this.aimColumn) - Math.abs(b.column - this.aimColumn));
          const pick = escapes.length > 1 && this.random() < 0.2 ? escapes[1] : escapes[0];
          actions.push(pick.action);
          nextColumn = pick.column;
          nextDepth = pick.depth;
        }
      } else if (target) {
        // At most one move per decision. If staying still is safe, never move
        // into a lane that our short prediction already marks dangerous.
        const sub = snapshot.stage === 3
          ? snapshot.enemies.find(enemy => enemy.kind === 'sub') : undefined;
        const idealDepth = sub
          ? (Math.abs(sub.y - PLAYER_DEPTHS[0]) < Math.abs(sub.y - PLAYER_DEPTHS[1]) ? 0 : 1)
          : snapshot.depth;
        const depthChange = sub && idealDepth !== snapshot.depth && this.random() < 0.40;
        const nextStep = depthChange
          ? { action: idealDepth === 0 ? 'up' : 'down', column: snapshot.column, depth: idealDepth }
          : { action: snapshot.column < this.aimColumn ? 'right' : 'left',
            column: snapshot.column + Math.sign(this.aimColumn - snapshot.column),
            depth: snapshot.depth };
        if ((depthChange || snapshot.column !== this.aimColumn) &&
            inBounds(nextStep.column) &&
            !occupiedBySub(snapshot, nextStep.column, nextStep.depth) &&
            !incomingThreat(snapshot, nextStep.column, nextStep.depth) &&
            this.random() < 0.89) {
          actions.push(nextStep.action as DemoAction);
          nextColumn = nextStep.column;
          nextDepth = nextStep.depth;
        }
      }

      if (nextColumn < snapshot.column) nextFacing = -1;
      if (nextColumn > snapshot.column) nextFacing = 1;
    }

    // Firing stays independent of the slower movement rhythm, but it now
    // requires a plausible visible target or an incoming shot to intercept.
    if (snapshot.missileReady && elapsedMs >= this.nextMissileAt &&
        missileOpportunity(snapshot, nextColumn, nextDepth)) {
      actions.push('missile');
      this.nextMissileAt = elapsedMs + 180 + this.random() * 220;
    }

    const sub = snapshot.stage === 3
      ? snapshot.enemies.find(enemy => enemy.kind === 'sub') : undefined;
    if (sub && snapshot.torpedoReady) {
      const sameDepth = Math.abs(sub.y - PLAYER_DEPTHS[nextDepth]) < 46;
      const facingTarget = (sub.x - PLAYER_COLUMNS[nextColumn]) * nextFacing > 45;
      if (sameDepth && (snapshot.mode === 'classic' || facingTarget) &&
          this.random() < 0.7) actions.push('torpedo');
    }
    return actions;
  }
}
