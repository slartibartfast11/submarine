import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canFire, PLAYER_COLUMNS, PLAYER_DEPTHS, speedScale, stageAt } from '../src/config.ts';

test('player movement has eight horizontal columns and two depths', () => {
  assert.equal(PLAYER_COLUMNS.length, 8);
  assert.equal(PLAYER_DEPTHS.length, 2);
});
test('missile and torpedo locks are independent', () => {
  assert.equal(canFire('missile', true, false), false);
  assert.equal(canFire('torpedo', true, false), true);
  assert.equal(canFire('missile', false, true), true);
  assert.equal(canFire('torpedo', false, true), false);
});
test('stage sequence repeats endlessly through 1-1, 1-2, 1-3, 2-1', () => {
  assert.deepEqual(stageAt(0), { cycle: 1, stage: 1 });
  assert.deepEqual(stageAt(35), { cycle: 1, stage: 2 });
  assert.deepEqual(stageAt(70), { cycle: 1, stage: 3 });
  assert.deepEqual(stageAt(105), { cycle: 2, stage: 1 });
});
test('difficulty grows but is capped', () => {
  assert.equal(speedScale(1), 1);
  assert.ok(speedScale(2) > speedScale(1));
  assert.equal(speedScale(99), 2.5);
});
