// End to end against a local leaderboard Worker: posts a genuine run of today's challenges and two cheats (a made-up
// score, and an edited replay with the original score), sees all three on the board (trusted at first), runs the
// checker (tools/run-checks/check-pending.js) as the GitHub Action would, and sees the cheats gone and the genuine
// run still there. Local only: never point it at the deployed board.
//   cd leaderboard-worker && npm run db:local && npm run dev      (with RUN_CHECK_SECRET in leaderboard-worker/.dev.vars)
//   RUN_CHECK_SECRET=… node tests/check-runs-e2e.js [http://127.0.0.1:8787]
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { playScripted } from './scripted-player.js';
import { loadSim } from './load-sim.js';

await loadSim();
const { gameToday } = await import('../game/core/game-day.js');
const { encodeReplay, decodeReplay } = await import('../game/core/replay-codec.js');

const BOARD = (process.argv[2] || 'http://127.0.0.1:8787').replace(/\/+$/, '');
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(BOARD)) throw new Error('local Workers only');
const SECRET = process.env.RUN_CHECK_SECRET;
if (!SECRET) throw new Error('Set RUN_CHECK_SECRET (the one in leaderboard-worker/.dev.vars).');
const day = gameToday(), tag = Date.now().toString(36).slice(-4);

const call = async (path, init) => { const res = await fetch(BOARD + path, init); return { status: res.status, body: await res.json() }; };
// One device per name (game/pods/leaderboard/device-key.js): a name belongs to the device that first posts with it.
const devices = new Map(), deviceOf = name => devices.get(name) ?? devices.set(name, randomBytes(32).toString('hex')).get(name);
const post = body => call('/score', { method: 'POST', body: JSON.stringify(body),
  headers: { 'content-type': 'application/json', authorization: `Bearer ${deviceOf(body.name)}` } });
const names = async mode => (await call(`/top?mode=${mode}&day=${day}`)).body.top.map(r => r.name);
function expect(ok, what) { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) process.exitCode = 1; }

const posted = {};
for (const mode of ['flight', 'survive']) {
  const { score, replay } = playScripted({ mode, day });
  const frames = decodeReplay(replay.replay);
  for (let i = 40; i < frames.length; i += 9) frames[i] = { x: 64, y: 0, grip: 30 };
  const runs = {
    honest: { score, replay: replay.replay },
    madeUp: { score: score + 1000, replay: replay.replay },
    edited: { score, replay: encodeReplay(frames) },
  };
  posted[mode] = {};
  for (const [kind, run] of Object.entries(runs)) {
    const name = `e2e ${kind} ${tag}`;
    const res = await post({ mode, day, name, score: run.score, simVersion: replay.simVersion, replay: run.replay });
    expect(res.status === 200, `${mode}: ${kind} run (score ${run.score}) accepted for now → ${res.status}`);
    posted[mode][kind] = name;
  }
  const shown = await names(mode);
  expect(Object.values(posted[mode]).every(n => shown.includes(n)), `${mode}: all three shown before the check`);
}

const pending = await call('/checks/pending', { headers: { authorization: `Bearer ${SECRET}` } });
console.log(`waiting for the check: ${pending.body.runs?.length} runs`);

const checker = spawnSync(process.execPath, [fileURLToPath(new URL('../tools/run-checks/check-pending.js', import.meta.url))], {
  env: { ...process.env, BOARD_URL: BOARD, RUN_CHECK_SECRET: SECRET }, encoding: 'utf8',
});
console.log(checker.stdout.trimEnd().replace(/^/gm, '  checker: '));
process.stderr.write(checker.stderr);
expect(checker.status === 0, `the checker finished cleanly (exit ${checker.status})`);

for (const mode of ['flight', 'survive']) {
  const shown = await names(mode);
  expect(shown.includes(posted[mode].honest), `${mode}: the genuine run is still on the board`);
  expect(!shown.includes(posted[mode].madeUp), `${mode}: the made-up score is gone`);
  expect(!shown.includes(posted[mode].edited), `${mode}: the edited replay is gone`);
}
const after = await call('/checks/pending', { headers: { authorization: `Bearer ${SECRET}` } });
expect(after.body.runs.length === 0, 'nothing left waiting');
