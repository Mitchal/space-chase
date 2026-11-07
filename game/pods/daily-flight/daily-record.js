// Today's daily flight: the date that names the course, the day's best run (score + its ghost), and the streak of
// days played in a row. Kept in this browser (or app).
const KEY = 'lure.daily.v1', STREAK_KEY = 'lure.dailyStreak.v1';

import { gameToday, shiftDay, dayDate } from '../../core/game-day.js';

export const today = gameToday; // the game's day: it turns over at midnight in Sweden (core/game-day.js)
export const dayLabel = day => dayDate(day).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const dayBefore = day => shiftDay(day, -1);

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
