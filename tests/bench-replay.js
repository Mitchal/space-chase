// How much CPU the leaderboard spends checking a score: replaying a run (core/replay-run.js), in Node (V8, like the
// Worker). npm run bench:replay [-- --write]   (--write: save the longest genuine runs to tests/out/ for posting to a
// local Worker with tests/post-replays.js).
//  1. Genuine runs: bots on many days; the longest of each mode, replayed exactly as the Worker would.
//  2. Worst cases: an unhittable bot that dawdles just ahead of the death wave (the longest an Escape run can last:
//     the wave sees to that) and one that survives three minutes in Survive (twice an "extreme" run). Not valid replays
//     (nobody is unhittable), but they cost what the longest real runs would: same ticks, same crowds.
import fs from 'node:fs';
import { loadSim } from './load-sim.js';

await loadSim();
const { world } = await import('../game/core/world.js');
const { startRun } = await import('../game/core/run.js');
const { tick, TICK_HZ } = await import('../game/core/sim-tick.js');
const { player, handling } = await import('../game/core/player.js');
const { frameOf } = await import('../game/core/sim-input.js');
const { replayRun } = await import('../game/core/replay-run.js');
const { decodeReplay } = await import('../game/core/replay-codec.js');
const { playBot } = await import('../game/pods/bots/bot-run.js');
const { evaderPolicy } = await import('../game/pods/bots/bot-policies.js');
const { shiftDay } = await import('../game/core/game-day.js');

const ms = f => { const t = process.hrtime.bigint(); const out = f(); return { out, ms: Number(process.hrtime.bigint() - t) / 1e6 }; };
const median = a => [...a].sort((x, y) => x - y)[a.length >> 1];
const timeReplay = (rec, n = 5) => {
  const times = [];
  let r;
  for (let i = 0; i < n; i++) { const t = ms(() => replayRun({ mode: rec.mode, day: rec.day, frames: decodeReplay(rec.replay) })); times.push(t.ms); r = t.out; }
  return { r, ms: median(times) };
};

// 1. Genuine runs.
const longest = {};
for (let d = 0; d < 120; d++) for (const mode of ['flight', 'survive']) {
  const { replay } = playBot({ mode, day: shiftDay('2026-11-09', d), maxS: 900 });
  if (!longest[mode] || replay.ticks > longest[mode].ticks) longest[mode] = replay;
}
console.log('Genuine runs (longest of 120 evader-bot runs per mode), replay CPU in Node (median of 5):');
for (const rec of Object.values(longest)) {
  const { r, ms: t } = timeReplay(rec);
  console.log(`  ${rec.mode.padEnd(7)} ${rec.day}  ${rec.ticks} ticks (${(rec.ticks / TICK_HZ).toFixed(0)} s)  score ${r.score}  ${t.toFixed(1)} ms  (${(t / rec.ticks * 1000).toFixed(1)} µs/tick)  ${rec.replay.length} B`);
}
if (process.argv.includes('--write')) {
  fs.mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
  for (const rec of Object.values(longest)) fs.writeFileSync(new URL(`./out/longest-${rec.mode}.json`, import.meta.url), JSON.stringify(rec));
  console.log('  saved to tests/out/');
}

// 2. Worst cases: the same tick loop a replay runs, with the player unhittable.
function worstCase(mode, maxS) {
  const steer = evaderPolicy(), wave = () => world.ents.find(e => e.type === 'wave');
  world.botPolicy = p => {
    const s = steer(p), w = wave();
    if (w && p.x - w.x > 420) s.ix = Math.min(s.ix, 0.15); // dawdle: stay just ahead of the wave
    return s;
  };
  startRun({ mode, day: '2026-11-09', index: -1 });
  const frames = [];
  for (let i = 0; i < maxS * TICK_HZ && !world.run.over; i++) { const w = world.botPolicy(player); frames.push(frameOf(w.ix, w.iy, handling.grip)); player.inv = 1; player.hp = 2; tick(frames[i]); }
  const outcome = world.run.over ? world.run.outcome : 'timeout', ents = world.ents.length;
  world.botPolicy = null;
  const times = [];
  for (let k = 0; k < 3; k++) {
    startRun({ mode, day: '2026-11-09', index: -1 });
    times.push(ms(() => { for (let i = 0; i < frames.length && !world.run.over; i++) { player.inv = 1; player.hp = 2; tick(frames[i]); } }).ms);
  }
  world.run = null;
  const t = median(times);
  console.log(`  ${mode.padEnd(7)} ${frames.length} ticks (${(frames.length / TICK_HZ).toFixed(0)} s, ${outcome}, ${ents} entities at the end)  ${t.toFixed(1)} ms  (${(t / frames.length * 1000).toFixed(1)} µs/tick)`);
}
console.log('Worst cases (unhittable bot), the same tick loop in Node (median of 3):');
worstCase('flight', 600);
worstCase('survive', 180);
console.log('Cloudflare free plan: 10 ms CPU per request. Workers Paid: 30 s by default.');
