// Survive, the second daily challenge (his spec, 2026-11-05): no flying right, just a round arena about four screens
// big. Missiles and rocks come in from its edge and it builds up: more rocks, more missiles, sooner and faster (no
// lasers since v3: he died to them too often). The day seeds all of it, so every run that day meets the same missiles
// and rocks at the same moments (timeline.js) and you can practise. The score is how long you last, to the millisecond.
// Delete this folder and the game is the Escape challenge alone.
// What happens is sim.js; here, how it's presented: the menu, today's tries and best, the milestones, the results.
import './sim.js';
import { world } from '../../core/world.js';
import { on } from '../../core/events.js';
import { addSystem, addSummary, ORDER } from '../../core/registry.js';
import { addMode, addModeNote } from '../../core/game-modes.js';
import { bigText } from '../../core/effects.js';
import { RADIUS } from './arena-shape.js';
import { drawArena, COLOR } from './arena-draw.js';
import { loadRecord, saveRecord, TIERS, tierOf, formatTime } from './survive-record.js';
import { MODE, runMs } from './sim.js';

let rec = loadRecord(), result = null, tierShown = 0;

const tries = n => `${n} ${n === 1 ? 'try' : 'tries'}`;

addMode({
  id: MODE, label: 'Survive', color: COLOR, tagline: 'Last as long as you can',
  howToPlay: [
    `Stay alive in the <b style="color:${COLOR}">arena</b> as long as you can. Its <b style="color:#ff4d6d">wall</b> hurts. It only gets busier, and every run today meets the same missiles and rocks.`,
    "Two hits and you're down.",
  ],
  format: formatTime,
  result(run) {
    const ms = runMs(), tier = tierOf(ms), up = TIERS.find(t => ms < t.s * 1000), bits = [];
    if (tier) bits.push(tier.name.toLowerCase());
    if (!result?.newBest && rec.best !== null) bits.push(`today's best ${formatTime(rec.best)}`);
    if (up) bits.push(`next: ${up.name.toLowerCase()} at ${up.s}s`);
    return {
      title: tier ? `${tier.name[0]}${tier.name.slice(1).toLowerCase()} run!` : 'You survived',
      score: formatTime(ms), newBest: !!result?.newBest, line: bits.join(' · '),
      share: `SPACE CHASE survive ${rec.day}\n${formatTime(ms)}${tier ? ` · ${tier.name.toLowerCase()}` : ''}`,
    };
  },
});

addModeNote(MODE, () => {
  rec = loadRecord();
  return rec.best === null ? 'not played yet today' : `best today <b>${formatTime(rec.best)}</b> · ${tries(rec.attempts)}`;
});

on('runStart', run => {
  if (world.mode !== MODE) return;
  result = null; tierShown = 0;
  if (world.botPolicy) return;
  rec = loadRecord(run.day);
  rec.attempts++;
  saveRecord(rec);
});

on('runEnd', () => {
  if (world.mode !== MODE || world.botPolicy) return;
  const ms = runMs(), newBest = rec.best === null || ms > rec.best;
  if (newBest) rec.best = ms;
  saveRecord(rec);
  result = { ms, newBest };
});

// The milestones, as you pass them.
addSystem(ORDER.director, () => {
  const tier = TIERS[tierShown];
  if (tier && world.t - world.run.startedAt >= tier.s) { tierShown++; bigText(`${tier.s}s · ${tier.name}`, { col: COLOR, t: 1.6 }); }
}, { mode: MODE });

addSummary('survive', () => world.mode !== MODE ? null
  : { day: rec.day, attempt: rec.attempts, timeMs: runMs(), best: rec.best, newBest: result?.newBest ?? null, radius: RADIUS });

drawArena(() => ({ ms: runMs(), best: rec.best }), formatTime, MODE);
