// The cheap checks on a posted run, done before it's stored: it was played in the simulation the checker replays
// (game/core/sim-version.js) and its replay is a well-formed one of a sensible length. Whether the replay really gives
// the score claimed is checked afterwards, outside the Worker, by a GitHub Action (../tools/run-checks/): replaying
// costs ~100 ms of CPU, the free plan allows 10 ms per request.
import { SIM_VERSION } from '../../game/core/sim-version.js';
import { decodeReplay } from '../../game/core/replay-codec.js';

// The longest run worth storing: ten minutes of ticks. An Escape run is over in under five (the death wave sees to
// that) and nobody has lasted two in Survive.
export const MAX_RUN_TICKS = 60 * 60 * 10; // 60 ticks a second (game/core/sim-tick.js)

// Bytes in a POST /score. A score is about 100 plus its replay: five minutes of a stick moving every single tick (far
// busier than a thumb) packs into ~70 kB of base64 (tests/run-shape.test.js); this leaves room for twice that.
export const MAX_BODY = 160 * 1024;

// body: the posted JSON. → { ok: true, simVersion, replay } or { ok: false, status, error, ...detail } to send back.
export function checkRunShape(body) {
  if (body?.simVersion !== SIM_VERSION) return { ok: false, status: 409, error: 'update', simVersion: SIM_VERSION };
  if (!decodeReplay(body?.replay, MAX_RUN_TICKS)) return { ok: false, status: 422, error: 'replay', why: 'unreadable' };
  return { ok: true, simVersion: SIM_VERSION, replay: body.replay };
}
