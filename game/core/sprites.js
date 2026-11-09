// host-only: glowing shapes drawn once and reused. A live shadowBlur is one of the most expensive things a phone's canvas can do,
// so anything that glows is painted with its glow into a small canvas the first time, then stamped with drawImage.
const cache = new Map();
const RES = 2; // sprite pixels per game pixel: crisp at the highest render scale (core/canvas.js)

// key: a unique name; size: the shape's half-extent in game pixels; glow: blur radius; color: the glow's colour;
// paint(g): draws the shape centred on (0, 0) in game pixels.
export function glowSprite(key, size, glow, color, paint) {
  let s = cache.get(key);
  if (s) return s;
  const half = Math.ceil(size + glow * 1.5), c = document.createElement('canvas');
  c.width = c.height = half * 2 * RES;
  const g = c.getContext('2d');
  g.scale(RES, RES); g.translate(half, half);
  g.shadowColor = color; g.shadowBlur = glow * RES;
  paint(g);
  s = { canvas: c, half };
  cache.set(key, s);
  return s;
}

// Stamps a sprite centred at (x, y), optionally rotated by angle a and scaled by k.
export function drawSprite(ctx, s, x, y, a = 0, k = 1) {
  const h = s.half * k;
  if (!a) { ctx.drawImage(s.canvas, x - h, y - h, h * 2, h * 2); return; }
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  ctx.drawImage(s.canvas, -h, -h, h * 2, h * 2);
  ctx.restore();
}
