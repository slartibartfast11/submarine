import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { SOUND_MUTED_KEY, readSoundMuted, writeSoundMuted } from '../src/sound-preference.ts';

test('the checked-in menu recording is the approved Revised A file', () => {
  const mp3 = readFileSync(new URL('../public/audio/menu-fanfare.mp3', import.meta.url));
  assert.equal(mp3.length, 97964);
  assert.equal(createHash('sha256').update(mp3).digest('hex'),
    '636f17f95b0dbae21f1f07b097a544c856823b9d15fe8fa69f10ee63e4d6a6e0');
});

test('sound-off is remembered explicitly on the local device', () => {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
  };
  assert.equal(readSoundMuted(storage), false);
  writeSoundMuted(storage, true);
  assert.equal(values.get(SOUND_MUTED_KEY), '1');
  assert.equal(readSoundMuted(storage), true);
  writeSoundMuted(storage, false);
  assert.equal(readSoundMuted(storage), false);
});

test('storage denial does not break sound or make a new player permanently muted', () => {
  const denied = {
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
  };
  assert.equal(readSoundMuted(denied), false);
  assert.doesNotThrow(() => writeSoundMuted(denied, true));
  assert.equal(readSoundMuted(null), false);
  assert.doesNotThrow(() => writeSoundMuted(null, true));
});

test('menu fanfare waits for the running scene before trying automatic playback', () => {
  // Phaser invokes Scene.create() in CREATING, then emits CREATE after switching
  // the scene to RUNNING. isActive() in the playback guard needs that transition.
  const scenes = readFileSync(new URL('../src/scenes.ts', import.meta.url), 'utf8');
  assert.match(scenes, /this\.events\.once\(Phaser\.Scenes\.Events\.CREATE, playFanfare\)/);
  assert.doesNotMatch(scenes, /if \(!soundBank\.muted\) playFanfare\(\)/);
});
