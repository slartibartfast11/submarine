import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ATTRACT_IDLE_MS, DEMO_GAME_OVER_MS, DEMO_RUN_MS,
  DemoController, demoSelection, incomingThreat, parseDemoSeed, seededRandom,
} from '../src/demo-controller.ts';

function snapshot(overrides = {}) {
  return {
    mode: 'classic', cycle: 1, stage: 1, column: 2, depth: 1, facing: 1,
    enemies: [], shots: [], missileReady: true, torpedoReady: true,
    ...overrides,
  };
} 

function classicBomb(overrides = {}) {
  return {
    kind: 'bomb', x: 405, y: 300, vx: 0, vy: 0,
    halfColumn: 5, quarterColumn: 11, halfRow: 7,
    stepColumn: 0, stepRow: 1,
    ticksInFlight: 0, bombFlight: 'straight', driftDirection: 1,
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
    enemies: [{ kind: 'plane', x: 705, y: 165, vx: 200, gridColumn: 4, gridRow: 1 }],
    shots: [classicBomb({ quarterColumn: 9, halfColumn: 4, halfRow: 6 })],
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

test('demo does not fire or wander aimlessly while the field is empty', () => {
  const controller = new DemoController(420);
  const view = snapshot();
  for (let ms = 0; ms < 12_000; ms += 145) {
    const actions = controller.decide(view, ms);
    assert.deepEqual(actions, [], 'unexpected empty-field activity at ' + ms + ' ms');
  }
});

test('demo fires frequently once an actual target is in its lane', () => {
  const controller = new DemoController(420);
  const view = snapshot({ enemies: [{ kind: 'plane', x: 405, y: 162, vx: 0, gridColumn: 2, gridRow: 1 }] });
  let launches = 0;
  for (let ms = 0; ms < 30_000; ms += 145) {
    if (controller.decide(view, ms).includes('missile')) launches++;
  }
  assert.ok(launches >= 55, 'only ' + launches + ' aimed launches in 30 seconds');
});

test('Classic straight and diagonal bombs threaten different predicted columns', () => {
  const view = snapshot({
    depth: 0,
    shots: [classicBomb({ quarterColumn: 11, halfColumn: 5,
      bombFlight: 'steep', driftDirection: 1 })],
  });
  // At the next Classic half-row it drifts across from column 2 into 3.
  assert.equal(incomingThreat(view, 2, 0), false);
  assert.equal(incomingThreat(view, 3, 0), true);
  // A straight bomb stays in column 2 rather than jumping right.
  const straight = snapshot({ depth: 0, shots: [classicBomb()] });
  assert.equal(incomingThreat(straight, 2, 0), true);
  assert.equal(incomingThreat(straight, 3, 0), false);
});

test('Modern projectiles are checked at their projected row and column', () => {
  const view = snapshot({
    mode: 'dynamic', depth: 0,
    shots: [classicBomb({ x: 555, y: 205, vx: -8, vy: 109 })],
  });
  assert.equal(incomingThreat(view, 3, 0), true);
  assert.equal(incomingThreat(view, 2, 0), false);
  assert.equal(incomingThreat(view, 3, 1), false);
});

test('Modern threat includes a projectile already overlapping its destination at t=0', () => {
  const view = snapshot({
    mode: 'dynamic', column: 1, depth: 0,
    enemies: [{ kind: 'plane', x: 405, y: 162, vx: 0, gridColumn: 2, gridRow: 1 }],
    shots: [classicBomb({ x: 405, y: 360, vx: 0, vy: 109 })],
  });
  assert.equal(incomingThreat(view, 1, 0), false, 'staying put should be safe');
  assert.equal(incomingThreat(view, 2, 0), true, 'destination is already occupied by bomb');
  for (let seed = 0; seed <= 4; seed++) {
    const actions = new DemoController(seed).decide(view, 0);
    assert.ok(!actions.includes('right'), `seed ${seed} moved into the bomb at t=0`);
  }
});

test('Modern threat prediction sweeps across gaps between frame samples', () => {
  const view = snapshot({
    mode: 'dynamic', depth: 0,
    // Crosses x=405 in less than 120 ms, so neither endpoint of the old
    // periodic sampler needed to be within the hit rectangle.
    shots: [classicBomb({ x: 300, y: 345, vx: 3000, vy: 0 })],
  });
  assert.equal(incomingThreat(view, 2, 0), true);
  assert.equal(incomingThreat(view, 0, 0), false);
});

test('escape does not choose a projectile-safe square occupied by an enemy sub', () => {
  // Reproduces Codex's stage-three example: up is clear of the bomb but
  // BattleScene would reject it because an enemy sub occupies that cell.
  const view = snapshot({
    mode: 'classic', stage: 3, column: 2, depth: 1,
    enemies: [{ kind: 'sub', x: 405, y: 345, vx: 0, gridColumn: 2, gridRow: 4 }],
    shots: [classicBomb({ halfRow: 9 })],
  });
  assert.equal(incomingThreat(view, 2, 1), true);
  assert.equal(incomingThreat(view, 2, 0), false);
  let horizontalEscapes = 0;
  for (const seed of [0, 1, 3, 4]) {
    const actions = new DemoController(seed).decide(view, 0);
    assert.ok(!actions.includes('up'), `seed ${seed} tried a blocked escape`);
    if (actions.includes('left') || actions.includes('right')) horizontalEscapes++;
  }
  assert.ok(horizontalEscapes >= 2, 'demo did not choose available horizontal escapes');
});

test('target-chasing cannot enter a submarine-occupied cell', () => {
  // A normal aiming step must obey the same occupancy rule as escape moves.
  const view = snapshot({
    mode: 'classic', stage: 3, column: 1, depth: 1,
    enemies: [
      { kind: 'sub', x: 405, y: 421, vx: 0, gridColumn: 2, gridRow: 5 },
    ],
  });
  for (let seed = 0; seed < 20; seed++) {
    const actions = new DemoController(seed).decide(view, 0);
    assert.ok(!actions.includes('right'), `seed ${seed} chased sub into occupied cell`);
  }
});

test('safe position never moves into a predicted Classic projectile', () => {
  for (let seed = 0; seed < 50; seed++) {
    const controller = new DemoController(seed);
    const view = snapshot({
      column: 2, depth: 0,
      enemies: [{ kind: 'plane', x: 855, y: 162, vx: 0, gridColumn: 5, gridRow: 1 }],
      shots: [classicBomb({ quarterColumn: 12, halfColumn: 6 })],
    });
    assert.equal(incomingThreat(view, 2, 0), false);
    assert.equal(incomingThreat(view, 3, 0), true);
    assert.ok(!controller.decide(view, 0).includes('right'),
      'seed ' + seed + ' moved into a predicted strike');
  }
});

test('can escape an incoming shot using an adjacent safe square', () => {
  let evasions = 0;
  for (let seed = 0; seed < 40; seed++) {
    const controller = new DemoController(seed);
    const view = snapshot({
      column: 2, depth: 0,
      shots: [classicBomb()],
    });
    const actions = controller.decide(view, 0);
    if (actions.includes('left') || actions.includes('right') || actions.includes('down')) {
      evasions++;
    }
  }
  assert.ok(evasions >= 25, 'insufficient deliberate evasions: ' + evasions);
});

test('missiles still respect lockouts even with a visible target', () => {
  const controller = new DemoController(725);
  const view = snapshot({
    enemies: [{ kind: 'plane', x: 405, y: 162, vx: 0, gridColumn: 2, gridRow: 1 }],
    missileReady: false,
  });
  for (let ms = 0; ms < 12_000; ms += 140) {
    assert.ok(!controller.decide(view, ms).includes('missile'));
  }
});

test('torpedoes cannot be requested before stage three, even with an enemy sub', () => {
  for (let stage of [1, 2]) {
    const controller = new DemoController(31337);
    const view = snapshot({ stage, enemies: [{ kind: 'sub', x: 705, y: 421, vx: 0, gridColumn: 4, gridRow: 5 }] });
    for (let ms = 0; ms < 40_000; ms += 750) {
      assert.ok(!controller.decide(view, ms).includes('torpedo'));
    }
  }
});

test('demo can fire torpedoes against a visible stage-three sub', () => {
  const controller = new DemoController(31337);
  const view = snapshot({
    stage: 3,
    enemies: [{ kind: 'sub', x: 705, y: 421, vx: 0, gridColumn: 4, gridRow: 5 }],
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
