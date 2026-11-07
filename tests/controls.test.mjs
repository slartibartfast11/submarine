import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dispatchControl, keyToControl, setControlScreen,
  subscribeControls, subscribeControlScreen,
} from '../src/controls.ts';

test('keyboard codes map to the same actions used by touchscreen buttons', () => {
  const pairs = [
    ['ArrowLeft', 'left'], ['KeyA', 'left'],
    ['ArrowRight', 'right'], ['KeyD', 'right'],
    ['ArrowUp', 'up'], ['KeyW', 'up'],
    ['ArrowDown', 'down'], ['KeyS', 'down'],
    ['Space', 'missile'], ['KeyX', 'torpedo'], ['Escape', 'menu'],
    ['Digit1', 'classic'], ['Numpad1', 'classic'],
    ['Digit2', 'modern'], ['Numpad2', 'modern'],
  ];
  for (const [key, action] of pairs) assert.equal(keyToControl(key), action, key);
  assert.equal(keyToControl('KeyG'), null);
  assert.equal(keyToControl('KeyQ'), null);
});

test('control subscribers receive press and hold events and unsubscribe cleanly', () => {
  const presses = [];
  const stop = subscribeControls((action, repeated) => presses.push([action, repeated]));
  dispatchControl('left');
  dispatchControl('left', true);
  dispatchControl('missile');
  stop();
  dispatchControl('right');
  assert.deepEqual(presses, [
    ['left', false], ['left', true], ['missile', false],
  ]);
});

test('screen visibility subscribers receive current scene and cleanup', () => {
  const views = [];
  const stop = subscribeControlScreen(view => views.push(view));
  setControlScreen('battle');
  setControlScreen('menu');
  stop();
  setControlScreen('battle');
  assert.deepEqual(views, ['menu', 'battle', 'menu']);
  setControlScreen('menu');
});
