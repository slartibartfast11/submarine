import { test } from 'node:test';
import {
  CLASSIC_COLUMNS, CLASSIC_ROWS, CLASSIC_HALF_COLUMNS, CLASSIC_HALF_ROWS,
  CLASSIC_QUARTER_COLUMNS, CLASSIC_SURFACE_ROW, classicHalfColumnX, classicHalfRowY,
  classicQuarterColumnX, classicHalfHitsCell, classicQuarterHitsCell,
  classicMissileBombContact, classicMissileQuarterBombContact, classicSubAction,
  classicTorpedoDirection, classicTorpedoY, classicTorpedoesContact,
  chooseSubPattern, dynamicSubAction, dynamicSubDepthProgress,
  classicPlaneCanRelease,
  classicBombFlight, classicBombQuarterStep, classicAdjacentBombThreat,
} from '../src/classic-grid.ts';
import assert from 'node:assert/strict';
import {
  advanceWarpCode, canFire, chooseBest, classicPlaneRow, classicTickMs, CLASSIC_AIR_ROWS,
  planePoseForMotion,
  CLASSIC_CELL_WIDTH, CLASSIC_ACTOR_MOVE_TICKS, CLASSIC_SURFACE_MOVE_TICKS,
  CLASSIC_TORPEDO_MOVE_TICKS,
  DYNAMIC_TORPEDO_SPEED, ENTRY_STEP_MS, torpedoUnlocked,
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
  assert.equal(CLASSIC_QUARTER_COLUMNS, 24);
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
  assert.equal(torpedoUnlocked(1, 3), true);
  assert.equal(torpedoUnlocked(2, 1), false);
  assert.equal(torpedoUnlocked(2, 2), false);
  assert.equal(torpedoUnlocked(2, 3), true);
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
  assert.equal(CLASSIC_SURFACE_MOVE_TICKS, 8);
});
test('Classic aircraft altitude stays within the sky rows', () => {
  for (let row = 0; row < CLASSIC_AIR_ROWS.length; row++) {
    for (const vertical of [-1, 0, 1]) {
      const nextRow = classicPlaneRow(row, vertical);
      assert.ok(nextRow >= 0 && nextRow < CLASSIC_AIR_ROWS.length);
      assert.ok(Math.abs(nextRow - row) <= 1);
    }
  }
  assert.equal(classicPlaneRow(1, -1), 0);
  assert.equal(classicPlaneRow(0, -1), 0);
  assert.equal(classicPlaneRow(CLASSIC_AIR_ROWS.length - 1, 1), CLASSIC_AIR_ROWS.length - 1);
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
test('quarter-column positions are evenly spaced and cover the original whole cells', () => {
  for (let q = 0; q < CLASSIC_QUARTER_COLUMNS - 1; q++) {
    assert.equal(classicQuarterColumnX(q + 1) - classicQuarterColumnX(q),
      CLASSIC_CELL_WIDTH / 4);
  }
  for (let col = 0; col < CLASSIC_COLUMNS; col++) {
    assert.equal((classicQuarterColumnX(col * 4) + classicQuarterColumnX(col * 4 + 1)) / 2,
      classicHalfColumnX(col * 2));
    assert.equal((classicQuarterColumnX(col * 4 + 2) + classicQuarterColumnX(col * 4 + 3)) / 2,
      classicHalfColumnX(col * 2 + 1));
    for (let sub = 0; sub < 4; sub++) {
      assert.equal(classicQuarterHitsCell(col * 4 + sub, 9, col, 4), true);
    }
  }
});
test('Classic sub appears, attacks, changes depth, may attack again then vanishes', () => {
  assert.equal(classicSubAction(1, 0), 'wait');
  assert.equal(classicSubAction(4, 0), 'fire');
  assert.equal(classicSubAction(12, 1), 'change-depth');
  assert.equal(classicSubAction(15, 1), 'fire');
  assert.equal(classicSubAction(32, 2), 'disappear');
});
test('Classic torpedo automatically fires towards the visible enemy side', () => {
  assert.equal(classicTorpedoDirection(2, 0), -1);
  assert.equal(classicTorpedoDirection(2, 5), 1);
  assert.equal(classicTorpedoDirection(2, null, -1), -1);
  assert.equal(classicTorpedoDirection(2, null, 1), 1);
  assert.equal(classicTorpedoDirection(0, 0, -1), -1);
});

test('Classic reconnaissance flights do not release bombs', () => {
  assert.equal(classicPlaneCanRelease(true, 0), false);
  assert.equal(classicPlaneCanRelease(true, 1), false);
  assert.equal(classicPlaneCanRelease(false, 0), true);
  assert.equal(classicPlaneCanRelease(false, 1), true);
  assert.equal(classicPlaneCanRelease(false, 2), false);
});
test('Classic aircraft drops have fixed shallow quarter-column trajectories from launch', () => {
  assert.equal(classicBombFlight(0.2), 'straight');
  assert.equal(classicBombFlight(0.60), 'shallow');
  assert.equal(classicBombFlight(0.78), 'medium');
  assert.equal(classicBombFlight(0.95), 'steep');
  for (let tick = 1; tick <= 12; tick++) {
    assert.equal(classicBombQuarterStep('straight', tick, 1), 0);
    for (const [pattern, interval] of [['shallow', 4], ['medium', 3], ['steep', 2]]) {
      const expected = (tick - 1) % interval === 0 ? 1 : 0;
      assert.equal(classicBombQuarterStep(pattern, tick, 1), expected, pattern);
      assert.equal(classicBombQuarterStep(pattern, tick, -1), expected === 0 ? 0 : -1, pattern);
    }
  }
  // The same fixed cadence applies above, at, and below the waterline.
  assert.equal(classicBombQuarterStep('shallow', 5, 1), 1);
  assert.equal(classicBombQuarterStep('shallow', 6, 1), 0);
});

test('Emergency interception follows the new quarter-column approach only when threatening', () => {
  // Player at column 2 (zero-based); quarter-column 7 is in the next
  // whole cell to the left and crosses into our cell on the next tick.
  assert.equal(classicAdjacentBombThreat(7, 7, 'shallow', 0, 1, 2, 4), true);
  assert.equal(classicAdjacentBombThreat(12, 7, 'medium', 0, -1, 2, 4), true);
  assert.equal(classicAdjacentBombThreat(7, 9, 'steep', 0, 1, 2, 5), true);
  assert.equal(classicAdjacentBombThreat(7, 7, 'straight', 0, 1, 2, 4), false);
  assert.equal(classicAdjacentBombThreat(7, 7, 'shallow', 0, -1, 2, 4), false);
  assert.equal(classicAdjacentBombThreat(3, 7, 'shallow', 0, 1, 2, 4), false);
  assert.equal(classicAdjacentBombThreat(5, 7, 'shallow', 0, 1, 2, 4), false);
  assert.equal(classicAdjacentBombThreat(7, 4, 'shallow', 0, 1, 2, 4), false);
  assert.equal(classicAdjacentBombThreat(8, 7, 'shallow', 0, 1, 2, 4), false);
});

test('quarter-column drops retain forgiving missile interception without widening it', () => {
  // A half-column 7 missile is at x=592.5: bombs 13..16 fall within 75px.
  for (const quarter of [13, 14, 15, 16]) {
    assert.equal(classicMissileQuarterBombContact(7, 9, 8, quarter, quarter, 7, 8), true);
  }
  for (const quarter of [12, 17]) {
    assert.equal(classicMissileQuarterBombContact(7, 9, 8, quarter, quarter, 7, 8), false);
  }
  // A bomb stepping out of range on the crossing tick is still intercepted.
  assert.equal(classicMissileQuarterBombContact(7, 9, 8, 16, 17, 7, 8), true);
  assert.equal(classicMissileQuarterBombContact(7, 9, 8, 17, 18, 7, 8), false);
  assert.equal(classicMissileQuarterBombContact(7, 9, 8, 15, 15, 3, 4), false);
});

test('Classic upward missiles intercept bombs one half-column to either side', () => {
  // Missile launched on grid 7; bombs on 6/7/8 all intercept.
  for (const bombColumn of [6, 7, 8]) {
    assert.equal(classicMissileBombContact(7, 8, 8, bombColumn, 8, 8), true);
    assert.equal(classicMissileBombContact(7, 9, 8, bombColumn, 7, 8), true);
    // Opposing shots cross between successive LCD states: 8 -> 7, 7 -> 8.
    assert.equal(classicMissileBombContact(7, 8, 7, bombColumn, 7, 8), true);
  }
  assert.equal(classicMissileBombContact(7, 9, 8, 5, 7, 8), false);
  assert.equal(classicMissileBombContact(7, 9, 8, 9, 7, 8), false);
});
test('No interception when vertical trajectories have not met', () => {
  assert.equal(classicMissileBombContact(7, 9, 8, 8, 3, 4), false);
  assert.equal(classicMissileBombContact(7, 5, 4, 8, 9, 10), false);
  assert.equal(classicMissileBombContact(7, 8, 8, 8, 9, 9), false);
});
test('Player has a distinct lower starting depth', () => {
  assert.equal(PLAYER_DEPTHS.length, 2);
  assert.ok(PLAYER_DEPTHS[1] > PLAYER_DEPTHS[0]);
});

test('G<cycle><stage> warp codes select any cycle and stage', () => {
  assert.deepEqual(advanceWarpCode('', 'KeyG'), { sequence: 'G', target: null });
  assert.deepEqual(advanceWarpCode('G', 'Digit1'), { sequence: 'G1', target: null });
  assert.deepEqual(advanceWarpCode('G1', 'Digit3'), {
    sequence: '', target: { cycle: 1, stage: 3 },
  });
  assert.deepEqual(advanceWarpCode('G2', 'Digit1'), {
    sequence: '', target: { cycle: 2, stage: 1 },
  });
  assert.deepEqual(advanceWarpCode('G3', 'Digit3'), {
    sequence: '', target: { cycle: 3, stage: 3 },
  });
  assert.deepEqual(advanceWarpCode('G2', 'Numpad3'), {
    sequence: '', target: { cycle: 2, stage: 3 },
  });
  assert.deepEqual(advanceWarpCode('G2', 'Digit4'), { sequence: '', target: null });
  assert.deepEqual(advanceWarpCode('G', 'Space'), { sequence: '', target: null });
  assert.deepEqual(advanceWarpCode('', 'Digit1'), { sequence: '', target: null });
});

test('torpedoes are enabled only in the submarine stage of each cycle', () => {
  for (const cycle of [1, 2, 3]) {
    assert.equal(torpedoUnlocked(cycle, 1), false);
    assert.equal(torpedoUnlocked(cycle, 2), false);
    assert.equal(torpedoUnlocked(cycle, 3), true);
  }
  assert.equal(canFire('torpedo', true, false), true);
  assert.equal(canFire('missile', false, true), true);
});
test('Classic torpedoes move one half-column every two ticks', () => {
  assert.equal(CLASSIC_TORPEDO_MOVE_TICKS, 2);
  assert.ok(DYNAMIC_TORPEDO_SPEED <= 210);
});
test('torpedo render position is exactly level with the hull', () => {
  assert.equal(classicTorpedoY(9), PLAYER_DEPTHS[0]);
  assert.equal(classicTorpedoY(11), PLAYER_DEPTHS[1]);
});
test('opposing torpedoes intercept at the same submarine depth', () => {
  assert.equal(classicTorpedoesContact(6, 7, 11, 8, 7, 11), true);
  assert.equal(classicTorpedoesContact(6, 7, 11, 7, 6, 11), true);
  assert.equal(classicTorpedoesContact(5, 6, 11, 10, 9, 11), false);
  assert.equal(classicTorpedoesContact(6, 7, 11, 8, 7, 9), false);
});
test('enemy submarines may be decoys, single shooters, dives or double attacks', () => {
  assert.equal(chooseSubPattern(0.1), 'decoy');
  assert.equal(chooseSubPattern(0.4), 'single');
  assert.equal(chooseSubPattern(0.7), 'dive');
  assert.equal(chooseSubPattern(0.9), 'double');
  assert.equal(classicSubAction(5, 0, 'decoy'), 'wait');
  assert.equal(classicSubAction(13, 0, 'decoy'), 'disappear');
  assert.equal(classicSubAction(4, 0, 'single'), 'fire');
  assert.equal(classicSubAction(12, 1, 'single'), 'wait');
  assert.equal(classicSubAction(12, 1, 'dive'), 'change-depth');
  assert.equal(classicSubAction(16, 1, 'double'), 'fire');
});
test('Dynamic subs rest precisely on two depths, with brief transitions', () => {
  assert.equal(dynamicSubAction(800, 0, 'decoy'), 'wait');
  assert.equal(dynamicSubAction(2200, 0, 'decoy'), 'disappear');
  assert.equal(dynamicSubAction(800, 0, 'single'), 'fire');
  assert.equal(dynamicSubAction(2250, 1, 'double'), 'fire');
  assert.equal(dynamicSubDepthProgress(1200, 'double'), 0);
  assert.ok(dynamicSubDepthProgress(1550, 'double') > 0);
  assert.ok(dynamicSubDepthProgress(1550, 'double') < 1);
  assert.equal(dynamicSubDepthProgress(1700, 'double'), 1);
  assert.equal(dynamicSubDepthProgress(9999, 'single'), 0);
});

test('four fighter LCD attitudes are selected by actual change and travel direction', () => {
  assert.deepEqual(planePoseForMotion(0, 1), { texture: 'plane', flipX: false });
  assert.deepEqual(planePoseForMotion(0, -1), { texture: 'plane', flipX: true });
  assert.deepEqual(planePoseForMotion(1, 1), { texture: 'planeBankRight', flipX: false });
  assert.deepEqual(planePoseForMotion(1, -1), { texture: 'planeBankLeft', flipX: false });
  assert.deepEqual(planePoseForMotion(-1, 1), { texture: 'planeClimb', flipX: false });
  assert.deepEqual(planePoseForMotion(-1, -1), { texture: 'planeClimb', flipX: true });
});

