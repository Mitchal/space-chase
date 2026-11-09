// Death blasts as the simulation sees them: every pursuer that dies explodes, and the blast kills pursuers nearby,
// which explode in turn. It never hurts you (see pod.js for why).
import { world, lurables, kill } from '../../core/world.js';
import { on } from '../../core/events.js';
import { addSystem, ORDER } from '../../core/registry.js';
import { dist } from '../../core/geometry.js';
import { burst, fx } from '../../core/effects.js';

export const RADIUS = 66, GROW_S = 0.12, LIFE_S = 0.32;
let blasts = [];
export const deathBlasts = () => blasts;

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
