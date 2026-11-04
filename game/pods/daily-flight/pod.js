// Daily flight (meta loop 3, his pick on 2026-11-03: "simple and pure skill"). One course a day, the same for every
// run that day: the date seeds the rocks, mines and laser angles (core/course-seed.js). Every run starts at sector 1,
// and the day's best score is the number to beat. The best run leaves a ghost.
// v14's blind A/B: B flies beside the ghost of today's best; A doesn't see it (it's still recorded).
// Delete this folder and every run gets a fresh random course with checkpoints again.
import { world, W } from '../../core/world.js';
import { on } from '../../core/events.js';
import { content, addSystem, addDrawer, addSummary, collectSummary, ORDER, LAYER } from '../../core/registry.js';
import { setCourseSeed } from '../../core/course-seed.js';
import { today, dayLabel, loadRecord, saveRecord } from './daily-record.js';
import { recordSample, ghostAt, drawGhost } from './ghost.js';

const GHOST_VARIANT = 'B';
let rec = loadRecord(), track = [], result = null, ghostShown = false;

content.checkpoints = false;
content.titleNotes.push(() => {
  rec = loadRecord();
  const best = rec.best === null ? 'no run yet today' : `today's best <b>${rec.best.toLocaleString()}</b>`;
  return `<p><b style="color:#b9c4ff">Daily flight · ${dayLabel(rec.day)}</b>: one course all day, from sector 1. ${best}.</p>`;
});
content.resultNotes.push(() => !result ? '' : result.newBest ? `new best today!` : `today's best ${result.best.toLocaleString()}`);

on('runStart', run => {
  result = null; track = [];
  if (world.botPolicy) { setCourseSeed(null); return; }
  rec = loadRecord(today());
  setCourseSeed(`daily|${rec.day}`);
  rec.attempts++;
  ghostShown = run.variant === GHOST_VARIANT && !!rec.ghost;
  saveRecord(rec);
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

addSummary('daily', () => ({ day: rec.day, attempt: rec.attempts, best: rec.best, newBest: result?.newBest ?? null, ghostShown }));

addDrawer(LAYER.player - 1, ctx => {
  if (!ghostShown || world.botPolicy) return;
  const g = ghostAt(rec.ghost);
  if (g) drawGhost(ctx, g);
});

addDrawer(LAYER.hud, ctx => {
  if (world.botPolicy || rec.best === null) return;
  ctx.font = '600 13px system-ui,sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = '#b9c4ff';
  ctx.fillText(`best today ${rec.best.toLocaleString()}`, W - 16, 66);
});
