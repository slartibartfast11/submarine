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

test('an older plane cannot steal or stop a newer plane sound when it dives', () => {
  const channel = new ExclusiveSoundChannel();
  const first = {}, next = {};
  const events = [];
  channel.play(first, () => ({ stop: () => events.push('stop first') }));
  channel.play(next, () => ({ stop: () => events.push('stop next') }));
  channel.change(first, () => { events.push('wrong dive'); return null; });
  channel.stop(first);
  assert.deepEqual(events, ['stop first']);
  channel.change(next, () => {
    events.push('play dive');
    return { stop: () => events.push('stop dive') };
  });
  assert.deepEqual(events, ['stop first', 'stop next', 'play dive']);
  channel.stop(next);
  assert.deepEqual(events, ['stop first', 'stop next', 'play dive', 'stop dive']);
});

test('the channel can be silenced on pause or scene shutdown', () => {
  const channel = new ExclusiveSoundChannel();
  let stops = 0;
  channel.play({}, () => ({ stop: () => { stops++; } }));
  channel.stop();
  assert.equal(stops, 1);
});
