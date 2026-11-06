// Leaderboard (his ask, 2026-11-06: first "to have fun with my family", then to share with anyone): today's best in
// each daily challenge, per player, on the main menu and under the results. Scores go to a tiny Cloudflare Worker (leaderboard-worker/) whose
// address is in leaderboard-url.js; until it's set, this pod does nothing. Bots and playtest runs never post (playtest
// runs fly A/B variants, so they aren't comparable). Delete this folder and the game has no board, as before.
import { world } from '../../core/world.js';
import { on } from '../../core/events.js';
import { collectSummary } from '../../core/registry.js';
import { runScore } from '../../core/game-modes.js';
import { playtest } from '../../core/mode.js';
import { LEADERBOARD_URL } from './leaderboard-url.js';
import { today, noteScore } from './player-record.js';
import { wireMenuBoard } from './menu-board.js';
import { wireResultsBoard, boardAfterRun, forgetRun } from './results-board.js';

if (LEADERBOARD_URL) {
  wireMenuBoard();
  wireResultsBoard();

  // The day a run belongs to is the day it started (a run past midnight still counts for the course it flew).
  let day = today();
  on('runStart', () => { day = today(); forgetRun(); });

  on('runEnd', run => {
    if (world.botPolicy || playtest || !run.mode) return;
    const score = Math.round(runScore(collectSummary(), run));
    if (!Number.isFinite(score) || score < 0) return;
    boardAfterRun(run.mode, day, noteScore(run.mode, day, score));
  });
}
