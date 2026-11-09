// The arena: a circle centred on (0, 0), about four screens of floor. Its wall hurts you and kills missiles, like the
// flight's death walls (P10: one set of rules).
import { hypot } from '../../core/det-math.js';

export const RADIUS = 850;
const MARGIN = 250; // rocks start beyond the wall and leave the world this far out

export const bounds = () => ({ minX: -RADIUS - MARGIN, maxX: RADIUS + MARGIN, minY: -RADIUS - MARGIN, maxY: RADIUS + MARGIN });

// The open floor at a given x, for anything that asks about the "lane" (bots, telemetry): the circle's chord there.
export function chordAt(x) {
  const h = Math.sqrt(Math.max(0, RADIUS * RADIUS - x * x));
  return { top: -h, bottom: h };
}

// How far o pokes out through the wall (> 0: touching it), and the outward direction.
export function wallContact(o) {
  const d = hypot(o.x, o.y) || 1;
  return { over: d + o.r - RADIUS, nx: o.x / d, ny: o.y / d };
}

// Puts o back inside the wall, moving inward at least `knock` (so you never stay pinned against it).
export function knockInside(o, { nx, ny }, knock) {
  o.x = nx * (RADIUS - o.r - 2); o.y = ny * (RADIUS - o.r - 2);
  const out = o.vx * nx + o.vy * ny, back = Math.max(Math.abs(out) * 0.6, knock);
  o.vx -= nx * (out + back); o.vy -= ny * (out + back);
}
