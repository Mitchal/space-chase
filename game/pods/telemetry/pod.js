// What happened in a run, for the taste log and the critic. Watches events; changes nothing.
import { world, lurables } from '../../core/world.js';
import { inView } from '../../core/camera.js';
import { on } from '../../core/events.js';
import { addSystem, addSummary, ORDER } from '../../core/registry.js';
import { player, hurtLabel } from '../../core/player.js';

// Kills during low pressure are the ones he had time to set up (P1 tripwire).
const SETUP_PRESSURE = 0.75;
let t = null, arena = null, last = null;

on('runStart', () => {
  t = { kills: {}, killsInLull: 0, killsInPressure: 0, hits: [], arenas: [], idleTimeS: 0, wallTimeS: 0, distancePx: 0, pursuersSeenS: 0, pursuerScreenS: 0, nearMisses: 0 };
  last = null;
});
on('arenaEnter', a => {
  arena = { arena: a.index + 1, name: a.def.name, startS: +(world.t - world.run.startedAt).toFixed(1), kills: 0, hits: 0, keysAtS: [], openedAtS: null, escaped: false };
  last = { x: player.x, y: player.y };
});
on('arenaExit', a => {
  arena.durationS = +a.t.toFixed(1);
  arena.escaped = !!a.cleared;
  t.arenas.push(arena);
});
on('kill', ({ cause }) => {
  if (cause === 'player') return;
  t.kills[cause] = (t.kills[cause] || 0) + 1;
  arena.kills++;
  if (world.pressure < SETUP_PRESSURE) t.killsInLull++; else t.killsInPressure++;
});
on('hurt', ({ cause }) => { t.hits.push({ cause, t: +(world.t - world.run.startedAt).toFixed(1), arena: arena.arena }); arena.hits++; });
on('nearMiss', () => { t.nearMisses++; });
on('keyTaken', () => arena.keysAtS.push(+world.arena.t.toFixed(1)));
on('exitOpened', () => { arena.openedAtS = +world.arena.t.toFixed(1); });

addSystem(ORDER.late, dt => {
  const moved = Math.hypot(player.x - last.x, player.y - last.y);
  t.distancePx += moved;
  if (moved / dt < 25) t.idleTimeS += dt;
  const lane = world.laneAt(player.x);
  if (player.y - lane.top < 40 || lane.bottom - player.y < 40) t.wallTimeS += dt; // hugging a wall
  // Pursuers are the star (run 23: "didn't see enough chasers"): how much of the run he could actually see them.
  const seen = lurables().filter(e => !(e.spawn > 0) && inView(e, e.r)).length;
  if (seen) t.pursuersSeenS += dt;
  t.pursuerScreenS += seen * dt;
  // How close anything flagged as a wave came (the flight's main tension).
  const wave = world.ents.find(e => e.type === 'wave');
  if (wave) t.closestWavePx = Math.min(t.closestWavePx ?? Infinity, Math.round(player.x - wave.x));
  last = { x: player.x, y: player.y };
});

addSummary('telemetry', () => {
  const r = world.run;
  return {
    outcome: r.outcome, durationS: +(r.endedAt ?? world.t - r.startedAt).toFixed(1),
    startArena: r.startArena + 1, arenaReached: r.ai + 1,
    killedBy: r.killer ? hurtLabel(r.killer.cause) : null,
    kills: t.kills, killsInLull: t.killsInLull, killsInPressure: t.killsInPressure, hits: t.hits, arenas: t.arenas, closestWavePx: t.closestWavePx ?? null,
    idleTimeS: +t.idleTimeS.toFixed(1), pursuersSeenS: +t.pursuersSeenS.toFixed(1), pursuerScreenS: +t.pursuerScreenS.toFixed(1), wallTimeS: +t.wallTimeS.toFixed(1), distancePx: Math.round(t.distancePx), nearMisses: t.nearMisses,
  };
});
