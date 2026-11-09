// Runs a batch of runs through the simulation they were played in: this checkout's for its own SIM_VERSION, otherwise
// a temporary git worktree of the commit that had theirs (sim-code-at.js). Either way through that checkout's own
// tools/run-checks/replay-runs.js, in a child process, so two versions never share a process.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SIM_VERSION } from '../../game/core/sim-version.js';
import { commitForVersion } from './sim-code-at.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REPLAYER = path.join('tools', 'run-checks', 'replay-runs.js');

export function simCheckouts({ log = console.log } = {}) {
  const dirs = new Map([[SIM_VERSION, ROOT]]), made = [];

  // The folder holding version's simulation, or null if there's none to be had.
  function dirFor(version) {
    if (dirs.has(version)) return dirs.get(version);
    const commit = Number.isInteger(version) ? commitForVersion(version, { cwd: ROOT }) : null;
    let dir = null;
    if (commit) {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), `space-chase-sim-v${version}-`));
      execFileSync('git', ['worktree', 'add', '--detach', dir, commit], { cwd: ROOT, stdio: 'ignore' });
      made.push(dir);
      if (!fs.existsSync(path.join(dir, REPLAYER))) dir = null;
      log(`simulation v${version}: commit ${commit.slice(0, 10)}${dir ? '' : ', which has no replay-runs.js'}`);
    } else log(`simulation v${version}: no commit on this branch has it`);
    dirs.set(version, dir);
    return dir;
  }

  return {
    // runs: [{id, mode, day, score, simVersion, replay}], all of one version → [{id, ok, why?} | {id, skipped}], or null.
    check(version, runs) {
      const dir = dirFor(version);
      if (!dir) return null;
      const out = spawnSync(process.execPath, [path.join(dir, REPLAYER)], {
        cwd: dir, input: JSON.stringify({ runs }), encoding: 'utf8', maxBuffer: 64 << 20,
      });
      if (out.status !== 0) throw new Error(`replay-runs.js (v${version}) failed: ${out.stderr.slice(-2000)}`);
      return JSON.parse(out.stdout).results;
    },
    cleanUp() {
      for (const dir of made) execFileSync('git', ['worktree', 'remove', '--force', dir], { cwd: ROOT, stdio: 'ignore' });
    },
  };
}
