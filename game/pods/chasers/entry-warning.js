// The warning before a pursuer enters (P5: run 33, "another one came from out of nowhere near the bottom of the
// screen and killed me. Felt bad."). While a chaser is spawning (harmless and immune), a pulsing arrowhead sits on
// the edge of the screen where it will come in, pointing at you; if the entry point is on screen, a ring closes on it.
import { world, W, H } from '../../core/world.js';
import { player } from '../../core/player.js';
import { clamp } from '../../core/geometry.js';

export const WARN_S = 1.5;
const INSET = 22;

export function drawEntryWarning(ctx, e, color) {
  const c = world.cam, pulse = 0.75 + 0.25 * Math.sin(world.t * 18), s = 1.6 + 0.3 * pulse;
  const mx = clamp(e.x, c.x + INSET, c.x + W - INSET), my = clamp(e.y, c.y + INSET, c.y + H - INSET);
  const a = Math.atan2(player.y - my, player.x - mx);
  ctx.save(); ctx.translate(mx, my); ctx.rotate(a); ctx.scale(s, s); ctx.globalAlpha = pulse;
  ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-10, 11); ctx.lineTo(-4, 0); ctx.lineTo(-10, -11); ctx.closePath();
  ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 16; ctx.fill(); ctx.restore();
  if (mx === e.x && my === e.y) {
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r + (e.spawn / WARN_S) * 40, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,122,89,.7)'; ctx.lineWidth = 2; ctx.stroke();
  }
}
