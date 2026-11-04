// The course: six sectors laid end to end, and the shape of the lane between the death walls.
// Each sector adds something to the world (P6), never to the controls (P7).
// Keys configure other pods and are ignored if that pod is missing:
//   rocks / mines: { perKpx } objects per 1000px of course   chasers: { from: 'behind' | 'flank' | 'edge', speed, start, every, max }   lasers: { every }
// Chasers come from behind, at the left edge of the screen: on your tail, like TIE fighters (v10 A/B: behind reached
// further than the flanks, and he liked both, "chasers coming from the front… mostly fun", run 43).
// Never just in front of the wave, so he sees them (run 23). A pod reading `from` picks the run's variant if it's an object.
// They fly at 315 (v8–v10: 300; you: 270): you can't outrun them, only out-turn them (run 19: "clever dodging").
// max: at most this many pursuers alive at once; now that they live on screen they'd otherwise pile up.
// rampS: when a run starts in that sector, 8s with no pursuers, then they trickle in (run 18: "let me find my bearings").
// wave: speed of the death wave (px/s).   lane: half-height of the lane (the lane is ~2× this tall, wider than the 640px view).

export const SECTOR_LEN = 3600;
// Direct control (v11) out-handles pursuers far more easily, so they come more often (every × pace) and more may be
// alive (max + extra). Death blasts clear crowds, so there are plenty of them. Same in both variants since v12.
const PACE = { A: 0.35, B: 0.35 }, EXTRA = { A: 4, B: 4 };
// v13: the last two sectors were too easy, "the chasers kind of auto-die. Maybe too many rocks. There could be more
// lasers in the end" (run 58). Lasers come more often. v13's blind A/B on late rocks (22 vs 13 per 1000px) was
// inconclusive (one run each, no comment on rocks); v14 settles between them, since a daily course must be the same for every run.
// v14: the chargers ("Rammers") are gone: "basically just a waste of space. Remove them" (run 59). Sector 4 was named after them.
const LATE_ROCKS = 16;

export const SECTORS = [
  { name: 'Outer debris', wave: 70, lane: 560, rocks: { perKpx: 11 }, mines: { perKpx: 0.6 }, chasers: { from: 'behind', pace: PACE, extra: EXTRA, speed: 315, rampS: 8, start: 2, every: 4, max: 3 } },
  { name: 'Asteroid belt', wave: 80, lane: 520, rocks: { perKpx: 20 }, mines: { perKpx: 0.5 }, chasers: { from: 'behind', pace: PACE, extra: EXTRA, speed: 315, rampS: 8, start: 2, every: 3.4, max: 3 } },
  { name: 'Crossfire', wave: 90, lane: 490, rocks: { perKpx: 15 }, chasers: { from: 'behind', pace: PACE, extra: EXTRA, speed: 315, rampS: 8, start: 2, every: 3, max: 4 }, lasers: { every: 6 } },
  { name: 'Minefield', wave: 100, lane: 460, rocks: { perKpx: 15 }, mines: { perKpx: 0.6 }, chasers: { from: 'behind', pace: PACE, extra: EXTRA, speed: 315, rampS: 8, start: 2, every: 3, max: 4 } },
  { name: 'Tumble', wave: 110, lane: 430, rocks: { perKpx: LATE_ROCKS }, chasers: { from: 'behind', pace: PACE, extra: EXTRA, speed: 315, rampS: 8, start: 2, every: 2.6, max: 5 }, lasers: { every: 4.5 } },
  { name: 'Breakout', wave: 120, lane: 400, rocks: { perKpx: LATE_ROCKS }, mines: { perKpx: 0.8 }, chasers: { from: 'behind', pace: PACE, extra: EXTRA, speed: 315, rampS: 8, start: 2, every: 2.2, max: 5 }, lasers: { every: 3.8 } },
];

export const COURSE_END = SECTOR_LEN * SECTORS.length;

export const sectorIndexAt = x => Math.max(0, Math.min(SECTORS.length - 1, Math.floor(x / SECTOR_LEN)));

// The lane: a winding centreline, a half-height that narrows sector by sector, and slow breathing over time ("dynamic death walls").
export function laneShape(x, t) {
  const f = Math.max(0, Math.min(SECTORS.length - 1, x / SECTOR_LEN - 0.5));
  const i = Math.floor(f), k = f - i;
  const base = SECTORS[i].lane + (SECTORS[Math.min(i + 1, SECTORS.length - 1)].lane - SECTORS[i].lane) * k;
  const centre = 320 + 140 * Math.sin(x / 1100) + 60 * Math.sin(x / 430 + 1);
  const half = Math.max(260, base + 70 * Math.sin(x / 520) + 35 * Math.sin(t * 0.9 + x / 260));
  return { top: centre - half, bottom: centre + half };
}
