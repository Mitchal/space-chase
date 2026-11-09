// The checker replays each run with its own game version's code (tools/run-checks/sim-code-at.js): the newest commit
// on master's line whose game/core/sim-version.js says that version.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { commitForVersion } from '../tools/run-checks/sim-code-at.js';

test('each version maps to the last master commit that had it', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sim-code-at-'));
  const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim();
  git('init', '-q', '-b', 'master');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'test');
  git('config', 'commit.gpgsign', 'false');
  const commit = (version, note) => {
    fs.mkdirSync(path.join(dir, 'game', 'core'), { recursive: true });
    if (version) fs.writeFileSync(path.join(dir, 'game', 'core', 'sim-version.js'), `export const SIM_VERSION = ${version};\n`);
    fs.writeFileSync(path.join(dir, `${note.replace(/\W+/g, '-')}.txt`), note); // its own file: merges never conflict
    git('add', '-A');
    git('commit', '-q', '-m', note);
    return git('rev-parse', 'HEAD');
  };
  try {
    commit(null, 'before versions');
    commit(1, 'v1');
    const earlyV1 = commit(1, 'more v1');
    git('checkout', '-q', '-b', 'feature');
    commit(1, 'feature work before the bump'); // never released as v1
    commit(2, 'bump');
    git('checkout', '-q', 'master');
    const releasedV1 = commit(1, 'fix on master');
    git('merge', '-q', '--no-ff', '-m', 'merge feature', 'feature');
    const lastV2 = commit(2, 'v2 tweak');
    assert.notEqual(releasedV1, earlyV1);
    assert.equal(commitForVersion(1, { cwd: dir }), releasedV1);
    assert.equal(commitForVersion(2, { cwd: dir }), lastV2);
    assert.equal(commitForVersion(3, { cwd: dir }), null);
    assert.equal(commitForVersion(0, { cwd: dir }), null);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
