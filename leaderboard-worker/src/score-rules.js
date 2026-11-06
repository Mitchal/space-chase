// Light sanity checks only: well-formed input and plausible numbers. Not anti-cheat.
// Each check returns the cleaned value, or null when it doesn't pass.
export const MAX_SCORE = 10_000_000; // points in Escape; milliseconds in Survive (that's 2¾ hours)
export const NAME_MAX = 16;
const DAY_MS = 86_400_000;

// A game mode's id, as the game names it ('flight', 'survive').
export const cleanMode = m => typeof m === 'string' && /^[a-z][a-z0-9-]{0,23}$/.test(m) ? m : null;

// The player's local date. Time zones keep it within a day of the date in UTC.
export function cleanDay(d, now = Date.now()) {
  if (typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  const t = Date.parse(d + 'T00:00:00Z');
  if (Number.isNaN(t)) return null;
  const todayUtc = Math.floor(now / DAY_MS) * DAY_MS;
  return Math.abs(t - todayUtc) <= DAY_MS ? d : null;
}

// Letters, digits, spaces and a little punctuation; whitespace squeezed; 1 to NAME_MAX characters.
export function cleanName(n) {
  if (typeof n !== 'string') return null;
  const s = n.replace(/[\p{C}]/gu, '').replace(/\s+/g, ' ').trim();
  return s.length >= 1 && [...s].length <= NAME_MAX ? s : null;
}

export const cleanScore = s => Number.isInteger(s) && s >= 0 && s <= MAX_SCORE ? s : null;

export const nameKey = name => name.toLocaleLowerCase('en');
