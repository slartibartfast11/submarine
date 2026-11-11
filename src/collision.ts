/** Axis-aligned logical sprite boxes, independent of visible opaque pixels. */
export type Box = { x: number; y: number; width: number; height: number };

export function overlapsBox(a: Box, b: Box): boolean {
  return Math.abs(a.x - b.x) <= (a.width + b.width) / 2 &&
    Math.abs(a.y - b.y) <= (a.height + b.height) / 2;
}

/**
 * Test the entire path between simulation ticks, not just the endpoints.
 * Relative movement allows two projectiles to cross each other in one tick.
 * Rectangles, not individual sprite pixels, determine a hit in both modes.
 */
export function sweptBoxesOverlap(aBefore: Box, aAfter: Box, bBefore: Box, bAfter: Box): boolean {
  if (overlapsBox(aBefore, bBefore)) return true;
  let enter = 0;
  let exit = 1;
  for (const axis of ['x', 'y'] as const) {
    const offset = aBefore[axis] - bBefore[axis];
    const relativeTravel = (aAfter[axis] - aBefore[axis]) - (bAfter[axis] - bBefore[axis]);
    const halfExtent = (aBefore[axis === 'x' ? 'width' : 'height'] +
      bBefore[axis === 'x' ? 'width' : 'height']) / 2;
    if (Math.abs(relativeTravel) < 1e-9) {
      if (Math.abs(offset) > halfExtent) return false;
      continue;
    }
    const t0 = (-halfExtent - offset) / relativeTravel;
    const t1 = (halfExtent - offset) / relativeTravel;
    enter = Math.max(enter, Math.min(t0, t1));
    exit = Math.min(exit, Math.max(t0, t1));
    if (enter > exit) return false;
  }
  return enter <= exit && exit >= 0 && enter <= 1;
}

/** Modern drops can drift to either side of the player's fixed firing line. */
export function modernMissileInterceptsDrop(
  missileBefore: Box, missileAfter: Box, dropBefore: Box, dropAfter: Box,
): boolean {
  const sideAllowance = 12;
  const width = missileBefore.width + 2 * sideAllowance;
  return sweptBoxesOverlap(
    { ...missileBefore, width }, { ...missileAfter, width }, dropBefore, dropAfter,
  );
}
