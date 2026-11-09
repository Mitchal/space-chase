// A scripted "human": a thumb on the joystick that wanders smoothly, stops, flicks back, sometimes lets go, and now
// and then switches to the arrow keys (which grip less). Plays a whole run through the same path as the live game
// (record each frame, then tick it) and returns its replay. Deterministic: the script has its own seeded dice.
import { world } from '../game/core/world.js';
import { startRun } from '../game/core/run.js';
import { tick, TICK_HZ } from '../game/core/sim-tick.js';
import { player, handling } from '../game/core/player.js';
import { frameOf } from '../game/core/sim-input.js';
import { recordFrame, lastReplay } from '../game/core/replay-recorder.js';
import { stateFingerprint } from '../game/core/replay-run.js';
import { generator, hashText } from '../game/core/course-seed.js';
import { cos, sin, atan2 } from '../game/core/det-math.js';
import { on } from '../game/core/events.js';
import { collectSummary } from '../game/core/registry.js';
import { runScore } from '../game/core/game-modes.js';

const TOUCH_GRIP = 30;

// The score as the game reckons it when the run ends (what it would post).
let endScore = null;
on('runEnd', run => { endScore = Math.round(runScore(collectSummary(), run)); });

// The steering for one tick. ahead: the direction of progress (flight: +x; survive: keep near the middle).
function scriptedSteer(state, random, mode) {
  if (state.left-- <= 0) { // pick the next gesture
    const r = random();
    state.kind = r < 0.55 ? 'drag' : r < 0.7 ? 'still' : r < 0.85 ? 'flick' : 'keys';
    state.left = Math.floor(20 + random() * 70);
    state.turn = (random() - 0.5) * 0.12;
    state.key = [[1, 0], [1, 1], [1, -1], [0, 1], [0, -1]][Math.floor(random() * 5)];
  }
  const home = mode === 'survive' ? atan2(-player.y, -player.x) : 0; // toward the middle, or ahead
  if (state.kind === 'still') return { ix: 0, iy: 0, grip: TOUCH_GRIP };
  if (state.kind === 'keys') {
    const m = Math.hypot(...state.key) || 1;
    return { ix: state.key[0] / m, iy: state.key[1] / m, grip: handling.grip };
  }
  if (state.kind === 'flick') state.a = state.a + Math.PI * 0.9 * (random() < 0.5 ? 1 : -1) * 0.05;
  state.a += state.turn + 0.04 * Math.sign(home - state.a) * (mode === 'survive' ? 1 : 0.5);
  const k = 0.55 + 0.45 * random();
  return { ix: cos(state.a) * k, iy: sin(state.a) * k, grip: TOUCH_GRIP };
}

// → { replay (core/replay-recorder.js), fingerprint, over, outcome, score (null if it never ended) } for a scripted run of mode on day (the daily seed).
export function playScripted({ mode, day, script = 'human', maxS = 300 }) {
  const random = generator(hashText(`${script}|${mode}|${day}`)), state = { left: 0, a: 0 };
  world.botPolicy = null;
  endScore = null;
  startRun({ mode, day, index: -1, variant: 'A', startArena: 0 });
  for (let i = 0; i < maxS * TICK_HZ && !world.run.over; i++) {
    const s = scriptedSteer(state, random, mode), frame = frameOf(s.ix, s.iy, s.grip);
    recordFrame(frame);
    tick(frame);
  }
  const result = { replay: lastReplay(), fingerprint: stateFingerprint(), over: world.run.over, outcome: world.run.outcome, score: endScore };
  world.run = null;
  return result;
}
