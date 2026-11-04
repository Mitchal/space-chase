// Juice: particles, floating text, screen shake and hit-stop. Any pod can trigger these.
import { on } from './events.js';
import { addSystem, addDrawer, ORDER, LAYER } from './registry.js';
import { rand } from './geometry.js';
import { W, H, world } from './world.js';

export const fx = { shake: 0, hitstop: 0, slowmo: 0, slowScale: 1 };
let parts = [], texts = [];

export function burst(x, y, col, n = 16) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = rand(60, 260);
    parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: rand(0.3, 0.7), col });
  }
}

// floatText sits at a world position; bigText is a screen-centred banner.
export function floatText(x, y, s, { col = '#e8ecf3', t = 0.9 } = {}) { texts.push({ x, y, s, col, t, big: false }); }
export function bigText(s, { y = H / 2 - 110, col = '#e8ecf3', t = 1.6 } = {}) { texts.push({ x: W / 2, y, s, col, t, big: true }); }
export function clearEffects() { parts = []; texts = []; }

// Every death gets a burst in the dead entity's own colour.
on('kill', ({ e }) => burst(e.x, e.y, e.color || '#ffffff'));

addSystem(ORDER.late, dt => {
  for (const q of parts) { q.t -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.92; q.vy *= 0.92; }
  parts = parts.filter(q => q.t > 0);
  for (const t of texts) { t.t -= dt; if (!t.big) t.y -= 30 * dt; }
  texts = texts.filter(t => t.t > 0);
  fx.shake *= Math.pow(0.002, dt);
}, { always: true });

addDrawer(LAYER.effects, ctx => {
  for (const q of parts) { ctx.globalAlpha = Math.min(1, q.t * 2); ctx.fillStyle = q.col; ctx.fillRect(q.x - 2, q.y - 2, 4, 4); }
  ctx.globalAlpha = 1;
});

addDrawer(LAYER.overlay, ctx => {
  ctx.textAlign = 'center';
  for (const t of texts) {
    ctx.globalAlpha = Math.min(1, t.t * 2); ctx.fillStyle = t.col;
    ctx.font = t.big ? '700 30px system-ui,sans-serif' : '700 15px system-ui,sans-serif';
    if (t.big) ctx.fillText(t.s, t.x, t.y);
    else ctx.fillText(t.s, t.x - world.cam.x, t.y - world.cam.y);
  }
  ctx.globalAlpha = 1;
});
