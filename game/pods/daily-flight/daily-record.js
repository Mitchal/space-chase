// Today's daily flight: the date that names the course, the day's best run (score + its ghost), and the streak of
// days played in a row. Kept in this browser (or app).
const KEY = 'lure.daily.v1', STREAK_KEY = 'lure.dailyStreak.v1';

const pad = n => String(n).padStart(2, '0');
const dayOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => dayOf(new Date());
export const dayLabel = day => new Date(day + 'T12:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const dayBefore = day => { const d = new Date(day + 'T12:00'); d.setDate(d.getDate() - 1); return dayOf(d); };

const read = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
const write = (key, v) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} };

export function loadRecord(day = today()) {
  const r = read(KEY);
  return r && r.day === day ? r : { day, attempts: 0, best: null, bestRun: null, ghost: null };
}
export const saveRecord = r => write(KEY, r);

// Days in a row with at least one run. Still alive today if you played yesterday and not yet today.
export function streak(day = today()) {
  const s = read(STREAK_KEY);
  return s && (s.last === day || s.last === dayBefore(day)) ? s.days : 0;
}

export function notePlayed(day = today()) {
  const s = read(STREAK_KEY);
  if (s?.last === day) return s.days;
  const days = s?.last === dayBefore(day) ? s.days + 1 : 1;
  write(STREAK_KEY, { last: day, days });
  return days;
}
