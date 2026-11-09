// A closed day's top five is kept for good (the hourly job) only once none of that day's runs is waiting for its
// check, and only from runs that checked out. Meanwhile the hourly job starts the checker again.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeBoard } from './worker-harness.js';
import { shiftDay } from '../leaderboard-worker/src/day-close.js';
import { TODAY } from './worker-harness.js';

const DAY = shiftDay(TODAY, -3); // long closed

function seed(b, rows) {
  for (const [mode, name, score, status] of rows) {
    b.DB.exec(`INSERT INTO scores (mode, day, name_key, name, score, updated_at, check_status, sim_version, replay)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`, mode, DAY, name.toLowerCase(), name, score, 1000 + score, status,
    status === 'ok' ? null : 'AQE=');
  }
}
const podium = (b, mode) => b.DB.query('SELECT place, name, score FROM podium WHERE mode = ? AND day = ? ORDER BY place', mode, DAY);

test('a closed day waits for its unchecked runs, then keeps only runs that checked out', async () => {
  const b = makeBoard();
  seed(b, [
    ['flight', 'Anna', 500, 'ok'], ['flight', 'Bo', 400, 'ok'], ['flight', 'Cheat', 9000, 'unchecked'],
    ['survive', 'Anna', 30000, 'ok'], ['survive', 'Bo', 20000, 'failed'],
  ]);
  await b.scheduled();
  assert.deepEqual(podium(b, 'flight'), [], 'flight still has a run waiting');
  assert.deepEqual(podium(b, 'survive'), [{ place: 1, name: 'Anna', score: 30000 }], 'the failed run is left out');
  assert.equal(b.dispatches.length, 1, 'the hourly job starts the checker while runs wait');

  const month = (await b.call('GET', `/month?m=${DAY.slice(0, 7)}`)).body.days[DAY];
  assert.equal(month.final, true);
  assert.deepEqual(month.modes.flight.map(r => r.name), ['Cheat', 'Anna', 'Bo'], 'meanwhile the calendar shows it live');

  const [cheat] = (await b.pending()).body.runs;
  await b.verdicts([b.verdict(cheat, false, 'score')]);
  await b.scheduled();
  assert.deepEqual(podium(b, 'flight'), [{ place: 1, name: 'Anna', score: 500 }, { place: 2, name: 'Bo', score: 400 }]);
  assert.equal(b.dispatches.length, 1, 'nothing left to check, so no new start');
  assert.deepEqual((await b.call('GET', '/trophies?name=Anna')).body.trophies.map(t => [t.mode, t.place]), [['flight', 1], ['survive', 1]]);
});

test('a waiting low score holds the day too, and a run that checks out takes its place', async () => {
  const b = makeBoard();
  seed(b, [['flight', 'Anna', 500, 'ok'], ['flight', 'Slow', 10, 'unchecked']]);
  await b.scheduled();
  assert.deepEqual(podium(b, 'flight'), []);
  const [slow] = (await b.pending()).body.runs;
  await b.verdicts([b.verdict(slow, true)]);
  await b.scheduled();
  assert.deepEqual(podium(b, 'flight').map(r => r.name), ['Anna', 'Slow']);
});
