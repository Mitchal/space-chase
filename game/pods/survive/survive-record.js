// Today's Survive challenge: the date that seeds it, your tries, and your longest run today (in milliseconds).
// Kept in this browser (or app). Lifetime bests are the stats pod's job.
import { gameToday } from '../../core/game-day.js';

const KEY = 'spacechase.survive.v1';

export const today = gameToday; // the game's day: it turns over at midnight in Sweden (core/game-day.js)

export function loadRecord(day = today()) {
  try {
    const r = JSON.parse(localStorage.getItem(KEY));
    if (r && r.day === day) return r;
  } catch {}
  return { day, attempts: 0, best: null };
}

export function saveRecord(r) { try { localStorage.setItem(KEY, JSON.stringify(r)); } catch {} }

// The milestones on the way (his first guess, 2026-11-05: "half a minute… 1 minute… an extreme run is like 1.5 minutes").
export const TIERS = [
  { s: 30, name: 'GOOD' },
  { s: 60, name: 'GREAT' },
  { s: 90, name: 'EXTREME' },
];
export const tierOf = ms => [...TIERS].reverse().find(t => ms >= t.s * 1000) || null;
export const formatTime = ms => (ms / 1000).toFixed(3) + 's';
