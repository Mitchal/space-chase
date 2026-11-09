// Logging in with an emailed code: codes, their expiry and tries, the per-email and per-address limits, sessions.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, call, logIn, lastCode, fakeLimiter } from './worker-harness.js';
import { storeCode, checkCode, CODE_TTL_MS, MAX_SENDS, SEND_WINDOW_MS } from '../src/auth/login-codes-db.js';
import { sessionPlayer, SESSION_TTL_MS } from '../src/auth/sessions-db.js';
import { cleanUp } from '../src/cleanup.js';

const start = (env, email, opts) => call(env, 'POST', '/auth/start', { body: { email }, ...opts });
const verify = (env, email, code, opts) => call(env, 'POST', '/auth/verify', { body: { email, code }, ...opts });
const wrong = code => String((Number(code) + 1) % 1e6).padStart(6, '0');

test('first login makes the account; the next login finds the same one', async () => {
  const env = makeEnv();
  const first = await logIn(env, '  Anna@Example.COM ');
  assert.match(first.token, /^[A-Za-z0-9_-]{43}$/);
  assert.deepEqual(first.account, { id: first.account.id, email: 'anna@example.com', name: null });
  const again = await logIn(env, 'anna@example.com');
  assert.equal(again.account.id, first.account.id);
  assert.notEqual(again.token, first.token);
  const stored = await env.DB.prepare('SELECT token_hash FROM sessions').all();
  assert.ok(stored.results.every(r => r.token_hash !== first.token && /^[0-9a-f]{64}$/.test(r.token_hash)));
  const codes = await env.DB.prepare('SELECT code_hash FROM login_codes').all();
  assert.ok(codes.results.every(r => /^[0-9a-f]{64}$/.test(r.code_hash)), 'only the hash of a code is kept');
});

test('asking for a code answers the same whether or not the email has an account', async () => {
  const env = makeEnv();
  await logIn(env, 'known@example.com');
  const known = await start(env, 'known@example.com'), unknown = await start(env, 'new@example.com');
  assert.deepEqual([known.status, known.body], [unknown.status, unknown.body]);
  assert.deepEqual(known.body, { ok: true });
});

test('a malformed email is refused, and with no email provider logging in is off', async () => {
  assert.equal((await start(makeEnv(), 'not-an-email')).status, 400);
  const off = await start(makeEnv({ EMAIL_PROVIDER: '' }), 'a@example.com');
  assert.deepEqual([off.status, off.body], [503, { error: 'email off' }]);
});

test('a code works once', async () => {
  const env = makeEnv();
  await start(env, 'b@example.com');
  const code = lastCode('b@example.com');
  assert.equal((await verify(env, 'b@example.com', code)).status, 200);
  assert.deepEqual((await verify(env, 'b@example.com', code)).body, { error: 'expired' });
});

test('five wrong tries use the code up, even for the right code after them', async () => {
  const env = makeEnv();
  await start(env, 'c@example.com');
  const code = lastCode('c@example.com');
  for (let left = 4; left >= 0; left--) assert.deepEqual((await verify(env, 'c@example.com', wrong(code))).body, { error: 'code', left });
  const late = await verify(env, 'c@example.com', code);
  assert.deepEqual([late.status, late.body], [401, { error: 'expired' }]);
  await start(env, 'c@example.com'); // a new code starts the count again
  assert.equal((await verify(env, 'c@example.com', lastCode('c@example.com'))).status, 200);
});

test('a code expires after 10 minutes', async () => {
  const env = makeEnv(), now = Date.now();
  await storeCode(env.DB, 'd@example.com', '123456', now);
  assert.equal((await checkCode(env.DB, 'd@example.com', '123456', now + CODE_TTL_MS)).result, 'expired');
  await storeCode(env.DB, 'd@example.com', '123456', now);
  assert.equal((await checkCode(env.DB, 'd@example.com', '123456', now + CODE_TTL_MS - 1)).result, 'ok');
});

test('an email gets at most 5 codes an hour, from any address', async () => {
  const env = makeEnv();
  for (let i = 0; i < MAX_SENDS; i++) assert.equal((await start(env, 'e@example.com', { ip: `10.0.1.${i}` })).status, 200);
  assert.equal((await start(env, 'e@example.com', { ip: '10.0.2.1' })).status, 429);
  assert.equal((await start(env, 'other@example.com')).status, 200, 'other emails are unaffected');
  assert.equal(await storeCode(env.DB, 'e@example.com', '000000', Date.now() + SEND_WINDOW_MS), true, 'an hour later it may again');
});

test('one address can only ask for and try so many codes a minute', async () => {
  const env = makeEnv({ AUTH_REQUESTS: fakeLimiter(10) });
  for (let i = 0; i < 10; i++) await verify(env, `f${i}@example.com`, '000000', { ip: '10.0.3.1' });
  assert.equal((await start(env, 'g@example.com', { ip: '10.0.3.1' })).status, 429);
  assert.equal((await start(env, 'g@example.com', { ip: '10.0.3.2' })).status, 200);
});

test('a session lasts 30 days, then the player logs in again', async () => {
  const env = makeEnv(), { token } = await logIn(env, 'h@example.com');
  const req = new Request('http://worker/me', { headers: { authorization: `Bearer ${token}` } });
  const now = Date.now();
  assert.ok(await sessionPlayer(req, env.DB, now + SESSION_TTL_MS - 60_000));
  assert.equal(await sessionPlayer(req, env.DB, now + SESSION_TTL_MS + 60_000), null);
  await env.DB.prepare('UPDATE sessions SET expires_at = ?1').bind(now - 1).run();
  assert.deepEqual((await call(env, 'GET', '/me', { token })).body, { error: 'login' });
});

test('logging out stops the token working', async () => {
  const env = makeEnv(), { token } = await logIn(env, 'i@example.com');
  assert.equal((await call(env, 'GET', '/me', { token })).status, 200);
  assert.equal((await call(env, 'POST', '/auth/logout', { token })).status, 200);
  assert.equal((await call(env, 'GET', '/me', { token })).status, 401);
});

test('the hourly job forgets expired sessions and spent codes', async () => {
  const env = makeEnv();
  await logIn(env, 'j@example.com');
  const later = Date.now() + SESSION_TTL_MS + 1;
  assert.deepEqual(await cleanUp(env.DB, later), { scores: 0, sessions: 1, codes: 1 });
});

test('the game may send the login token from its own addresses', async () => {
  const env = makeEnv();
  const pre = await call(env, 'OPTIONS', '/score', { origin: 'https://localhost' });
  assert.equal(pre.status, 204);
  assert.match(pre.headers.get('access-control-allow-headers'), /authorization/);
  assert.match(pre.headers.get('access-control-allow-methods'), /DELETE/);
  assert.equal((await call(env, 'POST', '/auth/start', { origin: 'https://evil.example', body: { email: 'a@b.co' } })).status, 403);
});
