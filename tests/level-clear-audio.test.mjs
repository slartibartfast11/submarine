import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { LEVEL_CLEAR_AUDIO_URL, LEVEL_CLEAR_DELAY_MS, LevelClearAudio } from '../src/level-clear-audio.ts';

function fakePlayer() {
  const events = [];
  return {
    events, paused: true, muted: false, currentTime: 0,
    pause() { events.push('pause'); this.paused = true; },
    play() { events.push('play'); this.paused = false; return Promise.resolve(); },
  };
}

test('the approved level-clear MP3 is byte-for-byte the listening preview', () => {
  assert.equal(LEVEL_CLEAR_AUDIO_URL, './audio/level-clear.mp3');
  const bytes = readFileSync(new URL('../public/audio/level-clear.mp3', import.meta.url));
  assert.equal(bytes.length, 19388);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),
    '8354f7a7a9049a0ccf310a9a498c9d859f6a549b122f9a80ff6b6c77ea4f6d26');
});

test('stage tune restarts as one voice and never stacks duplicates', () => {
  const player = fakePlayer();
  const cue = new LevelClearAudio(player);
  cue.play();
  player.currentTime = 0.5;
  cue.play();
  assert.deepEqual(player.events, ['pause', 'play', 'pause', 'play']);
  assert.equal(player.currentTime, 0);
});

test('pause/resume preserves a playing melody, while stop cancels it', () => {
  const player = fakePlayer();
  const cue = new LevelClearAudio(player);
  cue.play();
  cue.pause();
  cue.resume();
  assert.equal(player.events.filter(event => event === 'play').length, 2);
  cue.pause();
  cue.stop();
  cue.resume();
  assert.equal(player.events.filter(event => event === 'play').length, 2);
});

test('muting immediately stops the melody; unmuting does not replay it', () => {
  const player = fakePlayer();
  const cue = new LevelClearAudio(player);
  cue.play();
  cue.setMuted(true);
  cue.play();
  cue.setMuted(false);
  assert.equal(player.events.filter(event => event === 'play').length, 1);
  cue.play();
  assert.equal(player.events.filter(event => event === 'play').length, 2);
});

test('stage completion schedules the motif without delaying actual advancement', () => {
  assert.ok(LEVEL_CLEAR_DELAY_MS >= 150 && LEVEL_CLEAR_DELAY_MS <= 450);
  const scenes = readFileSync(new URL('../src/scenes.ts', import.meta.url), 'utf8');
  const advance = scenes.match(/private advanceStage\(\): void \{([\s\S]*?)\n  \}/)?.[1];
  assert.ok(advance, 'advanceStage must exist');
  assert.match(advance, /this\.cycle = next\.cycle/);
  assert.match(advance, /this\.stage = next\.stage/);
  assert.match(advance, /this\.time\.delayedCall\(LEVEL_CLEAR_DELAY_MS/);
  assert.match(advance, /this\.levelClearAudio\?\.play\(\)/);
});
