// Your lifetime numbers, kept in this browser (or app): the all-time high score and the day it was set, runs flown,
// escapes, and your best score on each of the last few weeks of days.
const KEY = 'spacechase.stats.v1', KEEP_DAYS = 35;

const pad = n => String(n).padStart(2, '0');
export const dayOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const empty = () => ({ best: null, bestDay: null, runs: 0, escapes: 0, days: {} });

export function loadStats() {
  try { return { ...empty(), ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return empty(); }
}

// Adds one finished run; returns the updated record.
export function noteRun(score, escaped, day = dayOf(new Date())) {
  const s = loadStats();
  s.runs++;
  if (escaped) s.escapes++;
  if (s.best === null || score > s.best) { s.best = score; s.bestDay = day; }
  s.days[day] = Math.max(s.days[day] ?? 0, score);
  const keep = Object.keys(s.days).sort().slice(-KEEP_DAYS);
  s.days = Object.fromEntries(keep.map(d => [d, s.days[d]]));
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  return s;
}

// The last n days ending today, oldest first: [{ day, date, best (null if not flown) }].
export function lastDays(s, n = 7, now = new Date()) {
  return Array.from({ length: n }, (_, i) => {
    const date = new Date(now); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() - (n - 1 - i));
    const day = dayOf(date);
    return { day, date, best: s.days[day] ?? null };
  });
}
