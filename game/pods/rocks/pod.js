// Asteroids (reference moment 2, his favourite movement): "flying about like asteroids", never static (run 17).
// They float straight through the death walls and away (run 20), so the field also exists beyond the walls.
// Scattered, fewer and larger than v8 (run 31); their size is v9's A/B (field-patterns.js).
// One set of rules (P10): they smash pursuers, and they hurt you too.
import { world, addEntity, lurables, kill } from '../../core/world.js';
import { on } from '../../core/events.js';
import { addSystem, addDrawer, addSpawner, ORDER, LAYER } from '../../core/registry.js';
import { player, hurt } from '../../core/player.js';
import { dist, pushOut } from '../../core/geometry.js';
import { inView, playFrame } from '../../core/camera.js';
import { courseRng } from '../../core/course-seed.js';
import { SPILL, scatter, fieldShare } from './field-patterns.js';

const SLICE = 250, LOOKAHEAD = 700, GONE = 900;
// v7 had too many: "too many asteroids that probably killed them off too early" (run 23). v8 had 0.6 of v7; v9 a share of that.
const V8_DENSITY = 0.6;
let genX = 0, owed = 0;
const addRock = rock => addEntity({ type: 'rock', ...rock, field: true, cull: true });
// A mode may place its own: spawn('rock', { x, y, r, vx, vy }).
addSpawner('rock', ({ x, y, r, vx, vy }) => addRock({ x, y, r, vx, vy }));

// One vertical slice: perKpx rocks per 1000px inside the lane, spread over the lane plus the spill beyond it.
function generateSlice(x0, def) {
  const lane = world.laneAt(x0), h = lane.bottom - lane.top;
  owed += def.perKpx * V8_DENSITY * fieldShare() * SLICE / 1000 * (h + 2 * SPILL) / h;
  const n = Math.floor(owed);
  owed -= n;
  scatter(x0, SLICE, n, addRock, courseRng('rocks', x0));
}

on('arenaEnter', a => { if (a.index === world.run.startArena) { genX = player.x - 300; owed = 0; } });

addSystem(ORDER.spawn, () => {
  const def = world.arena.def.rocks;
  if (!def) return;
  while (genX < playFrame().right + LOOKAHEAD) { generateSlice(genX, def); genX += SLICE; }
});

const rocks = () => world.ents.filter(e => e.type === 'rock' && !e.dead);

// Rocks drift on through the walls; once far outside the lane and heading away, or out of the world, they're gone.
const outOfWorld = (k, b = world.bounds) => k.x + k.r < b.minX || k.x - k.r > b.maxX || k.y + k.r < b.minY || k.y - k.r > b.maxY;
addSystem(ORDER.move, dt => {
  for (const k of rocks()) {
    k.x += k.vx * dt; k.y += k.vy * dt;
    const lane = world.laneAt(k.x);
    if ((k.y < lane.top - GONE && k.vy < 0) || (k.y > lane.bottom + GONE && k.vy > 0) || outOfWorld(k)) k.dead = true;
  }
});

addSystem(ORDER.collide, () => {
  const pursuers = lurables();
  for (const k of rocks()) {
    for (const e of pursuers) if (!e.dead && dist(k, e) < k.r + e.r) kill(e, 'rock');
    if (dist(k, player) < k.r + player.r) { hurt('rock', k); pushOut(player, k); }
  }
});

addDrawer(LAYER.hazards, ctx => {
  for (const k of rocks()) {
    if (!inView(k, k.r + 4)) continue;
    ctx.beginPath(); ctx.arc(k.x, k.y, k.r, 0, Math.PI * 2);
    ctx.fillStyle = '#1f2533'; ctx.fill();
    ctx.strokeStyle = '#c9a27a'; ctx.lineWidth = 2.5; ctx.stroke();
  }
});
