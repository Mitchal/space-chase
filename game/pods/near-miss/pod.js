// Near misses: when a pursuer roars past within a hair of you, time slows for a moment and you get a "CLOSE!" bonus.
// A first candidate for run 49's "one more thing could somehow make it even more exciting": the risky quick turn
// when no rock is near ("now it's too close for a rock, then I need to shake it by a quick turn. But that is risky")
// becomes a highlight, and run 48's favourite, "dodging precisely and seeing them roar by", gets a payoff.
// Won v12's blind A/B: "I wanted to trigger the slowmo so I got a bit too greedy" (run 56), "Luring them and getting
// the slow-mo as a reward as well as a little breather is awesome" (run 58). Emits 'nearMiss' (scoring and telemetry may listen).
// Delete this folder and close dodges are just close dodges.
import { world, lurables } from '../../core/world.js';
import { on, emit } from '../../core/events.js';
import { addSystem, addDrawer, ORDER, LAYER } from '../../core/registry.js';
import { player } from '../../core/player.js';
import { dist } from '../../core/geometry.js';
import { floatText, fx } from '../../core/effects.js';

const GRAZE = 22, CLEAR = GRAZE + 16; // gap between edges that counts as a graze, and that counts as past
const SLOW_S = 0.45, SLOW_SCALE = 0.3, RING_S = 0.5;
let rings = [];

on('runStart', () => { rings = []; fx.slowmo = 0; });
on('hurt', () => { for (const e of lurables()) e.grazing = false; });

addSystem(ORDER.late, dt => {
  for (const r of rings) r.t += dt;
  rings = rings.filter(r => r.t < RING_S);
  if (!world.run) return;
  for (const e of lurables()) {
    if (e.grazed) continue;
    const gap = dist(e, player) - e.r - player.r;
    if (gap < GRAZE && !(player.inv > 0)) e.grazing = true;
    else if (e.grazing && gap > CLEAR) {
      e.grazing = false; e.grazed = true;
      fx.slowmo = SLOW_S; fx.slowScale = SLOW_SCALE;
      floatText(player.x, player.y - 26, 'CLOSE!', { col: '#7cf2c8', t: 1 });
      rings.push({ x: player.x, y: player.y, t: 0 });
      emit('nearMiss', { e });
    }
  }
});

// A ring that snaps outward from the ship, so the slow-down reads as earned, not as lag.
addDrawer(LAYER.effects, ctx => {
  for (const r of rings) {
    const k = r.t / RING_S;
    ctx.beginPath(); ctx.arc(r.x, r.y, 14 + 50 * k, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(124,242,200,${1 - k})`; ctx.lineWidth = 2; ctx.stroke();
  }
});
