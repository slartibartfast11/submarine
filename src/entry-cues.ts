import { SFX_PRESETS } from './sfx-presets.ts';

// All six pings use precisely the same sound. Rests are measured from the end
// of one ping to the start of the next; the gaps shrink within each group.
// The first ping of each 1 / 2 / 3 group moves the player submarine.
const ping = SFX_PRESETS.entryPing;
export const ENTRY_PING_DURATION_MS = Math.round(
  (ping.attack + ping.sustain + ping.decay) * 1000,
);
export const ENTRY_FULL_REST_MS = 350;
export const ENTRY_HALF_REST_MS = 175;
export const ENTRY_QUARTER_REST_MS = 90;

const firstPairAt = ENTRY_PING_DURATION_MS + ENTRY_FULL_REST_MS;
const secondPairAt = firstPairAt + ENTRY_PING_DURATION_MS + ENTRY_HALF_REST_MS;
const firstTripleAt = secondPairAt + ENTRY_PING_DURATION_MS + ENTRY_FULL_REST_MS;
const secondTripleAt = firstTripleAt + ENTRY_PING_DURATION_MS + ENTRY_QUARTER_REST_MS;
const thirdTripleAt = secondTripleAt + ENTRY_PING_DURATION_MS + ENTRY_QUARTER_REST_MS;

// Timers follow the scene clock, so a paused entry pauses movement and sound.
export const ENTRY_SEQUENCE = [
  { atMs: 0, sound: 'entryPing', column: 4 },
  { atMs: firstPairAt, sound: 'entryPing', column: 3 },
  { atMs: secondPairAt, sound: 'entryPing', column: 3 },
  { atMs: firstTripleAt, sound: 'entryPing', column: 2 },
  { atMs: secondTripleAt, sound: 'entryPing', column: 2 },
  { atMs: thirdTripleAt, sound: 'entryPing', column: 2 },
] as const;

// Unlock controls exactly as the last 416 ms ping fades out.
export const ENTRY_COMPLETE_MS = thirdTripleAt + ENTRY_PING_DURATION_MS;
