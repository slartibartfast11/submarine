import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSfx } from '../src/sfx-renderer.ts';
import { SFX_PRESETS } from '../src/sfx-presets.ts';
import { ENTRY_SEQUENCE, ENTRY_COMPLETE_MS } from '../src/entry-cues.ts';

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

test('approved entry phrase matches the animation on the BOO beats', () => {
  assert.deepEqual(
    ENTRY_SEQUENCE.map(cue => [cue.atMs, cue.sound, cue.column]),
    [
      [0, 'entryBaaaa', 4],
      [1170, 'entryBoo', 3],
      [2100, 'entryBaaaa', 3],
      [3270, 'entryBooSecond', 2],
      [4200, 'entryFinal', 2],
    ],
  );
  assert.equal(ENTRY_COMPLETE_MS, 6300);
  for (const cue of ENTRY_SEQUENCE) {
    const tone = SFX_PRESETS[cue.sound];
    const durationMs = (tone.attack + tone.sustain + tone.decay) * 1000;
    assert.ok(cue.atMs + durationMs < ENTRY_COMPLETE_MS);
  }
  const steadyNote = SFX_PRESETS.entryBaaaa;
  assert.equal(steadyNote.freq, 159);
  assert.equal(steadyNote.slide, 0);
  assert.equal(steadyNote.wave, 1);
  assert.equal(steadyNote.decay, 0.035);
  assert.equal(SFX_PRESETS.entryFinal.freq, 147);
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

test('the second missile candidate remains distinct from the selected effect', () => {
  const primary = renderSfx(SFX_PRESETS.missileLaunch, 16000);
  const alternate = renderSfx(SFX_PRESETS.missileLaunchAlternate, 16000);
  assert.notDeepEqual(primary, alternate);
});
