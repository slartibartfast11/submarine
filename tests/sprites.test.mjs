import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SPRITE_MASKS } from '../src/sprite-masks.ts';
import { LCD_SEGMENTS } from '../src/lcd-segments.ts';

test('retained bitmap masks are well-formed, with the player untouched', () => {
  assert.deepEqual(Object.keys(SPRITE_MASKS).sort(), ['bomb', 'player', 'star']);
  for (const [name, mask] of Object.entries(SPRITE_MASKS)) {
    assert.ok(mask.length > 0, name);
    assert.ok(mask[0].length > 0, name);
    for (const row of mask) {
      assert.equal(row.length, mask[0].length, name);
      assert.match(row, /^[X.]+$/, name);
    }
    assert.ok(mask.some(row => row.includes('X')), name);
  }
  assert.equal(SPRITE_MASKS.player.length, 13);
  assert.equal(SPRITE_MASKS.player[0].length, 38);
});

test('six revised silhouettes use deliberate etch polygons, not pixel masks', () => {
  assert.deepEqual(Object.keys(LCD_SEGMENTS).sort(), [
    'enemySub', 'missile', 'plane', 'planeBankLeft', 'planeBankRight',
    'planeClimb', 'sweeper', 'torpedo',
  ]);
  for (const [name, design] of Object.entries(LCD_SEGMENTS)) {
    assert.ok(design.width > 0 && design.height > 0, name);
    assert.ok(design.ink.length > 0, name);
    for (const polygon of [...design.ink, ...design.clear]) {
      assert.ok(polygon.length >= 3, name);
      for (const [x, y] of polygon) {
        assert.ok(x >= 0 && x <= design.width, `${name} x=${x}`);
        assert.ok(y >= 0 && y <= design.height, `${name} y=${y}`);
      }
    }
  }
});

test('new etched missile and torpedo sizes match their Dynamic collision boxes', () => {
  assert.deepEqual([LCD_SEGMENTS.missile.width, LCD_SEGMENTS.missile.height], [12, 18]);
  assert.deepEqual([LCD_SEGMENTS.torpedo.width, LCD_SEGMENTS.torpedo.height], [26, 8]);
  assert.ok(LCD_SEGMENTS.torpedo.clear.length > 0);
  assert.notDeepEqual(LCD_SEGMENTS.plane.ink, LCD_SEGMENTS.planeBankRight.ink);
  assert.notDeepEqual(LCD_SEGMENTS.planeBankLeft.ink, LCD_SEGMENTS.planeBankRight.ink);
  assert.notDeepEqual(LCD_SEGMENTS.planeClimb.ink, LCD_SEGMENTS.plane.ink);
  assert.notDeepEqual(LCD_SEGMENTS.enemySub.ink, LCD_SEGMENTS.sweeper.ink);
});

test('etched silhouettes maintain distinct aircraft, ship and submarine bounds', () => {
  for (const name of ['plane', 'planeBankRight', 'planeBankLeft', 'planeClimb']) {
    assert.deepEqual([LCD_SEGMENTS[name].width, LCD_SEGMENTS[name].height], [76, 38], name);
  }
  assert.deepEqual([LCD_SEGMENTS.sweeper.width, LCD_SEGMENTS.sweeper.height], [72, 22]);
  assert.deepEqual([LCD_SEGMENTS.enemySub.width, LCD_SEGMENTS.enemySub.height], [72, 24]);
});
