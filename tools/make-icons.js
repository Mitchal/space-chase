// Draws the app icon (the ship with pursuers on its tail) and writes PNGs, with no dependencies.
// Usage: node tools/make-icons.js   → game/icons/icon-{192,512}.png, icon-maskable-512.png, app/icon-1024.png
const fs = require('fs'), path = require('path'), zlib = require('zlib');

const BG = [11, 13, 18], SHIP = [124, 242, 200], CHASER = [255, 122, 89], BLAST = [255, 122, 89];

// Shapes in unit space (0..1, y down). Each returns coverage-free inside tests; supersampling gives anti-aliasing.
const circle = (cx, cy, r) => (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
const ring = (cx, cy, r, w) => (x, y) => Math.abs(Math.hypot(x - cx, y - cy) - r) <= w / 2;
function arrow(cx, cy, size, angle) {
  // The chaser arrowhead from the game: nose (13,0), wings (-9,±8), notch (-5,0).
  const pts = [[13, 0], [-9, 8], [-5, 0], [-9, -8]].map(([px, py]) => {
    const c = Math.cos(angle), s = Math.sin(angle);
    return [cx + (px * c - py * s) * size, cy + (px * s + py * c) * size];
  });
  return (x, y) => { // even-odd point-in-polygon
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
}

function render(size, { pad = 0 } = {}) {
  const k = 1 - pad * 2, at = v => pad + v * k; // maskable icons keep the art inside a safe zone
  const ship = { x: at(0.66), y: at(0.42), r: 0.085 * k };
  const layers = [
    { test: circle(at(0.2), at(0.78), 0.1 * k), color: BLAST, alpha: 0.18 },
    { test: ring(at(0.2), at(0.78), 0.1 * k, 0.012 * k), color: BLAST, alpha: 0.8 },
    { test: arrow(at(0.25), at(0.52), 0.0095 * k, -0.25), color: CHASER, alpha: 1 },
    { test: arrow(at(0.4), at(0.72), 0.0095 * k, -0.75), color: CHASER, alpha: 1 },
    { test: arrow(at(0.34), at(0.3), 0.008 * k, 0.12), color: CHASER, alpha: 0.85 },
    { test: circle(ship.x, ship.y, ship.r), color: SHIP, alpha: 1 },
  ];
  const SS = 4, px = Buffer.alloc(size * size * 4);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    let r = 0, g = 0, b = 0;
    for (let sj = 0; sj < SS; sj++) for (let si = 0; si < SS; si++) {
      const x = (i + (si + 0.5) / SS) / size, y = (j + (sj + 0.5) / SS) / size;
      // Glow around the ship: a soft falloff, like the game's sprite glow.
      const d = Math.hypot(x - ship.x, y - ship.y), glow = Math.max(0, 1 - (d - ship.r) / (0.16 * k)) ** 2 * 0.55;
      let c = BG.map((v, n) => v + (SHIP[n] - v) * glow);
      for (const L of layers) if (L.test(x, y)) c = c.map((v, n) => v + (L.color[n] - v) * L.alpha);
      r += c[0]; g += c[1]; b += c[2];
    }
    const o = (j * size + i) * 4, n = SS * SS;
    px[o] = r / n; px[o + 1] = g / n; px[o + 2] = b / n; px[o + 3] = 255;
  }
  return png(size, size, px);
}

// Minimal PNG encoder: RGBA, no interlace.
function png(w, h, rgba) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = buf => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const root = path.join(__dirname, '..');
const out = (rel, buf) => { const p = path.join(root, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, buf); console.log(rel, buf.length, 'bytes'); };
out('game/icons/icon-192.png', render(192));
out('game/icons/icon-512.png', render(512));
out('game/icons/icon-maskable-512.png', render(512, { pad: 0.12 }));
out('app/icon-1024.png', render(1024, { pad: 0.16 }));
