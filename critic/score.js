// Scores the critic's sealed predictions against Mikael's actual reactions.
// Usage: node critic/score.js 2
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const v = process.argv[2] || '2';
const pred = JSON.parse(fs.readFileSync(path.join(ROOT, 'predictions', `v${v}.json`), 'utf8'));
const log = fs.readFileSync(path.join(ROOT, 'data', 'taste-log.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
const byRun = Object.fromEntries(log.map(e => [e.run, e]));

const argmax = d => Object.entries(d || {}).sort((a, b) => b[1] - a[1])[0]?.[0];
const brier = (d, actual) => { const ks = new Set([...Object.keys(d || {}), actual]); let s = 0; for (const k of ks) s += ((d?.[k] || 0) - (k === actual ? 1 : 0)) ** 2; return s; };

const rows = [];
for (const p of pred.runs) {
  const a = byRun[p.run];
  if (!a) continue;
  const r = a.reaction, t = a.telemetry, row = { run: p.run, variant: a.variant };
  if (r.playAgain) { row.playAgainHit = argmax(p.playAgain) === r.playAgain; row.playAgainBrier = +brier(p.playAgain, r.playAgain).toFixed(3); }
  if (r.vsPrevious) { row.vsPrevHit = argmax(p.vsPrevious) === r.vsPrevious; row.vsPrevBrier = +brier(p.vsPrevious, r.vsPrevious).toFixed(3); }
  if (r.tags.length) {
    row.topTagHit = r.tags.includes(argmax(p.tags));
    // Mean probability the critic gave to the tags he actually chose (0 = never considered them).
    row.actualTagProb = +(r.tags.reduce((s, x) => s + (p.tags?.[x] || 0), 0) / r.tags.length).toFixed(2);
  }
  row.tagsBlankBrier = ((p.tagsLeftBlank ?? 0.5) - (r.tags.length ? 0 : 1)) ** 2;
  if (p.killedBy && t.killedBy) row.killedByHit = argmax(p.killedBy) === t.killedBy;
  // v1-v2 count waves, v3+ count arenas. Telemetry from runs marked "doesn't count" is skipped.
  const reachedPred = p.arenaReached || p.waveReached, reached = t.arenaReached ?? t.waveReached;
  if (a.invalid) { row.invalid = true; delete row.killedByHit; }
  else if (reachedPred) row.reachedInRange = reached >= reachedPred.range[0] && reached <= reachedPred.range[1];
  row.predictedSentence = p.gutSentence; row.actualSentence = r.text;
  rows.push(row);
}

const rate = k => { const xs = rows.filter(r => k in r); return xs.length ? `${xs.filter(r => r[k]).length}/${xs.length}` : 'n/a'; };
const mean = k => { const xs = rows.filter(r => k in r).map(r => r[k]); return xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(3) : 'n/a'; };
console.log(JSON.stringify({
  version: +v, scoredRuns: rows.length,
  headline: { playAgainHits: rate('playAgainHit'), vsPrevHits: rate('vsPrevHit'), killedByHits: rate('killedByHit'), reachedInRange: rate('reachedInRange'),
              playAgainBrier: mean('playAgainBrier'), vsPrevBrier: mean('vsPrevBrier'), topTagHits: rate('topTagHit'), actualTagProb: mean('actualTagProb'), note: 'Brier: 0 = perfect, ~0.67 = uniform guess over 3 options. Sentences are compared by hand.' },
  rows,
}, null, 2));
