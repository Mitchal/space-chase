// Mines: lure a pursuer into one and the blast takes out everything nearby, you included (P10).
// What they do is sim.js; here, how they and their blasts look.
import './sim.js';
import { world } from '../../core/world.js';
import { addDrawer, LAYER } from '../../core/registry.js';
import { player } from '../../core/player.js';
import { glowSprite, drawSprite } from '../../core/sprites.js';
import { inView } from '../../core/camera.js';
import { BLAST, HURT_RADIUS, BLAST_S, mineBlasts } from './sim.js';

const mineSprite = r => glowSprite('mine', r, 10, '#ffd166', g => {
  g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.strokeStyle = '#ffd166'; g.lineWidth = 3; g.stroke();
  g.beginPath(); g.arc(0, 0, 3, 0, Math.PI * 2); g.fillStyle = '#ffd166'; g.fill();
});

addDrawer(LAYER.hazards, ctx => {
  for (const b of mineBlasts()) {
    const k = b.t / BLAST_S, rad = BLAST * Math.min(1, b.t / 0.12);
    ctx.beginPath(); ctx.arc(b.x, b.y, rad, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,209,102,${0.35 * (1 - k)})`; ctx.fill();
    ctx.strokeStyle = `rgba(255,209,102,${1 - k})`; ctx.lineWidth = 3; ctx.stroke();
  }
  for (const m of world.ents) {
    if (m.type !== 'mine' || m.dead || !inView(m, HURT_RADIUS + 30)) continue;
    ctx.beginPath(); ctx.arc(m.x, m.y, HURT_RADIUS + player.r, 0, Math.PI * 2);
    ctx.setLineDash([3, 7]); ctx.strokeStyle = 'rgba(255,209,102,.28)'; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
    const pulse = 1 + 0.12 * Math.sin(world.t * 6 + m.x);
    drawSprite(ctx, mineSprite(m.r), m.x, m.y, 0, pulse);
  }
});
