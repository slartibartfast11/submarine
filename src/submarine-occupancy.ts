import { PLAYER_DEPTHS, type GameMode } from './config';
import { CLASSIC_SUB_ROWS } from './classic-grid';

/** The two hulls have half-heights of 15 and 12 px; leave a little clearance. */
export const SUBMARINE_VERTICAL_CLEARANCE = 32;

export type SubmarinePosition = {
  gridColumn: number;
  gridRow: number;
  y: number;
};

/** Prevent two submarine LCD segments occupying the same logical column and depth. */
export function submarineOccupiesCell(
  mode: GameMode, submarine: SubmarinePosition, column: number, depth: number,
): boolean {
  if (submarine.gridColumn !== column) return false;
  return mode === 'classic'
    ? submarine.gridRow === CLASSIC_SUB_ROWS[depth]
    : Math.abs(submarine.y - PLAYER_DEPTHS[depth]) < SUBMARINE_VERTICAL_CLEARANCE;
}

/** An arriving enemy sub must not materialise on the player's occupied cell. */
export function safeSubSpawnRow(
  proposedRow: number, spawnColumn: number, playerColumn: number, playerDepth: number,
): number {
  if (spawnColumn !== playerColumn || proposedRow !== CLASSIC_SUB_ROWS[playerDepth]) {
    return proposedRow;
  }
  return proposedRow === CLASSIC_SUB_ROWS[0] ? CLASSIC_SUB_ROWS[1] : CLASSIC_SUB_ROWS[0];
}
