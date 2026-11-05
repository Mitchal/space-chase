// What comes into the arena, when and where. Every piece is drawn from the day's seed, keyed by what it is and its
// number (the 7th missile, the 12th rock), and the schedule depends only on the clock. So every run that day gets the
// same missiles and rocks at the same moments, whatever happened before, and you can practise it.
// (Lasers, if switched back on, are the one thing aimed at you: one cuts through where you are, at the day's angle.)
import { world } from '../../core/world.js';
import { spawn } from '../../core/registry.js';
import { courseRng } from '../../core/course-seed.js';
import { player } from '../../core/player.js';
import { RADIUS } from './arena-shape.js';

// How it builds up (t: seconds into the run). A good run is ~30s, a great one ~60s, an extreme one ~90s.
// v2 (his playtest, 2026-11-05: the first 10–20s were "too calm in the beginning. Definitely"): a busier start.
// v3 trial (2026-11-05: "I die too often from lasers"): no lasers at all; missiles carry the build-up instead,
// more of them, coming sooner and faster as the clock runs. Uncomment `laser` to bring lasers back.
export const PACE = {
  chaser: { first: 0.6, every: t => Math.max(0.45, 2.0 - t * 0.025), max: t => 5 + Math.floor(t / 7), speed: t => Math.min(420, 300 + t * 1.5) },
  rock: { first: 0.5, every: t => Math.max(0.5, 1.5 - t * 0.014), max: t => 14 + Math.floor(t / 4.5), field: 10 },
  // laser: { first: 4, every: t => Math.max(1.3, 4.2 - t * 0.04), crossFrom: 50 },
};
const KINDS = Object.keys(PACE);
const TAU = Math.PI * 2;

let next = {}, count = {};
const rng = (kind, n) => courseRng('survive', kind, n);
const alive = type => world.ents.filter(e => e.type === type && !e.dead).length;
const onCircle = (a, r) => ({ x: Math.cos(a) * r, y: Math.sin(a) * r });

// A missile comes in just inside the wall; never right on top of you (then it comes in opposite).
function chaser(r, t) {
  let a = r() * TAU;
  const pt = onCircle(a, RADIUS - 40);
  if (Math.hypot(pt.x - player.x, pt.y - player.y) < 320) a += Math.PI;
  if (alive('chaser') < PACE.chaser.max(t)) spawn('chaser', { ...onCircle(a, RADIUS - 40), speed: PACE.chaser.speed(t) });
}

const rockSize = r => 24 + 46 * r() ** 1.5;

// A rock drifts in from beyond the wall, across the arena through a point near the middle, and out the other side.
function rock(r, t) {
  const size = rockSize(r), from = onCircle(r() * TAU, RADIUS + size + 30), to = onCircle(r() * TAU, r() * RADIUS * 0.55);
  const speed = 70 + r() * 60 + t * 0.5, d = Math.hypot(to.x - from.x, to.y - from.y);
  if (alive('rock') < PACE.rock.max(t)) spawn('rock', { ...from, r: size, vx: (to.x - from.x) / d * speed, vy: (to.y - from.y) / d * speed });
}

function laser(r, t) {
  const angle = r() * Math.PI;
  spawn('laser', { x: player.x, y: player.y, angle });
  if (t >= PACE.laser.crossFrom) spawn('laser', { x: player.x, y: player.y, angle: angle + Math.PI / 2 });
}

const FIRE = { chaser, rock, laser };

// A fresh arena: a few rocks already drifting, clear of the middle where you start, and the clock at zero.
export function beginTimeline() {
  for (let i = 0; i < PACE.rock.field; i++) {
    const r = rng('field', i), size = rockSize(r), at = onCircle(r() * TAU, 300 + r() * (RADIUS - 420)), a = r() * TAU, s = 30 + r() * 40;
    spawn('rock', { ...at, r: size, vx: Math.cos(a) * s, vy: Math.sin(a) * s });
  }
  for (const k of KINDS) { next[k] = PACE[k].first; count[k] = 0; }
}

// Fires everything that's due by run time t. The gap to the next one comes from the scheduled time, not the frame.
export function stepTimeline(t) {
  for (const k of KINDS) {
    while (t >= next[k]) {
      const r = rng(k, count[k]++);
      FIRE[k](r, next[k]);
      next[k] += PACE[k].every(next[k]) * (0.8 + 0.4 * r());
    }
  }
}
