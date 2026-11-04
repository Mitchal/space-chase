// Daily flight, the main hook (meta loop 3, his pick on 2026-11-03: "simple and pure skill"). One course a day, the
// same for every run that day: the date seeds the rocks, mines and laser angles (core/course-seed.js). Every run
// starts at sector 1, today's best score is the number to beat, and the ghost of your best run flies with you
// ("I love all of it, including the ghosts"). A streak counts the days in a row you've flown.
// Delete this folder and every run gets a fresh random course with checkpoints again.
import { world, W } from '../../core/world.js';
import { on } from '../../core/events.js';
import { content, addSystem, addDrawer, addSummary, collectSummary, ORDER, LAYER } from '../../core/registry.js';
import { setCourseSeed } from '../../core/course-seed.js';
import { today, dayLabel, loadRecord, saveRecord, streak, notePlayed } from './daily-record.js';
import { recordSample, ghostAt, drawGhost } from './ghost.js';

let rec = loadRecord(), track = [], result = null, days = streak();

content.checkpoints = false;
content.titleNotes.push(() => {
  rec = loadRecord(); days = streak();
  const best = rec.best === null ? 'Not flown yet today' : `Today's best <b>${rec.best.toLocaleString()}</b> · ${rec.attempts} ${rec.attempts === 1 ? 'try' : 'tries'}`;
  const run = days > 0 ? ` · 🔥 ${days} day${days === 1 ? '' : 's'}` : '';
  return `<div class="daily"><div class="daily-head">DAILY CHALLENGE · ${dayLabel(rec.day).toUpperCase()}</div>
    <div>One course for everyone today. Beat your best; your ghost flies with you.</div>
    <div class="daily-best">${best}${run}</div></div>`;
});
content.resultNotes.push(() => !result ? '' : result.newBest ? 'new best today!' : `today's best ${result.best.toLocaleString()}`);

on('runStart', () => {
  result = null; track = [];
  if (world.botPolicy) { setCourseSeed(null); return; }
  rec = loadRecord(today());
  setCourseSeed(`daily|${rec.day}`);
  rec.attempts++;
  saveRecord(rec);
  days = notePlayed(rec.day);
});

on('runEnd', run => {
  if (world.botPolicy) return;
  const score = collectSummary().score?.score ?? 0;
  const newBest = rec.best === null || score > rec.best;
  if (newBest) Object.assign(rec, { best: score, bestRun: run.index + 1, ghost: track });
  saveRecord(rec);
  result = { score, newBest, best: rec.best };
});

addSystem(ORDER.late, () => { if (!world.botPolicy) recordSample(track); });

addSummary('daily', () => ({ day: rec.day, attempt: rec.attempts, best: rec.best, newBest: result?.newBest ?? null, streak: days, ghostShown: !!rec.ghost }));

addDrawer(LAYER.player - 1, ctx => {
  if (world.botPolicy || !rec.ghost) return;
  const g = ghostAt(rec.ghost);
  if (g) drawGhost(ctx, g);
});

addDrawer(LAYER.hud, ctx => {
  if (world.botPolicy || rec.best === null) return;
  ctx.font = '600 13px system-ui,sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = '#b9c4ff';
  ctx.fillText(`best today ${rec.best.toLocaleString()}`, W - 16, 66);
});
