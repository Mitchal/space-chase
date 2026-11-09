// host-only: smooth drawing between ticks. The simulation moves in fixed 60 Hz ticks (core/sim-tick.js) while screens
// refresh at 60, 90 or 120 Hz, so a frame usually falls between two ticks. Each frame is drawn with every position
// blended from where it was at the last tick to where it is now, then put back exactly: drawing never changes the run.
import { world } from './world.js';
import { player } from './player.js';

const before = new WeakMap();
let blended = [];
const movers = () => [player, world.focus, ...world.ents];

// Call before each tick: notes where everything is.
export function rememberPositions() {
  for (const o of movers()) {
    let p = before.get(o);
    if (!p) before.set(o, p = { x: 0, y: 0 });
    p.x = o.x; p.y = o.y;
  }
}

// alpha: how far into the next tick this frame is (0..1). Something born this tick is drawn where it is.
export function blendPositions(alpha) {
  blended = [];
  for (const o of movers()) {
    const p = before.get(o);
    if (!p) continue;
    blended.push(o, o.x, o.y);
    o.x = p.x + (o.x - p.x) * alpha; o.y = p.y + (o.y - p.y) * alpha;
  }
}

export function restorePositions() {
  for (let i = 0; i < blended.length; i += 3) { blended[i].x = blended[i + 1]; blended[i].y = blended[i + 2]; }
  blended = [];
}
