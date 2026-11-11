import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SUBMARINE_VERTICAL_CLEARANCE, safeSubSpawnRow, submarineOccupiesCell,
} from '../src/submarine-occupancy.ts';

const sub = (gridColumn, gridRow, y) => ({ gridColumn, gridRow, y });

test('Classic denies the occupied submarine cell, but permits a neighbouring column or other depth', () => {
  const enemy = sub(5, 5, 421);
  assert.equal(submarineOccupiesCell('classic', enemy, 5, 1), true);
  assert.equal(submarineOccupiesCell('classic', enemy, 4, 1), false);
  assert.equal(submarineOccupiesCell('classic', enemy, 5, 0), false);
  assert.equal(submarineOccupiesCell('classic', enemy, 0, 1), false);
});

test('Classic blocks the upper lane too, including a player depth change into that cell', () => {
  const enemy = sub(0, 4, 345);
  assert.equal(submarineOccupiesCell('classic', enemy, 0, 0), true);
  assert.equal(submarineOccupiesCell('classic', enemy, 0, 1), false);
  assert.equal(submarineOccupiesCell('classic', enemy, 1, 0), false);
});

test('Modern treats the enemy at the screen edge as occupying its logical edge column', () => {
  const enemy = sub(5, 5, 421);
  assert.equal(submarineOccupiesCell('dynamic', enemy, 5, 1), true);
  assert.equal(submarineOccupiesCell('dynamic', enemy, 4, 1), false);
  assert.equal(submarineOccupiesCell('dynamic', enemy, 5, 0), false);
});

test('Modern sub depth transition is blocked before its hull can overlap either lane', () => {
  const initial = sub(0, 4, 345);
  assert.equal(submarineOccupiesCell('dynamic', initial, 0, 0), true);
  assert.equal(submarineOccupiesCell('dynamic', { ...initial, y: 421 - SUBMARINE_VERTICAL_CLEARANCE - 1 }, 0, 1), false);
  assert.equal(submarineOccupiesCell('dynamic', { ...initial, y: 421 - SUBMARINE_VERTICAL_CLEARANCE + 1 }, 0, 1), true);
  assert.equal(submarineOccupiesCell('dynamic', { ...initial, y: 390 }, 0, 0), false);
});

test('enemy submarines choose the other depth rather than spawning on the player', () => {
  assert.equal(safeSubSpawnRow(5, 5, 5, 1), 4);
  assert.equal(safeSubSpawnRow(4, 0, 0, 0), 5);
  assert.equal(safeSubSpawnRow(5, 5, 5, 0), 5);
  assert.equal(safeSubSpawnRow(4, 0, 1, 0), 4);
});
