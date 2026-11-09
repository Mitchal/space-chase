// The run's random numbers, all drawn from one seed so a run can be replayed exactly (core/replay-run.js). A run is
// always seeded: a daily challenge by its mode and day (core/run.js), so every run that day meets the same course;
// bots and tests by whatever they pass. Two kinds of generator:
// - courseRng('rocks', sliceX): one per piece of the course, keyed by what and where it is, so a mine you set off early
//   can't reshuffle the rocks later on;
// - simRng('spawn-points'): one stream per name for the run's other random choices (where a missile comes in), drawn
//   in the order the simulation asks, which a replay repeats exactly.
// Purely visual randomness (sparks, shake) has its own stream (core/visual-random.js) and never touches these.

let seed = 'unseeded', streams = new Map();

export function setCourseSeed(s) { seed = String(s); streams = new Map(); }
export const courseSeed = () => seed;

// A string → 32-bit hash (FNV-1a).
export function hashText(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// mulberry32: small, fast and good enough for placing rocks. → () => a number in [0, 1).
export function generator(s) {
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A random() for one piece of the course, e.g. courseRng('rocks', sliceX).
export const courseRng = (...keys) => generator(hashText([seed, ...keys].join('|')));

// The run's stream with this name (created on first use, fresh for every run).
export function simRng(name) {
  let r = streams.get(name);
  if (!r) streams.set(name, r = generator(hashText([seed, 'stream', name].join('|'))));
  return r;
}
