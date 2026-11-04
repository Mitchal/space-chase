// Fixed pipeline per frame: systems in order, sweep the dead, draw. Bots call step() directly.
import { world, sweepDead } from './world.js';
import { runSystems } from './registry.js';
import { drawFrame } from './canvas.js';
import { fx } from './effects.js';
import { on, emit } from './events.js';

export function step(dt) {
  if (!world.run) return;
  world.t += dt;
  const active = !world.run.over && !(world.transition > 0);
  runSystems(dt, active);
  sweepDead();
}

on('keyPressed', code => {
  if (code !== 'KeyP' || !world.run || world.run.over) return;
  world.paused = !world.paused;
  emit('pauseChanged', world.paused);
});

let last = performance.now();
function frame(now) {
  let dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  if (world.run && !world.paused && !world.botPolicy) {
    // Hit-stop: a brief slow-motion on every hit so you see what got you (P5).
    if (fx.hitstop > 0) { fx.hitstop -= dt; dt *= 0.3; }
    // Slow-mo: any pod can ask for a moment of slow time (fx.slowmo seconds at fx.slowScale speed).
    else if (fx.slowmo > 0) { fx.slowmo -= dt; dt *= fx.slowScale; }
    step(dt);
  }
  drawFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
