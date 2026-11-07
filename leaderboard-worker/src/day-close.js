// When a day's board closes: at midnight in Sweden, when the game's day turns over for everyone (the game works out
// its day the same way: game/core/game-day.js). A run already in the air at midnight counts for the day it started,
// so it's let in if it lands within GRACE_MS. After that the day is final, and the hourly job (wrangler.toml, at half
// past) keeps its top five for good (podium-db.js).
export const TIME_ZONE = 'Europe/Stockholm';
export const GRACE_MS = 30 * 60_000;

const format = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });

// The date in Sweden at a moment (YYYY-MM-DD).
export function swedishDay(ms = Date.now()) {
  const part = Object.fromEntries(format.formatToParts(new Date(ms)).map(p => [p.type, p.value]));
  return `${part.year}-${part.month}-${part.day}`;
}

export function shiftDay(day, n) {
  const d = new Date(day + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// ms since 1970 at the midnight in Sweden that ends a day: 23:00 UTC in winter, 22:00 UTC in summer.
export function closesAt(day) {
  const next = shiftDay(day, 1);
  for (const hour of [23, 22]) {
    const ms = Date.parse(`${day}T${hour}:00:00Z`);
    if (swedishDay(ms) === next && swedishDay(ms - 1) === day) return ms;
  }
  return Date.parse(`${next}T00:00:00Z`); // not reached while Sweden is an hour or two ahead of UTC
}

// The latest day that has closed, grace included.
export const lastClosedDay = (now = Date.now()) => shiftDay(swedishDay(now - GRACE_MS), -1);

// Whether a day takes scores: closed days don't, and neither do days that haven't started in Sweden yet.
export const dayOpen = (day, now = Date.now()) => day > lastClosedDay(now) && day <= swedishDay(now);
