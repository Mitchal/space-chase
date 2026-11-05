// Run lifecycle: start, arena-to-arena progression, end, settle.
import { world } from './world.js';
import { emit, on } from './events.js';
import { content, addSystem, ORDER } from './registry.js';
import { player, resetPlayer } from './player.js';
import { nextRunIndex } from './storage.js';
import { clearEffects, bigText } from './effects.js';
import { clamp } from './geometry.js';
import { useMode } from './game-modes.js';

const SETTLE_S = 1.4;

// opts: { mode, startArena, variant, index } (index/variant are given by bots so they don't consume run numbers).
// mode: a game mode's id; left out, the run is in the same mode as the last one.
export function startRun(opts = {}) {
  useMode(opts.mode);
  const index = opts.index ?? nextRunIndex();
  const startArena = clamp(opts.startArena ?? 0, 0, content.arenas.length - 1);
  world.run = {
    mode: world.mode, index, variant: opts.variant || (index % 2 === 0 ? 'A' : 'B'), startArena, ai: -1, startedAt: world.t,
    over: false, outcome: null, endedAt: null, endT: 0, killer: null, settled: false,
  };
  world.paused = false;
  player.hp = player.maxHp;
  emit('runStart', world.run);
  enterArena(startArena, true);
}

// The first stage of a run always starts clean; later ones follow content.stageFlow.
function enterArena(i, first = false) {
  const flow = content.stageFlow;
  world.run.ai = i; world.transition = 0;
  if (first || flow.clearBetween) { world.ents = []; clearEffects(); }
  world.arena = { index: i, def: content.arenas[i], t: 0, startedAt: world.t };
  resetPlayer(i > world.run.startArena, first || flow.recenter);
  emit('arenaEnter', world.arena);
  const def = world.arena.def;
  bigText(def.banner ?? `${content.stageLabel.toUpperCase()} ${i + 1} · ${def.name.toUpperCase()}`, { t: 1.8 });
}

export function endRun(outcome) {
  const r = world.run;
  if (!r || r.over) return;
  r.over = true; r.outcome = outcome; r.endedAt = world.t - r.startedAt;
  emit('runEnd', r);
}

on('arenaCleared', () => {
  if (!world.run || world.run.over) return;
  // arenaExit carries the outcome: in a continuous flow the next stage begins inside this handler,
  // so listeners must not rely on arenaCleared arriving before arenaEnter.
  emit('arenaExit', { ...world.arena, cleared: true });
  const flow = content.stageFlow;
  if (world.run.ai === content.arenas.length - 1) { bigText(flow.clearedText, { y: 280, col: '#7cf2c8', t: 3 }); endRun('win'); }
  else if (flow.pauseS > 0) { bigText(flow.clearedText, { y: 280, col: '#7cf2c8', t: 1.4 }); world.transition = flow.pauseS; }
  else enterArena(world.run.ai + 1);
});

on('playerDown', ({ cause, src }) => {
  world.run.killer = { cause, x: src?.x ?? player.x, y: src?.y ?? player.y };
  emit('arenaExit', { ...world.arena, cleared: false });
  endRun('dead');
});

addSystem(ORDER.director - 1, dt => {
  const r = world.run;
  if (world.transition > 0) {
    world.transition -= dt;
    if (world.transition <= 0) enterArena(r.ai + 1);
    return;
  }
  if (r.over) {
    r.endT += dt;
    if (r.endT > SETTLE_S && !r.settled && !world.botPolicy) {
      r.settled = true;
      emit('runSettled', r);
      if (!content.runOverScreen) startRun({ startArena: r.startArena });
    }
    return;
  }
  world.arena.t += dt;
}, { always: true });
