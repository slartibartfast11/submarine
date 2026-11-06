import { test } from 'node:test';
import {
  CLASSIC_COLUMNS, CLASSIC_ROWS, CLASSIC_HALF_COLUMNS, CLASSIC_HALF_ROWS,
  CLASSIC_SURFACE_ROW, classicHalfColumnX, classicHalfRowY,
  classicHalfHitsCell, classicShotsMeet, classicSubAction,
  classicTorpedoDirection, classicPlaneCanRelease,
  classicBombFlight, classicBombLateralStep,
} from '../src/classic-grid.ts';
import assert from 'node:assert/strict';
import {
  canFire, chooseBest, classicPlaneStep, classicTickMs, CLASSIC_AIR_ROWS,
  CLASSIC_CELL_WIDTH, CLASSIC_ACTOR_MOVE_TICKS, ENTRY_STEP_MS,
  PLAYER_COLUMNS, PLAYER_DEPTHS, CLASSIC_ROW_Y,
  speedScale, stageAfter, stageGoal, stageTarget,
} from '../src/config.ts';

test('shared Classic playfield has six columns and six logical rows', () => {
  assert.equal(PLAYER_COLUMNS.length, 6);
  assert.equal(PLAYER_DEPTHS.length, 2);
  assert.equal(CLASSIC_ROW_Y.length, 6);
  assert.equal(CLASSIC_COLUMNS, 6);
  assert.equal(CLASSIC_ROWS, 6);
  assert.equal(CLASSIC_SURFACE_ROW, 3);
  assert.equal(CLASSIC_HALF_COLUMNS, 12);
  assert.equal(CLASSIC_HALF_ROWS, 12);
  assert.equal(PLAYER_COLUMNS[2], 405);
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
  assert.ok(ENTRY_STEP_MS >= 2000);
  assert.equal(CLASSIC_ACTOR_MOVE_TICKS, 4);
});
test('Classic planes ALWAYS advance horizontally, independently of altitude', () => {
  for (const direction of [-1, 1]) {
    for (let row = 0; row < CLASSIC_AIR_ROWS.length; row++) {
      for (const vertical of [-1, 0, 1]) {
        const next = classicPlaneStep(400, row, direction, vertical);
        assert.equal(next.x, 400 + CLASSIC_CELL_WIDTH * direction);
        assert.ok(next.row >= 0 && next.row < CLASSIC_AIR_ROWS.length);
        assert.ok(Math.abs(next.row - row) <= 1);
      }
    }
  }
  assert.deepEqual(classicPlaneStep(0, 1, 1, -1), { x: CLASSIC_CELL_WIDTH, row: 0 });
  assert.deepEqual(classicPlaneStep(0, 0, -1, -1), { x: -CLASSIC_CELL_WIDTH, row: 0 });
});

test('each whole aircraft cell is hit by either fore or aft projectile half', () => {
  for (let col = 0; col < CLASSIC_COLUMNS; col++) {
    for (let row = 0; row < 3; row++) {
      for (const leftRight of [0, 1]) {
        for (const highLow of [0, 1]) {
          assert.equal(classicHalfHitsCell(col * 2 + leftRight, row * 2 + highLow, col, row), true);
        }
      }
      if (col < 5) assert.equal(classicHalfHitsCell(col * 2 + 2, row * 2, col, row), false);
    }
  }
  assert.equal(classicShotsMeet(5, 4, 5, 4), true);
  assert.equal(classicShotsMeet(5, 4, 4, 4), false);
});
test('half-cell coordinates are ordered and stay inside the field', () => {
  for (let col = 0; col < 6; col++) {
    const aft = classicHalfColumnX(2 * col);
    const fore = classicHalfColumnX(2 * col + 1);
    assert.ok(aft < PLAYER_COLUMNS[col] && fore > PLAYER_COLUMNS[col]);
    assert.equal(fore - aft, CLASSIC_CELL_WIDTH / 2);
  }
  for (let row = 0; row < 11; row++) assert.ok(classicHalfRowY(row + 1) > classicHalfRowY(row));
});
test('Classic sub appears, attacks, changes depth, may attack again then vanishes', () => {
  assert.equal(classicSubAction(1, 0, false), 'wait');
  assert.equal(classicSubAction(3, 0, false), 'fire');
  assert.equal(classicSubAction(12, 1, true), 'change-depth');
  assert.equal(classicSubAction(15, 1, false), 'fire');
  assert.equal(classicSubAction(15, 1, true), 'wait');
  assert.equal(classicSubAction(26, 2, false), 'disappear');
});
test('Classic torpedo automatically fires towards the visible enemy side', () => {
  assert.equal(classicTorpedoDirection(2, 0), -1);
  assert.equal(classicTorpedoDirection(2, 5), 1);
  assert.equal(classicTorpedoDirection(2, null), null);
  assert.equal(classicTorpedoDirection(0, 0), -1);
});

test('Classic reconnaissance flights do not release bombs', () => {
  assert.equal(classicPlaneCanRelease(true, 0), false);
  assert.equal(classicPlaneCanRelease(true, 1), false);
  assert.equal(classicPlaneCanRelease(false, 0), true);
  assert.equal(classicPlaneCanRelease(false, 1), true);
  assert.equal(classicPlaneCanRelease(false, 2), false);
});
test('Classic bombs may descend vertically or angle at fixed half-cell intervals', () => {
  assert.equal(classicBombFlight(0.2), 'straight');
  assert.equal(classicBombFlight(0.6), 'diagonal');
  assert.equal(classicBombFlight(0.9), 'water-hook');
  assert.equal(classicBombLateralStep('straight', 8, 2, 1), 0);
  assert.equal(classicBombLateralStep('diagonal', 4, 2, -1), -1);
  assert.equal(classicBombLateralStep('diagonal', 5, 3, 1), 0);
  assert.equal(classicBombLateralStep('water-hook', 5, 4, 1), 0);
  assert.equal(classicBombLateralStep('water-hook', 6, 4, 1), 1);
  assert.equal(classicBombLateralStep('water-hook', 7, 5, 1), 0);
});
