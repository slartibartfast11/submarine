/** Aircraft sounds are emitted on motion changes, not on every animation frame. */
export type AircraftVerticalMotion = -1 | 0 | 1;
export type AircraftMotionCue = 'climb' | 'dive' | null;

export function aircraftMotionCue(
  previous: AircraftVerticalMotion, next: AircraftVerticalMotion,
): AircraftMotionCue {
  if (next === 0 || next === previous) return null;
  return next < 0 ? 'climb' : 'dive';
}
