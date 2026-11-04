// How a charger looks, including its readable windup: a full-length aim lane and a closing ring.
import { world } from '../../core/world.js';
import { addDrawer, LAYER } from '../../core/registry.js';
import { rand } from '../../core/geometry.js';

function drawWindup(ctx, e, windup) {
  const k = 1 - e.st / windup;
  ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + e.dx * e.len, e.y + e.dy * e.len);
  ctx.strokeStyle = `rgba(179,136,255,${0.25 + 0.2 * k})`; ctx.lineWidth = e.r * 2; ctx.stroke();
  ctx.setLineDash([8, 6]); ctx.strokeStyle = `rgba(227,212,255,${0.5 + 0.5 * k})`; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 4 + 30 * (1 - k), 0, Math.PI * 2);
  ctx.strokeStyle = '#e3d4ff'; ctx.lineWidth = 2; ctx.stroke();
}

export function drawChargers(windup) {
  addDrawer(LAYER.mobs, ctx => {
    for (const e of world.ents) {
      if (e.type !== 'charger') continue;
      if (e.spawn > 0) {
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r + e.spawn * 26, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(179,136,255,.6)'; ctx.lineWidth = 2; ctx.stroke();
        continue;
      }
      if (e.state === 'windup') drawWindup(ctx, e, windup);
      if (e.state === 'dash' || (e.state === 'rest' && e.st > 0.6)) {
        ctx.beginPath(); ctx.moveTo(e.sx, e.sy); ctx.lineTo(e.x, e.y);
        ctx.strokeStyle = 'rgba(179,136,255,.45)'; ctx.lineWidth = e.r * 2; ctx.stroke();
      }
      ctx.save(); ctx.translate(e.x, e.y);
      if (e.state === 'windup') ctx.translate(rand(-2, 2), rand(-2, 2));
      ctx.fillStyle = e.state === 'dash' ? '#e3d4ff' : '#b388ff'; ctx.shadowColor = '#b388ff'; ctx.shadowBlur = e.state === 'dash' ? 22 : 10;
      ctx.fillRect(-e.r, -e.r, e.r * 2, e.r * 2); ctx.restore();
    }
  });
}
