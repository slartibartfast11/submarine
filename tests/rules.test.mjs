import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canFire, chooseBest, classicPlaneStep, classicTickMs, CLASSIC_AIR_ROWS,
  CLASSIC_AIR_STEP, ENTRY_STEP_MS, PLAYER_COLUMNS, PLAYER_DEPTHS,
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

test('Classic is a discrete shared clock which accelerates by cycle', () => {
  assert.ok(classicTickMs(1) >= 100 && classicTickMs(1) <= 175);
  assert.ok(classicTickMs(2) < classicTickMs(1));
  assert.ok(ENTRY_STEP_MS > classicTickMs(1) * 4);
});
test('Classic planes ALWAYS advance horizontally, independently of altitude', () => {
  for (const direction of [-1, 1]) {
    for (let row = 0; row < CLASSIC_AIR_ROWS.length; row++) {
      for (const vertical of [-1, 0, 1]) {
        const next = classicPlaneStep(400, row, direction, vertical);
        assert.equal(next.x, 400 + CLASSIC_AIR_STEP * direction);
        assert.ok(next.row >= 0 && next.row < CLASSIC_AIR_ROWS.length);
        assert.ok(Math.abs(next.row - row) <= 1);
      }
    }
  }
  assert.deepEqual(classicPlaneStep(0, 1, 1, -1), { x: CLASSIC_AIR_STEP, row: 0 });
  assert.deepEqual(classicPlaneStep(0, 0, -1, -1), { x: -CLASSIC_AIR_STEP, row: 0 });
});
