// Your stats on the main menu (v17, his ask: "would be cool to see some tracking and some highscore directly in the
// main menu"): the all-time high score, runs flown and escapes, and your best score each day for the last week.
// Recorded at the end of every player run (bots don't count). Delete this folder and the menu shows only the daily card.
import { world } from '../../core/world.js';
import { on } from '../../core/events.js';
import { content, collectSummary } from '../../core/registry.js';
import { loadStats, noteRun } from './stats-record.js';
import { statsCard } from './stats-card.js';

on('runEnd', run => {
  if (world.botPolicy) return;
  noteRun(collectSummary().score?.score ?? 0, run.outcome === 'win');
});

content.titleNotes.push(() => statsCard(loadStats()));
