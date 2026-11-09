export type ScreenEdge = 'left' | 'right';

export function exitEdge(direction: -1 | 1): ScreenEdge {
  return direction === 1 ? 'right' : 'left';
}

export function entryEdge(direction: -1 | 1): ScreenEdge {
  return direction === 1 ? 'left' : 'right';
}

export function chooseEntryDirection(
  randomValue: number,
  recentExit: ScreenEdge | null,
  timeSinceExitMs: number,
  continuityWindowMs = 1800,
): -1 | 1 {
  // Do not re-enter from the edge a plane has just exited.
  if (recentExit !== null && timeSinceExitMs < continuityWindowMs) {
    return recentExit === 'right' ? 1 : -1;
  }
  return randomValue < 0.5 ? 1 : -1;
}
