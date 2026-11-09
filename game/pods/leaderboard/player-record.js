// What this player keeps for the board: the name they picked, and today's best per challenge with its replay. The best
// is what gets sent (the board keeps the higher of what it has and what it gets), so a run that didn't reach the board,
// offline or before a name was picked, still counts the next time anything is sent. The board only takes a score with
// the replay that earned it (core/replay-recorder.js), which it plays to check.
import { readSaved, writeSaved } from '../../core/storage.js';
import { gameToday } from '../../core/game-day.js';

const NAME_KEY = 'spacechase.boardName.v1', BESTS_KEY = 'spacechase.boardBests.v2';
export const NAME_MAX = 16; // the Worker allows the same

export const today = gameToday; // the game's day: it turns over at midnight in Sweden (core/game-day.js)

export const loadName = () => { const n = readSaved(NAME_KEY); return typeof n === 'string' && n ? n : null; };
export const cleanName = n => [...String(n).replace(/\s+/g, ' ').trim()].slice(0, NAME_MAX).join('');
export function saveName(n) { const name = cleanName(n); if (name) writeSaved(NAME_KEY, name); return name || null; }
// Puts back the name from before a refused one (or none: the board asks again).
export const restoreName = was => writeSaved(NAME_KEY, was || null);

function loadBests(day) {
  const b = readSaved(BESTS_KEY);
  return b && b.day === day && b.modes ? b : { day, modes: {} };
}

// Notes a run's score and its replay ({simVersion, replay}, or null: it can't be sent); returns the day's best for that
// challenge: { score, simVersion?, replay? }.
export function noteScore(mode, day, score, replay) {
  const b = loadBests(day), was = b.modes[mode];
  if (!was || score > was.score) b.modes[mode] = { score, ...(replay && { simVersion: replay.simVersion, replay: replay.replay }) };
  writeSaved(BESTS_KEY, b);
  return b.modes[mode];
}

// [{mode, score, simVersion, replay}] for every challenge played that day whose best can be sent.
export const bestsOn = day => Object.entries(loadBests(day).modes).filter(([, b]) => b.replay).map(([mode, b]) => ({ mode, ...b }));
