import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ExclusiveSoundChannel } from '../src/exclusive-sound.ts';

test('the next bomb replaces the previous whistle without overlapping playback', () => {
  const channel = new ExclusiveSoundChannel();
  const a = {}, b = {};
  const events = [];
  channel.play(a, () => {
    events.push('start a');
    return { stop: () => events.push('stop a') };
  });
  channel.play(b, () => {
    events.push('start b');
    return { stop: () => events.push('stop b') };
  });
  assert.deepEqual(events, ['start a', 'stop a', 'start b']);
  channel.stop(a); // The older bomb can be intercepted without silencing B.
  assert.deepEqual(events, ['start a', 'stop a', 'start b']);
  channel.stop(b);
  assert.deepEqual(events, ['start a', 'stop a', 'start b', 'stop b']);
});

test('a bomb ending normally stops its whistle exactly once', () => {
  const channel = new ExclusiveSoundChannel();
  const bomb = {};
  let stops = 0;
  channel.play(bomb, () => ({ stop: () => { stops++; } }));
  channel.stop(bomb);
  channel.stop(bomb);
  channel.stop();
  assert.equal(stops, 1);
});

test('muted playback interrupts the previous bomb and leaves the channel empty', () => {
  const channel = new ExclusiveSoundChannel();
  let stops = 0;
  channel.play({}, () => ({ stop: () => { stops++; } }));
  channel.play({}, () => null);
  channel.stop();
  assert.equal(stops, 1);
});

test('any aircraft can start a dive or climb cue, but older aircraft cannot stop it', () => {
  const channel = new ExclusiveSoundChannel();
  const a = {}, b = {};
  const events = [];
  const begin = (owner, cue) => channel.play(owner, () => {
    events.push('start ' + cue);
    return { stop: () => events.push('stop ' + cue) };
  });
  begin(a, 'entry A');
  begin(b, 'entry B');
  begin(a, 'dive A');
  channel.stop(b); // B's lifetime is independent of the sound currently playing.
  assert.deepEqual(events, [
    'start entry A', 'stop entry A', 'start entry B',
    'stop entry B', 'start dive A',
  ]);
  begin(b, 'climb B');
  channel.stop(a);
  assert.deepEqual(events.slice(-2), ['stop dive A', 'start climb B']);
  channel.stop(b);
  assert.equal(events.at(-1), 'stop climb B');
});

test('the channel can be silenced on pause or scene shutdown', () => {
  const channel = new ExclusiveSoundChannel();
  let stops = 0;
  channel.play({}, () => ({ stop: () => { stops++; } }));
  channel.stop();
  assert.equal(stops, 1);
});
