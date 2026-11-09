// The run checker (tools/run-checks/verify-run.js): a genuine run's replay gives exactly its score; a made-up score,
// a tampered, cut-short or padded replay, or a run on another day does not. And the Worker's cheap checks on the way in
// (leaderboard-worker/src/run-shape.js): runs from another game version and unreadable or over-long replays are refused.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const { checkRun } = await import('../tools/run-checks/verify-run.js');
const { checkRunShape, MAX_RUN_TICKS, MAX_BODY } = await import('../leaderboard-worker/src/run-shape.js');
const { SIM_VERSION } = await import('../game/core/sim-version.js');
const { encodeReplay, decodeReplay } = await import('../game/core/replay-codec.js');
const { playScripted } = await import('./scripted-player.js');

const DAY = '2026-11-09';
const runs = { flight: playScripted({ mode: 'flight', day: DAY }), survive: playScripted({ mode: 'survive', day: DAY }) };
const stored = (mode, changes = {}) => {
  const r = runs[mode].replay;
  return { mode, day: DAY, score: runs[mode].score, simVersion: r.simVersion, replay: r.replay, ...changes };
};
const edited = (mode, edit) => { const f = decodeReplay(runs[mode].replay.replay); edit(f); return encodeReplay(f); };

for (const mode of ['flight', 'survive']) {
  test(`${mode}: a genuine run checks out`, () => {
    assert.ok(runs[mode].score > 0);
    assert.deepEqual(checkRun(stored(mode)), { ok: true });
  });

  test(`${mode}: a made-up score fails`, () => {
    for (const score of [runs[mode].score + 1, runs[mode].score * 10, 0]) {
      assert.deepEqual(checkRun(stored(mode, { score })), { ok: false, why: 'score', replayed: runs[mode].score });
    }
  });

  test(`${mode}: a tampered replay does not pass with the original score`, () => {
    const tampered = [
      edited(mode, f => { for (let i = 0; i < f.length; i += 7) f[i] = { x: 64, y: 0, grip: 30 }; }),
      edited(mode, f => f.splice(30, 10)), // ten ticks taken out early on
      edited(mode, f => { f[f.length >> 1] = { x: -64, y: 64, grip: 255 }; }),
    ];
    for (const replay of tampered) assert.equal(checkRun(stored(mode, { replay })).ok, false);
  });

  test(`${mode}: a cut-short or padded replay fails`, () => {
    assert.equal(checkRun(stored(mode, { replay: edited(mode, f => f.splice(f.length - 120)) })).why, 'unfinished');
    assert.equal(checkRun(stored(mode, { replay: edited(mode, f => f.push(...f.slice(0, 120))) })).why, 'overrun');
  });
}

test('a run is checked against its own day: the same input on another day fails', () => {
  assert.equal(checkRun({ ...stored('survive'), day: '2026-11-10' }).ok, false);
});

test('garbage fails, and a run from another simulation is not judged at all', () => {
  assert.equal(checkRun(stored('flight', { replay: 'nonsense' })).why, 'unreadable');
  assert.deepEqual(checkRun(stored('flight', { simVersion: SIM_VERSION + 1 })), { skipped: 'version' });
});

test('the Worker turns away other game versions and unreadable or over-long replays', () => {
  assert.deepEqual(checkRunShape(stored('flight')), { ok: true, simVersion: SIM_VERSION, replay: runs.flight.replay.replay });
  assert.deepEqual(checkRunShape(stored('flight', { simVersion: SIM_VERSION - 1 })),
    { ok: false, status: 409, error: 'update', simVersion: SIM_VERSION });
  assert.equal(checkRunShape(stored('flight', { simVersion: undefined })).error, 'update');
  assert.equal(checkRunShape(stored('flight', { replay: 'nonsense' })).why, 'unreadable');
  assert.equal(checkRunShape(stored('flight', { replay: null })).why, 'unreadable');
  const long = encodeReplay(Array.from({ length: MAX_RUN_TICKS + 1 }, () => ({ x: 64, y: 0, grip: 14 })));
  assert.equal(checkRunShape(stored('flight', { replay: long })).why, 'unreadable');
});

test('a long run of nonstop thumb steering fits in a request, and the Worker checks it cheaply', () => {
  // Five minutes with the stick moving every single tick: far busier than a real thumb.
  let a = 0;
  const frames = Array.from({ length: 5 * 60 * 60 }, (_, i) => {
    a += 0.05 + (i % 17) / 400;
    return { x: Math.round(Math.cos(a) * 64), y: Math.round(Math.sin(a) * 64), grip: 30 };
  });
  const body = JSON.stringify(stored('flight', { replay: encodeReplay(frames) }));
  assert.ok(body.length < MAX_BODY / 2, `${body.length} bytes`);
  checkRunShape(JSON.parse(body)); // warm up
  const t = performance.now();
  assert.equal(checkRunShape(JSON.parse(body)).ok, true);
  const ms = performance.now() - t;
  assert.ok(ms < 10, `${ms.toFixed(2)} ms`); // the free plan's CPU for a whole request
});
