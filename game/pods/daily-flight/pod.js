// Daily flight, the main hook (meta loop 3, his pick on 2026-11-03: "simple and pure skill"). One course a day, the
// same for every run that day: the date seeds the rocks, mines and laser angles (core/course-seed.js). Every run
// starts at sector 1, today's best score is the number to beat, and the ghost of your best run flies with you
// ("I love all of it, including the ghosts"). A streak counts the days in a row you've flown.
// Delete this folder and every Escape run gets a fresh random course with checkpoints again.
import { world } from '../../core/world.js';
import { on } from '../../core/events.js';
import { content, addSystem, addDrawer, addSummary, collectSummary, ORDER, LAYER } from '../../core/registry.js';
import { addModeNote } from '../../core/game-modes.js';
import { setCourseSeed } from '../../core/course-seed.js';
import { today, loadRecord, saveRecord, streak, notePlayed } from './daily-record.js';
import { recordSample, ghostAt, drawGhost } from './ghost.js';
import { hudFont, view } from '../../core/canvas.js';

// The Escape challenge is the flight mode. The streak counts days you played either daily challenge.
const MODE = 'flight';
const inFlight = () => world.mode === MODE && !world.botPolicy;
let rec = loadRecord(), track = [], result = null, days = streak();

content.checkpoints = false;
addModeNote(MODE, () => {
  rec = loadRecord();
  return rec.best === null ? 'not flown yet today' : `best today <b>${rec.best.toLocaleString()}</b> · ${rec.attempts} ${rec.attempts === 1 ? 'try' : 'tries'}`;
});
content.dailyNotes.push(() => { days = streak(); return days > 0 ? `🔥 ${days} day${days === 1 ? '' : 's'}` : ''; });
content.resultNotes.push(() => !result ? '' : result.newBest ? 'new best today!' : `today's best ${result.best.toLocaleString()}`);

on('runStart', () => {
  result = null; track = [];
  if (world.botPolicy) { if (world.mode === MODE) setCourseSeed(null); return; }
  days = notePlayed();
  if (world.mode !== MODE) return;
  rec = loadRecord(today());
  setCourseSeed(`daily|${rec.day}`);
  rec.attempts++;
  saveRecord(rec);
});

on('runEnd', run => {
  if (!inFlight()) return;
  const score = collectSummary().score?.score ?? 0;
  const newBest = rec.best === null || score > rec.best;
  if (newBest) Object.assign(rec, { best: score, bestRun: run.index + 1, ghost: track });
  saveRecord(rec);
  result = { score, newBest, best: rec.best };
});

addSystem(ORDER.late, () => { if (!world.botPolicy) recordSample(track); }, { mode: MODE });

addSummary('daily', () => world.mode !== MODE ? null : ({ day: rec.day, attempt: rec.attempts, best: rec.best, newBest: result?.newBest ?? null, streak: days, ghostShown: !!rec.ghost }));

addDrawer(LAYER.player - 1, ctx => {
  if (world.botPolicy || !rec.ghost) return;
  const g = ghostAt(rec.ghost);
  if (g) drawGhost(ctx, g);
}, { mode: MODE });

addDrawer(LAYER.hud, ctx => {
  if (world.botPolicy || rec.best === null) return;
  ctx.font = hudFont(13); ctx.textAlign = 'right'; ctx.fillStyle = '#b9c4ff';
  ctx.fillText(`best today ${rec.best.toLocaleString()}`, view.w - view.inset.right - 16, view.inset.top + 66 * view.hud);
}, { mode: MODE });
