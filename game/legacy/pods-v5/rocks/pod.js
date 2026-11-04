// Rocks: the asteroid field (reference moment 2, his favourite movement). They stream in from ahead and
// ride the scroll. One set of rules (P10): they smash pursuers, and they hurt you too.
import { world, addEntity, lurables, kill, W, H } from '../../core/world.js';
import { on } from '../../core/events.js';
import { addSystem, addDrawer, ORDER, LAYER } from '../../core/registry.js';
import { player, hurt } from '../../core/player.js';
import { aheadPoint } from '../../core/spawn-points.js';
import { dist, rand, pushOut } from '../../core/geometry.js';

const DRIFT = 35;
let rockT = 0;

function addRock(pt, r, drift) {
  addEntity({ type: 'rock', x: pt.x, y: pt.y, r, vx: drift ? rand(-DRIFT, DRIFT) : 0, vy: drift ? rand(-DRIFT, DRIFT) : 0, scrolls: true });
}

// The field is already there when you arrive: seed the right half of the screen, clear of the player.
function seedField(def) {
  for (let i = 0; i < 5; i++) {
    const r = rand(18, 40), pt = aheadPoint(r, 50);
    pt.x = rand(W * 0.55, W - r);
    if (dist(pt, player) > 200) addRock(pt, r, def.drift);
  }
}

on('runStart', () => { rockT = 0; });
on('arenaEnter', a => { if (a.def.rocks && !world.ents.some(e => e.type === 'rock')) seedField(a.def.rocks); });

addSystem(ORDER.spawn, dt => {
  const def = world.arena.def.rocks;
  if (!def || (rockT += dt) < def.every) return;
  rockT = 0;
  const r = rand(18, 44);
  addRock(aheadPoint(r, 50), r, def.drift);
});

const rocks = () => world.ents.filter(e => e.type === 'rock' && !e.dead);

addSystem(ORDER.move, dt => {
  for (const k of rocks()) {
    k.x += k.vx * dt; k.y += k.vy * dt;
    if ((k.y < k.r && k.vy < 0) || (k.y > H - k.r && k.vy > 0)) k.vy *= -1;
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
    ctx.strokeStyle = '#c9a27a'; ctx.lineWidth = 2.5; ctx.stroke();
  }
});
