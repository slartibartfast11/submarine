import {
  CLASSIC_ROW_Y, CLASSIC_SUB_LIFETIME_TICKS, CLASSIC_CELL_WIDTH,
  PLAYER_COLUMNS, SCREEN,
} from './config.ts';

/** Six full columns × six rows. Projectiles occupy twelve half-cells per axis. */
export const CLASSIC_COLUMNS = 6;
export const CLASSIC_ROWS = 6;
export const CLASSIC_HALF_COLUMNS = CLASSIC_COLUMNS * 2;
export const CLASSIC_HALF_ROWS = CLASSIC_ROWS * 2;
export const CLASSIC_SURFACE_ROW = 3;
export const CLASSIC_SUB_ROWS = [4, 5] as const;

export type ClassicSubAction = 'wait' | 'fire' | 'change-depth' | 'disappear';

export function classicHalfColumnX(halfColumn: number): number {
  const column = Math.floor(halfColumn / 2);
  // The two projectile slots are the fore and aft halves of a full cell.
  const centre = PLAYER_COLUMNS[Math.max(0, Math.min(CLASSIC_COLUMNS - 1, column))];
  return centre + (halfColumn % 2 === 0 ? -1 : 1) * CLASSIC_CELL_WIDTH / 4;
}

export function classicHalfRowY(halfRow: number): number {
  const row = Math.floor(halfRow / 2);
  if (row < 0) return SCREEN.hudHeight - 15;
  if (row >= CLASSIC_ROWS) return SCREEN.seafloor + 15;
  const top = row === 0 ? SCREEN.hudHeight : (CLASSIC_ROW_Y[row - 1] + CLASSIC_ROW_Y[row]) / 2;
  const bottom = row === CLASSIC_ROWS - 1 ? SCREEN.seafloor :
    (CLASSIC_ROW_Y[row] + CLASSIC_ROW_Y[row + 1]) / 2;
  return top + (halfRow % 2 === 0 ? 0.25 : 0.75) * (bottom - top);
}

export function classicHalfHitsCell(
  halfColumn: number, halfRow: number, column: number, row: number,
): boolean {
  return Math.floor(halfColumn / 2) === column && Math.floor(halfRow / 2) === row;
}

/** Two small shots collide only when occupying the same half-cell. */
export function classicShotsMeet(
  firstCol: number, firstRow: number, secondCol: number, secondRow: number,
): boolean {
  return firstCol === secondCol && firstRow === secondRow;
}

/** Classic chooses the visible enemy sub's side, never the player's facing. */
export function classicTorpedoDirection(
  playerColumn: number, enemyColumn: number | null,
): -1 | 1 | null {
  if (enemyColumn === null) return null;
  if (enemyColumn === playerColumn) return enemyColumn < CLASSIC_COLUMNS / 2 ? -1 : 1;
  return enemyColumn < playerColumn ? -1 : 1;
}

/** A temporary LCD attack pose, not a continuously patrolling enemy. */
export function classicSubAction(
  ticks: number, shotsFired: number, shotActive: boolean,
): ClassicSubAction {
  if (ticks >= CLASSIC_SUB_LIFETIME_TICKS) return 'disappear';
  if (ticks === 12) return 'change-depth';
  if (ticks >= 3 && shotsFired === 0 && !shotActive) return 'fire';
  if (ticks >= 14 && shotsFired === 1 && !shotActive && ticks <= 23) return 'fire';
  return 'wait';
}

export type ClassicBombFlight = 'straight' | 'diagonal' | 'water-hook';

// A quarter of planes are reconnaissance-only in practice (the spawn chance
// lives in BattleScene); other aircraft can keep two bombs in flight.
export function classicPlaneCanRelease(reconnaissance: boolean, activeBombs: number): boolean {
  return !reconnaissance && activeBombs < 2;
}

/**
 * Original-style intermittent releases. Some bombs stay vertical, some begin
 * angling in the sky, and others go straight until they enter the water.
 * These are deterministic decisions once each bomb has been launched.
 */
export function classicBombFlight(randomValue: number): ClassicBombFlight {
  return randomValue < 0.45 ? 'straight' : randomValue < 0.70 ? 'diagonal' : 'water-hook';
}

export function classicBombLateralStep(
  pattern: ClassicBombFlight, halfRow: number, flightTick: number, direction: -1 | 1,
): number {
  if (pattern === 'straight') return 0;
  if (pattern === 'water-hook' && halfRow < CLASSIC_SURFACE_ROW * 2) return 0;
  // Move a half-column sideways every two downward half-row steps.
  return flightTick % 2 === 0 ? direction : 0;
}

/**
 * Classic's deliberate interception concession: a straight-up launch can
 * catch a diagonal bomb from ONE neighbouring whole cell if its next few
 * half-cell steps would hit the submarine at its current depth.
 *
 * This only forecasts the established, non-homing bomb path. It does not
 * expand ordinary collision boxes or grant the missile diagonal movement.
 */
export function classicAdjacentBombThreat(
  halfColumn: number, halfRow: number, pattern: ClassicBombFlight,
  ticksInFlight: number, driftDirection: -1 | 1,
  playerColumn: number, playerRow: number,
): boolean {
  if (pattern === 'straight') return false;
  const bombColumn = Math.floor(halfColumn / 2);
  if (Math.abs(bombColumn - playerColumn) !== 1) return false;
  if (driftDirection !== (playerColumn < bombColumn ? -1 : 1)) return false;
  const playerTop = playerRow * 2;
  // The threat must be beside the sub or in the immediately higher row.
  if (halfRow < playerTop - 2 || halfRow > playerTop + 1) return false;

  let col = halfColumn;
  let row = halfRow;
  // A strictly local emergency window; not an across-screen defence.
  for (let tick = 1; tick <= 3; tick++) {
    row++;
    col += classicBombLateralStep(pattern, row, ticksInFlight + tick, driftDirection);
    if (row >= CLASSIC_HALF_ROWS || col < 0 || col >= CLASSIC_HALF_COLUMNS) break;
    if (classicHalfHitsCell(col, row, playerColumn, playerRow)) return true;
  }
  return false;
}
