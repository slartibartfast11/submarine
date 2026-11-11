import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSfx } from '../src/sfx-renderer.ts';
import { SFX_PRESETS } from '../src/sfx-presets.ts';
import {
  ENTRY_SEQUENCE, ENTRY_COMPLETE_MS, ENTRY_PING_DURATION_MS,
  ENTRY_FULL_REST_MS, ENTRY_HALF_REST_MS, ENTRY_QUARTER_REST_MS,
} from '../src/entry-cues.ts';

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

test('quiet sonar entry uses one preset and accelerates in 1, 2, 3 groups', () => {
  const ping = SFX_PRESETS.entryPing;
  assert.deepEqual(ping, {"wave":2,"freq":880,"slide":-0.1,"dslide":0,"minFreq":20,"vibDepth":0,"vibRate":6,"arpMult":1,"arpTime":0.1,"duty":0.5,"dutySweep":0,"attack":0.006,"sustain":0.01,"punch":0,"decay":0.4,"repeat":0,"lpf":1600,"lpfSweep":0,"lpfRes":0,"hpf":0,"hpfSweep":0,"phaserMs":0,"phaserSweep":0,"crushBits":0,"crushHold":1,"gain":0.5,"seed":7095});
  assert.equal(ENTRY_PING_DURATION_MS, 416);
  assert.equal(ENTRY_FULL_REST_MS, 350);
  assert.equal(ENTRY_HALF_REST_MS, 175);
  assert.equal(ENTRY_QUARTER_REST_MS, 90);

  assert.deepEqual(
    ENTRY_SEQUENCE.map(cue => [cue.atMs, cue.sound, cue.column]),
    [
      [0, 'entryPing', 4],
      [766, 'entryPing', 3],
      [1357, 'entryPing', 3],
      [2123, 'entryPing', 2],
      [2629, 'entryPing', 2],
      [3135, 'entryPing', 2],
    ],
  );
  assert.equal(ENTRY_COMPLETE_MS, 3551);
  const movements = ENTRY_SEQUENCE.filter((cue, i) =>
    i === 0 || cue.column !== ENTRY_SEQUENCE[i - 1].column);
  assert.deepEqual(movements.map(cue => [cue.atMs, cue.column]), [
    [0, 4], [766, 3], [2123, 2],
  ]);
  for (let i = 1; i < ENTRY_SEQUENCE.length; i++) {
    assert.ok(ENTRY_SEQUENCE[i].atMs >=
      ENTRY_SEQUENCE[i - 1].atMs + ENTRY_PING_DURATION_MS);
  }
  assert.equal(ENTRY_SEQUENCE.at(-1).atMs + ENTRY_PING_DURATION_MS, ENTRY_COMPLETE_MS);
});

test('entry ping bypasses normalisation while gameplay effects keep it', () => {
  const ping = SFX_PRESETS.entryPing;
  const raw = renderSfx(ping, 12000, { normalize: false });
  const softer = renderSfx({ ...ping, gain: ping.gain / 2 }, 12000, { normalize: false });
  const normalized = renderSfx(ping, 12000);
  const normalizedExplicit = renderSfx(ping, 12000, { normalize: true });
  assert.deepEqual(normalized, normalizedExplicit);
  const peak = samples => Math.max(...samples.map(Math.abs));
  assert.ok(peak(raw) > 0 && peak(raw) < 1);
  assert.ok(Math.abs(peak(softer) / peak(raw) - 0.5) < 0.0001,
    'unnormalised PCM must preserve preset gain');
  assert.ok(peak(normalized) > peak(raw),
    'normalisation would make the entry ping louder');
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

test('aircraft falling-bomb sound uses the selected longer whistle', () => {
  const preset = SFX_PRESETS.aircraftBombFall;
  assert.equal(preset.wave, 2);
  assert.equal(preset.freq, 950);
  assert.equal(preset.slide, -1.8);
  assert.equal(preset.dslide, -0.65);
  assert.equal(preset.minFreq, 90);
  assert.equal(preset.sustain, 0.85);
  assert.equal(preset.decay, 0.35);
  const pcm = renderSfx(preset, 10000);
  assert.equal(pcm.length, Math.ceil((preset.attack + preset.sustain + preset.decay) * 10000));
  assert.ok(pcm.some(value => Math.abs(value) > 0.005));
});

test('aircraft dive uses the approved noise whoosh preset', () => {
  const expected = {"wave":4,"freq":2400,"slide":-2,"dslide":-4,"minFreq":60,"vibDepth":0,"vibRate":6,"arpMult":1,"arpTime":0.1,"duty":0.5,"dutySweep":0,"attack":0.35,"sustain":0.35,"punch":0,"decay":0.15,"repeat":0,"lpf":4000,"lpfSweep":-2.5,"lpfRes":0.7,"hpf":0,"hpfSweep":0,"phaserMs":1,"phaserSweep":6,"crushBits":0,"crushHold":1,"gain":0.8,"seed":7095};
  assert.deepEqual(SFX_PRESETS.planeDive, expected);
  const pcm = renderSfx(expected, 10000);
  assert.equal(pcm.length, 8500);
  assert.ok(pcm.some(value => Math.abs(value) > 0.005));
  assert.ok(pcm.every(Number.isFinite));
});
