// Checks a batch of runs with THIS checkout's simulation. The checker (check-pending.js) runs it from a checkout of
// each run's own game version (sim-code-at.js), so its input and output must stay the same in every version:
//   stdin:  {"runs": [{"id", "mode", "day", "score", "simVersion", "replay"}]}
//   stdout: {"simVersion", "results": [{"id", "ok", "why"?} | {"id", "skipped": "version"}]}
// Usage: node tools/run-checks/replay-runs.js < runs.json
import { checkRun, SIM_VERSION } from './verify-run.js';

const chunks = [];
for await (const c of process.stdin) chunks.push(c);
const { runs } = JSON.parse(Buffer.concat(chunks).toString('utf8'));

const results = runs.map(run => {
  const { ok, why, skipped } = checkRun(run);
  return skipped ? { id: run.id, skipped } : ok ? { id: run.id, ok } : { id: run.id, ok, why };
});
process.stdout.write(JSON.stringify({ simVersion: SIM_VERSION, results }));
