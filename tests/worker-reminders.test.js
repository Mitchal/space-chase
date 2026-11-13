// Daily reminders on the web: a browser signs up with its push address and a time, and the five-minute job sends it a
// signed push when that time comes round in its own time zone, then moves it on a day.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createPublicKey, verify } from 'node:crypto';
import worker from '../leaderboard-worker/src/worker.js';
import { makeBoard } from './worker-harness.js';
import { nextReminderAt } from '../leaderboard-worker/src/reminder-time.js';
import { REMINDER_CRON } from '../leaderboard-worker/src/reminder-sender.js';

const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const jwk = privateKey.export({ format: 'jwk' });
const KEYS = {
  VAPID_PUBLIC_KEY: Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x, 'base64url'), Buffer.from(jwk.y, 'base64url')]).toString('base64url'),
  VAPID_PRIVATE_KEY: jwk.d,
};
const CHROME = 'https://fcm.googleapis.com/fcm/send/abc123';
const FIREFOX = 'https://updates.push.services.mozilla.com/wpush/v2/xyz';

// Runs the five-minute job; push services answer with `status(endpoint)`.
async function sendDue(b, status = () => 201) {
  const sent = [], realFetch = globalThis.fetch, realLog = console.log;
  console.log = () => {};
  globalThis.fetch = async (url, init) => { sent.push({ url, headers: init.headers }); return new Response(null, { status: status(url) }); };
  try { await worker.scheduled({ cron: REMINDER_CRON }, b.env, {}); } finally { globalThis.fetch = realFetch; console.log = realLog; }
  return sent;
}
const remind = (b, body) => b.call('POST', '/reminder', { body: { hour: 18, minute: 0, timeZone: 'Europe/Stockholm', ...body } });
const makeDue = b => b.DB.exec('UPDATE reminders SET next_at = 0');

test('without keys, reminders are off and the game is told so', async () => {
  const b = makeBoard();
  assert.deepEqual((await b.call('GET', '/reminder/key')).body, { key: null });
  assert.equal((await remind(b, { endpoint: CHROME })).status, 503);
});

test('only push service addresses and real times are taken', async () => {
  const b = makeBoard(KEYS);
  assert.equal((await b.call('GET', '/reminder/key')).body.key, KEYS.VAPID_PUBLIC_KEY);
  for (const endpoint of ['https://evil.example/hook', 'http://fcm.googleapis.com/x', 'not a url', null])
    assert.equal((await remind(b, { endpoint })).status, 400, String(endpoint));
  assert.equal((await remind(b, { endpoint: CHROME, hour: 24 })).status, 400);
  assert.equal((await remind(b, { endpoint: CHROME, minute: 1.5 })).status, 400);
  assert.equal(b.DB.query('SELECT COUNT(*) AS n FROM reminders')[0].n, 0);
});

test('a due reminder is sent once, signed, and moves on to the next time it comes round', async () => {
  const b = makeBoard(KEYS);
  const { status, body } = await remind(b, { endpoint: CHROME });
  assert.equal(status, 200);
  assert.ok(body.nextAt > Date.now() && body.nextAt <= Date.now() + 86_400_000);
  assert.equal((await sendDue(b)).length, 0, 'not due yet');

  makeDue(b);
  const [push] = await sendDue(b);
  assert.equal(push.url, CHROME);
  const [, token, key] = push.headers.authorization.match(/^vapid t=([^,]+), k=(.+)$/);
  assert.equal(key, KEYS.VAPID_PUBLIC_KEY);
  const [head, claims, sig] = token.split('.');
  const pub = createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y }, format: 'jwk' });
  assert.ok(verify('sha256', Buffer.from(`${head}.${claims}`), { key: pub, dsaEncoding: 'ieee-p1363' }, Buffer.from(sig, 'base64url')),
    'the push service can check the signature');
  assert.equal(JSON.parse(Buffer.from(claims, 'base64url')).aud, 'https://fcm.googleapis.com');

  const next = b.DB.query('SELECT next_at FROM reminders')[0].next_at;
  assert.equal(next, body.nextAt, 'the next 18:00 in Stockholm');
  assert.equal((await sendDue(b)).length, 0, 'not sent twice');
});

test('changing the time replaces it; turning it off or a dead subscription removes it', async () => {
  const b = makeBoard(KEYS);
  await remind(b, { endpoint: CHROME });
  await remind(b, { endpoint: CHROME, hour: 7, minute: 30 });
  assert.deepEqual(b.DB.query('SELECT hour, minute FROM reminders'), [{ hour: 7, minute: 30 }]);
  await b.call('POST', '/reminder/off', { body: { endpoint: CHROME } });
  assert.equal(b.DB.query('SELECT COUNT(*) AS n FROM reminders')[0].n, 0);

  await remind(b, { endpoint: CHROME });
  await remind(b, { endpoint: FIREFOX });
  makeDue(b);
  await sendDue(b, url => url === FIREFOX ? 410 : 201);
  assert.deepEqual(b.DB.query('SELECT endpoint FROM reminders').map(r => r.endpoint), [CHROME]);
});

test('a push service that keeps refusing is given up on after five days', async () => {
  const b = makeBoard(KEYS);
  await remind(b, { endpoint: CHROME });
  for (let day = 1; day <= 5; day++) { makeDue(b); await sendDue(b, () => 500); }
  assert.equal(b.DB.query('SELECT COUNT(*) AS n FROM reminders')[0].n, 0);
});

test('the time follows the player\'s clock through summer time', () => {
  const at = (iso, tz = 'Europe/Stockholm', hour = 18, minute = 0) => new Date(nextReminderAt({ hour, minute, timeZone: tz }, Date.parse(iso))).toISOString();
  assert.equal(at('2026-03-28T12:00:00Z'), '2026-03-28T17:00:00.000Z', 'winter: UTC+1');
  assert.equal(at('2026-03-28T18:00:00Z'), '2026-03-29T16:00:00.000Z', 'the day summer time starts: UTC+2');
  assert.equal(at('2026-10-24T17:00:00Z'), '2026-10-25T17:00:00.000Z', 'the day it ends');
  assert.equal(at('2026-03-29T00:30:00Z', 'Europe/Stockholm', 2, 30), '2026-03-29T01:30:00.000Z', 'a skipped time comes an hour late');
  assert.equal(at('2026-11-13T23:00:00Z', 'America/New_York', 20, 15), '2026-11-14T01:15:00.000Z');
});
