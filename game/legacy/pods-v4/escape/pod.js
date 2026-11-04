// Escape (P8, his design from run 12): three keys spread out, each with a dotted line to the exit.
// The lines are the onboarding and the reminder. Take every key, the exit opens, reach it.
import { world, addEntity, W, H } from '../../core/world.js';
import { on, emit } from '../../core/events.js';
import { addSystem, ORDER } from '../../core/registry.js';
import { player } from '../../core/player.js';
import { openPoint } from '../../core/spawn-points.js';
import { dist, rand } from '../../core/geometry.js';
import { floatText, bigText, burst } from '../../core/effects.js';
import { drawEscape } from './escape-draw.js';

const PICKUP_RADIUS = 16, EXIT_RADIUS = 44;
let lastSide = -1;

function placeExit() {
  let side;
  do { side = Math.floor(Math.random() * 4); } while (side === lastSide);
  lastSide = side;
  const pos = side === 0 ? { x: rand(160, W - 160), y: 0 } : side === 1 ? { x: rand(160, W - 160), y: H }
            : side === 2 ? { x: 0, y: rand(140, H - 140) } : { x: W, y: rand(140, H - 140) };
  return addEntity({ type: 'exit', ...pos, r: 0, horiz: side < 2, open: false, keepClear: 170 });
}

on('arenaEnter', a => {
  const exit = placeExit();
  const total = a.def.keys || 0;
  for (let i = 0; i < total; i++) {
    const pt = openPoint(260, 150, 80);
    addEntity({ type: 'key', x: pt.x, y: pt.y, r: 8, taken: false, keepClear: 150 });
  }
  if (!total) exit.open = true;
});

const keys = () => world.ents.filter(e => e.type === 'key');
const exitOf = () => world.ents.find(e => e.type === 'exit');

addSystem(ORDER.rules, () => {
  const exit = exitOf();
  if (!exit) return;
  const all = keys();
  for (const k of all) {
    if (k.taken || dist(k, player) > PICKUP_RADIUS + player.r) continue;
    k.taken = true;
    const left = all.filter(o => !o.taken).length;
    burst(k.x, k.y, '#7cf2c8', 18);
    floatText(k.x, k.y - 16, left ? `KEY ${all.length - left}/${all.length}` : 'ALL KEYS', { col: '#7cf2c8', t: 1.1 });
    emit('keyTaken', { left, total: all.length });
    if (!left) { exit.open = true; bigText('EXIT OPEN', { col: '#7cf2c8', t: 1.4 }); emit('exitOpened'); }
  }
  if (exit.open && dist(exit, player) < EXIT_RADIUS) emit('arenaCleared');
});

drawEscape(keys, exitOf);
