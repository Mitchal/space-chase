// Rocks: the asteroid field (reference moment 2). One set of rules (P10): they smash pursuers, and they hurt you too.
import { world, addEntity, lurables, kill, W, H } from '../../core/world.js';
import { on } from '../../core/events.js';
import { addSystem, addDrawer, ORDER, LAYER } from '../../core/registry.js';
import { player, hurt } from '../../core/player.js';
import { openPoint } from '../../core/spawn-points.js';
import { dist, rand, pushOut } from '../../core/geometry.js';

const DRIFT_SPEED = 35;

on('arenaEnter', a => {
  const def = a.def.rocks;
  if (!def) return;
  for (let i = 0; i < def.count; i++) {
    const r = rand(20, 36), pt = openPoint(150, r + 30, 100), ang = Math.random() * Math.PI * 2;
    const v = def.drift ? DRIFT_SPEED : 0;
    addEntity({ type: 'rock', x: pt.x, y: pt.y, r, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, keepClear: r + 50 });
  }
});

const rocks = () => world.ents.filter(e => e.type === 'rock' && !e.dead);

addSystem(ORDER.move, dt => {
  for (const k of rocks()) {
    if (!k.vx && !k.vy) continue;
    k.x += k.vx * dt; k.y += k.vy * dt;
    if (k.x < 80 || k.x > W - 80) k.vx *= -1;
    if (k.y < 80 || k.y > H - 80) k.vy *= -1;
  }
});

addSystem(ORDER.collide, () => {
  for (const k of rocks()) {
    for (const e of lurables()) if (dist(k, e) < k.r + e.r) kill(e, 'rock');
    if (dist(k, player) < k.r + player.r) { hurt('rock', k); pushOut(player, k); }
  }
});

addDrawer(LAYER.hazards, ctx => {
  for (const k of rocks()) {
    ctx.beginPath(); ctx.arc(k.x, k.y, k.r, 0, Math.PI * 2);
    ctx.fillStyle = '#1f2533'; ctx.fill();
    // A warm rim says "dangerous", unlike v3's neutral grey.
    ctx.strokeStyle = '#c9a27a'; ctx.lineWidth = 2.5; ctx.stroke();
  }
});
