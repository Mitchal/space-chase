// Records the run being played: every tick's input frame from the start until the run is over (pausing records
// nothing: no ticks pass). At the end, lastReplay() is everything needed to play the same run again (core/replay-run.js)
// and what the leaderboard checks a score with.
import { world } from './world.js';
import { on } from './events.js';
import { SIM_VERSION } from './sim-version.js';
import { encodeReplay } from './replay-codec.js';

let rec = null;

on('runStart', run => {
  rec = { mode: run.mode, day: run.day, seed: run.seed, variant: run.variant, startArena: run.startArena, frames: [] };
});

// Call with each tick's frame just before the tick plays it.
export function recordFrame(frame) {
  if (rec && world.run && !world.run.over) rec.frames.push(frame);
}

// The latest run's replay: { simVersion, mode, day, seed, variant, startArena, ticks, replay } (replay: base64).
export function lastReplay() {
  if (!rec) return null;
  const { frames, ...run } = rec;
  return { simVersion: SIM_VERSION, ...run, ticks: frames.length, replay: encodeReplay(frames) };
}
