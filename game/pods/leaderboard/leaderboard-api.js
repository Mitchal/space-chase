// Talks to the leaderboard Worker (leaderboard-worker/). Every call resolves, never throws: null when the board can't
// be reached (offline, no Worker, a slow network), so the game simply carries on without it.
import { LEADERBOARD_URL } from './leaderboard-url.js';
import { deviceKey } from './device-key.js';

const TIMEOUT_MS = 6000;
// Answers the game acts on: a name the Worker won't take (422 {error: 'name'}: one it won't show; {error: 'taken'}:
// another device's), so the game asks for another; and a run played in another version of the game (409
// {error: 'update'}: its replay can't be checked, core/replay-run.js).
const ANSWERED = new Set(['name', 'taken', 'update']);
export const nameRefused = answer => answer?.error === 'name' || answer?.error === 'taken';
export const needsUpdate = answer => answer?.error === 'update';

async function call(path, init) {
  const stop = new AbortController(), timer = setTimeout(() => stop.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(LEADERBOARD_URL + path, { ...init, signal: stop.signal });
    if (res.ok) return await res.json();
    const answer = res.status === 422 || res.status === 409 ? await res.json() : null;
    return ANSWERED.has(answer?.error) ? answer : null;
  } catch { return null; } finally { clearTimeout(timer); }
}

// → { best, rank, players, top: [{name, score}] }, {error: 'name' | 'taken' | 'update'} or null. The board keeps each
// player's best of the day, and checks it afterwards by replaying the run (simVersion, replay: core/replay-recorder.js).
// Sent with this device's key, which the name belongs to (device-key.js).
// was: the name before a rename, so that day's rows move to the new name instead of staying behind.
export const postScore = ({ mode, day, name, score, simVersion, replay, was = null }) => call('/score', {
  method: 'POST',
  headers: { 'content-type': 'application/json', authorization: `Bearer ${deviceKey()}` },
  body: JSON.stringify({ mode, day, name, score, simVersion, replay, was }),
});

// → { players, top: [{name, score}] } or null.
export const fetchTop = (mode, day) => call(`/top?mode=${encodeURIComponent(mode)}&day=${encodeURIComponent(day)}`);

// The day's leader and their run's input, to watch it: → { run: {name, score, simVersion, replay} | null } or null.
export const fetchBestRun = (mode, day) => call(`/best?mode=${encodeURIComponent(mode)}&day=${encodeURIComponent(day)}`);

// A month of daily top fives, for the calendar: → { month, days: { 'YYYY-MM-DD': { final, closes?, modes: { [mode]:
// [{name, score}] best first } } } } or null. final: the day stopped taking scores; closes: when an open one will (ms).
export const fetchMonth = month => call(`/month?m=${encodeURIComponent(month)}`);

// → { trophies: [{mode, day, place}] } (places 1 to 3 of closed days, newest first) or null.
export const fetchTrophies = name => call(`/trophies?name=${encodeURIComponent(name)}`);
