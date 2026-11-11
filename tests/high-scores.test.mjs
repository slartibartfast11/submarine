import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HighScores } from '../src/high-scores.ts';

const run = (score, cycle = 1, stage = 1) => ({ score, cycle, stage });
const memoryStorage = () => {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
};

test('mode records survive reloads independently, including stage and cycle', () => {
  const storage = memoryStorage();
  const scores = new HighScores(storage);
  scores.record('classic', run(300, 2, 3));
  scores.record('dynamic', run(100));
  scores.record('classic', run(200));
  scores.record('classic', run(300, 4, 2));
  const reloaded = new HighScores(storage);
  assert.deepEqual(reloaded.get('classic'), run(300, 2, 3));
  assert.deepEqual(reloaded.get('dynamic'), run(100));
  const copy = reloaded.get('classic');
  copy.score = 0;
  assert.equal(reloaded.get('classic').score, 300);
});

test('unavailable, throwing and full storage keep working in memory', () => {
  for (const storage of [null, {
    getItem() { throw new Error('denied'); },
    setItem() { throw new Error('full'); },
  }]) {
    const scores = new HighScores(storage);
    scores.record('classic', run(500));
    assert.deepEqual(scores.get('classic'), run(500));
    assert.deepEqual(scores.get('dynamic'), run(0));
  }
});

test('malformed records are ignored without losing the other mode', () => {
  for (const value of ['{', 'null', '42', '{}', JSON.stringify(run(-1)),
    JSON.stringify(run(1.5)), JSON.stringify(run(100, 0)), JSON.stringify(run(100, 1, 4))]) {
    const storage = memoryStorage();
    storage.setItem('submarine.highscores.classic', value);
    storage.setItem('submarine.highscores.modern', JSON.stringify(run(90, 3, 2)));
    const scores = new HighScores(storage);
    assert.deepEqual(scores.get('classic'), run(0));
    assert.deepEqual(scores.get('dynamic'), run(90, 3, 2));
    scores.record('classic', run(10));
    assert.deepEqual(new HighScores(storage).get('classic'), run(10));
  }
});
