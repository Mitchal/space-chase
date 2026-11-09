// Math that gives the same bits in every JavaScript engine. + - * / and Math.sqrt are exact (IEEE 754, correctly
// rounded) everywhere, but Math.sin, cos, atan2, hypot, pow, exp and log are not: V8 (Chrome, Android, the leaderboard
// Worker), JavaScriptCore (iOS Safari) and SpiderMonkey (Firefox) may differ in the last bit, and a replayed run would
// drift apart. The simulation uses these instead (tools/check-determinism.js enforces it). They are fdlibm's
// algorithms, built only from exact operations, so they're accurate to about one unit in the last place too.
export const PI = Math.PI, TAU = 2 * Math.PI, HALF_PI = Math.PI / 2;

// π/2 in three parts (fdlibm): n·PIO2_1 is exact for |n| < 2^20, so the reduction loses nothing for any angle the game uses.
const INV_PIO2 = 6.36619772367581382433e-01, PIO2_1 = 1.57079632673412561417e+00, PIO2_2 = 6.07710050630396597660e-11;
const PIO2_2T = 2.02226624879595063154e-21; // π/2 − (PIO2_1 + PIO2_2)

// fdlibm __kernel_sin / __kernel_cos on [-π/4, π/4], with the reduced angle in two parts (x + y).
function kSin(x, y) {
  const z = x * x, v = z * x;
  const r = 8.33333333332248946124e-03 + z * (-1.98412698298579493134e-04 + z * (2.75573137070700676789e-06
    + z * (-2.50507602534068634195e-08 + z * 1.58969099521155010221e-10)));
  return x - ((z * (0.5 * y - v * r) - y) - v * -1.66666666666666324348e-01);
}
function kCos(x, y) {
  const z = x * x;
  const r = z * (4.16666666666666019037e-02 + z * (-1.38888888888741095749e-03 + z * (2.48015872894767294178e-05
    + z * (-2.75573143513906633035e-07 + z * (2.08757232129817482790e-09 + z * -1.13596475577881948265e-11)))));
  const hz = 0.5 * z, w = 1 - hz;
  return w + (((1 - w) - hz) + (z * r - x * y));
}

// x = n·π/2 + (hi + lo), |hi + lo| ≤ ~π/4. Returns n mod 4 and sets the parts.
const red = { hi: 0, lo: 0 };
function reduce(x) {
  const n = Math.round(x * INV_PIO2);
  const a = x - n * PIO2_1, b = n * PIO2_2, hi = a - b;
  red.hi = hi; red.lo = ((a - hi) - b) - n * PIO2_2T;
  return ((n % 4) + 4) % 4;
}

export function sin(x) {
  if (!Number.isFinite(x)) return NaN;
  if (Math.abs(x) < 0.7853981633974483) return kSin(x, 0);
  const q = reduce(x), { hi, lo } = red;
  return q === 0 ? kSin(hi, lo) : q === 1 ? kCos(hi, lo) : q === 2 ? -kSin(hi, lo) : -kCos(hi, lo);
}

export function cos(x) {
  if (!Number.isFinite(x)) return NaN;
  if (Math.abs(x) < 0.7853981633974483) return kCos(x, 0);
  const q = reduce(x), { hi, lo } = red;
  return q === 0 ? kCos(hi, lo) : q === 1 ? -kSin(hi, lo) : q === 2 ? -kCos(hi, lo) : kSin(hi, lo);
}

// fdlibm atan: four breakpoints, then an odd polynomial.
const ATAN_HI = [4.63647609000806093515e-01, 7.85398163397448278999e-01, 9.82793723247329054082e-01, 1.57079632679489655800e+00];
const ATAN_LO = [2.26987774529616870924e-17, 3.06161699786838301793e-17, 1.39033110312309984516e-17, 6.12323399573676603587e-17];
const AT = [3.33333333333329318027e-01, -1.99999999998764832476e-01, 1.42857142725034663711e-01, -1.11111104054623557880e-01,
  9.09088713343650656196e-02, -7.69187620504482999495e-02, 6.66107313738753120669e-02, -5.83357013379057348645e-02,
  4.97687799461593236017e-02, -3.65315727442169155270e-02, 1.62858201153657823623e-02];

export function atan(x) {
  if (Number.isNaN(x)) return NaN;
  const neg = x < 0;
  let a = Math.abs(x), id = -1;
  if (a >= 7.37869762948382064640e19) return neg ? -(ATAN_HI[3] + ATAN_LO[3]) : ATAN_HI[3] + ATAN_LO[3];
  if (a < 0.4375) { if (a < 7.450580596923828e-9) return x; a = x; }
  else if (a < 1.1875) {
    if (a < 0.6875) { id = 0; a = (2 * a - 1) / (2 + a); } else { id = 1; a = (a - 1) / (a + 1); }
  } else if (a < 2.4375) { id = 2; a = (a - 1.5) / (1 + 1.5 * a); } else { id = 3; a = -1 / a; }
  const z = a * a, w = z * z;
  const s1 = z * (AT[0] + w * (AT[2] + w * (AT[4] + w * (AT[6] + w * (AT[8] + w * AT[10])))));
  const s2 = w * (AT[1] + w * (AT[3] + w * (AT[5] + w * (AT[7] + w * AT[9]))));
  if (id < 0) return a - a * (s1 + s2);
  const r = ATAN_HI[id] - ((a * (s1 + s2) - ATAN_LO[id]) - a);
  return neg ? -r : r;
}

const PI_LO = 1.2246467991473531772e-16;

// The angle of (x, y), in (-π, π]. atan2(0, 0) is 0.
export function atan2(y, x) {
  if (Number.isNaN(x) || Number.isNaN(y)) return NaN;
  if (y === 0) return x < 0 || Object.is(x, -0) ? (Object.is(y, -0) ? -PI : PI) : y;
  if (x === 0) return y > 0 ? HALF_PI : -HALF_PI;
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    if (!Number.isFinite(y)) return (y > 0 ? 1 : -1) * (!Number.isFinite(x) ? (x > 0 ? PI / 4 : 3 * PI / 4) : HALF_PI);
    return x > 0 ? (y > 0 ? 0 : -0) : (y > 0 ? PI : -PI);
  }
  const z = atan(Math.abs(y / x));
  if (x > 0) return y > 0 ? z : -z;
  return y > 0 ? PI - (z - PI_LO) : (z - PI_LO) - PI;
}

// Length of (x, y). (Math.hypot is free to round differently from one engine to the next.)
export const hypot = (x, y) => Math.sqrt(x * x + y * y);

// x^1.5, for sizes drawn from a skewed random number.
export const pow15 = x => x * Math.sqrt(x);
