// Lasers: a telegraphed beam across your position. What they do is sim.js; here, how they look.
import './sim.js';
import { world } from '../../core/world.js';
import { addDrawer, LAYER } from '../../core/registry.js';
import { TELEGRAPH, HALF_WIDTH } from './sim.js';

addDrawer(LAYER.hazards, ctx => {
  for (const e of world.ents) {
    if (e.type !== 'laser' || e.dead) continue;
    ctx.beginPath(); ctx.moveTo(e.x - e.c * 1400, e.y - e.s * 1400); ctx.lineTo(e.x + e.c * 1400, e.y + e.s * 1400);
    if (e.tele > 0) {
      const k = 1 - e.tele / TELEGRAPH;
      ctx.setLineDash([10, 8]); ctx.strokeStyle = `rgba(255,77,109,${0.25 + 0.5 * k})`; ctx.lineWidth = 1 + 2 * k; ctx.stroke(); ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = 'rgba(255,77,109,.35)'; ctx.lineWidth = HALF_WIDTH * 2 + 10; ctx.stroke();
      ctx.strokeStyle = '#ffd0d8'; ctx.lineWidth = HALF_WIDTH * 2 - 4; ctx.stroke();
    }
  }
});
