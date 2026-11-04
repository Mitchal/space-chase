// Breathing cadence (P2 revised): pressure comes in waves, so there's room to set traps (P1).
// Spawners multiply their rate by world.pressure (0.4 = lull, ~1.3 = peak).
//
// Blind A/B for v4, about who sets the rhythm:
//   A: the clock. A 16s cycle: 5s lull, 6s build, 5s peak.
//   B: you. Calm until you take a key; each key triggers a surge that fades (P8: "set the pace myself").
// Both: once the exit opens, it's a full-pressure getaway.
import { world, W, H } from '../../core/world.js';
import { on } from '../../core/events.js';
import { addSystem, addDrawer, ORDER, LAYER } from '../../core/registry.js';

const LULL = 0.55, PEAK = 1.4, GETAWAY = 1.5, SURGE = 0.9, SURGE_DECAY = 0.12;
let surge = 0, getaway = false;

on('arenaEnter', () => { surge = 0; getaway = false; world.pressure = LULL; });
on('keyTaken', () => { if (world.run.variant === 'B') surge = Math.min(1.1, surge + SURGE); });
on('exitOpened', () => { getaway = true; });

function clockPressure(t) {
  const c = t % 16;
  return c < 5 ? LULL : c < 11 ? LULL + (PEAK - LULL) * (c - 5) / 6 : PEAK;
}

addSystem(ORDER.director, dt => {
  if (getaway) { world.pressure = GETAWAY; return; }
  if (world.run.variant === 'A') { world.pressure = clockPressure(world.arena.t); return; }
  surge = Math.max(0, surge - dt * SURGE_DECAY);
  world.pressure = LULL + surge;
});

// P5: make the rhythm readable. The arena border warms as pressure rises.
addDrawer(LAYER.floor, ctx => {
  const k = Math.max(0, Math.min(1, (world.pressure - LULL) / (GETAWAY - LULL)));
  ctx.strokeStyle = `rgba(255,${Math.round(150 - 80 * k)},${Math.round(120 - 60 * k)},${0.15 + 0.5 * k})`;
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, W - 6, H - 6);
});
