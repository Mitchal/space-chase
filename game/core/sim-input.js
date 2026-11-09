// The player's input for one tick of the simulation: the only thing a live player, a bot or a replay feeds into a run.
// A frame is whole numbers so it records exactly (core/replay-codec.js):
//   x, y: the steering direction in the world's frame, in 1/STEPS of full deflection (length ≤ 1 once applied);
//   grip: how hard the ship turns toward it (1/s; touch steering grips harder than keys, see core/player.js).
// The live game turns its keys, mouse or joystick into a frame (core/input.js) and plays that frame, never the raw
// input, so what it plays and what it records are the same thing.
import { world } from './world.js';
import { clamp } from './geometry.js';

export const STEPS = 64;
export const MAX_GRIP = 255;

// A raw direction (any length; longer than 1 means full) and grip → a frame.
export function frameOf(ix, iy, grip) {
  const q = v => Math.round(clamp(Number.isFinite(v) ? v : 0, -1, 1) * STEPS) + 0; // + 0: never -0, which a replay can't tell from 0
  return { x: q(ix), y: q(iy), grip: Math.round(clamp(Number.isFinite(grip) ? grip : 0, 0, MAX_GRIP)) };
}

export const sameFrame = (a, b) => a.x === b.x && a.y === b.y && a.grip === b.grip;

// Plays a frame: world.input is what the systems read this tick.
export function applyFrame(f) {
  let ix = f.x / STEPS, iy = f.y / STEPS;
  const m = Math.sqrt(ix * ix + iy * iy);
  if (m > 1) { ix /= m; iy /= m; }
  world.input = { ix, iy, grip: f.grip };
}
