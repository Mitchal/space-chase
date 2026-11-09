// The simulation's clock: it only ever advances in fixed ticks of TICK seconds, whatever the screen's frame rate, so a
// run plays out the same on any device and again in a replay (core/replay-run.js). The live game calls tick() from its
// frame loop (core/loop.js) as real time passes; bots and replays call it as fast as they like.
// Hit-stop and slow-mo belong to the simulation too: a tick during either moves the world on by less game time.
import { world, sweepDead } from './world.js';
import { runSystems } from './registry.js';
import { fx } from './effects.js';
import { applyFrame } from './sim-input.js';

export const TICK_HZ = 60, TICK = 1 / TICK_HZ;
const HITSTOP_SCALE = 0.3;

// Advances the world by dt seconds of game time: systems in order, then sweep the dead.
export function step(dt) {
  if (!world.run) return;
  world.t += dt;
  const active = !world.run.over && !(world.transition > 0);
  runSystems(dt, active);
  sweepDead();
}

// One tick (TICK of real time), playing one input frame (core/sim-input.js).
export function tick(frame) {
  if (!world.run) return;
  applyFrame(frame);
  let dt = TICK;
  // Hit-stop: a brief slow-motion on every hit so you see what got you (P5).
  if (fx.hitstop > 0) { fx.hitstop -= TICK; dt *= HITSTOP_SCALE; }
  // Slow-mo: any pod can ask for a moment of slow time (fx.slowmo seconds at fx.slowScale speed).
  else if (fx.slowmo > 0) { fx.slowmo -= TICK; dt *= fx.slowScale; }
  step(dt);
}
