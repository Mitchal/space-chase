// A run's input, one frame per tick (core/sim-input.js), packed small enough to send with a score: runs of identical
// frames, each run stored as its length and what changed from the run before, as variable-length integers, in base64.
// A long Escape run (~4 minutes, ~15,000 ticks) of busy thumb steering comes to a few tens of kilobytes.
// Bytes: FORMAT, ticks, then per run: (length·4 + changed) [, zigzag Δx, zigzag Δy if changed & 1] [, grip if changed & 2].
const FORMAT = 1;

function pushVarint(out, n) {
  while (n >= 128) { out.push((n % 128) + 128); n = Math.floor(n / 128); }
  out.push(n);
}
const zigzag = n => n >= 0 ? n * 2 : -n * 2 - 1;
const unzigzag = n => n % 2 ? -(n + 1) / 2 : n / 2;

function toBase64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode(...bytes.slice(i, i + 8192));
  return btoa(s);
}

export function encodeReplay(frames) {
  const out = [FORMAT];
  pushVarint(out, frames.length);
  let prev = { x: 0, y: 0, grip: 0 };
  for (let i = 0; i < frames.length;) {
    const f = frames[i];
    let n = 1;
    while (i + n < frames.length && frames[i + n].x === f.x && frames[i + n].y === f.y && frames[i + n].grip === f.grip) n++;
    const dir = f.x !== prev.x || f.y !== prev.y, grip = f.grip !== prev.grip;
    pushVarint(out, n * 4 + (dir ? 1 : 0) + (grip ? 2 : 0));
    if (dir) { pushVarint(out, zigzag(f.x - prev.x)); pushVarint(out, zigzag(f.y - prev.y)); }
    if (grip) pushVarint(out, f.grip);
    prev = f; i += n;
  }
  return toBase64(Uint8Array.from(out));
}

// → the frames, or null if it isn't a well-formed replay of at most maxTicks ticks (anything sent to a server is suspect).
export function decodeReplay(text, maxTicks = Infinity) {
  if (typeof text !== 'string') return null;
  let bytes;
  try { bytes = Uint8Array.from(atob(text), c => c.charCodeAt(0)); } catch { return null; }
  let at = 0;
  const varint = () => {
    let n = 0, scale = 1;
    for (;;) {
      if (at >= bytes.length || scale > 562949953421312) throw new Error('truncated');
      const b = bytes[at++];
      n += (b % 128) * scale;
      if (b < 128) return n;
      scale *= 128;
    }
  };
  try {
    if (bytes[at++] !== FORMAT) return null;
    const ticks = varint();
    if (ticks > maxTicks) return null;
    const frames = [];
    let prev = { x: 0, y: 0, grip: 0 };
    while (frames.length < ticks) {
      const head = varint(), n = Math.floor(head / 4);
      if (n < 1 || frames.length + n > ticks) return null;
      const f = { ...prev };
      if (head & 1) { f.x = prev.x + unzigzag(varint()); f.y = prev.y + unzigzag(varint()); }
      if (head & 2) f.grip = varint();
      for (let k = 0; k < n; k++) frames.push(f);
      prev = f;
    }
    return at === bytes.length ? frames : null;
  } catch { return null; }
}
