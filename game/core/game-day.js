// host-only: the game's day. The daily challenges and their courses, the leaderboard, streaks and daily stats all turn over at
// midnight in Sweden, for everyone (his call, 2026-11-07: "Make Swedish midnight be the time"): one day, one course and
// one board, wherever you play. The leaderboard Worker closes a day at the same moment (leaderboard-worker/src/day-close.js).
// Days are 'YYYY-MM-DD'.
export const GAME_TIME_ZONE = 'Europe/Stockholm';

let format = null;
try {
  format = new Intl.DateTimeFormat('en-CA', { timeZone: GAME_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
} catch {} // a browser without time zones: the device's own date, which is right in Sweden

const pad = n => String(n).padStart(2, '0');
const localDay = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// The game's date at a moment.
export function gameDayAt(ms = Date.now()) {
  if (!format) return localDay(new Date(ms));
  const part = Object.fromEntries(format.formatToParts(new Date(ms)).map(p => [p.type, p.value]));
  return `${part.year}-${part.month}-${part.day}`;
}
export const gameToday = () => gameDayAt();

// The day n days after day (n < 0: before).
export function shiftDay(day, n) {
  const d = new Date(day + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// A Date to show a day with (local noon, so its date reads the same in every time zone).
export const dayDate = day => new Date(day + 'T12:00');
