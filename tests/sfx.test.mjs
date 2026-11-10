import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSfx } from '../src/sfx-renderer.ts';
import { SFX_PRESETS } from '../src/sfx-presets.ts';
import { ENTRY_CUES } from '../src/entry-cues.ts';

test('every supplied preset renders a finite, non-empty audible waveform', () => {
  for (const [name, preset] of Object.entries(SFX_PRESETS)) {
    const pcm = renderSfx(preset);
    assert.ok(pcm.length > 1000, name);
    assert.ok(pcm.every(Number.isFinite), name);
    assert.ok(pcm.some(x => Math.abs(x) > 0.005), name);
    assert.ok(pcm.every(x => Math.abs(x) <= 1), name);
  }
});

test('noise is repeatable with a seed and changes when the seed changes', () => {
  const preset = SFX_PRESETS.enemyDestroyed;
  const first = renderSfx(preset, 12000);
  const second = renderSfx(preset, 12000);
  const different = renderSfx({ ...preset, seed: 999 }, 12000);
  assert.deepEqual(first, second);
  assert.notDeepEqual(first, different);
});

test('synthesized durations follow attack, sustain and decay', () => {
  const p = SFX_PRESETS.playerDestroyed;
  const pcm = renderSfx(p, 10000);
  assert.equal(pcm.length, Math.ceil((p.attack + p.sustain + p.decay) * 10000));
});

test('the alternate torpedo sounds different from the original', () => {
  const first = renderSfx(SFX_PRESETS.torpedoLaunch, 12000);
  const second = renderSfx(SFX_PRESETS.torpedoLaunchAlternate, 12000);
  assert.notDeepEqual(first, second);
});

test('new presets have the expected durations', () => {
  for (const name of ['extraLife', 'gameOver', 'boatAppear']) {
    const preset = SFX_PRESETS[name];
    const output = renderSfx(preset, 10000);
    assert.equal(output.length, Math.ceil((preset.attack + preset.sustain + preset.decay) * 10000), name);
  }
});

test('entry has two paired motifs followed by a longer last note', () => {
  assert.deepEqual(ENTRY_CUES.map(step => step.length), [2, 2, 1]);
  assert.deepEqual(ENTRY_CUES[0].map(note => note.sound), ['entryDah', 'entryDunn']);
  assert.deepEqual(ENTRY_CUES[1].map(note => note.sound), ['entryDah', 'entryDunn']);
  assert.equal(ENTRY_CUES[2][0].sound, 'entryFinal');

  for (const notes of ENTRY_CUES) {
    for (const note of notes) {
      const preset = SFX_PRESETS[note.sound];
      const end = note.offset + preset.attack + preset.sustain + preset.decay;
      assert.ok(end < 2.1, 'no phrase should spill into the next entry step');
    }
  }
  const short = SFX_PRESETS.entryDah;
  const long = SFX_PRESETS.entryFinal;
  assert.ok(long.attack + long.sustain + long.decay >
    short.attack + short.sustain + short.decay);
});

test('the second missile candidate remains distinct from the selected effect', () => {
  const primary = renderSfx(SFX_PRESETS.missileLaunch, 16000);
  const alternate = renderSfx(SFX_PRESETS.missileLaunchAlternate, 16000);
  assert.notDeepEqual(primary, alternate);
});
