// Chasers as the simulation sees them: fast, wide-turning pursuers (P2). In the flight they come from behind, like
// fighters on your tail. They crash into each other, and anything deadly kills them.
import { world, addEntity, live, kill } from '../../core/world.js';
import { on } from '../../core/events.js';
import { addSystem, addSpawner, ORDER } from '../../core/registry.js';
import { player, hurt } from '../../core/player.js';
import { entryPoint } from '../../core/spawn-points.js';
import { clamp, dist, wrapAngle } from '../../core/geometry.js';
import { atan2, cos, sin } from '../../core/det-math.js';

// How long a chaser is announced (harmless and immune) before it comes in.
export const WARN_S = 1.5;
export const COLOR = '#ff7a59';
// TURN: v10 widened it to 1.8 to make up for thrusters; v11 is back to direct control, so back to 2.3 (~130px radius at
// 300px/s): "my direct control will definitely make it too easy otherwise" (2026-11-03).
const SPEED = 168, TURN = 2.3, MAX = 20;
let spawnT = 0, pending = 0, staggerT = 0;

// hold: while announced, keep its place in the play frame (where the warning is); otherwise it stays at its world point.
// speed: its own cruising speed, else the stage's.
function addChaser(pt, { hold = false, speed } = {}) {
  const f = world.focus;
  return addEntity({ type: 'chaser', lurable: true, color: COLOR, x: pt.x, y: pt.y, ...(hold && { ox: pt.x - f.x, oy: pt.y - f.y }),
    r: 10, a: atan2(player.y - pt.y, player.x - pt.x), spawn: WARN_S, speed });
}
const spawnChaser = from => addChaser(entryPoint(typeof from === 'object' ? from[world.run.variant] || from.A : from), { hold: true });

// A mode may place its own: spawn('chaser', { x, y, speed }).
addSpawner('chaser', ({ x, y, speed }) => addChaser({ x, y }, { speed }));

// A stage can set chasers.pace / chasers.extra per variant ({ A: 0.7 }): a multiplier on `every`, extra pursuers on `max`.
// A stage can set chasers.rampS: on the run's first stage, nobody comes for that long, then they trickle in one at a time (P2: a run ramps in).
on('arenaEnter', a => {
  const c = a.def.chasers, ramp = a.index === world.run.startArena ? c?.rampS || 0 : 0;
  pending = ramp ? 1 : c?.start || 0; staggerT = ramp || 0.3; spawnT = ramp + (c?.every || 0);
});

addSystem(ORDER.spawn, dt => {
  const c = world.arena.def.chasers;
  if (!c) return;
  if (pending > 0 && (staggerT -= dt) <= 0) { spawnChaser(c.from); pending--; staggerT = 0.3; }
  spawnT -= dt * world.pressure;
  if (spawnT <= 0) {
    spawnT = c.every * (c.pace?.[world.run.variant] ?? 1);
    if (world.ents.filter(e => e.type === 'chaser' && !e.dead).length < (c.max ?? MAX) + (c.extra?.[world.run.variant] ?? 0)) spawnChaser(c.from);
  }
});

// A stage can set chasers.speed. In a forward flight they must keep up with you (TIE fighters on the Falcon),
// so the only way to shed them is to make their wide turns carry them into something.
// While announced (spawning) a chaser holds its place in the frame, so the warning stays where it will come in.
// Far from you they fly CATCH_UP faster: one that falls behind closes in instead of being left to the wave (v7, v10 A).
const FAR = 450, CATCH_UP = 1.35;
addSystem(ORDER.move, dt => {
  const stageSpeed = world.arena.def.chasers?.speed ?? SPEED, b = world.bounds;
  for (const e of world.ents) {
    if (e.type !== 'chaser' || e.dead) continue;
    if (e.spawn > 0) {
      e.spawn -= dt;
      if (e.ox !== undefined) { e.x = world.focus.x + e.ox; e.y = world.focus.y + e.oy; }
      e.a = atan2(player.y - e.y, player.x - e.x);
      continue;
    }
    const want = atan2(player.y - e.y, player.x - e.x);
    e.a += clamp(wrapAngle(want - e.a), -TURN * dt, TURN * dt);
    const speed = e.speed ?? stageSpeed, v = dist(e, player) > FAR ? speed * CATCH_UP : speed;
    e.x = clamp(e.x + cos(e.a) * v * dt, b.minX + e.r, b.maxX - e.r);
    e.y = clamp(e.y + sin(e.a) * v * dt, b.minY + e.r, b.maxY - e.r);
  }
});

addSystem(ORDER.collide, () => {
  const cs = live('chaser');
  for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) {
    const a = cs[i], b = cs[j];
    if (!a.dead && !b.dead && dist(a, b) < a.r + b.r) { kill(a, 'collide'); kill(b, 'collide'); }
  }
  for (const e of cs) {
    if (!e.dead && dist(e, player) < e.r + player.r) { hurt('chaser', e); kill(e, 'player'); }
  }
});
