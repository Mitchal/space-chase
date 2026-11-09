// How the asteroid field is laid out ahead of you. Scattered, because rocks are what you lure pursuers into, so
// they must be near you (v8 blind A/B: walls left thin scatter between them, "I should have gone for the asteroids,
// tried to but they never came", run 32; scatter reached further, with 10× the rock kills).
// Sizes (run 31: "The small ones are too small I think, I want fewer and larger ones I believe"). v9's blind A/B
// (fewer and larger vs fewest and huge) tied, and he liked them ("I think I like these asteroids", run 38): settled on
// fewer and larger. `share` is the fraction of v8's count.
import { world } from '../../core/world.js';
import { player } from '../../core/player.js';
import { fieldPoint } from '../../core/spawn-points.js';
import { dist, between } from '../../core/geometry.js';
import { cos, sin, pow15, PI } from '../../core/det-math.js';

export const SPILL = 450;

const SHARE = 0.65;
export const fieldShare = () => SHARE;

// Scatter n rocks through [x0, x0 + w], this stretch all streaming one way. random: the course's generator for it.
export function scatter(x0, w, n, add, random) {
  const within = (a, b) => between(random, a, b);
  const dir = (random() < 0.5 ? 1 : -1) * PI / 2 + within(-0.6, 0.6) + (random() < 0.3 ? PI * 0.15 : 0);
  for (let i = 0; i < n; i++) {
    const r = 22 + 48 * pow15(random()), pt = fieldPoint(x0, x0 + w, r, 30, SPILL, random);
    const a = dir + within(-0.25, 0.25), s = within(70, 130);
    if (pt && dist(pt, player) > 220 + r) add({ x: pt.x, y: pt.y, r, vx: cos(a) * s, vy: sin(a) * s });
  }
}
