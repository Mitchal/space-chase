// host-only: watching a recorded run on screen, at its real speed. The frame loop (core/loop.js) plays the recording's
// frames instead of this device's input, through the same simulation, so the run plays out exactly as it was flown
// (core/replay-run.js checks that same thing headlessly). To the pods it's a bot's run (world.botPolicy is set):
// nothing is saved, counted or posted, and no results screen comes up. A pod that shows one listens for 'watchStart'
// (the run it was given) and 'watchEnd'.
import { world } from './world.js';
import { on, emit } from './events.js';
import { startRun } from './run.js';
import { decodeReplay } from './replay-codec.js';
import { MAX_TICKS } from './replay-run.js';
import { SIM_VERSION } from './sim-version.js';

const IDLE = { x: 0, y: 0, grip: 0 }; // after the recording ends (the run is over: only the explosions play on)
const WATCH = () => ({ ix: 0, iy: 0 }); // stands in for a bot: the recording does the steering
let frames = null, at = 0;

export const watching = () => frames !== null;

// A run recorded in another version of the simulation would play out differently, so it can't be shown.
export const canWatch = run => !!run && run.simVersion === SIM_VERSION && typeof run.replay === 'string' && run.replay.length > 0;

// run: { mode, day, simVersion, replay, … } (the rest, e.g. who flew it, goes to the 'watchStart' listeners).
// Plays the daily challenge from the start, as the leaderboard checks it. → true if it started.
export function watchRun(run) {
  if (!canWatch(run)) return false;
  const recorded = decodeReplay(run.replay, MAX_TICKS);
  if (!recorded?.length) return false;
  frames = recorded; at = 0;
  world.botPolicy = WATCH;
  startRun({ mode: run.mode, day: run.day, index: -1, variant: 'A', startArena: 0 });
  emit('watchStart', run);
  return true;
}

// The next recorded frame, for the frame loop.
export const nextWatchFrame = () => at < frames.length ? frames[at++] : IDLE;

// Back to no run at all (the menu shows over an empty field, as at start-up).
export function stopWatching() {
  if (!frames) return;
  frames = null;
  world.botPolicy = null; world.run = null; world.paused = false; world.ents = [];
  emit('watchEnd');
}
// Any way back to the menu (the pause card's Quit, say) ends the watching.
on('showTitle', stopWatching);
