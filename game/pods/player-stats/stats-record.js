// Your lifetime numbers, kept in this browser (or app): runs played, escapes, and per game mode the all-time best and
// the day it was set, plus your best on each of the last few weeks of days.
// v1 records from before game modes (one flat high score) were all Escape runs: they're read as the 'flight' mode's.
const KEY = 'spacechase.stats.v1', KEEP_DAYS = 35, LEGACY_MODE = 'flight';

import { gameToday, shiftDay, dayDate } from '../../core/game-day.js';

const emptyMode = () => ({ best: null, bestDay: null, days: {} });

export function loadStats() {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(KEY)); } catch {}
  const s = { runs: raw?.runs ?? 0, escapes: raw?.escapes ?? 0, modes: raw?.modes ?? {} };
  if (!raw?.modes && raw?.best != null) s.modes[LEGACY_MODE] = { best: raw.best, bestDay: raw.bestDay, days: raw.days || {} };
  return s;
}

// Adds one finished run in a mode (higher scores are better); returns the updated record.
export function noteRun(mode, score, escaped, day = gameToday()) {
  const s = loadStats(), m = s.modes[mode] ||= emptyMode();
  s.runs++;
  if (escaped) s.escapes++;
  if (m.best === null || score > m.best) { m.best = score; m.bestDay = day; }
  m.days[day] = Math.max(m.days[day] ?? 0, score);
  const keep = Object.keys(m.days).sort().slice(-KEEP_DAYS);
  m.days = Object.fromEntries(keep.map(d => [d, m.days[d]]));
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  return s;
}

// The last n game days ending today, oldest first: [{ day, date }].
export function lastDays(n = 7, today = gameToday()) {
  return Array.from({ length: n }, (_, i) => {
    const day = shiftDay(today, i - (n - 1));
    return { day, date: dayDate(day) };
  });
}
