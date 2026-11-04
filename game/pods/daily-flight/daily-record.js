// Today's daily flight: the date that names the course, and the day's best run (score + its ghost), kept in this browser.
const KEY = 'lure.daily.v1';

const pad = n => String(n).padStart(2, '0');
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
export const dayLabel = day => new Date(day + 'T12:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

const fresh = day => ({ day, attempts: 0, best: null, bestRun: null, ghost: null });

export function loadRecord(day = today()) {
  let r = null;
  try { r = JSON.parse(localStorage.getItem(KEY)); } catch {}
  return r && r.day === day ? r : fresh(day);
}

export function saveRecord(r) { try { localStorage.setItem(KEY, JSON.stringify(r)); } catch {} }
