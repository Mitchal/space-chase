// Headless playtests: window.LureSim.run(...) / .batch(n). Runs synchronously, never touches the taste log.
import { world } from '../../core/world.js';
import { emit } from '../../core/events.js';
import { collectSummary } from '../../core/registry.js';
import { startRun } from '../../core/run.js';
import { step } from '../../core/loop.js';
import { handling } from '../../core/player.js';
import { randomPolicy, evaderPolicy } from './bot-policies.js';

const POLICIES = { random: randomPolicy, evader: evaderPolicy };

// direct: bypass any installed steering (e.g. thrusters) so bots compare layouts, not their own piloting.
// mode: a game mode's id (left out: the current one).
function run({ policy = 'evader', variant = 'A', startArena = 0, maxS = 600, direct = false, mode } = {}) {
  const steer = handling.steer;
  if (direct) handling.steer = null;
  world.botPolicy = POLICIES[policy]();
  startRun({ mode, variant, startArena, index: -1 });
  for (let i = 0; i < maxS * 60 && !world.run.over; i++) step(1 / 60);
  if (!world.run.over) { world.run.outcome = 'timeout'; emit('arenaExit', world.arena); world.run.endedAt = world.t - world.run.startedAt; }
  const s = collectSummary().telemetry;
  world.botPolicy = null; world.run = null; handling.steer = steer;
  emit('showTitle');
  const kills = Object.values(s.kills).reduce((a, b) => a + b, 0);
  return {
    policy, variant, outcome: s.outcome, durationS: s.durationS, arenaReached: s.arenaReached, killedBy: s.killedBy,
    kills, seenShare: +(s.pursuersSeenS / s.durationS).toFixed(2), onScreen: +(s.pursuerScreenS / s.durationS).toFixed(2), wave: s.kills.wave || 0, nearMisses: s.nearMisses, killsPerS: +(kills / s.durationS).toFixed(2), lullShare: kills ? +(s.killsInLull / kills).toFixed(2) : null,
    arenas: s.arenas.map(a => ({ arena: a.arena, s: a.durationS, kills: a.kills, keys: a.keysAtS, escaped: a.escaped })),
  };
}

function batch(n = 10) {
  const rows = [];
  for (const policy of ['random', 'evader']) for (const variant of ['A', 'B']) for (let i = 0; i < n; i++) rows.push(run({ policy, variant }));
  const summary = {};
  for (const r of rows) {
    const k = `${r.policy}/${r.variant}`;
    const a = summary[k] ||= { runs: 0, wins: 0, timeouts: 0, arena: 0, dur: 0, kps: 0, lullShare: 0, escapes: 0, escapeS: 0, deaths: {} };
    a.runs++; if (r.outcome === 'win') a.wins++; if (r.outcome === 'timeout') a.timeouts++;
    a.arena += r.arenaReached; a.dur += r.durationS; a.kps += r.killsPerS; a.lullShare += r.lullShare || 0;
    for (const s of r.arenas) if (s.escaped) { a.escapes++; a.escapeS += s.s; }
    if (r.killedBy) a.deaths[r.killedBy] = (a.deaths[r.killedBy] || 0) + 1;
  }
  for (const a of Object.values(summary)) {
    for (const f of ['arena', 'dur', 'kps', 'lullShare']) a[f] = +(a[f] / a.runs).toFixed(2);
    a.secondsPerEscapedArena = a.escapes ? +(a.escapeS / a.escapes).toFixed(1) : null;
    delete a.escapeS;
  }
  return { summary, rows };
}

window.LureSim = { run, batch };
