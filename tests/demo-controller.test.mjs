import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ATTRACT_IDLE_MS, DEMO_GAME_OVER_MS, DEMO_RUN_MS,
  DemoController, demoSelection, parseDemoSeed, seededRandom,
} from '../src/demo-controller.ts';

function snapshot(overrides = {}) {
  return {
    mode: 'classic', stage: 1, column: 2, depth: 1, facing: 1,
    enemies: [], shots: [], missileReady: true, torpedoReady: true,
    ...overrides,
  };
}

test('menu and player game-over use the same idle delay', () => {
  assert.equal(ATTRACT_IDLE_MS, 15_000);
  assert.ok(DEMO_GAME_OVER_MS < ATTRACT_IDLE_MS);
  assert.ok(DEMO_RUN_MS > ATTRACT_IDLE_MS);
});

test('demo selection is reproducible and includes every stage and both render modes', () => {
  assert.deepEqual(demoSelection(12345), demoSelection(12345));
  const modes = new Set();
  const stages = new Set();
  for (let seed = 0; seed < 100; seed++) {
    const selection = demoSelection(seed);
    modes.add(selection.mode);
    stages.add(selection.stage);
  }
  assert.deepEqual([...modes].sort(), ['classic', 'dynamic']);
  assert.deepEqual([...stages].sort(), [1, 2, 3]);
});

test('seeded generator stays in range and repeats exactly for a given seed', () => {
  const a = seededRandom(431);
  const b = seededRandom(431);
  for (let i = 0; i < 100; i++) {
    const value = a();
    assert.ok(value >= 0 && value < 1);
    assert.equal(value, b());
  }
});

test('virtual player has stable seeded decisions and a human-sized reaction delay', () => {
  const first = new DemoController(999);
  const second = new DemoController(999);
  const view = snapshot({
    enemies: [{ kind: 'plane', x: 705, y: 165 }],
    shots: [{ kind: 'bomb', x: 405, y: 280 }],
  });
  for (let ms = 0; ms < 30_000; ms += 145) {
    const a = first.decide(view, ms);
    const b = second.decide(view, ms);
    assert.deepEqual(a, b);
    assert.ok(a.filter(action => action === 'left' || action === 'right').length <= 1);
    for (const action of a) {
      assert.ok(['left', 'right', 'up', 'down', 'missile', 'torpedo'].includes(action));
    }
  }
});

test('torpedoes cannot be requested before stage three, even with an enemy sub', () => {
  for (let stage of [1, 2]) {
    const controller = new DemoController(31337);
    const view = snapshot({ stage, enemies: [{ kind: 'sub', x: 705, y: 421 }] });
    for (let ms = 0; ms < 40_000; ms += 750) {
      assert.ok(!controller.decide(view, ms).includes('torpedo'));
    }
  }
});

test('demo can fire torpedoes against a visible stage-three sub', () => {
  const controller = new DemoController(31337);
  const view = snapshot({
    stage: 3,
    enemies: [{ kind: 'sub', x: 705, y: 421 }],
  });
  let fired = false;
  for (let ms = 0; ms < 40_000; ms += 750) {
    if (controller.decide(view, ms).includes('torpedo')) fired = true;
  }
  assert.equal(fired, true);
});

test('demo never requests a movement beyond the six-position horizontal grid', () => {
  for (let column of [0, 5]) {
    const controller = new DemoController(211 + column);
    const view = snapshot({ column });
    for (let ms = 0; ms < 20_000; ms += 900) {
      const actions = controller.decide(view, ms);
      if (column === 0) assert.ok(!actions.includes('left'));
      if (column === 5) assert.ok(!actions.includes('right'));
    }
  }
});


test('URL demoSeed accepts decimal seeds and rejects invalid input', () => {
  assert.equal(parseDemoSeed('12345'), 12345);
  assert.equal(parseDemoSeed('0'), 0);
  assert.equal(parseDemoSeed('4294967295'), 4294967295);
  for (const value of [null, '', '-1', '12.5', '0x10', 'hello', '4294967296']) {
    assert.equal(parseDemoSeed(value), null);
  }
});
