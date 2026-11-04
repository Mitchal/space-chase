// The warning before a pursuer enters (P5: run 33, "another one came from out of nowhere near the bottom of the
// screen and killed me. Felt bad."). While a chaser is spawning (harmless and immune), a pulsing arrowhead sits on
// the edge of the screen where it will come in, pointing at you; if the entry point is on screen, a ring closes on it.
import { world, W, H } from '../../core/world.js';
import { player } from '../../core/player.js';
import { clamp } from '../../core/geometry.js';
import { glowSprite, drawSprite } from '../../core/sprites.js';
import { view } from '../../core/canvas.js';

export const WARN_S = 1.5;
const INSET = 22;

export function drawEntryWarning(ctx, e, color) {
  const c = world.cam, pulse = 0.75 + 0.25 * Math.sin(world.t * 18), s = 1.6 + 0.3 * pulse;
  const n = view.inset; // clear of notches and rounded corners
  const mx = clamp(e.x, c.x + n.left + INSET, c.x + W - n.right - INSET), my = clamp(e.y, c.y + n.top + INSET, c.y + H - n.bottom - INSET);
  const a = Math.atan2(player.y - my, player.x - mx);
  const arrow = glowSprite('entry-arrow' + color, 14, 10, color, g => {
    g.beginPath(); g.moveTo(14, 0); g.lineTo(-10, 11); g.lineTo(-4, 0); g.lineTo(-10, -11); g.closePath();
    g.fillStyle = color; g.fill();
  });
  ctx.globalAlpha = pulse; drawSprite(ctx, arrow, mx, my, a, s); ctx.globalAlpha = 1;
  if (mx === e.x && my === e.y) {
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r + (e.spawn / WARN_S) * 40, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,122,89,.7)'; ctx.lineWidth = 2; ctx.stroke();
  }
}
