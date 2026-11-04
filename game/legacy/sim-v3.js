// Headless bot playtests for v3. Bots are proxies for skill levels, not for taste:
// "random" is the no-skill floor; "evader" is a crude competent player that circles to make pursuers
// converge, dodges telegraphs, avoids rocks and runs for the exit once it opens.
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
          const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
          if (e.type === 'chaser' || e.type === 'charger') {
            nearest = Math.min(nearest, d - e.r - p.r);
            const w = 9000 / (d * d);
            fx += dx / d * w - dy / d * w * 0.7;
            fy += dy / d * w + dx / d * w * 0.7;
            if (e.type === 'charger' && (e.state === 'windup' || e.state === 'dash')) {
              const off = dx * -e.dy + dy * e.dx; // sideways distance from the dash line
              if (Math.abs(off) < 60) { const s = off >= 0 ? 1 : -1; fx += -e.dy * s * 5; fy += e.dx * s * 5; }
            }
          } else if (e.type === 'mine') {
            if (d < 100) { const w = (100 - d) / 100 * 3; fx += dx / d * w; fy += dy / d * w; }
          } else if (e.type === 'rock') {
            const g = d - e.r;
            if (g < 50) { const w = (50 - g) / 50 * 2; fx += dx / d * w; fy += dy / d * w; }
          } else if (e.type === 'laser') {
            if (laserDist(e, p) < 45) {
              const nx = -e.s, ny = e.c, s = ((p.x - e.x) * nx + (p.y - e.y) * ny) >= 0 ? 1 : -1;
              fx += nx * s * 4; fy += ny * s * 4;
            }
          }
        }
        const ex = G.exit;
        if (ex && ex.open) {
          const dx = ex.x - p.x, dy = ex.y - p.y, d = Math.hypot(dx, dy) || 1;
          fx += dx / d * 3; fy += dy / d * 3;
        } else {
          const m = 90;
          if (p.x < m) fx += (m - p.x) / m * 2; if (p.x > W - m) fx -= (p.x - (W - m)) / m * 2;
          if (p.y < m) fy += (m - p.y) / m * 2; if (p.y > H - m) fy -= (p.y - (H - m)) / m * 2;
          fx += (W / 2 - p.x) * 0.0006; fy += (H / 2 - p.y) * 0.0006;
        }
        return { ix: fx, iy: fy, dash: nearest < 30 };
      };
    },
  };

  function run({ policy = 'evader', variant = 'A', startArena = 0, maxS = 600 } = {}) {
    window.__botPolicy = policies[policy]();
    const savedRuns = mem.runs;
    startRun({ variant, startArena });
    for (let i = 0; i < maxS * 60 && !G.over; i++) update(1 / 60);
    const t = G.tel, dur = G.endedAt ?? G.t;
    if (!G.over) closeArenaStat();
    const out = {
      policy, variant, startArena: startArena + 1, outcome: G.outcome || 'timeout', durationS: +dur.toFixed(1), arenaReached: G.ai + 1,
      kills: lured(t.kills), killsPerS: +(lured(t.kills) / dur).toFixed(2), chains3PerMin: +(t.chains3 / dur * 60).toFixed(1), maxChain: t.maxChain,
      slammed: t.kills.slam, nearMissPerMin: +(t.nearMiss / dur * 60).toFixed(1), killedBy: G.killer ? G.killer.label : null, killMix: t.kills,
      arenas: t.arenas.map(a => ({ arena: a.arena, s: a.durationS, kills: a.kills, slammed: a.slammed, hits: a.hits, escaped: a.escapedAtS !== null })),
    };
    window.__botPolicy = null; G = null; mem.runs = savedRuns;
    try { localStorage.setItem('lure.runCount.v1', String(savedRuns)); } catch {}
    $('title').classList.add('show');
    return out;
  }

  function batch(n = 10) {
    const rows = [];
    for (const policy of ['random', 'evader'])
      for (const variant of ['A', 'B'])
        for (let i = 0; i < n; i++) rows.push(run({ policy, variant }));
    const agg = {};
    for (const r of rows) {
      const k = `${r.policy}/${r.variant}`, a = agg[k] || (agg[k] = { runs: 0, wins: 0, timeouts: 0, arena: 0, dur: 0, kps: 0, slammedPerEscape: 0, escapes: 0, arenaS: 0, deaths: {} });
      a.runs++; if (r.outcome === 'win') a.wins++; if (r.outcome === 'timeout') a.timeouts++;
      a.arena += r.arenaReached; a.dur += r.durationS; a.kps += r.killsPerS;
      for (const s of r.arenas) if (s.escaped) { a.escapes++; a.slammedPerEscape += s.slammed; a.arenaS += s.s; }
      if (r.killedBy) a.deaths[r.killedBy] = (a.deaths[r.killedBy] || 0) + 1;
    }
    for (const k in agg) {
      const a = agg[k], n = a.runs;
      a.arena = +(a.arena / n).toFixed(2); a.dur = +(a.dur / n).toFixed(1); a.kps = +(a.kps / n).toFixed(2);
      a.slammedPerEscape = a.escapes ? +(a.slammedPerEscape / a.escapes).toFixed(2) : null;
      a.secondsPerEscapedArena = a.escapes ? +(a.arenaS / a.escapes).toFixed(1) : null; delete a.arenaS;
    }
    return { summary: agg, rows };
  }

  window.LureSim = { run, batch, policies };
})();
