/** Timing for fixed LCD destruction glyphs, in milliseconds. */
export const DEBRIS_HOLD_MS = 230;
export const DEBRIS_FADE_MS = 140;

// Give a lost submarine time to register before the next state appears.
export const PLAYER_DEBRIS_MULTIPLIER = 3;
export const PLAYER_DEBRIS_DURATION_MS =
  (DEBRIS_HOLD_MS + DEBRIS_FADE_MS) * PLAYER_DEBRIS_MULTIPLIER;
export const PLAYER_DEATH_PAUSE_MS = PLAYER_DEBRIS_DURATION_MS + 120;
