import { test } from 'node:test';
import assert from 'node:assert/strict';
import { modernMissileInterceptsDrop, overlapsBox, sweptBoxesOverlap } from '../src/collision.ts';

const box = (x, y, width, height) => ({x, y, width, height});

test('full sprite rectangles collide even when the visible pixels might miss', () => {
  assert.equal(overlapsBox(box(0, 0, 12, 16), box(11, 13, 12, 12)), true);
  assert.equal(overlapsBox(box(0, 0, 12, 16), box(13, 15, 12, 12)), false);
});

test('rising missile intercepts a falling bomb crossing between ticks', () => {
  const missileBefore = box(100, 180, 12, 16);
  const missileAfter = box(100, 145, 12, 16);
  const bombBefore = box(100, 140, 12, 12);
  const bombAfter = box(100, 155, 12, 12);
  assert.equal(sweptBoxesOverlap(missileBefore, missileAfter, bombBefore, bombAfter), true);
});

test('parallel missiles and bombs in separate columns do not collide', () => {
  assert.equal(sweptBoxesOverlap(box(100, 180, 12, 16), box(100, 145, 12, 16),
    box(130, 140, 12, 12), box(130, 155, 12, 12)), false);
});

test('Modern missiles catch a drifting drop on either side of the firing line', () => {
  const missileBefore = box(705, 320, 12, 18);
  const missileAfter = box(705, 298, 12, 18);
  for (const side of [-1, 1]) {
    const dropBefore = box(705 + side * 15, 295, 12, 12);
    const dropAfter = box(705 + side * 16, 303, 12, 12);
    assert.equal(sweptBoxesOverlap(missileBefore, missileAfter, dropBefore, dropAfter), false);
    assert.equal(modernMissileInterceptsDrop(missileBefore, missileAfter, dropBefore, dropAfter), true);
  }
});

test('Modern interception still requires a close, simultaneous pass', () => {
  const missileBefore = box(705, 320, 12, 18);
  const missileAfter = box(705, 298, 12, 18);
  // The drop crosses the missile vertically just outside its defensive reach.
  assert.equal(modernMissileInterceptsDrop(missileBefore, missileAfter,
    box(730, 295, 12, 12), box(731, 303, 12, 12)), false);
  // Within horizontal reach, but the missile is already above the falling drop.
  assert.equal(modernMissileInterceptsDrop(missileBefore, missileAfter,
    box(720, 340, 12, 12), box(721, 348, 12, 12)), false);
});

test('fast-moving missile hits aircraft crossed between simulation frames', () => {
  assert.equal(sweptBoxesOverlap(box(100, 140, 12, 16), box(100, 100, 12, 16),
    box(100, 119, 76, 18), box(100, 119, 76, 18)), true);
});

test('no phantom hits when trajectories cross at different times', () => {
  assert.equal(sweptBoxesOverlap(box(0, 0, 2, 2), box(20, 0, 2, 2),
    box(10, -20, 2, 2), box(10, -10, 2, 2)), false);
});
