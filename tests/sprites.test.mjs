import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SPRITE_MASKS } from '../src/sprite-masks.ts';

test('every LCD sprite is a nonempty fixed-width one-bit mask', () => {
  for (const [name, mask] of Object.entries(SPRITE_MASKS)) {
    assert.ok(mask.length > 0, name);
    assert.ok(mask[0].length > 0, name);
    for (const row of mask) {
      assert.equal(row.length, mask[0].length, name);
      assert.match(row, /^[X.]+$/, name);
    }
    assert.ok(mask.some(row => row.includes('X')), name);
  }
});

test('player submarine remains unchanged and the new projectile geometry is compact', () => {
  assert.equal(SPRITE_MASKS.player.length, 13);
  assert.equal(SPRITE_MASKS.player[0].length, 38);
  assert.equal(SPRITE_MASKS.torpedo[0].length, 15); // 30px at native scale
  assert.equal(SPRITE_MASKS.torpedo.length, 5);
  assert.equal(SPRITE_MASKS.missile[0].length, 8); // 16px
  assert.equal(SPRITE_MASKS.missile.length, 9);    // 18px
});

test('torpedo is hollow and asymmetric: fins at tail, nose at bow', () => {
  const mask = SPRITE_MASKS.torpedo;
  assert.ok(mask[2].includes('...........'));
  assert.notDeepEqual(mask, mask.map(row => [...row].reverse().join('')));
});

test('aircraft have two distinct original poses; surface and enemy subs are separate masks', () => {
  assert.notDeepEqual(SPRITE_MASKS.plane, SPRITE_MASKS.planeBank);
  assert.notDeepEqual(SPRITE_MASKS.sweeper, SPRITE_MASKS.enemySub);
  assert.notDeepEqual(SPRITE_MASKS.player, SPRITE_MASKS.enemySub);
  assert.ok(SPRITE_MASKS.plane.length >= 10);
  assert.ok(SPRITE_MASKS.sweeper.length >= 10);
});
