// When a daily reminder is next due: the next time the clock reads hour:minute in the player's own time zone. Worked
// out in that zone (not as a fixed UTC offset), so 18:00 stays 18:00 when summer time starts or ends.
const formats = new Map();

function formatFor(timeZone) {
  if (!formats.has(timeZone)) formats.set(timeZone, new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23',
    year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }));
  return formats.get(timeZone);
}

// The zone's name if this runtime knows it, else null.
export function cleanTimeZone(tz) {
  if (typeof tz !== 'string' || tz.length > 64) return null;
  try { formatFor(tz); return tz; } catch { return null; }
}

// The wall clock in a zone at a moment.
function clockAt(timeZone, ms) {
  const p = Object.fromEntries(formatFor(timeZone).formatToParts(new Date(ms)).map(x => [x.type, +x.value]));
  return { year: p.year, month: p.month, day: p.day, hour: p.hour, minute: p.minute, second: p.second };
}

// How far ahead of UTC the zone's clock is at a moment (ms).
function offsetAt(timeZone, ms) {
  const c = clockAt(timeZone, ms);
  return Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute, c.second) - (ms - ms % 1000);
}

// The moment a zone's clock shows a date and time. A time skipped by summer time lands an hour later.
function momentOf(timeZone, year, month, day, hour, minute) {
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  const guess = asUtc - offsetAt(timeZone, asUtc);
  return asUtc - offsetAt(timeZone, guess);
}

// ms since 1970 of the next hour:minute in timeZone after `now`.
export function nextReminderAt({ hour, minute, timeZone }, now = Date.now()) {
  const today = clockAt(timeZone, now);
  for (let ahead = 0; ahead < 3; ahead++) {
    const d = new Date(Date.UTC(today.year, today.month - 1, today.day + ahead));
    const at = momentOf(timeZone, d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), hour, minute);
    if (at > now) return at;
  }
  return now + 86_400_000; // not reached
}
