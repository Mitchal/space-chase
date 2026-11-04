// Headless bot playtests. Bots are proxies for skill levels, not for taste:
// "random" is the no-skill floor, "evader" is a crude competent player that circles to make pursuers converge.
(function () {
  const policies = {
    random() {
      const s = {};
      return G => {
        if (!s.until || G.t > s.until) { s.until = G.t + rand(0.3, 0.9); s.a = Math.random() * Math.PI * 2; }
        return { ix: Math.cos(s.a), iy: Math.sin(s.a) };
      };
    },
    evader() {
      return G => {
        const p = G.p;
        let fx = 0, fy = 0, nearest = Infinity;
        for (const e of G.ents) {
          if (e.dead || e.spawn > 0) continue;
          if (e.type === 'chaser' || e.type === 'charger') {
            const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
            nearest = Math.min(nearest, d - e.r - p.r);
            const w = 9000 / (d * d);
            fx += dx / d * w - dy / d * w * 0.7; // flee + swirl, which drags followers onto converging paths
            fy += dy / d * w + dx / d * w * 0.7;
            if (e.type === 'charger' && (e.state === 'windup' || e.state === 'dash')) {
              const along = (p.x - e.x) * e.dx + (p.y - e.y) * e.dy;
              const off = (p.x - e.x) * -e.dy + (p.y - e.y) * e.dx;
              if (along > 0 && Math.abs(off) < 60) { const s = off >= 0 ? 1 : -1; fx += -e.dy * s * 5; fy += e.dx * s * 5; }
            }
          } else if (e.type === 'mine') {
            const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
            if (d < 100) { const w = (100 - d) / 100 * 3; fx += dx / d * w; fy += dy / d * w; }
          } else if (e.type === 'laser') {
            if (laserDist(e, p) < 45) {
              const nx = -e.s, ny = e.c, s = ((p.x - e.x) * nx + (p.y - e.y) * ny) >= 0 ? 1 : -1;
              fx += nx * s * 4; fy += ny * s * 4;
            }
          }
        }
        const m = 90;
        if (p.x < m) fx += (m - p.x) / m * 2; if (p.x > W - m) fx -= (p.x - (W - m)) / m * 2;
        if (p.y < m) fy += (m - p.y) / m * 2; if (p.y > H - m) fy -= (p.y - (H - m)) / m * 2;
        fx += (W / 2 - p.x) * 0.0006; fy += (H / 2 - p.y) * 0.0006;
        const busy = G.ents.filter(e => e.type === 'chaser').length >= 4;
        return { ix: fx, iy: fy, dash: nearest < 30, decoy: busy && Math.random() < 0.02, mine: busy && Math.random() < 0.02 };
      };
    },
  };

  function run({ policy = 'evader', variant = 'A', startWave = 0, abilities = { decoy: false, mine: false }, maxS = 400 } = {}) {
    window.__botPolicy = policies[policy]();
    const savedRuns = mem.runs;
    startRun({ variant, startWave, abilities });
    for (let i = 0; i < maxS * 60 && !G.over; i++) update(1 / 60);
    const t = G.tel, dur = G.endedAt ?? G.t;
    const out = {
      policy, variant, startWave: startWave + 1, abilities, outcome: G.outcome || 'timeout', durationS: +dur.toFixed(1), waveReached: G.wave + 1,
      kills: lured(t.kills), killsPerS: +(lured(t.kills) / dur).toFixed(2), chains3PerMin: +(t.chains3 / dur * 60).toFixed(1), maxChain: t.maxChain,
      firstKillS: t.firstKillS, longestNoKillS: t.longestNoKillS, assistMines: t.assistMines, nearMissPerMin: +(t.nearMiss / dur * 60).toFixed(1),
      hits: t.hits.map(h => h.cause), dashes: t.dashes, killMix: t.kills,
    };
    window.__botPolicy = null; G = null; mem.runs = savedRuns;
    try { localStorage.setItem('lure.runCount.v1', String(savedRuns)); } catch {}
    $('title').classList.add('show');
    return out;
  }

  function batch(n = 6) {
    const rows = [];
    for (const policy of ['random', 'evader'])
      for (const variant of ['A', 'B'])
        for (let i = 0; i < n; i++) rows.push(run({ policy, variant }));
    const agg = {};
    for (const r of rows) {
      const k = `${r.policy}/${r.variant}`, a = agg[k] || (agg[k] = { runs: 0, wins: 0, wave: 0, dur: 0, kps: 0, c3: 0, firstKill: 0, noKill: 0, nm: 0, deaths: {} });
      a.runs++; if (r.outcome === 'win') a.wins++;
      a.wave += r.waveReached; a.dur += r.durationS; a.kps += r.killsPerS; a.c3 += r.chains3PerMin; a.firstKill += r.firstKillS ?? r.durationS; a.noKill += r.longestNoKillS; a.nm += r.nearMissPerMin;
      if (r.hits.length) { const last = r.hits[r.hits.length - 1]; a.deaths[last] = (a.deaths[last] || 0) + 1; }
    }
    for (const k in agg) { const a = agg[k], n = a.runs; for (const f of ['wave', 'dur', 'kps', 'c3', 'firstKill', 'noKill', 'nm']) a[f] = +(a[f] / n).toFixed(2); }
    return { summary: agg, rows };
  }

  window.LureSim = { run, batch, policies };
})();
