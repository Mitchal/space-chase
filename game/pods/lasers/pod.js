// Lasers: a telegraphed beam across your position. It cuts through pursuers, mines and you alike.
import { world, addEntity, live, lurables, kill } from '../../core/world.js';
import { on } from '../../core/events.js';
import { addSystem, addDrawer, addSpawner, ORDER, LAYER } from '../../core/registry.js';
import { player, hurt } from '../../core/player.js';
import { lineDist } from '../../core/geometry.js';
import { courseRng } from '../../core/course-seed.js';

const TELEGRAPH = 1.2, ACTIVE = 0.35, HALF_WIDTH = 7;
let laserT = 0, fired = 0;

on('runStart', () => { fired = 0; });
on('arenaEnter', () => { laserT = 0; });

// A beam through (x, y) at angle `angle`, telegraphed first. A mode may fire its own: spawn('laser', { x, y, angle }).
const addLaser = ({ x, y, angle }) => addEntity({ type: 'laser', x, y, c: Math.cos(angle), s: Math.sin(angle), tele: TELEGRAPH, active: ACTIVE });
addSpawner('laser', addLaser);

addSystem(ORDER.spawn, dt => {
  const l = world.arena.def.lasers;
  if (!l || (laserT += dt * world.pressure) < l.every) return;
  laserT = 0;
  const angle = [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4][Math.floor(courseRng('laser', fired++)() * 4)];
  addLaser({ x: player.x, y: player.y, angle });
});

addSystem(ORDER.collide, dt => {
  for (const L of live('laser')) {
    if (L.tele > 0) { L.tele -= dt; continue; }
    if ((L.active -= dt) <= 0) { L.dead = true; continue; }
    for (const e of lurables()) if (lineDist(L, e) < HALF_WIDTH + e.r) kill(e, 'laser');
    for (const e of live()) if (e.detonate && lineDist(L, e) < HALF_WIDTH + e.r) e.detonate();
    if (lineDist(L, player) < HALF_WIDTH + player.r) hurt('laser', player);
  }
});

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
