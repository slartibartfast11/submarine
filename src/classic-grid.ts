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
