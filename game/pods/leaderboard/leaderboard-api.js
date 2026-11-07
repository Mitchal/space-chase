// Talks to the leaderboard Worker (leaderboard-worker/). Every call resolves, never throws: null when the board can't
// be reached (offline, no Worker, a slow network), so the game simply carries on without it.
import { LEADERBOARD_URL } from './leaderboard-url.js';

const TIMEOUT_MS = 6000;
const NAME_REFUSED = 422; // the Worker's answer to a name it won't show: {error: 'name'}, so the game can ask again
export const nameRefused = answer => answer?.error === 'name';

async function call(path, init) {
  const stop = new AbortController(), timer = setTimeout(() => stop.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(LEADERBOARD_URL + path, { ...init, signal: stop.signal });
    return res.ok || res.status === NAME_REFUSED ? await res.json() : null;
  } catch { return null; } finally { clearTimeout(timer); }
}

// → { best, rank, players, top: [{name, score}] }, {error: 'name'} or null. The board keeps each player's best of the day.
// was: the name before a rename, so that day's row moves to the new name instead of staying behind.
export const postScore = ({ mode, day, name, score, was = null }) => call('/score', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode, day, name, score, was }),
});

// → { players, top: [{name, score}] } or null.
export const fetchTop = (mode, day) => call(`/top?mode=${encodeURIComponent(mode)}&day=${encodeURIComponent(day)}`);

// A month of daily top fives, for the calendar: → { month, days: { 'YYYY-MM-DD': { final, closes?, modes: { [mode]:
// [{name, score}] best first } } } } or null. final: the day stopped taking scores; closes: when an open one will (ms).
export const fetchMonth = month => call(`/month?m=${encodeURIComponent(month)}`);

// → { trophies: [{mode, day, place}] } (places 1 to 3 of closed days, newest first) or null.
export const fetchTrophies = name => call(`/trophies?name=${encodeURIComponent(name)}`);
