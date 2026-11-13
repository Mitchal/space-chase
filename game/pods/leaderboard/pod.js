// Leaderboard (his ask, 2026-11-06: first "to have fun with my family", then to share with anyone): today's best in
// each daily challenge, per player, on the main menu and under the results. Each closed day's top five is kept for good:
// a calendar shows any day's (calendar.js), and places 1 to 3 are gold, silver and bronze trophies (trophy-record.js). Scores go to a tiny Cloudflare Worker (leaderboard-worker/) whose
// address is in leaderboard-url.js; until it's set, this pod does nothing. Bots and playtest runs never post (playtest
// runs fly A/B variants, so they aren't comparable). Delete this folder and the game has no board, as before.
import { world } from '../../core/world.js';
import { on } from '../../core/events.js';
import { content, collectSummary } from '../../core/registry.js';
import { runScore } from '../../core/game-modes.js';
import { playtest } from '../../core/mode.js';
import { lastReplay } from '../../core/replay-recorder.js';
import { LEADERBOARD_URL } from './leaderboard-url.js';
import { fetchBestRun } from './leaderboard-api.js';
import { noteScore } from './player-record.js';
import { wireMenuBoard } from './menu-board.js';
import { wireResultsBoard, boardAfterRun, forgetRun } from './results-board.js';
import { wireCalendar } from './calendar.js';
import { markSeen } from './trophy-record.js';

if (LEADERBOARD_URL) {
  wireMenuBoard();
  wireResultsBoard();
  wireCalendar();
  // The day's leader with their run, for a pod that shows it being flown (content.bestRun, core/registry.js).
  content.bestRun = async (mode, day) => (await fetchBestRun(mode, day))?.run ?? null;

  on('runStart', () => { forgetRun(); markSeen(); }); // trophy news shows until your next run

  // The day a run belongs to is the day it started (a run past midnight still counts for the course it flew). Its
  // replay goes with the score; only a daily run from the start can be checked (the Worker replays exactly that).
  on('runEnd', run => {
    if (world.botPolicy || playtest || !run.mode) return;
    const score = Math.round(runScore(collectSummary(), run)), rec = lastReplay();
    if (!Number.isFinite(score) || score < 0) return;
    const daily = rec && rec.startArena === 0 && rec.variant === 'A' && rec.seed === `${run.mode}|${run.day}`;
    boardAfterRun(run.mode, run.day, noteScore(run.mode, run.day, score, daily ? rec : null));
  });
}
