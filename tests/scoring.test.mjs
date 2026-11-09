import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyScore, extraLivesEarned, INTERCEPT_POINTS } from '../src/scoring.ts';
import { chooseEntryDirection, exitEdge, entryEdge } from '../src/spawn-continuity.ts';

test('intercepts award ten points and successive 10,000-point thresholds grant lives', () => {
  assert.equal(INTERCEPT_POINTS, 10);
  assert.deepEqual(applyScore(9990, 1, INTERCEPT_POINTS, 3), { score: 10000, lives: 2 });
  assert.deepEqual(applyScore(19900, 2, 100, 3), { score: 20000, lives: 3 });
  assert.deepEqual(applyScore(19990, 3, INTERCEPT_POINTS, 3), { score: 20000, lives: 3 });
  assert.deepEqual(applyScore(20000, 1, 100, 3), { score: 20100, lives: 1 });
  assert.equal(extraLivesEarned(9990, 30010), 3);
});
test('new aircraft do not enter from the last recently exited edge', () => {
  assert.equal(exitEdge(1), 'right');
  assert.equal(entryEdge(-1), 'right');
  for (const random of [0, 0.4, 0.8]) {
    assert.equal(chooseEntryDirection(random, 'right', 500), 1);
    assert.equal(chooseEntryDirection(random, 'left', 500), -1);
  }
  assert.equal(chooseEntryDirection(0.8, 'right', 3000), -1);
  assert.equal(chooseEntryDirection(0.2, 'left', 3000), 1);
});
