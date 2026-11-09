// Your account: the profile reads, and deleting it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, call, logIn, player, postScore, today, PEPPER } from './worker-harness.js';
import { emailKey } from '../src/auth/email-key.js';
import { archiveClosedDays } from '../src/podium-db.js';

const count = async (env, sql, ...args) => (await env.DB.prepare(sql).bind(...args).first()).n;

test('the profile shows your name; the server has no email to show', async () => {
  const env = makeEnv(), { token, account } = await player(env, 'me@example.com', 'Me');
  assert.deepEqual((await call(env, 'GET', '/me', { token })).body, { account: { id: account.id, name: 'Me' } });
  assert.equal((await call(env, 'GET', '/me')).status, 401);
});

test('deleting an account removes its email key, sessions, code and scores, and keeps past places without it', async () => {
  const env = makeEnv();
  const gone = await player(env, 'gone@example.com', 'Gone'), stays = await player(env, 'stays@example.com', 'Stays');
  const other = await logIn(env, 'gone@example.com'); // a second device
  for (const day of ['2026-11-01', today()]) {
    await env.DB.prepare(`INSERT OR REPLACE INTO scores (mode, day, player_id, score, updated_at) VALUES
      ('flight', ?1, ?2, 900, 1), ('flight', ?1, ?3, 500, 1)`).bind(day, gone.account.id, stays.account.id).run();
  }
  await archiveClosedDays(env.DB, '2026-11-01');

  const del = await call(env, 'DELETE', '/me', { token: gone.token });
  assert.deepEqual([del.status, del.body], [200, { ok: true }]);

  const id = gone.account.id, key = await emailKey(PEPPER, 'gone@example.com');
  assert.equal(await count(env, 'SELECT COUNT(*) AS n FROM players WHERE id = ?1 OR email_key = ?2', id, key), 0);
  assert.equal(await count(env, 'SELECT COUNT(*) AS n FROM sessions WHERE player_id = ?1', id), 0);
  assert.equal(await count(env, 'SELECT COUNT(*) AS n FROM scores WHERE player_id = ?1', id), 0);
  assert.equal(await count(env, 'SELECT COUNT(*) AS n FROM login_codes WHERE email_key = ?1', key), 0);
  for (const token of [gone.token, other.token]) assert.equal((await call(env, 'GET', '/me', { token })).status, 401);

  const kept = (await call(env, 'GET', '/month?m=2026-11')).body.days['2026-11-01'].modes.flight;
  assert.deepEqual(kept, [{ id: null, name: null, score: 900 }, { id: stays.account.id, name: 'Stays', score: 500 }]);
  const board = (await call(env, 'GET', `/top?mode=flight&day=${today()}`)).body.top;
  assert.deepEqual(board.map(r => r.name), ['Stays']);

  const again = await logIn(env, 'gone@example.com');
  assert.notEqual(again.account.id, id);
  assert.equal(again.account.name, null, 'the same email later starts a fresh account');
});

test("deleting needs a login, and can't touch names from before accounts", async () => {
  const env = makeEnv();
  assert.equal((await call(env, 'DELETE', '/me')).status, 401);
  await env.DB.prepare(`INSERT INTO players (name, legacy_key, created_at) VALUES ('Old', 'old', 0)`).run();
  const { token } = await player(env, 'x@example.com', 'X');
  await postScore(env, token, 1);
  await call(env, 'DELETE', '/me', { token });
  assert.equal(await count(env, 'SELECT COUNT(*) AS n FROM players'), 1);
});

test("a deleted account's id is never given out again (the game caches trophies by id)", async () => {
  const env = makeEnv();
  const last = await player(env, 'last@example.com', 'Last');
  await call(env, 'DELETE', '/me', { token: last.token });
  const next = await logIn(env, 'next@example.com');
  assert.ok(next.account.id > last.account.id);
});
