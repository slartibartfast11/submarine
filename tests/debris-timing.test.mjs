import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEBRIS_HOLD_MS, DEBRIS_FADE_MS, PLAYER_DEBRIS_MULTIPLIER,
  PLAYER_DEBRIS_DURATION_MS, PLAYER_DEATH_PAUSE_MS,
} from '../src/debris-timing.ts';

test('player debris remains on screen three times longer than enemy debris', () => {
  const enemyDuration = DEBRIS_HOLD_MS + DEBRIS_FADE_MS;
  assert.equal(PLAYER_DEBRIS_MULTIPLIER, 3);
  assert.equal(PLAYER_DEBRIS_DURATION_MS, enemyDuration * 3);
  assert.equal(PLAYER_DEBRIS_DURATION_MS, 1110);
});

test('respawn and game over cannot interrupt the player wreckage', () => {
  assert.ok(PLAYER_DEATH_PAUSE_MS > PLAYER_DEBRIS_DURATION_MS);
});
