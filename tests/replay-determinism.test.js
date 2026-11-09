// Recorded runs replay to exactly the same end: same world to the last bit, same score. Bots and a scripted human,
// in both daily challenges, on a few days.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSim } from './load-sim.js';

await loadSim();
const { playBot } = await import('../game/pods/bots/bot-run.js');
const { replayRun } = await import('../game/core/replay-run.js');
const { decodeReplay } = await import('../game/core/replay-codec.js');
const { playScripted } = await import('./scripted-player.js');

const DAYS = ['2026-11-09', '2026-11-10', '2027-01-01'];
const replayOf = rec => replayRun({ mode: rec.mode, day: rec.day, seed: rec.seed, frames: decodeReplay(rec.replay) });

for (const mode of ['flight', 'survive']) {
  for (const policy of ['evader', 'random']) {
    test(`${mode}: a ${policy} bot's run replays exactly`, () => {
      for (const day of DAYS) {
        const live = playBot({ mode, policy, day, maxS: 900 });
        assert.notEqual(live.summary.telemetry?.outcome ?? 'ended', 'timeout');
        assert.ok(live.replay.ticks > 60, 'the run lasted a while');
        const again = replayOf(live.replay);
        assert.equal(again.ok, true, `${day}: ${again.error}`);
        assert.equal(again.fingerprint, live.fingerprint, `${day}: end state`);
        if (mode === 'flight') assert.equal(again.score, live.summary.score.score, `${day}: score`);
      }
    });
  }

  test(`${mode}: a scripted human's run replays exactly, twice`, () => {
    for (const day of DAYS) {
      const live = playScripted({ mode, day });
      assert.equal(live.over, true, `${day}: the run ended`);
      const first = replayOf(live.replay), second = replayOf(live.replay);
      assert.equal(first.ok, true, `${day}: ${first.error}`);
      assert.equal(first.score, live.score, `${day}: score`);
      assert.equal(first.fingerprint, live.fingerprint, `${day}: end state`);
      assert.deepEqual(second, first, `${day}: a second replay`);
    }
  });
}

test('a run on another day is a different run', () => {
  const a = playScripted({ mode: 'survive', day: '2026-11-09' }), b = playScripted({ mode: 'survive', day: '2026-11-10' });
  assert.notEqual(a.fingerprint, b.fingerprint);
});

test('the same input on another day does not replay to the same end', () => {
  const live = playScripted({ mode: 'flight', day: '2026-11-09' });
  const other = replayRun({ mode: 'flight', day: '2026-11-10', frames: decodeReplay(live.replay.replay) });
  assert.equal(other.ok && other.fingerprint === live.fingerprint, false);
});
