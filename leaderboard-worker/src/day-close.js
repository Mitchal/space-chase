// When a day's board closes. Players send their own local date, so one date is being played somewhere on Earth for
// about 50 hours: from 10:00 UTC the day before (UTC+14) to 12:00 UTC the day after (UTC-12). A day takes scores until
// CLOSE_HOUR_UTC the day after, then it's final, and the hourly job keeps its top five for good (podium-db.js).
export const CLOSE_HOUR_UTC = 14;
const DAY_MS = 86_400_000, HOUR_MS = 3_600_000;
const isoDay = ms => new Date(ms).toISOString().slice(0, 10);

// ms since 1970 when a day stops taking scores.
export const closesAt = day => Date.parse(day + 'T00:00:00Z') + DAY_MS + CLOSE_HOUR_UTC * HOUR_MS;

// The latest day that has closed (YYYY-MM-DD).
export const lastClosedDay = (now = Date.now()) =>
  isoDay((Math.floor((now - CLOSE_HOUR_UTC * HOUR_MS) / DAY_MS) - 1) * DAY_MS);

export const dayOpen = (day, now = Date.now()) => day > lastClosedDay(now);
