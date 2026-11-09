import {
  CLASSIC_ROW_Y, CLASSIC_SUB_LIFETIME_TICKS, CLASSIC_CELL_WIDTH,
  PLAYER_COLUMNS, SCREEN,
} from './config.ts';

/** Six full columns × six rows. Missiles use half-cells; aircraft drops use quarter-columns. */
export const CLASSIC_COLUMNS = 6;
export const CLASSIC_ROWS = 6;
export const CLASSIC_HALF_COLUMNS = CLASSIC_COLUMNS * 2;
export const CLASSIC_QUARTER_COLUMNS = CLASSIC_COLUMNS * 4;
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

/** Evenly spaced quarter-column positions, centred inside each whole cell. */
export function classicQuarterColumnX(quarterColumn: number): number {
  const column = Math.floor(quarterColumn / 4);
  const centre = PLAYER_COLUMNS[Math.max(0, Math.min(CLASSIC_COLUMNS - 1, column))];
  return centre + (quarterColumn % 4 - 1.5) * CLASSIC_CELL_WIDTH / 4;
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
 * Check shared-clock movement for two shots travelling in opposite vertical
 * directions. They may occupy the same half-row on this tick OR swap rows
 * between two snapshots (otherwise the alternate half-row parity can cause
 * unavoidable misses). Horizontal forgiveness is exactly one half-column.
 */
/** Aircraft drops occupy quarter-columns but still hit the same whole player cells. */
export function classicQuarterHitsCell(
  quarterColumn: number, halfRow: number, column: number, row: number,
): boolean {
  return Math.floor(quarterColumn / 4) === column && Math.floor(halfRow / 2) === row;
}

export function classicMissileBombContact(
  missileColumn: number, missileBeforeRow: number, missileAfterRow: number,
  bombColumn: number, bombBeforeRow: number, bombAfterRow: number,
): boolean {
  if (Math.abs(missileColumn - bombColumn) > 1) return false;
  const wereSeparatedWithMissileBelow = missileBeforeRow >= bombBeforeRow;
  const nowMissileAboveOrLevel = missileAfterRow <= bombAfterRow;
  return wereSeparatedWithMissileBelow && nowMissileAboveOrLevel;
}

/**
 * Half-column player missiles can intercept quarter-column aircraft drops.
 * Preserve the original half-cell horizontal forgiveness (75 logical pixels),
 * including a bomb's sideways step between consecutive LCD snapshots.
 */
export function classicMissileQuarterBombContact(
  missileColumn: number, missileBeforeRow: number, missileAfterRow: number,
  bombBeforeQuarter: number, bombAfterQuarter: number,
  bombBeforeRow: number, bombAfterRow: number,
): boolean {
  if (missileBeforeRow < bombBeforeRow || missileAfterRow > bombAfterRow) return false;
  const missileX = classicHalfColumnX(missileColumn);
  const bombBeforeX = classicQuarterColumnX(bombBeforeQuarter);
  const bombAfterX = classicQuarterColumnX(bombAfterQuarter);
  const left = Math.min(bombBeforeX, bombAfterX);
  const right = Math.max(bombBeforeX, bombAfterX);
  return missileX >= left - CLASSIC_CELL_WIDTH / 2 &&
    missileX <= right + CLASSIC_CELL_WIDTH / 2;
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
  ticks: number, shotsFired: number, pattern: SubPattern = 'double',
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

export type ClassicBombFlight = 'straight' | 'shallow' | 'medium' | 'steep';

// Reconnaissance flights cannot release bombs; attack flights allow two active bombs.
export function classicPlaneCanRelease(reconnaissance: boolean, activeBombs: number): boolean {
  return !reconnaissance && activeBombs < 2;
}

/** Fixed at launch: vertical bomb or one of three shallow torpedo trajectories. */
export function classicBombFlight(randomValue: number): ClassicBombFlight {
  if (randomValue < 0.45) return 'straight';
  if (randomValue < 0.65) return 'shallow';
  if (randomValue < 0.85) return 'medium';
  return 'steep';
}

/**
 * Falling torpedoes advance one QUARTER-column every 4, 3 or 2 half-row ticks.
 * The first sideways step occurs on the first tick, so there is no waterline
 * turn or sudden change of course. A shot's pattern and direction never change.
 */
export function classicBombQuarterStep(
  pattern: ClassicBombFlight, flightTick: number, direction: -1 | 1,
): number {
  if (pattern === 'straight') return 0;
  const interval = pattern === 'shallow' ? 4 : pattern === 'medium' ? 3 : 2;
  return (flightTick - 1) % interval === 0 ? direction : 0;
}

/**
 * A vertical missile may intercept an incoming torpedo from the adjacent
 * whole cell if its fixed quarter-column trajectory threatens the player.
 * This is a short-range firing assist; it never steers either projectile.
 */
export function classicAdjacentBombThreat(
  quarterColumn: number, halfRow: number, pattern: ClassicBombFlight,
  ticksInFlight: number, driftDirection: -1 | 1,
  playerColumn: number, playerRow: number,
): boolean {
  if (pattern === 'straight') return false;
  const bombColumn = Math.floor(quarterColumn / 4);
  if (Math.abs(bombColumn - playerColumn) !== 1) return false;
  if (driftDirection !== (playerColumn < bombColumn ? -1 : 1)) return false;
  const playerTop = playerRow * 2;
  if (halfRow < playerTop - 2 || halfRow > playerTop + 1) return false;

  let col = quarterColumn;
  let row = halfRow;
  for (let tick = 1; tick <= 3; tick++) {
    row++;
    col += classicBombQuarterStep(pattern, ticksInFlight + tick, driftDirection);
    if (row >= CLASSIC_HALF_ROWS || col < 0 || col >= CLASSIC_QUARTER_COLUMNS) break;
    if (classicQuarterHitsCell(col, row, playerColumn, playerRow)) return true;
  }
  return false;
}
