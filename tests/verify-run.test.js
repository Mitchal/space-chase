// The leaderboard Worker's check (leaderboard-worker/src/verify-run.js): a genuine replay's score is accepted, and a
// made-up score, a tampered or cut-short replay, or one from another version of the game is turned away.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const { verifyRun, MAX_RUN_TICKS, MAX_BODY } = await import('../leaderboard-worker/src/verify-run.js');
const { SIM_VERSION } = await import('../game/core/sim-version.js');
const { encodeReplay, decodeReplay } = await import('../game/core/replay-codec.js');
const { playScripted } = await import('./scripted-player.js');

const DAY = '2026-11-09';
const runs = { flight: playScripted({ mode: 'flight', day: DAY }), survive: playScripted({ mode: 'survive', day: DAY }) };
const post = (mode, changes = {}) => {
  const r = runs[mode].replay;
  return { mode, day: DAY, score: runs[mode].score, simVersion: r.simVersion, replay: r.replay, ...changes };
};
const check = body => verifyRun(body, { mode: body.mode, day: body.day, claimed: body.score });
const edited = (mode, edit) => { const f = decodeReplay(runs[mode].replay.replay); edit(f); return encodeReplay(f); };

for (const mode of ['flight', 'survive']) {
  test(`${mode}: a genuine run's score is accepted`, () => {
    assert.ok(runs[mode].score > 0);
    assert.deepEqual(check(post(mode)), { ok: true, score: runs[mode].score });
  });

  test(`${mode}: a made-up score is refused`, () => {
    for (const score of [runs[mode].score + 1, runs[mode].score * 10, 0]) {
      assert.deepEqual(check(post(mode, { score })), { ok: false, status: 422, error: 'replay', why: 'score' });
    }
  });

  test(`${mode}: a tampered replay does not pass with the original score`, () => {
    const tampered = [
      edited(mode, f => { for (let i = 0; i < f.length; i += 7) f[i] = { x: 64, y: 0, grip: 30 }; }),
      edited(mode, f => f.splice(30, 10)), // ten ticks taken out early on
      edited(mode, f => { f[f.length >> 1] = { x: -64, y: 64, grip: 255 }; }),
    ];
    for (const replay of tampered) assert.equal(check(post(mode, { replay })).ok, false);
  });

  test(`${mode}: a cut-short or padded replay is refused`, () => {
    assert.equal(check(post(mode, { replay: edited(mode, f => f.splice(f.length - 120)) })).why, 'unfinished');
    assert.equal(check(post(mode, { replay: edited(mode, f => f.push(...f.slice(0, 120))) })).why, 'overrun');
  });
}

test('a run from another version of the game is told to update', () => {
  assert.deepEqual(check(post('flight', { simVersion: SIM_VERSION - 1 })), { ok: false, status: 409, error: 'update', simVersion: SIM_VERSION });
  assert.equal(check(post('flight', { simVersion: undefined })).error, 'update');
});

test('garbage and over-long replays are refused before they are played', () => {
  assert.equal(check(post('flight', { replay: 'nonsense' })).why, 'unreadable');
  assert.equal(check(post('flight', { replay: null })).why, 'unreadable');
  const long = encodeReplay(Array.from({ length: MAX_RUN_TICKS + 1 }, () => ({ x: 64, y: 0, grip: 14 })));
  assert.equal(check(post('flight', { replay: long })).why, 'unreadable');
});

test('a run is checked against its own day: the same input on another day fails', () => {
  assert.equal(verifyRun(post('survive'), { mode: 'survive', day: '2026-11-10', claimed: runs.survive.score }).ok, false);
});

test('a long run of nonstop thumb steering fits in a request', () => {
  // Five minutes with the stick moving every single tick: far busier than a real thumb.
  let a = 0;
  const frames = Array.from({ length: 5 * 60 * 60 }, (_, i) => { a += 0.05 + (i % 17) / 400; return { x: Math.round(Math.cos(a) * 64), y: Math.round(Math.sin(a) * 64), grip: 30 }; });
  const body = JSON.stringify(post('flight', { replay: encodeReplay(frames) }));
  assert.ok(body.length < MAX_BODY / 2, `${body.length} bytes`);
});
