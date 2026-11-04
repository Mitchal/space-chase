// What the reminder pod remembers in this browser (or app): how many runs you've flown, whether we've asked yet, and
// the reminder you set ('app' = a phone notification the app schedules; 'calendar' = an event you added on the web).
const KEY = 'spacechase.reminder.v1';
export const ASK_AFTER_RUNS = 5;

const fresh = () => ({ runs: 0, asked: false, kind: null, hour: null, minute: null });

export function loadReminder() {
  try { return { ...fresh(), ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return fresh(); }
}

export function saveReminder(patch) {
  const r = { ...loadReminder(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(r)); } catch {}
  return r;
}

const pad = n => String(n).padStart(2, '0');
export const clock = (h, m) => `${pad(h)}:${pad(m)}`;

// A sensible default time: now, rounded to the quarter hour (you're playing now, so this is a time that suits you).
export function suggestedTime(now = new Date()) {
  const t = Math.round((now.getHours() * 60 + now.getMinutes()) / 15) * 15 % (24 * 60);
  return clock(Math.floor(t / 60), t % 60);
}
