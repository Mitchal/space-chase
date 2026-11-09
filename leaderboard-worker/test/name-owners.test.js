// Names belong to the device that first posts with them (src/name-owners.js, src/device-key.js, src/rename.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { makeEnv, newDevice, call, postScore, rows, owners, oldRow } from './device-harness.js';

const sha256 = s => createHash('sha256').update(s).digest('hex');

test('the first post with a name claims it for that device, storing only the key\'s hash', async () => {
  const env = makeEnv(), anna = newDevice();
  const res = await postScore(env, anna, 'Anna', 500);
  assert.equal(res.status, 200);
  assert.equal(res.body.best, 500);
  assert.deepEqual(owners(env), { anna: sha256(anna) });
  const stored = JSON.stringify(env.DB.raw.prepare('SELECT * FROM name_owners').all());
  assert.ok(!stored.includes(anna), 'the key itself is never stored');
});

test('the owner keeps posting with the name, in any capitals', async () => {
  const env = makeEnv(), anna = newDevice();
  await postScore(env, anna, 'Anna', 500);
  const res = await postScore(env, anna, 'ANNA', 900);
  assert.equal(res.status, 200);
  assert.deepEqual(rows(env), { anna: 900 });
});

test('another device gets 422 taken, and the owner\'s row is untouched', async () => {
  const env = makeEnv(), anna = newDevice(), forger = newDevice();
  await postScore(env, anna, 'Anna', 500);
  for (const name of ['Anna', 'anna', ' ANNA ']) {
    const res = await postScore(env, forger, name, 9_999_999);
    assert.equal(res.status, 422);
    assert.deepEqual(res.body, { error: 'taken' });
  }
  assert.deepEqual(rows(env), { anna: 500 });
  assert.deepEqual(owners(env), { anna: sha256(anna) });
});

test('a post without a key, or with a malformed one, is refused and changes nothing', async () => {
  const env = makeEnv();
  const none = await postScore(env, null, 'Anna', 500);
  assert.equal(none.status, 401);
  assert.deepEqual(none.body, { error: 'key' });
  for (const bad of ['short', 'g'.repeat(64), newDevice().toUpperCase(), newDevice() + '0']) {
    assert.equal((await postScore(env, bad, 'Anna', 500)).status, 401, bad);
  }
  const basic = await call(env, 'POST', '/score', {
    headers: { authorization: `Basic ${newDevice()}` }, body: { mode: 'flight', day: '2026-01-01', name: 'A', score: 1 },
  });
  assert.equal(basic.status, 401);
  assert.deepEqual(rows(env), {});
  assert.deepEqual(owners(env), {});
});

test('a name already on the board before owners existed is claimed by whoever posts with it first', async () => {
  const env = makeEnv(), first = newDevice(), second = newDevice();
  oldRow(env, 'Mikael', 300);
  assert.equal((await postScore(env, first, 'Mikael', 200)).status, 200);
  assert.deepEqual(rows(env), { mikael: 300 }, 'the better score stays');
  assert.equal((await postScore(env, second, 'Mikael', 400)).status, 422);
});

test('the owner renames: the day\'s rows in every challenge move over and the old name is let go', async () => {
  const env = makeEnv(), anna = newDevice(), other = newDevice();
  await postScore(env, anna, 'Anna', 500);
  await postScore(env, anna, 'Anna', 70_000, { mode: 'survive' });
  const res = await postScore(env, anna, 'Annie', 400, { was: 'Anna' });
  assert.equal(res.status, 200);
  assert.equal(res.body.best, 500, 'the moved score is kept, as it is better than the one sent');
  assert.deepEqual(rows(env), { annie: 500 });
  assert.deepEqual(rows(env, { mode: 'survive' }), { annie: 70_000 });
  assert.deepEqual(owners(env), { annie: sha256(anna) });
  // The game posts each challenge with `was`; the second finds the old name already let go, and that's fine.
  const again = await postScore(env, anna, 'Annie', 70_000, { mode: 'survive', was: 'Anna' });
  assert.equal(again.status, 200);
  // Anyone may now take the old name.
  assert.equal((await postScore(env, other, 'Anna', 10)).status, 200);
  assert.deepEqual(rows(env), { annie: 500, anna: 10 });
});

test('a rename keeps the better score and the earlier time when the new name has a row too', async () => {
  const env = makeEnv(), anna = newDevice();
  await postScore(env, anna, 'Anna', 300);
  await postScore(env, anna, 'Annie', 800); // a device may hold more than one name
  await postScore(env, anna, 'Annie', 100, { was: 'Anna' });
  assert.deepEqual(rows(env), { annie: 800 });
  assert.equal(owners(env).anna, undefined);
});

test('renaming away from someone else\'s name leaves their row and their claim alone', async () => {
  const env = makeEnv(), anna = newDevice(), forger = newDevice();
  await postScore(env, anna, 'Anna', 500);
  const res = await postScore(env, forger, 'Forger', 10, { was: 'Anna' });
  assert.equal(res.status, 200, 'the forger\'s own score goes in');
  assert.deepEqual(rows(env), { anna: 500, forger: 10 });
  assert.equal(owners(env).anna, sha256(anna));
  assert.equal((await postScore(env, forger, 'Anna', 1)).status, 422, 'and the name is still taken');
});

test('`was` can no longer delete a row nobody owns', async () => {
  const env = makeEnv(), forger = newDevice();
  oldRow(env, 'Bertil', 700);
  oldRow(env, 'Bertil', 50_000, { mode: 'survive' });
  await postScore(env, forger, 'Forger', 10, { was: 'Bertil' });
  assert.deepEqual(rows(env), { bertil: 700, forger: 10 });
  assert.deepEqual(rows(env, { mode: 'survive' }), { bertil: 50_000 });
});

test('the browser may send the key: the CORS preflight allows the authorization header', async () => {
  const env = makeEnv();
  const res = await call(env, 'OPTIONS', '/score', { headers: { 'access-control-request-headers': 'authorization, content-type' } });
  assert.equal(res.status, 204);
  assert.match(res.headers.get('access-control-allow-headers'), /\bauthorization\b/);
});

test('trophies stay keyed by name and need no key', async () => {
  const env = makeEnv();
  env.DB.raw.prepare("INSERT INTO podium (mode, day, place, name_key, name, score) VALUES ('flight', '2026-11-01', 1, 'anna', 'Anna', 900)").run();
  const res = await call(env, 'GET', '/trophies?name=Anna');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { trophies: [{ mode: 'flight', day: '2026-11-01', place: 1 }] });
});
