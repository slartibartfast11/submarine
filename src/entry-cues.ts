import { ENTRY_STEP_MS } from './config';

// Movement falls on the BOO beats of the approved Take 6 preview.
// Notes are triggered by the scene clock so pausing also pauses the sequence.
export const ENTRY_MOVE_OFFSET_MS = 1170;
export const ENTRY_COMPLETE_MS = ENTRY_STEP_MS * 3;

export const ENTRY_SEQUENCE = [
  { atMs: 0, sound: 'entryBaaaa', column: 4 },
  { atMs: ENTRY_MOVE_OFFSET_MS, sound: 'entryBoo', column: 3 },
  { atMs: ENTRY_STEP_MS, sound: 'entryBaaaa', column: 3 },
  { atMs: ENTRY_STEP_MS + ENTRY_MOVE_OFFSET_MS, sound: 'entryBooSecond', column: 2 },
  { atMs: ENTRY_STEP_MS * 2, sound: 'entryFinal', column: 2 },
] as const;
