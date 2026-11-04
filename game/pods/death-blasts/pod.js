// Death blasts: every pursuer that dies explodes (run 45: "would be even more fun if more than one could collide at
// once, maybe if each one collides with a little explosion radius like a mine!"; then, 2026-11-03: "every death of a
// chaser should lead to it personally exploding with a blast"). The blast kills pursuers nearby, which explode in turn,
// so a crowd you gather tightly goes up together. It's small, so chains only happen when you packed them (P1).
// It never hurts you: the hero exception to P10 (run 48: "maybe their blast should not hurt me. A bit unfair perhaps
// but hey I'm the hero here"). Won v11's blind A/B (run 47, from a run without: "I would have done better if chasers
// exploded in this run"). Delete this folder and pursuers just die.
import { world, lurables, kill } from '../../core/world.js';
import { on } from '../../core/events.js';
import { addSystem, addDrawer, ORDER, LAYER } from '../../core/registry.js';
import { dist } from '../../core/geometry.js';
import { burst, fx } from '../../core/effects.js';

const RADIUS = 66, GROW_S = 0.12, LIFE_S = 0.32, COLOR = '255,122,89';
let blasts = [];

on('runStart', () => { blasts = []; });

on('kill', ({ e }) => {
  if (!world.run || !e.lurable) return;
  blasts.push({ x: e.x, y: e.y, t: 0 });
  burst(e.x, e.y, '#ff7a59', 16);
  fx.shake = Math.max(fx.shake, 5);
});

addSystem(ORDER.collide, dt => {
  for (const b of blasts) {
    b.t += dt;
    const rad = RADIUS * Math.min(1, b.t / GROW_S);
    for (const e of lurables()) if (dist(e, b) < rad + e.r) kill(e, 'blast');
  }
  blasts = blasts.filter(b => b.t < LIFE_S);
});

addDrawer(LAYER.hazards, ctx => {
  for (const b of blasts) {
    const k = b.t / LIFE_S, rad = RADIUS * Math.min(1, b.t / GROW_S);
    ctx.beginPath(); ctx.arc(b.x, b.y, rad, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${COLOR},${0.35 * (1 - k)})`; ctx.fill();
    ctx.strokeStyle = `rgba(${COLOR},${1 - k})`; ctx.lineWidth = 3; ctx.stroke();
  }
});
