/**
 * Each cue begins when the submarine advances to its next entry position.
 * One phrase per 2.1-second step: dah-dunn / dah-dunn / dunnnn.
 * Keep the gaps between steps; they give the approach its deliberate pace.
 */
export const ENTRY_CUES = [
  [{ sound: 'entryDah', offset: 0 }, { sound: 'entryDunn', offset: 0.27 }],
  [{ sound: 'entryDah', offset: 0 }, { sound: 'entryDunn', offset: 0.24 }],
  [{ sound: 'entryFinal', offset: 0 }],
] as const;
