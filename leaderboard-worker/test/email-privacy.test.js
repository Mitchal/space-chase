// Email addresses are never stored or logged: accounts, codes and limits go by a keyed hash (src/auth/email-key.js).
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, call, logIn, player, postScore, logged, PEPPER } from './worker-harness.js';
import { emailKey, maskEmail } from '../src/auth/email-key.js';

const EMAIL = 'private.person@example.org';

// Every value in every table, as text.
async function everything(env) {
  const { results: tables } = await env.DB.prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`).all();
  const values = [];
  for (const { name } of tables) {
    for (const row of (await env.DB.prepare(`SELECT * FROM "${name}"`).all()).results) values.push(...Object.values(row).map(String));
  }
  return values;
}

test('no table holds the address, only its key', async () => {
  const env = makeEnv();
  const { token } = await player(env, ` ${EMAIL.toUpperCase()} `, 'Private');
  await postScore(env, token, 42);
  await call(env, 'POST', '/auth/start', { body: { email: EMAIL } }); // a pending code too
  const values = await everything(env);
  assert.ok(!values.some(v => v.toLowerCase().includes('private.person') || v.includes('@')), 'no address anywhere');
  const key = await emailKey(PEPPER, EMAIL);
  assert.match(key, /^[0-9a-f]{64}$/);
  assert.ok(values.includes(key), 'the account and its code are kept by the key');
});

test('the key is keyed: the same address with another pepper gives another key', async () => {
  assert.notEqual(await emailKey(PEPPER, EMAIL), await emailKey(`${PEPPER}-other`, EMAIL));
  assert.equal(await emailKey(PEPPER, EMAIL), await emailKey(PEPPER, EMAIL));
});

test('log mode shows the code with the address masked', async () => {
  const env = makeEnv();
  await logIn(env, EMAIL);
  assert.equal(maskEmail(EMAIL), 'p***@e***.org');
  assert.ok(logged.some(l => l.includes('p***@e***.org')));
  assert.ok(!logged.some(l => l.includes(EMAIL)));
});

test("a provider's refusal is logged with the address masked", async () => {
  const env = makeEnv({ EMAIL_PROVIDER: 'resend', RESEND_API_KEY: 'test', EMAIL_FROM: 'x@example.com' });
  mock.method(globalThis, 'fetch', async () => new Response(`Invalid to: ${EMAIL}`, { status: 422 }));
  const errors = [];
  mock.method(console, 'error', (...args) => errors.push(args.join(' ')));
  try {
    assert.equal((await call(env, 'POST', '/auth/start', { body: { email: EMAIL } })).status, 502);
  } finally { mock.restoreAll(); }
  assert.equal(errors.length, 1);
  assert.match(errors[0], /p\*\*\*@e\*\*\*\.org/);
  assert.ok(!errors[0].includes(EMAIL));
});
