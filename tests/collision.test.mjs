import { test } from 'node:test';
import assert from 'node:assert/strict';
import { overlapsBox, sweptBoxesOverlap } from '../src/collision.ts';

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

test('fast-moving missile hits aircraft crossed between simulation frames', () => {
  assert.equal(sweptBoxesOverlap(box(100, 140, 12, 16), box(100, 100, 12, 16),
    box(100, 119, 76, 18), box(100, 119, 76, 18)), true);
});

test('no phantom hits when trajectories cross at different times', () => {
  assert.equal(sweptBoxesOverlap(box(0, 0, 2, 2), box(20, 0, 2, 2),
    box(10, -20, 2, 2), box(10, -10, 2, 2)), false);
});
