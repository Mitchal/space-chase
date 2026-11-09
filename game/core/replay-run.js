// Plays a recorded run again, headlessly, and says how it ended. The same simulation, the same seed and the same input
// frames give the same run to the last bit on any engine (core/det-math.js), so the score that comes out is the one the
// player earned. The leaderboard Worker uses this to check every score it's sent; the tests use it to check that the
// simulation is deterministic. Needs the simulation loaded first: core/sim-kernel.js, then each pod's sim.js.
import { world } from './world.js';
import { on } from './events.js';
import { collectSummary } from './registry.js';
import { startRun } from './run.js';
import { modeById, runScore } from './game-modes.js';
import { tick, TICK_HZ } from './sim-tick.js';
import { hashText } from './course-seed.js';
import { player } from './player.js';

export const MAX_TICKS = TICK_HZ * 60 * 30; // half an hour: far longer than any run lasts
let replaying = false, endScore = null;
const REPLAY = () => ({ ix: 0, iy: 0 }); // stands in for a bot while replaying (the frames do the steering)

// The score as the game reckons it the moment the run ends (what the game sends to the leaderboard).
on('runEnd', run => { if (replaying) endScore = Math.round(runScore(collectSummary(), run)); });

// { mode, day, seed?, frames } → { ok: true, score, outcome, ticks, fingerprint } or { ok: false, error }.
// seed: left out, the daily challenge's (the mode and day). The run must end on exactly its last frame.
export function replayRun({ mode, day, seed, frames }) {
  if (!modeById(mode)) return { ok: false, error: 'mode' };
  if (!Array.isArray(frames) || frames.length > MAX_TICKS) return { ok: false, error: 'length' };
  replaying = true; endScore = null;
  // To the host (a live page, if this runs in one) a replay is a bot's run: nothing is saved, counted or posted.
  const host = world.botPolicy;
  world.botPolicy = REPLAY;
  try {
    startRun({ mode, day, seed, index: -1, variant: 'A', startArena: 0 });
    let i = 0;
    while (i < frames.length && !world.run.over) tick(frames[i++]);
    if (!world.run.over) return { ok: false, error: 'unfinished' };
    if (i !== frames.length) return { ok: false, error: 'overrun' };
    return { ok: true, score: endScore, outcome: world.run.outcome, ticks: i, fingerprint: stateFingerprint() };
  } finally { replaying = false; world.botPolicy = host; }
}

// A hash of the world as it stands (exact, every number to the last bit), to compare two runs.
export function stateFingerprint() {
  const ents = world.ents.map(e => [e.type, e.x, e.y, e.vx ?? null, e.vy ?? null, e.a ?? null, !!e.dead]);
  const me = [player.x, player.y, player.vx, player.vy, player.hp, player.inv];
  return hashText(JSON.stringify([world.t, world.run?.outcome ?? null, world.run?.endedAt ?? null, me, ents])).toString(16);
}
