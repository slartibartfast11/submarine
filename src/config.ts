export const SCREEN = { width: 960, height: 540, waterline: 263, seafloor: 491, hudHeight: 85 } as const;
export const COLOURS = {
  background: 0xd5dac8,
  dark: 0x26372d,
  mid: 0x62745f,
  light: 0xa5b3a0,
} as const;

// Five positions, numbered 1–5 left to right; two fixed depth lanes.
export const PLAYER_COLUMNS = [110, 295, 480, 665, 850] as const;
export const PLAYER_DEPTHS = [343, 421] as const;
export const LIVES = 3;

// Classic runs on a shared discrete clock; the entire world advances once
// per tick. Difficulty shortens the interval instead of interpolating frames.
export const CLASSIC_BASE_TICK_MS = 145;
export const CLASSIC_AIR_STEP = 40; // Aircraft grid is finer than the player's.
export const CLASSIC_AIR_ROWS = [118, 156, 194] as const;
export const ENTRY_STEP_MS = 900; // 5 ... 4 ... 3 ... ready.

export function classicTickMs(cycle: number): number {
  return CLASSIC_BASE_TICK_MS / speedScale(cycle);
}

/** Aircraft ALWAYS move one column horizontally, optionally changing altitude. */
export function classicPlaneStep(
  x: number, row: number, direction: -1 | 1, verticalChange: -1 | 0 | 1,
): { x: number; row: number } {
  return {
    x: x + CLASSIC_AIR_STEP * direction,
    row: Math.max(0, Math.min(CLASSIC_AIR_ROWS.length - 1, row + verticalChange)),
  };
}

export type GameMode = 'classic' | 'dynamic';
export type StageNumber = 1 | 2 | 3;
export type TargetKind = 'plane' | 'sweeper' | 'sub';
export type StagePosition = { cycle: number; stage: StageNumber };
export type BestRun = StagePosition & { score: number };

// Each stage is an objective, not a timer. The early quotas are tunable.
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
  // An equal score never overwrites the stage where the record was achieved.
  return candidate.score > previous.score ? { ...candidate } : previous;
}
export function speedScale(cycle: number): number {
  return Math.min(2.5, 1 + (cycle - 1) * 0.14);
}

// The missile and torpedo have independent single-projectile slots.
export function canFire(weapon: 'missile' | 'torpedo', airborne: boolean, underwater: boolean): boolean {
  return weapon === 'missile' ? !airborne : !underwater;
}
