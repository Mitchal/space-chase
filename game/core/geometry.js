// Pure math for positions and directions on the arena plane.

export const rand = (a, b) => a + Math.random() * (b - a);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function wrapAngle(a) {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

// Distance from point o to the infinite line through L with direction (L.c, L.s).
export const lineDist = (L, o) => Math.abs((o.x - L.x) * L.s - (o.y - L.y) * L.c);

// How far a ray from (x, y) along (dx, dy) travels before leaving box b = {minX, maxX, minY, maxY}.
export function rayToBox(x, y, dx, dy, b) {
  const tx = dx > 0 ? (b.maxX - x) / dx : dx < 0 ? (b.minX - x) / dx : Infinity;
  const ty = dy > 0 ? (b.maxY - y) / dy : dy < 0 ? (b.minY - y) / dy : Infinity;
  return Math.min(tx, ty);
}

// Moves circle o out of circle solid along the line between their centres.
export function pushOut(o, solid) {
  const d = dist(o, solid) || 1, min = o.r + solid.r;
  if (d < min) { o.x = solid.x + (o.x - solid.x) / d * min; o.y = solid.y + (o.y - solid.y) / d * min; }
}
