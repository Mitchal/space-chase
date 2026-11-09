// Checks one stored run by playing it again: the replay (the run's input, one frame per tick, game/core/replay-codec.js)
// goes through this checkout's simulation from the day's seed (game/core/replay-run.js), and the score that comes out
// must be exactly the score the player was given. The simulation is deterministic to the bit on every engine
// (tools/check-determinism.js), so an honest run always checks out.
// What it can't tell: who or what was steering. A bot or a tool-assisted run sends genuinely valid input and passes.
import { loadSim } from './load-sim.js';

await loadSim();
const { SIM_VERSION } = await import('../../game/core/sim-version.js');
const { decodeReplay } = await import('../../game/core/replay-codec.js');
const { replayRun, MAX_TICKS } = await import('../../game/core/replay-run.js');

export { SIM_VERSION };

// run: {mode, day, score, simVersion, replay} → {ok: true} or {ok: false, why}: 'unreadable', 'mode', 'unfinished'
// (the replay stops before the run ends), 'overrun' (it goes on after), 'score' (it ends with another score).
// A run from another simulation can't be judged here at all: → {skipped: 'version'}.
export function checkRun({ mode, day, score, simVersion, replay }) {
  if (simVersion !== SIM_VERSION) return { skipped: 'version' };
  const frames = decodeReplay(replay, MAX_TICKS);
  if (!frames) return { ok: false, why: 'unreadable' };
  const run = replayRun({ mode, day, frames });
  if (!run.ok) return { ok: false, why: run.error };
  return run.score === score ? { ok: true } : { ok: false, why: 'score', replayed: run.score };
}
