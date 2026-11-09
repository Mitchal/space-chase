// Mines as the simulation sees them: scattered through the field ahead of you from the course's seed. Lure a pursuer
// into one and the blast takes out everything nearby, you included (P10). Other pods can set one off by calling its
// detonate().
import { world, addEntity, live, lurables, kill } from '../../core/world.js';
import { on } from '../../core/events.js';
import { addSystem, ORDER } from '../../core/registry.js';
import { player, hurt } from '../../core/player.js';
import { fieldPoint } from '../../core/spawn-points.js';
import { dist } from '../../core/geometry.js';
import { courseRng } from '../../core/course-seed.js';
import { playFrame } from '../../core/focus.js';
import { burst, fx } from '../../core/effects.js';

export const BLAST = 64, HURT_RADIUS = BLAST * 0.85, BLAST_S = 0.32;
const SLICE = 250, LOOKAHEAD = 700;
let blasts = [], genX = 0, owed = 0;
export const mineBlasts = () => blasts;

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
  blasts = blasts.filter(b => b.t < BLAST_S);
});
