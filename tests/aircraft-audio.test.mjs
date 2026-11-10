import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aircraftMotionCue } from '../src/aircraft-audio.ts';

test('level flight does not play an aircraft sound', () => {
  assert.equal(aircraftMotionCue(0, 0), null);
  assert.equal(aircraftMotionCue(1, 0), null);
  assert.equal(aircraftMotionCue(-1, 0), null);
});

test('a newly starting dive plays once, not on every frame or grid step', () => {
  assert.equal(aircraftMotionCue(0, 1), 'dive');
  assert.equal(aircraftMotionCue(1, 1), null);
  assert.equal(aircraftMotionCue(0, 1), 'dive');
});

test('climbing uses the approach sound cue and changing direction retriggers', () => {
  assert.equal(aircraftMotionCue(0, -1), 'climb');
  assert.equal(aircraftMotionCue(-1, -1), null);
  assert.equal(aircraftMotionCue(1, -1), 'climb');
  assert.equal(aircraftMotionCue(-1, 1), 'dive');
});
