// The course's random numbers. Unseeded, every run gets a fresh course. A pod may seed it (e.g. a daily course that
// every run of the day flies), and then each piece of the course gets its own generator keyed by what and where it is,
// so a mine you set off early can't reshuffle the rocks later on.

let seed = null;

export function setCourseSeed(s) { seed = s; }
export const courseSeed = () => seed;

// A string → 32-bit hash (FNV-1a).
export function hashText(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// mulberry32: small, fast and good enough for placing rocks.
function generator(s) {
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A random() for one piece of the course, e.g. courseRng('rocks', sliceX).
export const courseRng = (...keys) => seed === null ? Math.random : generator(hashText([seed, ...keys].join('|')));
