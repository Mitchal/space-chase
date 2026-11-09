// Talks to the leaderboard Worker about scores and boards (worker-call.js: every call resolves, null when the board
// can't be reached). Logging in and the account are in account-api.js.
import { call, callAsPlayer } from './worker-call.js';

// → { best, rank, players, top: [{id, name, score}] }, or {error: 'login'} (not logged in, or the login ran out:
// session-record.js has forgotten it), {error: 'no name'} (the account has no name yet), or null.
// The board keeps each player's best of the day.
export const postScore = ({ mode, day, score }) => callAsPlayer('/score', {
  method: 'POST', body: { mode, day, score },
}, [422]);

// → { players, top: [{id, name, score}] } or null.
export const fetchTop = (mode, day) => call(`/top?mode=${encodeURIComponent(mode)}&day=${encodeURIComponent(day)}`);

// A month of daily top fives, for the calendar: → { month, days: { 'YYYY-MM-DD': { final, closes?, modes: { [mode]:
// [{id, name, score}] best first } } } } or null. final: the day stopped taking scores; closes: when an open one will
// (ms). id and name are null where a deleted account placed.
export const fetchMonth = month => call(`/month?m=${encodeURIComponent(month)}`);

// → { trophies: [{mode, day, place}] } (places 1 to 3 of closed days, newest first) or null.
export const fetchTrophies = playerId => call(`/trophies?player=${encodeURIComponent(playerId)}`);
