// Which commit holds the simulation of a given SIM_VERSION (game/core/sim-version.js), to replay that version's runs
// with. Every push to master is released (the web version, .github/workflows/deploy-web.yml), so a version's players
// had the newest master commit that still says that version: walking master's own line of commits (first parents)
// back from the tip, the first one whose sim-version.js says N. Needs the whole history (a full clone).
import { execFileSync } from 'node:child_process';

const FILE = 'game/core/sim-version.js';

const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 });

// The SIM_VERSION a commit says, or null if it has no sim-version.js (from before versions).
export function versionAt(commit, cwd) {
  try { return Number(/SIM_VERSION\s*=\s*(\d+)/.exec(git(['show', `${commit}:${FILE}`], cwd))[1]); } catch { return null; }
}

// → the commit (full hash) whose simulation is `version`, or null if no commit on this line has it (a version newer
// than the checkout, or one skipped by a bump of two).
export function commitForVersion(version, { cwd = process.cwd(), tip = 'HEAD' } = {}) {
  for (const commit of git(['rev-list', '--first-parent', tip], cwd).split('\n').filter(Boolean)) {
    const v = versionAt(commit, cwd);
    if (v === version) return commit;
    if (v === null || v < version) return null; // went past it: that version never was on this line
  }
  return null;
}
