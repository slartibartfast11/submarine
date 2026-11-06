export const SCREEN = { width: 960, height: 540, waterline: 263, seafloor: 491 } as const;
export const COLOURS = {
  background: 0xd5dac8,
  dark: 0x26372d,
  mid: 0x62745f,
  light: 0xa5b3a0,
} as const;

// The eight positions are a conscious modern design choice, not LCD emulation.
export const PLAYER_COLUMNS = [95, 205, 315, 425, 535, 645, 755, 865] as const;
export const PLAYER_DEPTHS = [343, 421] as const;
export const STAGE_LENGTH_SECONDS = 35;
export const LIVES = 3;
export type GameMode = 'classic' | 'dynamic';
export type StageNumber = 1 | 2 | 3;

export function stageAt(totalSeconds: number): { cycle: number; stage: StageNumber } {
  const position = Math.floor(Math.max(0, totalSeconds) / STAGE_LENGTH_SECONDS);
  return { cycle: Math.floor(position / 3) + 1, stage: ((position % 3) + 1) as StageNumber };
}

export function speedScale(cycle: number): number {
  return Math.min(2.5, 1 + (cycle - 1) * 0.14);
}

// Each player weapon has its OWN lockout. Firing a missile never locks torpedoes.
export function canFire(weapon: 'missile' | 'torpedo', airborne: boolean, underwater: boolean): boolean {
  return weapon === 'missile' ? !airborne : !underwater;
}
