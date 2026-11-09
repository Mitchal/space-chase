// Lasers as the simulation sees them: a telegraphed beam across your position. It cuts through pursuers, mines and you
// alike. The angle of each comes from the course's seed.
import { world, addEntity, live, lurables, kill } from '../../core/world.js';
import { on } from '../../core/events.js';
import { addSystem, addSpawner, ORDER } from '../../core/registry.js';
import { player, hurt } from '../../core/player.js';
import { lineDist } from '../../core/geometry.js';
import { courseRng } from '../../core/course-seed.js';
import { cos, sin, PI } from '../../core/det-math.js';

export const TELEGRAPH = 1.2, HALF_WIDTH = 7;
const ACTIVE = 0.35;
let laserT = 0, fired = 0;

on('runStart', () => { fired = 0; });
on('arenaEnter', () => { laserT = 0; });

// A beam through (x, y) at angle `angle`, telegraphed first. A mode may fire its own: spawn('laser', { x, y, angle }).
const addLaser = ({ x, y, angle }) => addEntity({ type: 'laser', x, y, c: cos(angle), s: sin(angle), tele: TELEGRAPH, active: ACTIVE });
addSpawner('laser', addLaser);

addSystem(ORDER.spawn, dt => {
  const l = world.arena.def.lasers;
  if (!l || (laserT += dt * world.pressure) < l.every) return;
  laserT = 0;
  const angle = [0, PI / 2, PI / 4, -PI / 4][Math.floor(courseRng('laser', fired++)() * 4)];
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
