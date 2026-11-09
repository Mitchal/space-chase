// Moving the live database to accounts (migrations/0004): names typed before stay on their scores and past days,
// as players nobody can log in as.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakeD1 } from './fake-d1.js';
import { call, player, postScore, today } from './worker-harness.js';

function oldDatabase() {
  const db = fakeD1({ migrateUpTo: 2 });
  db.raw.exec(`
    INSERT INTO scores (mode, day, name_key, name, score, updated_at) VALUES
      ('flight', '${today()}', 'anna', 'Anna', 700, 20), ('survive', '${today()}', 'bo', 'Bo', 9000, 10),
      ('flight', '2026-11-02', 'anna', 'anna', 300, 5);
    INSERT INTO podium (mode, day, place, name_key, name, score) VALUES
      ('flight', '2026-11-02', 1, 'anna', 'anna', 300), ('flight', '2026-11-02', 2, 'cleo', 'Cleo', 100);`);
  db.migrate();
  return db;
}

test('every old name becomes a player without an email, with its latest spelling', async () => {
  const db = oldDatabase();
  const { results } = await db.prepare('SELECT name, legacy_key, email FROM players ORDER BY legacy_key').all();
  assert.deepEqual(results, [
    { name: 'Anna', legacy_key: 'anna', email: null },
    { name: 'Bo', legacy_key: 'bo', email: null },
    { name: 'Cleo', legacy_key: 'cleo', email: null },
  ]);
});

test("old scores and past days still show under their names, and their trophies stay theirs", async () => {
  const env = { DB: oldDatabase(), EMAIL_PROVIDER: 'log' };
  const top = (await call(env, 'GET', `/top?mode=flight&day=${today()}`)).body.top;
  assert.deepEqual(top.map(r => [r.name, r.score]), [['Anna', 700]]);
  const day = (await call(env, 'GET', '/month?m=2026-11')).body.days['2026-11-02'].modes.flight;
  assert.deepEqual(day.map(r => r.name), ['Anna', 'Cleo']);
  const anna = await env.DB.prepare(`SELECT id FROM players WHERE legacy_key = 'anna'`).first();
  assert.deepEqual((await call(env, 'GET', `/trophies?player=${anna.id}`)).body.trophies, [{ mode: 'flight', day: '2026-11-02', place: 1 }]);
});

test("a new account named like an old name is a different player; the old row can't be touched", async () => {
  const env = { DB: oldDatabase(), EMAIL_PROVIDER: 'log' };
  const { token, account } = await player(env, 'anna@example.com', 'Anna');
  await postScore(env, token, 50);
  const top = (await call(env, 'GET', `/top?mode=flight&day=${today()}`)).body.top;
  assert.deepEqual(top.map(r => r.score), [700, 50]);
  assert.equal(top[1].id, account.id);
  assert.notEqual(top[0].id, account.id);
});
