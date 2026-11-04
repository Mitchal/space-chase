// Where new things may appear. All points are in world coordinates, relative to the current view.
// Entities with `keepClear` reserve the space around them; entities flagged `field` (rocks, mines) avoid each other.
import { world, W, H } from './world.js';
import { player } from './player.js';
import { rand, dist, clamp } from './geometry.js';

const view = () => world.cam;
const clearOfReserved = (pt, radius) => world.ents.every(e => !e.keepClear || e.dead || dist(e, pt) > e.keepClear + radius);

// How much room a point has: the smallest margin to any reserved space or to the player's buffer.
function slack(pt, minFromPlayer, radius) {
  let s = dist(pt, player) - minFromPlayer;
  for (const e of world.ents) if (e.keepClear && !e.dead) s = Math.min(s, dist(e, pt) - e.keepClear - radius);
  return s;
}

// A point just inside an edge of the view, away from the player and reserved spaces.
export function edgePoint(minFromPlayer = 220) {
  const { x: cx, y: cy } = view();
  let pt = { x: cx + 30, y: cy + 30 };
  for (let k = 0; k < 30; k++) {
    const side = Math.floor(Math.random() * 4);
    pt = side === 0 ? { x: cx + rand(30, W - 30), y: cy + 30 } : side === 1 ? { x: cx + rand(30, W - 30), y: cy + H - 30 }
       : side === 2 ? { x: cx + 30, y: cy + rand(30, H - 30) } : { x: cx + W - 30, y: cy + rand(30, H - 30) };
    if (dist(pt, player) > minFromPlayer && clearOfReserved(pt, 0)) return pt;
  }
  return pt;
}

// A point behind the player: at the left of the view (never behind world.rearX), inside the lane.
export function behindPoint(minFromPlayer = 160) {
  const x = Math.max(view().x + 20, world.rearX + 50);
  const lane = world.laneAt(x);
  let best = null, bestD = -1;
  for (let k = 0; k < 20; k++) {
    const y = clamp(player.y + rand(-H / 2, H / 2), lane.top + 30, lane.bottom - 30);
    const pt = { x, y }, d = dist(pt, player);
    if (d > minFromPlayer) return pt;
    if (d > bestD) { best = pt; bestD = d; }
  }
  return best;
}

// A point just beyond the top, bottom or leading (right) edge of the view, ahead of world.rearX. It stays inside the
// lane (its walls kill pursuers), so where a wall is on screen the point is on screen too.
// Far from the player (run 33: "came from out of nowhere near the bottom of the screen").
export function flankPoint(minFromPlayer = 380) {
  const { x: cx, y: cy } = view();
  let best = null, bestD = -1;
  for (let k = 0; k < 20; k++) {
    const side = Math.random() < 0.8 ? Math.floor(Math.random() * 2) : 2; // mostly the sides: crossing, not head-on
    let x = side === 2 ? cx + W + 40 : cx + rand(W * 0.2, W * 0.65);
    x = Math.max(x, world.rearX + 200);
    const lane = world.laneAt(x), top = Math.max(cy - 40, lane.top + 30), bottom = Math.min(cy + H + 40, lane.bottom - 30);
    const y = side === 0 ? top : side === 1 ? bottom : rand(top, bottom);
    const pt = { x, y }, d = dist(pt, player);
    if (d > minFromPlayer) return pt;
    if (d > bestD) { best = pt; bestD = d; }
  }
  return best;
}

// Where a pursuer enters: from behind, from the flanks, or from any edge of the view.
export const entryPoint = from => from === 'behind' ? behindPoint() : from === 'flank' ? flankPoint() : edgePoint();

// A point in [x0, x1] inside the lane (or up to `spill` beyond its walls), clear of other field objects by `gap`.
// Returns the roomiest try if crowded. random: the course's generator for this piece (core/course-seed.js).
export function fieldPoint(x0, x1, radius, gap = 40, spill = 0, random = Math.random) {
  const between = (a, b) => a + random() * (b - a);
  let best = null, bestSlack = -Infinity;
  for (let k = 0; k < 30; k++) {
    // The lane as it was at t = 0, so a seeded course lays out the same whenever you get there.
    const x = between(x0, x1), lane = world.laneAt(x, 0);
    if (lane.bottom - lane.top < 2 * radius + 20) continue;
    const pt = { x, y: spill ? between(lane.top - spill, lane.bottom + spill) : between(lane.top + radius + 10, lane.bottom - radius - 10) };
    let s = Infinity;
    for (const e of world.ents) if (e.field && !e.dead) s = Math.min(s, dist(e, pt) - (e.r || 0) - radius - gap);
    if (s > 0) return pt;
    if (s > bestSlack) { best = pt; bestSlack = s; }
  }
  return best;
}

// A point in the open floor of the view, at least minFromPlayer from the player and radius clear of reserved spaces.
// If the floor is too crowded, returns the roomiest candidate rather than an unchecked one.
export function openPoint(minFromPlayer, radius = 0, margin = 70) {
  const { x: cx, y: cy } = view();
  let best = null, bestSlack = -Infinity;
  for (let k = 0; k < 80; k++) {
    const pt = { x: cx + rand(margin, W - margin), y: cy + rand(margin, H - margin) };
    const s = slack(pt, minFromPlayer, radius);
    if (s > 0) return pt;
    if (s > bestSlack) { best = pt; bestSlack = s; }
  }
  return best;
}
