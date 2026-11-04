// Chargers: slow stalkers that telegraph a straight dash (P5: one windup at a time, full aim lane).
// A dashing charger kills any other pursuer it hits.
import { world, addEntity, live, lurables, kill } from '../../core/world.js';
import { on } from '../../core/events.js';
import { addSystem, ORDER } from '../../core/registry.js';
import { player, hurt } from '../../core/player.js';
import { entryPoint } from '../../core/spawn-points.js';
import { clamp, dist, rand, rayToBox } from '../../core/geometry.js';
import { fx } from '../../core/effects.js';
import { drawChargers } from './charger-draw.js';

const WINDUP = 1.0, DASH_SPEED = 600, COLOR = '#b388ff';
let spawnT = 0;

on('arenaEnter', () => { spawnT = 0; });

addSystem(ORDER.spawn, dt => {
  const c = world.arena.def.chargers;
  if (!c) return;
  spawnT += dt * world.pressure;
  if (spawnT < c.every || world.ents.filter(e => e.type === 'charger' && !e.dead).length >= c.max) return;
  spawnT = 0;
  const pt = entryPoint(c.from);
  addEntity({ type: 'charger', lurable: true, color: COLOR, x: pt.x, y: pt.y, r: 13, state: 'approach', st: rand(1.5, 2.5), dx: 0, dy: 0, len: 0, spawn: 0.9 });
});

function stepCharger(e, dt, busy) {
  e.st -= dt;
  if (e.state === 'approach') {
    const d = dist(e, player) || 1;
    e.x += (player.x - e.x) / d * 65 * dt; e.y += (player.y - e.y) / d * 65 * dt;
    if (e.st > 0) return;
    if (busy) { e.st = 0.5; return; }
    e.state = 'windup'; e.st = WINDUP;
    e.dx = (player.x - e.x) / d; e.dy = (player.y - e.y) / d;
    e.len = Math.min(900, rayToBox(e.x, e.y, e.dx, e.dy, world.bounds));
  } else if (e.state === 'windup') {
    if (e.st <= 0) { e.state = 'dash'; e.st = 0.6; e.sx = e.x; e.sy = e.y; }
  } else if (e.state === 'dash') {
    const nx = e.x + e.dx * DASH_SPEED * dt, ny = e.y + e.dy * DASH_SPEED * dt;
    const b = world.bounds;
    e.x = clamp(nx, b.minX + e.r, b.maxX - e.r); e.y = clamp(ny, b.minY + e.r, b.maxY - e.r);
    if (e.x !== nx || e.y !== ny) { e.st = 0; fx.shake = Math.max(fx.shake, 4); }
    if (e.st <= 0) { e.state = 'rest'; e.st = 0.9; }
  } else if (e.state === 'rest' && e.st <= 0) {
    e.state = 'approach'; e.st = rand(1.4, 2.4);
  }
}

addSystem(ORDER.move, dt => {
  const busy = () => world.ents.some(o => o.type === 'charger' && !o.dead && (o.state === 'windup' || o.state === 'dash'));
  for (const e of world.ents) {
    if (e.type !== 'charger' || e.dead) continue;
    if (e.spawn > 0) { e.spawn -= dt; continue; }
    stepCharger(e, dt, busy());
  }
});

addSystem(ORDER.collide, () => {
  for (const c of live('charger')) {
    if (c.dead) continue;
    if (c.state === 'dash') {
      for (const o of lurables()) if (o !== c && !o.dead && dist(o, c) < o.r + c.r) { kill(o, 'charger'); if (o.type === 'charger') kill(c, 'charger'); }
    }
    if (!c.dead && dist(c, player) < c.r + player.r) hurt(c.state === 'dash' ? 'charger dash' : 'charger', c);
  }
});

drawChargers(WINDUP);
