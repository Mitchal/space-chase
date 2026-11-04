// Mines: lure a pursuer into one and the blast takes out everything nearby, you included (P10).
// Other pods can set one off by calling its detonate().
import { world, addEntity, live, lurables, kill, W, H } from '../../core/world.js';
import { on } from '../../core/events.js';
import { addSystem, addDrawer, ORDER, LAYER } from '../../core/registry.js';
import { player, hurt } from '../../core/player.js';
import { openPoint } from '../../core/spawn-points.js';
import { dist, clamp } from '../../core/geometry.js';
import { burst, fx } from '../../core/effects.js';

const BLAST = 64, HURT_RADIUS = BLAST * 0.85;
let blasts = [], mineT = 0, lastKillT = 0, lastAssistT = -99;

function placeMine(pos) {
  const pt = pos || openPoint(150, 30);
  const m = addEntity({ type: 'mine', x: pt.x, y: pt.y, r: 11, spawn: 0.8, fuse: -1, keepClear: 60 });
  m.detonate = () => explode(m);
  return m;
}

function explode(m) {
  if (m.dead) return;
  m.dead = true;
  blasts.push({ x: m.x, y: m.y, t: 0, hurt: false });
  burst(m.x, m.y, '#ffd166', 22);
  fx.shake = Math.max(fx.shake, 7);
}

on('arenaEnter', a => {
  blasts = []; mineT = 0; lastKillT = world.t; lastAssistT = -99;
  for (let i = 0; i < (a.def.mines?.count || 0); i++) placeMine();
});
on('kill', ({ cause }) => { if (cause !== 'player') lastKillT = world.t; });

addSystem(ORDER.spawn, dt => {
  const want = world.arena.def.mines?.count || 0;
  const mines = world.ents.filter(e => e.type === 'mine' && !e.dead).length;
  if ((mineT += dt) > 8 && mines < want) { mineT = 0; placeMine(); }
  // P4 dead-air guard: nothing has died for a while and there's nothing to lure into, so put a mine in the path.
  const mobs = lurables();
  if (mobs.length && mines === 0 && world.t - lastKillT > 6 && world.t - lastAssistT > 3) {
    const mob = mobs.sort((a, b) => dist(a, player) - dist(b, player))[0];
    const d = dist(mob, player) || 1, k = Math.min(0.5, Math.max(0, 1 - 130 / d));
    placeMine({ x: clamp(player.x + (mob.x - player.x) * k, 40, W - 40), y: clamp(player.y + (mob.y - player.y) * k, 40, H - 40) });
    lastAssistT = world.t;
  }
});

addSystem(ORDER.collide, dt => {
  for (const m of world.ents) if (m.type === 'mine' && m.spawn > 0) m.spawn -= dt;
  for (const m of live('mine')) {
    if (m.fuse > 0 && (m.fuse -= dt) <= 0) { explode(m); continue; }
    if (lurables().some(e => dist(m, e) < m.r + e.r) || dist(m, player) < m.r + player.r) explode(m);
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

addDrawer(LAYER.hazards, ctx => {
  for (const b of blasts) {
    const k = b.t / 0.32, rad = BLAST * Math.min(1, b.t / 0.12);
    ctx.beginPath(); ctx.arc(b.x, b.y, rad, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,209,102,${0.35 * (1 - k)})`; ctx.fill();
    ctx.strokeStyle = `rgba(255,209,102,${1 - k})`; ctx.lineWidth = 3; ctx.stroke();
  }
  for (const m of world.ents) {
    if (m.type !== 'mine' || m.dead) continue;
    if (m.spawn > 0) { ctx.beginPath(); ctx.arc(m.x, m.y, m.r + m.spawn * 26, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,209,102,.5)'; ctx.lineWidth = 2; ctx.stroke(); continue; }
    ctx.beginPath(); ctx.arc(m.x, m.y, HURT_RADIUS + player.r, 0, Math.PI * 2);
    ctx.setLineDash([3, 7]); ctx.strokeStyle = 'rgba(255,209,102,.28)'; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
    const pulse = 1 + 0.12 * Math.sin(world.t * 6 + m.x);
    ctx.beginPath(); ctx.arc(m.x, m.y, m.r * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3; ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 10; ctx.stroke(); ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(m.x, m.y, 3, 0, Math.PI * 2); ctx.fillStyle = '#ffd166'; ctx.fill();
  }
});
