import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SPRITE_MASKS } from '../src/sprite-masks.ts';
import { LCD_SEGMENTS } from '../src/lcd-segments.ts';
import { CURVED_ETCHES } from '../src/curved-art.ts';

test('only the impact starburst retains a 1-bit mask', () => {
  assert.deepEqual(Object.keys(SPRITE_MASKS).sort(), ['star']);
  for (const [name, mask] of Object.entries(SPRITE_MASKS)) {
    assert.ok(mask.length > 0, name);
    assert.ok(mask[0].length > 0, name);
    for (const row of mask) {
      assert.equal(row.length, mask[0].length, name);
      assert.match(row, /^[X.]+$/, name);
    }
    assert.ok(mask.some(row => row.includes('X')), name);
  }
  assert.deepEqual(Object.keys(CURVED_ETCHES).sort(), ['bomb','enemySub','player','sweeper']);
  for (const [name,etch] of Object.entries(CURVED_ETCHES)) {
    assert.ok(etch.width>0 && etch.height>0,name);
    assert.ok(etch.ink.length>0,name);
    for(const p of [...etch.ink,...etch.clear]) assert.ok(p.startsWith('M'),name);
  }
  assert.deepEqual([CURVED_ETCHES.player.width,CURVED_ETCHES.player.height],[76,30]);
});

test('six revised silhouettes use deliberate etch polygons, not pixel masks', () => {
  assert.deepEqual(Object.keys(LCD_SEGMENTS).sort(), [
    'missile', 'plane', 'planeBankLeft', 'planeBankRight',
    'planeClimb', 'torpedo',
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
  assert.notDeepEqual(CURVED_ETCHES.enemySub.ink, CURVED_ETCHES.sweeper.ink);
});

test('etched silhouettes maintain distinct aircraft, ship and submarine bounds', () => {
  for (const name of ['plane', 'planeBankRight', 'planeBankLeft', 'planeClimb']) {
    assert.deepEqual([LCD_SEGMENTS[name].width, LCD_SEGMENTS[name].height], [76, 38], name);
  }
  assert.deepEqual([CURVED_ETCHES.sweeper.width, CURVED_ETCHES.sweeper.height], [72, 22]);
  assert.deepEqual([CURVED_ETCHES.enemySub.width, CURVED_ETCHES.enemySub.height], [72, 24]);
});

test('ship silhouettes stay fixed size and have proper naval details', () => {
  const player = CURVED_ETCHES.player;
  const escort = CURVED_ETCHES.sweeper;
  assert.deepEqual([player.width, player.height], [76, 30]);
  assert.deepEqual([escort.width, escort.height], [72, 22]);
  assert.ok(player.clear.length >= 4); // readable portholes
  assert.ok(escort.ink.length >= 6); // superstructure, mast, deck and gun
  assert.ok(escort.clear.length >= 3); // bridge apertures
});
