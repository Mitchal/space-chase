// Checks a posted score by playing its run again. The game sends the run's input (one frame per tick, packed:
// game/core/replay-codec.js) and the version of the simulation it was played in; this replays it from the day's seed
// (game/core/replay-run.js) and the score that comes out is the only one that counts. It must match the score claimed.
// What it can't tell: who or what was steering. A bot or a tool-assisted run sends genuinely valid input and passes.
import './replay-sim.js';
import { SIM_VERSION } from '../../game/core/sim-version.js';
import { decodeReplay } from '../../game/core/replay-codec.js';
import { replayRun, MAX_TICKS } from '../../game/core/replay-run.js';
import { TICK_HZ } from '../../game/core/sim-tick.js';

// The longest run worth checking: ten minutes of ticks. An Escape run is over in under five (the death wave sees to
// that) and nobody has lasted two in Survive; a longer replay is refused before it costs anything to play.
export const MAX_RUN_TICKS = Math.min(MAX_TICKS, TICK_HZ * 60 * 10);

// Bytes in a POST /score. A score is about 100 plus its replay: five minutes of a stick moving every single tick (far
// busier than a thumb) packs into ~70 kB of base64 (tests/verify-run.test.js); this leaves room for twice that.
export const MAX_BODY = 160 * 1024;

// body: the posted JSON ({simVersion, replay, ...}); claimed: its score, already checked to be a plausible number.
// → { ok: true, score } or { ok: false, status, error, ...detail } to send back as it is.
export function verifyRun(body, { mode, day, claimed }) {
  if (body?.simVersion !== SIM_VERSION) return { ok: false, status: 409, error: 'update', simVersion: SIM_VERSION };
  const frames = decodeReplay(body?.replay, MAX_RUN_TICKS);
  if (!frames) return { ok: false, status: 422, error: 'replay', why: 'unreadable' };
  const run = replayRun({ mode, day, frames });
  if (!run.ok) return { ok: false, status: 422, error: 'replay', why: run.error };
  if (run.score !== claimed) {
    console.warn(`replay mismatch: ${mode} ${day} claimed ${claimed}, replayed ${run.score}`);
    return { ok: false, status: 422, error: 'replay', why: 'score' };
  }
  return { ok: true, score: run.score };
}
