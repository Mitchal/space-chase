// host-only: the frame loop. Real time is fed to the simulation in fixed ticks (core/sim-tick.js): each tick takes this
// moment's input (core/input.js), records it (core/replay-recorder.js) and plays it. Then the frame is drawn, blended
// between the last two ticks (core/render-blend.js). Bots drive their runs themselves.
import { world } from './world.js';
import { on, emit } from './events.js';
import { player } from './player.js';
import { tick, TICK } from './sim-tick.js';
import { sampleFrame } from './input.js';
import { recordFrame } from './replay-recorder.js';
import { rememberPositions, blendPositions, restorePositions } from './render-blend.js';
import { placeCamera } from './camera.js';
import { drawFrame } from './canvas.js';

// At most this many ticks per frame: a slow frame (under 30 fps) slows the game rather than letting it lurch ahead,
// as it always has. A long stall (a hidden tab) is dropped, not caught up.
const MAX_TICKS_PER_FRAME = 2, MAX_FRAME_S = 0.25;

// Pauses or resumes the run in progress (no-op when there's none). Any pod may call it (a key, a button, the app going away).
export function setPaused(paused) {
  if (!world.run || world.run.over || world.paused === paused) return;
  world.paused = paused;
  emit('pauseChanged', paused);
}

on('keyPressed', code => { if (code === 'KeyP') setPaused(!world.paused); });

// One tick of live play.
export function liveTick() {
  rememberPositions();
  const frame = sampleFrame(player);
  recordFrame(frame);
  tick(frame);
}

let last = performance.now(), owed = 0;
function frame(now) {
  const elapsed = Math.min(MAX_FRAME_S, Math.max(0, now - last) / 1000);
  last = now;
  if (world.run && !world.paused && !world.botPolicy) {
    owed += elapsed;
    for (let n = 0; owed >= TICK && n < MAX_TICKS_PER_FRAME; n++) { liveTick(); owed -= TICK; }
    owed = Math.min(owed, TICK);
  } else owed = 0;
  const live = world.run && !world.botPolicy;
  if (live) blendPositions(owed / TICK);
  placeCamera();
  drawFrame();
  if (live) restorePositions();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
