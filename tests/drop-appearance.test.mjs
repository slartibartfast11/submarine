import { test } from 'node:test';
import assert from 'node:assert/strict';
import { droppedBombAppearance } from '../src/drop-appearance.ts';
import { LCD_SEGMENTS } from '../src/lcd-segments.ts';

test('Classic straight bombs retain the existing bomb silhouette', () => {
  assert.deepEqual(droppedBombAppearance('straight', 1), { texture: 'bomb', angle: 0 });
  assert.deepEqual(droppedBombAppearance('straight', -1), { texture: 'bomb', angle: 0 });
});

test('Classic diagonal and water-hook bombs use a directional filled mask', () => {
  for (const flight of ['diagonal', 'water-hook']) {
    assert.deepEqual(droppedBombAppearance(flight, 1), { texture: 'angledBomb', angle: 60 });
    assert.deepEqual(droppedBombAppearance(flight, -1), { texture: 'angledBomb', angle: 120 });
  }
});

test('Modern bombs use the directional mask only for noticeable lateral drift', () => {
  assert.equal(droppedBombAppearance(null, 0).texture, 'bomb');
  assert.equal(droppedBombAppearance(null, 6).texture, 'bomb');
  assert.equal(droppedBombAppearance(null, -6).texture, 'bomb');
  assert.deepEqual(droppedBombAppearance(null, 8), { texture: 'angledBomb', angle: 60 });
  assert.deepEqual(droppedBombAppearance(null, -8), { texture: 'angledBomb', angle: 120 });
});

test('directional drop is solid and distinct from the hollow horizontal torpedo', () => {
  const drop = LCD_SEGMENTS.angledBomb;
  assert.deepEqual([drop.width, drop.height], [18, 12]);
  assert.equal(drop.clear.length, 0);
  assert.ok(drop.ink.length > 0);
  assert.ok(LCD_SEGMENTS.torpedo.clear.length > 0);
});
