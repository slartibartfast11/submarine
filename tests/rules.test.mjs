import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canFire, chooseBest, PLAYER_COLUMNS, PLAYER_DEPTHS,
  speedScale, stageAfter, stageGoal, stageTarget,
} from '../src/config.ts';

test('player movement uses five horizontal columns and two depths', () => {
  assert.equal(PLAYER_COLUMNS.length, 5);
  assert.equal(PLAYER_DEPTHS.length, 2);
  assert.equal(PLAYER_COLUMNS[2], 480);
});
test('missile and torpedo locks are independent', () => {
  assert.equal(canFire('missile', true, false), false);
  assert.equal(canFire('torpedo', true, false), true);
  assert.equal(canFire('missile', false, true), true);
  assert.equal(canFire('torpedo', false, true), false);
});
test('stage advances through kill objectives, never by waiting', () => {
  assert.equal(stageTarget(1), 'plane');
  assert.equal(stageTarget(2), 'sweeper');
  assert.equal(stageTarget(3), 'sub');
  assert.deepEqual(stageAfter(1, 1), { cycle: 1, stage: 2 });
  assert.deepEqual(stageAfter(1, 2), { cycle: 1, stage: 3 });
  assert.deepEqual(stageAfter(1, 3), { cycle: 2, stage: 1 });
  assert.equal(stageGoal(1, 1), 8);
  assert.equal(stageGoal(1, 2), 4);
  assert.equal(stageGoal(1, 3), 4);
  assert.ok(stageGoal(2, 1) > stageGoal(1, 1));
});
test('session best records the stage of the new high score, not furthest stage', () => {
  const initial = { score: 1350, cycle: 2, stage: 3 };
  assert.deepEqual(chooseBest(initial, { score: 900, cycle: 4, stage: 3 }), initial);
  assert.deepEqual(chooseBest(initial, { score: 1350, cycle: 5, stage: 1 }), initial);
  assert.deepEqual(chooseBest(initial, { score: 1600, cycle: 3, stage: 1 }),
    { score: 1600, cycle: 3, stage: 1 });
});
test('difficulty grows but is capped', () => {
  assert.equal(speedScale(1), 1);
  assert.ok(speedScale(2) > speedScale(1));
  assert.equal(speedScale(99), 2.5);
});
