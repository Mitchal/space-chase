// Mines: scattered through the field ahead of you. Lure a pursuer into one and the blast takes out
// everything nearby, you included (P10). Other pods can set one off by calling its detonate().
import { world, addEntity, live, lurables, kill } from '../../core/world.js';
import { on } from '../../core/events.js';
import { addSystem, addDrawer, ORDER, LAYER } from '../../core/registry.js';
import { player, hurt } from '../../core/player.js';
import { fieldPoint } from '../../core/spawn-points.js';
import { dist } from '../../core/geometry.js';
import { courseRng } from '../../core/course-seed.js';
import { glowSprite, drawSprite } from '../../core/sprites.js';
import { inView, playFrame } from '../../core/camera.js';
import { burst, fx } from '../../core/effects.js';

const BLAST = 64, HURT_RADIUS = BLAST * 0.85, SLICE = 250, LOOKAHEAD = 700;
let blasts = [], genX = 0, owed = 0;

function placeMine(x0) {
  const pt = fieldPoint(x0, x0 + SLICE, 11, 70, 0, courseRng('mines', x0, owed));
  if (!pt || dist(pt, player) < 220) return;
  const m = addEntity({ type: 'mine', x: pt.x, y: pt.y, r: 11, spawn: 0.4, fuse: -1, field: true, cull: true });
  m.detonate = () => explode(m);
}

function explode(m) {
  if (m.dead) return;
  m.dead = true;
  blasts.push({ x: m.x, y: m.y, t: 0, hurt: false });
  burst(m.x, m.y, '#ffd166', 22);
  fx.shake = Math.max(fx.shake, 7);
}

on('runStart', () => { blasts = []; });
on('arenaEnter', a => { if (a.index === world.run.startArena) { genX = player.x - 300; owed = 0; } });

addSystem(ORDER.spawn, () => {
  const def = world.arena.def.mines;
  while (genX < playFrame().right + LOOKAHEAD) {
    if (def) for (owed += def.perKpx * SLICE / 1000; owed >= 1; owed--) placeMine(genX);
    genX += SLICE;
  }
});

addSystem(ORDER.collide, dt => {
  for (const m of world.ents) if (m.type === 'mine' && m.spawn > 0) m.spawn -= dt;
  const pursuers = lurables();
  for (const m of live('mine')) {
    if (m.fuse > 0 && (m.fuse -= dt) <= 0) { explode(m); continue; }
    if (pursuers.some(e => !e.dead && dist(m, e) < m.r + e.r) || dist(m, player) < m.r + player.r) explode(m);
  }
  for (const b of blasts) {
    b.t += dt;
    const rad = BLAST * Math.min(1, b.t / 0.12);
    for (const e of lurables()) if (dist(e, b) < rad + e.r) kill(e, 'mine');
    for (const m of live('mine')) if (m.fuse < 0 && dist(m, b) < rad + m.r) m.fuse = 0.09;
    if (!b.hurt && dist(player, b) < rad * 0.85 + player.r) { b.hurt = true; hurt('mine', b); }
  }
  blasts = blasts.filter(b => b.t < 0.32);
});

const mineSprite = r => glowSprite('mine', r, 10, '#ffd166', g => {
  g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.strokeStyle = '#ffd166'; g.lineWidth = 3; g.stroke();
  g.beginPath(); g.arc(0, 0, 3, 0, Math.PI * 2); g.fillStyle = '#ffd166'; g.fill();
});

addDrawer(LAYER.hazards, ctx => {
  for (const b of blasts) {
    const k = b.t / 0.32, rad = BLAST * Math.min(1, b.t / 0.12);
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
