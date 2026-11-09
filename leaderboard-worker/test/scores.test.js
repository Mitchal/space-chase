// Scores belong to accounts: only a logged-in player with a name can post, only as themselves.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, call, logIn, player, postScore, today } from './worker-harness.js';
import { archiveClosedDays } from '../src/podium-db.js';

test('posting a score needs a working login', async () => {
  const env = makeEnv();
  const none = await call(env, 'POST', '/score', { body: { mode: 'flight', day: today(), score: 5 } });
  assert.deepEqual([none.status, none.body], [401, { error: 'login' }]);
  const forged = await postScore(env, 'x'.repeat(43), 5);
  assert.equal(forged.status, 401);
});

test("a new account can't post until it has a name", async () => {
  const env = makeEnv(), { token } = await logIn(env, 'a@example.com');
  assert.deepEqual((await postScore(env, token, 5)).body, { error: 'no name' });
  assert.equal((await call(env, 'POST', '/me', { token, body: { name: 'Anna' } })).status, 200);
  const posted = await postScore(env, token, 5);
  assert.equal(posted.status, 200);
  assert.equal(posted.body.best, 5);
});

test('the board keeps your best, shows your current name and your id', async () => {
  const env = makeEnv();
  const anna = await player(env, 'anna@example.com', 'Anna'), bo = await player(env, 'bo@example.com', 'Bo');
  await postScore(env, anna.token, 300);
  await postScore(env, bo.token, 500);
  const after = await postScore(env, anna.token, 100);
  assert.deepEqual({ best: after.body.best, rank: after.body.rank, players: after.body.players }, { best: 300, rank: 2, players: 2 });
  await call(env, 'POST', '/me', { token: anna.token, body: { name: 'Anna B' } });
  const top = await call(env, 'GET', `/top?mode=flight&day=${today()}`);
  assert.deepEqual(top.body.top, [
    { id: bo.account.id, name: 'Bo', score: 500 },
    { id: anna.account.id, name: 'Anna B', score: 300 },
  ]);
});

test('two players may share a name; each keeps their own row', async () => {
  const env = makeEnv();
  const one = await player(env, 'one@example.com', 'Sam'), two = await player(env, 'two@example.com', 'sam');
  await postScore(env, one.token, 10);
  await postScore(env, two.token, 20);
  const top = (await call(env, 'GET', `/top?mode=flight&day=${today()}`)).body.top;
  assert.deepEqual(top.map(r => [r.id, r.score]), [[two.account.id, 20], [one.account.id, 10]]);
});

test("the old name and was fields can't post as, or remove, anyone", async () => {
  const env = makeEnv();
  const anna = await player(env, 'anna@example.com', 'Anna'), bo = await player(env, 'bo@example.com', 'Bo');
  await postScore(env, anna.token, 300);
  await postScore(env, bo.token, 10, { name: 'Anna', was: 'Anna' });
  const top = (await call(env, 'GET', `/top?mode=flight&day=${today()}`)).body.top;
  assert.deepEqual(top.map(r => [r.name, r.score]), [['Anna', 300], ['Bo', 10]]);
});

test('a rude name is refused', async () => {
  const env = makeEnv(), { token } = await logIn(env, 'r@example.com');
  assert.deepEqual((await call(env, 'POST', '/me', { token, body: { name: 'sh1thead' } })).body, { error: 'name' });
  assert.equal((await call(env, 'POST', '/me', { token, body: { name: '' } })).status, 422);
  assert.equal((await call(env, 'POST', '/me', { token, body: { name: 'x'.repeat(17) } })).status, 422);
});

test("a closed day's top five and trophies belong to the player, under their current name", async () => {
  const env = makeEnv();
  const anna = await player(env, 'anna@example.com', 'Anna');
  await env.DB.prepare(`INSERT INTO scores (mode, day, player_id, score, updated_at) VALUES ('flight', '2026-11-01', ?1, 900, 1)`)
    .bind(anna.account.id).run();
  await archiveClosedDays(env.DB, '2026-11-01');
  await call(env, 'POST', '/me', { token: anna.token, body: { name: 'Queen Anna' } });
  const month = (await call(env, 'GET', '/month?m=2026-11')).body;
  assert.deepEqual(month.days['2026-11-01'].modes.flight, [{ id: anna.account.id, name: 'Queen Anna', score: 900 }]);
  const trophies = (await call(env, 'GET', `/trophies?player=${anna.account.id}`)).body;
  assert.deepEqual(trophies, { trophies: [{ mode: 'flight', day: '2026-11-01', place: 1 }] });
  assert.equal((await call(env, 'GET', '/trophies?name=Anna')).status, 400);
});
