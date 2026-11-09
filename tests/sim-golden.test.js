// Golden replays (game/dev/sim-golden.json): recorded runs with the exact end state and score they must replay to.
//   - The simulation changed what a run does (a speed, a spawn, the order of systems)? This fails: bump SIM_VERSION in
//     game/core/sim-version.js (old replays can't be checked any more) and regenerate: UPDATE_GOLDEN=1 npm test.
//   - Another engine (Safari, Firefox): game/dev/replay-check.js replays the same file in the browser's console.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadSim } from './load-sim.js';

await loadSim();
const { SIM_VERSION } = await import('../game/core/sim-version.js');
const { replayRun } = await import('../game/core/replay-run.js');
const { decodeReplay } = await import('../game/core/replay-codec.js');
const { playScripted } = await import('./scripted-player.js');
const { playBot } = await import('../game/pods/bots/bot-run.js');

const FILE = new URL('../game/dev/sim-golden.json', import.meta.url);
const replayOf = r => replayRun({ mode: r.mode, day: r.day, frames: decodeReplay(r.replay) });

function record() {
  const runs = [];
  for (const mode of ['flight', 'survive']) for (const day of ['2026-11-09', '2026-12-24']) {
    runs.push({ by: 'scripted', ...playScripted({ mode, day }).replay });
    runs.push({ by: 'evader bot', ...playBot({ mode, day, maxS: 900 }).replay });
  }
  return {
    simVersion: SIM_VERSION,
    runs: runs.map(({ by, mode, day, ticks, replay }) => { const r = replayOf({ mode, day, replay }); return { by, mode, day, ticks, score: r.score, fingerprint: r.fingerprint, replay }; }),
  };
}

if (process.env.UPDATE_GOLDEN) fs.writeFileSync(FILE, JSON.stringify(record(), null, 1) + '\n');
const golden = JSON.parse(fs.readFileSync(FILE, 'utf8'));

test('the golden replays are for this simulation version', () => {
  assert.equal(golden.simVersion, SIM_VERSION, 'SIM_VERSION changed: regenerate the golden replays (UPDATE_GOLDEN=1 npm test)');
});

test('the golden replays still replay to the same end (else: bump SIM_VERSION and regenerate)', () => {
  for (const r of golden.runs) {
    const again = replayOf(r);
    assert.equal(again.ok, true, `${r.by} ${r.mode} ${r.day}: ${again.error}`);
    assert.deepEqual({ score: again.score, ticks: again.ticks, fingerprint: again.fingerprint },
      { score: r.score, ticks: r.ticks, fingerprint: r.fingerprint }, `${r.by} ${r.mode} ${r.day}`);
  }
});
