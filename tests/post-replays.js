// End-to-end against a local leaderboard Worker (cd leaderboard-worker && npm run dev): plays long genuine runs of
// today's daily challenges, posts them as the game would, and times each request against a cheap one. Also checks
// that a made-up score and an old game version are turned away. Local only: never point it at the deployed board.
//   node tests/post-replays.js [http://127.0.0.1:8787]
import { loadSim } from './load-sim.js';

await loadSim();
const { world } = await import('../game/core/world.js');
const { on } = await import('../game/core/events.js');
const { collectSummary } = await import('../game/core/registry.js');
const { startRun } = await import('../game/core/run.js');
const { runScore } = await import('../game/core/game-modes.js');
const { tick, TICK_HZ } = await import('../game/core/sim-tick.js');
const { player, handling } = await import('../game/core/player.js');
const { frameOf } = await import('../game/core/sim-input.js');
const { recordFrame, lastReplay } = await import('../game/core/replay-recorder.js');
const { generator, hashText } = await import('../game/core/course-seed.js');
const { evaderPolicy } = await import('../game/pods/bots/bot-policies.js');
const { gameToday } = await import('../game/core/game-day.js');

const BOARD = (process.argv[2] || 'http://127.0.0.1:8787').replace(/\/+$/, '');
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(BOARD)) throw new Error('local Workers only');
const day = gameToday();

let endScore = null;
on('runEnd', run => { endScore = Math.round(runScore(collectSummary(), run)); });

// An evader bot with a little seeded wobble, so each try is a different genuine run of today's course.
function play(mode, n) {
  const steer = evaderPolicy(), random = generator(hashText(`wobble|${n}`));
  startRun({ mode, day, index: -1 });
  for (let i = 0; i < 900 * TICK_HZ && !world.run.over; i++) {
    const s = steer(player), f = frameOf(s.ix + (random() - 0.5) * 0.6, s.iy + (random() - 0.5) * 0.6, handling.grip);
    recordFrame(f); tick(f);
  }
  const done = world.run.over;
  world.run = null;
  return done ? { ...lastReplay(), score: endScore } : null;
}

const post = body => fetch(`${BOARD}/score`, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:8765' }, body: JSON.stringify(body) });
async function timed(f) { const t = performance.now(); const res = await f(); const body = await res.json(); return { ms: performance.now() - t, status: res.status, body }; }
const median = a => [...a].sort((x, y) => x - y)[a.length >> 1];

for (const mode of ['flight', 'survive']) {
  let best = null;
  for (let n = 0; n < 60; n++) { const r = play(mode, n); if (r && (!best || r.ticks > best.ticks)) best = r; }
  const body = { mode, day, name: 'replay test', score: best.score, simVersion: best.simVersion, replay: best.replay };
  const base = [], full = [];
  for (let k = 0; k < 3; k++) {
    base.push((await timed(() => fetch(`${BOARD}/top?mode=${mode}&day=${day}`))).ms);
    const r = await timed(() => post(body));
    if (r.status !== 200) throw new Error(`${mode}: ${r.status} ${JSON.stringify(r.body)}`);
    full.push(r.ms);
  }
  console.log(`${mode.padEnd(7)} ${best.ticks} ticks (${(best.ticks / TICK_HZ).toFixed(0)} s), score ${best.score}: POST /score ${median(full).toFixed(0)} ms vs GET /top ${median(base).toFixed(0)} ms (wall clock, median of 3; the difference is ~ the replay)`);
  const fake = await timed(() => post({ ...body, score: best.score + 1000 }));
  const old = await timed(() => post({ ...body, simVersion: best.simVersion - 1 }));
  console.log(`         made-up score → ${fake.status} ${JSON.stringify(fake.body)}; older game → ${old.status} ${JSON.stringify(old.body)}`);
}
