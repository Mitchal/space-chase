// Your stats on the main menu (v17, his ask: "would be cool to see some tracking and some highscore directly in the
// main menu"): each daily challenge's all-time best, runs played and escapes, and your best each day for the last
// week, per challenge. Recorded at the end of every player run (bots don't count). Delete this folder and the menu
// shows only the daily challenges.
import { world } from '../../core/world.js';
import { on } from '../../core/events.js';
import { content, collectSummary } from '../../core/registry.js';
import { modeList, runScore, formatScore } from '../../core/game-modes.js';
import { loadStats, noteRun } from './stats-record.js';
import { statsCard } from './stats-card.js';

on('runEnd', run => {
  if (world.botPolicy) return;
  noteRun(world.mode ?? 'flight', runScore(collectSummary(), run), run.outcome === 'win');
});

content.titleNotes.push(() => statsCard(loadStats(), modeList().map(m => ({ ...m, fmt: n => formatScore(n, m) }))));
