// Near misses: when a pursuer roars past within a hair of you, time slows for a moment and you get a "CLOSE!" bonus.
// A first candidate for run 49's "one more thing could somehow make it even more exciting": the risky quick turn
// when no rock is near ("now it's too close for a rock, then I need to shake it by a quick turn. But that is risky")
// becomes a highlight, and run 48's favourite, "dodging precisely and seeing them roar by", gets a payoff.
// Won v12's blind A/B: "I wanted to trigger the slowmo so I got a bit too greedy" (run 56), "Luring them and getting
// the slow-mo as a reward as well as a little breather is awesome" (run 58).
// Delete this folder and close dodges are just close dodges. What happens is sim.js; here, the ring you see.
import './sim.js';
import { on } from '../../core/events.js';
import { addSystem, addDrawer, ORDER, LAYER } from '../../core/registry.js';
import { player } from '../../core/player.js';

const RING_S = 0.5;
let rings = [];

on('runStart', () => { rings = []; });
on('nearMiss', () => { rings.push({ x: player.x, y: player.y, t: 0 }); });

addSystem(ORDER.late, dt => {
  for (const r of rings) r.t += dt;
  rings = rings.filter(r => r.t < RING_S);
}, { always: true });

// A ring that snaps outward from the ship, so the slow-down reads as earned, not as lag.
addDrawer(LAYER.effects, ctx => {
  for (const r of rings) {
    const k = r.t / RING_S;
    ctx.beginPath(); ctx.arc(r.x, r.y, 14 + 50 * k, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(124,242,200,${1 - k})`; ctx.lineWidth = 2; ctx.stroke();
  }
});
