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

/**
 * Missile and bomb segments have finite LCD width. A missile at half-column
 * 7 hits a bomb at 6, 7 or 8 when they overlap vertically. The missile does
 * not move sideways, and the range never extends past the adjacent slot.
 */
export function classicShotsMeet(
  missileCol: number, missileRow: number, bombCol: number, bombRow: number,
): boolean {
  return Math.abs(missileCol - bombCol) <= 1 && missileRow === bombRow;
}

/**
 * Check shared-clock movement for two shots travelling in opposite vertical
 * directions. They may occupy the same half-row on this tick OR swap rows
 * between two snapshots (otherwise the alternate half-row parity can cause
 * unavoidable misses). Horizontal forgiveness is exactly one half-column.
 */
export function classicMissileBombContact(
  missileColumn: number, missileBeforeRow: number, missileAfterRow: number,
  bombColumn: number, bombBeforeRow: number, bombAfterRow: number,
): boolean {
  if (Math.abs(missileColumn - bombColumn) > 1) return false;
  const wereSeparatedWithMissileBelow = missileBeforeRow >= bombBeforeRow;
  const nowMissileAboveOrLevel = missileAfterRow <= bombAfterRow;
  return wereSeparatedWithMissileBelow && nowMissileAboveOrLevel;
}

/** Classic auto-targets a visible submarine; otherwise fire in last facing. */
export function classicTorpedoDirection(
  playerColumn: number, enemyColumn: number | null, facing: -1 | 1 = 1,
): -1 | 1 {
  if (enemyColumn === null || enemyColumn === playerColumn) return facing;
  return enemyColumn < playerColumn ? -1 : 1;
}

/** A torpedo's logical half-row is rendered on its parent submarine's centreline. */
export function classicTorpedoY(halfRow: number): number {
  return CLASSIC_ROW_Y[Math.floor(halfRow / 2)];
}

/** Collisions include adjacent half-cells and opposing torpedoes swapping cells. */
export function classicTorpedoesContact(
  friendlyBefore: number, friendlyAfter: number, friendlyRow: number,
  enemyBefore: number, enemyAfter: number, enemyRow: number,
): boolean {
  if (Math.floor(friendlyRow / 2) !== Math.floor(enemyRow / 2)) return false;
  const before = friendlyBefore - enemyBefore;
  const after = friendlyAfter - enemyAfter;
  return Math.abs(after) <= 1 || before === 0 ||
    (before < 0 && after > 0) || (before > 0 && after < 0);
}

export type SubPattern = 'decoy' | 'single' | 'dive' | 'double';

/** Independently chosen attack plans; decoys do absolutely nothing. */
export function chooseSubPattern(randomValue: number): SubPattern {
  if (randomValue < 0.28) return 'decoy';
  if (randomValue < 0.57) return 'single';
  if (randomValue < 0.78) return 'dive';
  return 'double';
}

/** Independent of live shot count: double attacks can fire at both depths. */
export function classicSubAction(
  ticks: number, shotsFired: number, _shotActive: boolean, pattern: SubPattern = 'double',
): ClassicSubAction {
  if (pattern === 'decoy') return ticks >= 13 ? 'disappear' : 'wait';
  if (pattern === 'single') {
    if (ticks >= 22) return 'disappear';
    return ticks >= 4 && shotsFired === 0 ? 'fire' : 'wait';
  }
  if (pattern === 'dive') {
    if (ticks >= 27) return 'disappear';
    if (ticks === 12) return 'change-depth';
    return ticks >= 4 && shotsFired === 0 ? 'fire' : 'wait';
  }
  if (ticks >= CLASSIC_SUB_LIFETIME_TICKS) return 'disappear';
  if (ticks === 12) return 'change-depth';
  if (ticks >= 4 && shotsFired === 0) return 'fire';
  if (ticks >= 15 && shotsFired === 1) return 'fire';
  return 'wait';
}

export type DynamicSubAction = 'wait' | 'fire' | 'disappear';
export function dynamicSubAction(
  ageMs: number, shotsFired: number, pattern: SubPattern,
): DynamicSubAction {
  const lifetime = pattern === 'decoy' ? 2100 : pattern === 'single' ? 3100 :
    pattern === 'dive' ? 3700 : 4400;
  if (ageMs >= lifetime) return 'disappear';
  if (pattern !== 'decoy' && ageMs >= 700 && shotsFired === 0) return 'fire';
  if (pattern === 'double' && ageMs >= 2150 && shotsFired === 1) return 'fire';
  return 'wait';
}

/** Dynamic sub has a short transition, but only two persistent depth states. */
export function dynamicSubDepthProgress(ageMs: number, pattern: SubPattern): number {
  if (pattern !== 'dive' && pattern !== 'double') return 0;
  if (ageMs <= 1400) return 0;
  if (ageMs >= 1700) return 1;
  return (ageMs - 1400) / 300;
}

export type ClassicBombFlight = 'straight' | 'diagonal' | 'water-hook';

// Reconnaissance flights cannot release bombs; attack flights allow two active bombs.
export function classicPlaneCanRelease(reconnaissance: boolean, activeBombs: number): boolean {
  return !reconnaissance && activeBombs < 2;
}

/** Assign a bomb's fixed trajectory: straight, diagonal or waterline turn. */
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
 * A vertical missile can intercept a diagonal bomb from an adjacent whole
 * cell if the bomb's existing path threatens the current player position.
 * This does not alter projectile trajectories or ordinary collision bounds.
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
