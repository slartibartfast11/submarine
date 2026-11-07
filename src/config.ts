export const SCREEN = { width: 960, height: 540, waterline: 263, seafloor: 491, hudHeight: 85 } as const;
export const COLOURS = {
  background: 0xd5dac8,
  dark: 0x26372d,
  mid: 0x62745f,
  light: 0xa5b3a0,
} as const;

// Shared six-column playfield. Three sky rows, one surface row, two sub rows.
// Row display positions are offset around the waterline.
export const PLAYER_COLUMNS = [105, 255, 405, 555, 705, 855] as const;
export const CLASSIC_CELL_WIDTH = 150;
export const CLASSIC_ROW_Y = [110, 162, 214, 254, 345, 421] as const;
export const CLASSIC_AIR_ROWS = [110, 162, 214] as const;
export const PLAYER_DEPTHS = [CLASSIC_ROW_Y[4], CLASSIC_ROW_Y[5]] as const;
export const LIVES = 3;
export const CLASSIC_BASE_TICK_MS = 145;
export const CLASSIC_ACTOR_MOVE_TICKS = 4;
export const CLASSIC_SURFACE_MOVE_TICKS = 8;
export const CLASSIC_SUB_LIFETIME_TICKS = 32;
export const CLASSIC_TORPEDO_MOVE_TICKS = 2;
export const DYNAMIC_TORPEDO_SPEED = 200;
// Entry sequence: columns 5, 4, 3; one hold per position.
export const ENTRY_STEP_MS = 2100;

export function classicTickMs(cycle: number): number {
  return CLASSIC_BASE_TICK_MS / speedScale(cycle);
}

export type PlanePose = 'plane' | 'planeBankRight' | 'planeBankLeft' | 'planeClimb';

/** Select the aircraft mask from vertical movement and travel direction. */
export function planePoseForMotion(
  verticalChange: number, travelDirection: -1 | 1,
): { texture: PlanePose; flipX: boolean } {
  if (verticalChange < 0) return { texture: 'planeClimb', flipX: travelDirection === -1 };
  if (verticalChange > 0) {
    return { texture: travelDirection === 1 ? 'planeBankRight' : 'planeBankLeft', flipX: false };
  }
  return { texture: 'plane', flipX: travelDirection === -1 };
}

export function classicPlaneRow(row: number, verticalChange: -1 | 0 | 1): number {
  return Math.max(0, Math.min(CLASSIC_AIR_ROWS.length - 1, row + verticalChange));
}
export type GameMode = 'classic' | 'dynamic';
export type StageNumber = 1 | 2 | 3;
export type TargetKind = 'plane' | 'sweeper' | 'sub';
export type StagePosition = { cycle: number; stage: StageNumber };
export type BestRun = StagePosition & { score: number };

// Each stage is a kill objective, never a time limit.
export function stageTarget(stage: StageNumber): TargetKind {
  return stage === 1 ? 'plane' : stage === 2 ? 'sweeper' : 'sub';
}
export function stageGoal(cycle: number, stage: StageNumber): number {
  return stage === 1 ? 8 + (cycle - 1) * 2 : 4 + (cycle - 1);
}
export function stageAfter(cycle: number, stage: StageNumber): StagePosition {
  return stage === 3 ? { cycle: cycle + 1, stage: 1 } : { cycle, stage: (stage + 1) as StageNumber };
}
export function chooseBest(previous: BestRun, candidate: BestRun): BestRun {
  return candidate.score > previous.score ? { ...candidate } : previous;
}
export function speedScale(cycle: number): number {
  return Math.min(2.5, 1 + (cycle - 1) * 0.14);
}
export function torpedoUnlocked(cycle: number, stage: StageNumber): boolean {
  // The weapon unlocks in game 1-3 and stays available in subsequent cycles.
  return cycle > 1 || stage === 3;
}
export function canFire(weapon: 'missile' | 'torpedo', airborne: boolean, underwater: boolean): boolean {
  return weapon === 'missile' ? !airborne : !underwater;
}

// Debug stage warp, typed as G<cycle><stage> (e.g. G13, G23, G31).
// Hidden behind a prefix to avoid changing ordinary movement/firing controls.
export type WarpCodeState = { sequence: string; target: StagePosition | null };
export function advanceWarpCode(sequence: string, keyCode: string): WarpCodeState {
  if (keyCode === 'KeyG') return { sequence: 'G', target: null };
  const match = /^(?:Digit|Numpad)([1-9])$/.exec(keyCode);
  if (!match || !sequence.startsWith('G')) return { sequence: '', target: null };
  if (sequence === 'G') return { sequence: `G${match[1]}`, target: null };
  if (/^G[1-9]$/.test(sequence)) {
    const stage = Number(match[1]);
    return {
      sequence: '',
      target: stage >= 1 && stage <= 3 ? { cycle: Number(sequence[1]), stage: stage as StageNumber } : null,
    };
  }
  return { sequence: '', target: null };
}

