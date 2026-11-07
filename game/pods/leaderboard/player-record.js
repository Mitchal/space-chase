// What this player keeps for the board: the name they picked, and today's best per challenge. The best is what gets
// sent (the board keeps the higher of what it has and what it gets), so a run that didn't reach the board, offline or
// before a name was picked, still counts the next time anything is sent.
import { readSaved, writeSaved } from '../../core/storage.js';
import { gameToday } from '../../core/game-day.js';

const NAME_KEY = 'spacechase.boardName.v1', BESTS_KEY = 'spacechase.boardBests.v1';
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

// Notes a run's score; returns the day's best for that challenge.
export function noteScore(mode, day, score) {
  const b = loadBests(day);
  b.modes[mode] = Math.max(b.modes[mode] ?? 0, score);
  writeSaved(BESTS_KEY, b);
  return b.modes[mode];
}

// [{mode, score}] for every challenge played that day.
export const bestsOn = day => Object.entries(loadBests(day).modes).map(([mode, score]) => ({ mode, score }));
