// The run checker: takes every run the leaderboard has stored unchecked, replays each in the simulation it was played
// in, and sends back a verdict per run. A run that checks out stays on the board (and its replay is dropped); one that
// doesn't is hidden. Run by .github/workflows/check-runs.yml; also by hand against a local Worker.
//   BOARD_URL=https://… RUN_CHECK_SECRET=… node tools/run-checks/check-pending.js [--linger 60] [--batch 50]
// --linger: once nothing is left, keep looking this many seconds after starting (the Worker starts the checker at most
// once a minute, so runs that arrive in between are picked up). Exit code 1 if a run couldn't be checked at all.
import { boardCalls } from './board-calls.js';
import { simCheckouts } from './sim-checkouts.js';

const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? Number(process.argv[i + 1]) : fallback; };
const LINGER_MS = arg('linger', 0) * 1000, BATCH = arg('batch', 50), POLL_MS = 10_000;
const { BOARD_URL, RUN_CHECK_SECRET } = process.env;
if (!BOARD_URL || !RUN_CHECK_SECRET) { console.error('Set BOARD_URL and RUN_CHECK_SECRET.'); process.exit(2); }

const board = boardCalls(BOARD_URL, RUN_CHECK_SECRET), sims = simCheckouts();
const idOf = r => `${r.mode}|${r.day}|${r.key}|${r.at}|${r.score}`;
const started = Date.now(), done = new Set(), stuck = new Set();
const tally = { ok: 0, failed: 0, stuck: 0 };

// One round: the oldest waiting runs, checked and answered. → how many runs it judged.
async function round() {
  const runs = (await board.pending(Math.min(200, BATCH + stuck.size))).filter(r => !stuck.has(idOf(r)));
  for (const r of runs) if (done.has(idOf(r))) { stuck.add(idOf(r)); tally.stuck++; console.warn(`answered but still waiting: ${r.mode} ${r.day}`); }
  const fresh = runs.filter(r => !stuck.has(idOf(r)));
  const byVersion = Map.groupBy(fresh, r => r.simVersion);
  let judged = 0;
  for (const [version, group] of byVersion) {
    const results = new Map((sims.check(version, group.map(r => ({ id: idOf(r), ...r }))) ?? []).map(res => [res.id, res]));
    const verdicts = [];
    for (const r of group) {
      const res = results.get(idOf(r)) ?? { skipped: 'version' };
      if (res.skipped) { stuck.add(idOf(r)); tally.stuck++; continue; }
      verdicts.push({ mode: r.mode, day: r.day, key: r.key, at: r.at, score: r.score, ok: res.ok, why: res.why });
      done.add(idOf(r));
      if (res.ok) tally.ok++;
      else { tally.failed++; console.log(`failed: ${r.mode} ${r.day} score ${r.score} (${res.why})`); }
    }
    if (verdicts.length) await board.send(verdicts);
    judged += verdicts.length;
  }
  return judged;
}

try {
  for (;;) {
    if (await round()) continue;
    if (Date.now() - started >= LINGER_MS) break;
    await new Promise(r => setTimeout(r, POLL_MS));
  }
} finally { sims.cleanUp(); }

console.log(`checked ${tally.ok + tally.failed} runs: ${tally.ok} ok, ${tally.failed} failed`
  + (tally.stuck ? `; ${tally.stuck} couldn't be checked (see above)` : ''));
if (tally.stuck) process.exit(1);
