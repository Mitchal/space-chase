// What this player keeps for the board: today's best per challenge. The best is what gets sent (the board keeps the
// higher of what it has and what it gets), so a run that didn't reach the board, offline or before logging in, still
// counts the next time anything is sent. Who you are on the board is your account (session-record.js).
import { readSaved, writeSaved } from '../../core/storage.js';
import { gameToday } from '../../core/game-day.js';

const OLD_NAME_KEY = 'spacechase.boardName.v1', BESTS_KEY = 'spacechase.boardBests.v1';
export const NAME_MAX = 16; // the Worker allows the same

export const today = gameToday; // the game's day: it turns over at midnight in Sweden (core/game-day.js)

// The name this device typed for the board before accounts (2026-11), offered when a new account picks its name.
export const oldName = () => { const n = readSaved(OLD_NAME_KEY); return typeof n === 'string' ? n : ''; };

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
