// Headless playtests: window.LureSim.run(...) / .batch(n). Runs synchronously, never touches the taste log.
// Each run is on a fresh random course unless you pass a seed; its replay is in the result (core/replay-run.js).
import { emit } from '../../core/events.js';
import { playBot } from './bot-run.js';

const freshSeed = () => `bot|${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`;

// opts: { policy, variant, startArena, maxS, direct, mode, seed } (bot-run.js).
function run(opts = {}) {
  const { policy = 'evader', variant = 'A' } = opts;
  const { summary, replay } = playBot({ ...opts, policy, variant, seed: opts.seed ?? freshSeed() });
  const s = summary.telemetry;
  emit('showTitle');
  const kills = Object.values(s.kills).reduce((a, b) => a + b, 0);
  return {
    policy, variant, outcome: s.outcome, durationS: s.durationS, arenaReached: s.arenaReached, killedBy: s.killedBy,
    kills, seenShare: +(s.pursuersSeenS / s.durationS).toFixed(2), onScreen: +(s.pursuerScreenS / s.durationS).toFixed(2), wave: s.kills.wave || 0, nearMisses: s.nearMisses, killsPerS: +(kills / s.durationS).toFixed(2), lullShare: kills ? +(s.killsInLull / kills).toFixed(2) : null,
    arenas: s.arenas.map(a => ({ arena: a.arena, s: a.durationS, kills: a.kills, keys: a.keysAtS, escaped: a.escaped })),
    replay,
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
