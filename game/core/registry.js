// Where pods plug into the kernel. The kernel never imports a pod; pods register here.

export const ORDER = { input: 0, director: 10, spawn: 20, move: 30, collide: 40, rules: 50, late: 60 };
export const LAYER = { floor: 0, hazards: 10, objective: 20, mobs: 30, player: 40, effects: 50, hud: 60, overlay: 70 };

const systems = [], drawers = [], summaries = [];

// Content and capabilities that pods provide. Defaults keep the kernel runnable with no pods at all.
// A run is a sequence of stages (called arenas in the code). How one stage hands over to the next is up to the pods:
// separate rooms (clear, pause, recentre) or one continuous flight (keep everything, no pause).
export const content = {
  arenas: [{ name: 'Empty arena' }],
  stageLabel: 'Arena',
  howToPlay: [], // HTML lines a game-mode pod adds to the title screen
  stageFlow: { clearBetween: true, pauseS: 1.4, recenter: true, clearedText: 'ESCAPED' },
  startScreen: false, // a pod shows a start screen, so don't auto-start
  runOverScreen: false, // a pod handles the end of a run, so don't auto-restart
  checkpoints: true, // offer "start at stage N"; a mode pod may turn this off (e.g. a daily course flown from the start)
  titleNotes: [], // () => HTML lines a pod adds to the title screen
  resultNotes: [], // run => text a pod adds to the end-of-run stats
};

// always: keep running while the run is over or between arenas (effects, timers).
export function addSystem(order, fn, { always = false } = {}) {
  systems.push({ order, fn, always });
  systems.sort((a, b) => a.order - b.order);
}

export function runSystems(dt, active) {
  for (const s of systems) if (s.always || active) s.fn(dt);
}

export function addDrawer(layer, fn) {
  drawers.push({ layer, fn });
  drawers.sort((a, b) => a.layer - b.layer);
}

export function runDrawers(ctx, from, to) {
  for (const d of drawers) if (d.layer >= from && d.layer < to) d.fn(ctx);
}

// A summary provider contributes one key to the record saved for each run.
export function addSummary(key, fn) { summaries.push({ key, fn }); }

export function collectSummary() {
  const out = {};
  for (const s of summaries) out[s.key] = s.fn();
  return out;
}
