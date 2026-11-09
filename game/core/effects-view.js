// host-only: how the effects look (core/effects.js): particles, floating text and banners, and the shake dying away.
// Their randomness is visual only (core/visual-random.js); they advance with the simulation's ticks, so they slow
// down in hit-stop like everything else, but never feed back into it.
import { on } from './events.js';
import { addSystem, addDrawer, ORDER, LAYER } from './registry.js';
import { fx, showEffects } from './effects.js';
import { visualRand } from './visual-random.js';
import { H } from './world.js';
import { hudFont, view } from './canvas.js';
import { toScreen } from './screen-mapping.js';

let parts = [], texts = [];

function burst(x, y, col, n = 16) {
  for (let i = 0; i < n; i++) {
    const a = visualRand(0, Math.PI * 2), sp = visualRand(60, 260);
    parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: visualRand(0.3, 0.7), col });
  }
}

showEffects({
  burst,
  floatText(x, y, s, { col = '#e8ecf3', t = 0.9 }) { texts.push({ x, y, s, col, t, big: false }); },
  bigText(s, { y = H / 2 - 110, col = '#e8ecf3', t = 1.6 }) { texts.push({ x: null, y, s, col, t, big: true }); },
  clear() { parts = []; texts = []; },
});

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

// Centred on the screen as it is now; shrunk to fit a narrow (upright) screen.
function bigLine(ctx, t) {
  const room = view.w - view.inset.left - view.inset.right - 32, w = ctx.measureText(t.s).width;
  if (w > room) ctx.font = hudFont(30 * room / w, 700);
  ctx.fillText(t.s, view.w / 2, t.y / H * view.h);
}

addDrawer(LAYER.overlay, ctx => {
  ctx.textAlign = 'center';
  for (const t of texts) {
    ctx.globalAlpha = Math.min(1, t.t * 2); ctx.fillStyle = t.col;
    ctx.font = t.big ? hudFont(30, 700) : hudFont(15, 700);
    if (t.big) bigLine(ctx, t);
    else { const p = toScreen(t.x, t.y); ctx.fillText(t.s, p.x, p.y); }
  }
  ctx.globalAlpha = 1;
});
