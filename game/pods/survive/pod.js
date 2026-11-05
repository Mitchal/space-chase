// Survive, the second daily challenge (his spec, 2026-11-05): no flying right, just a round arena about four screens
// big. Missiles and rocks come in from its edge, lasers cut across, and it builds up: more rocks, more missiles,
// lasers more often, then crossed. The day seeds all of it, so every run that day meets the same missiles, rocks and
// lasers at the same moments (timeline.js) and you can practise. The score is how long you last, to the millisecond.
// Delete this folder and the game is the Escape challenge alone.
import { world, lurables, kill } from '../../core/world.js';
import { on } from '../../core/events.js';
import { content, addSystem, addSummary, ORDER } from '../../core/registry.js';
import { addMode, addModeNote } from '../../core/game-modes.js';
import { setCourseSeed } from '../../core/course-seed.js';
import { player, hurt } from '../../core/player.js';
import { bigText } from '../../core/effects.js';
import { RADIUS, bounds, chordAt, wallContact, knockInside } from './arena-shape.js';
import { beginTimeline, stepTimeline } from './timeline.js';
import { drawArena, COLOR } from './arena-draw.js';
import { today, loadRecord, saveRecord, TIERS, tierOf, formatTime } from './survive-record.js';

const MODE = 'survive', KNOCK = 160;
let rec = loadRecord(), result = null, tierShown = 0;

const runMs = () => Math.round((world.run.endedAt ?? world.t - world.run.startedAt) * 1000);
const tries = n => `${n} ${n === 1 ? 'try' : 'tries'}`;

addMode({
  id: MODE, label: 'Survive', color: COLOR, tagline: 'Last as long as you can',
  howToPlay: [
    `Stay alive in the <b style="color:${COLOR}">arena</b> as long as you can. Its <b style="color:#ff4d6d">wall</b> hurts. It only gets busier, and every run today meets the same missiles, rocks and lasers.`,
    "Two hits and you're down.",
  ],
  score: () => runMs(),
  format: formatTime,
  setup() {
    content.arenas = [{ name: 'Arena', banner: 'SURVIVE' }];
    content.stageLabel = 'Arena';
    content.scoring = 'time';
    world.cameraFollows = true;
    world.bounds = bounds();
    world.laneAt = chordAt;
  },
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

on('runStart', () => {
  if (world.mode !== MODE) return;
  result = null; tierShown = 0;
  if (world.botPolicy) { setCourseSeed(`survive|bot|${Math.random()}`); return; }
  rec = loadRecord(today());
  setCourseSeed(`survive|${rec.day}`);
  rec.attempts++;
  saveRecord(rec);
});

on('arenaEnter', () => {
  if (world.mode !== MODE) return;
  Object.assign(player, { x: 0, y: 0, vx: 0, vy: 0 });
  beginTimeline();
});

on('runEnd', () => {
  if (world.mode !== MODE || world.botPolicy) return;
  const ms = runMs(), newBest = rec.best === null || ms > rec.best;
  if (newBest) rec.best = ms;
  saveRecord(rec);
  result = { ms, newBest };
});

addSystem(ORDER.director, () => {
  const t = world.t - world.run.startedAt;
  stepTimeline(t);
  const tier = TIERS[tierShown];
  if (tier && t >= tier.s) { tierShown++; bigText(`${tier.s}s · ${tier.name}`, { col: COLOR, t: 1.6 }); }
}, { mode: MODE });

addSystem(ORDER.collide, () => {
  const hit = wallContact(player);
  if (hit.over > 0) { hurt('wall', { x: player.x, y: player.y }); knockInside(player, hit, KNOCK); }
  for (const e of lurables()) if (wallContact(e).over > 0) kill(e, 'wall');
}, { mode: MODE });

addSummary('survive', () => world.mode !== MODE ? null
  : { day: rec.day, attempt: rec.attempts, timeMs: runMs(), best: rec.best, newBest: result?.newBest ?? null, radius: RADIUS });

drawArena(() => ({ ms: runMs(), best: rec.best }), formatTime, MODE);
