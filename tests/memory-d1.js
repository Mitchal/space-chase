// A stand-in for Cloudflare D1 in the tests: the Worker's own test database (leaderboard-worker/test/fake-d1.js:
// SQLite in memory with every migration applied), plus plain synchronous SQL for the tests themselves.
import { fakeD1 } from '../leaderboard-worker/test/fake-d1.js';

const plain = row => ({ ...row });

export function memoryD1() {
  const d1 = fakeD1();
  return Object.assign(d1, {
    query: (sql, ...args) => d1.raw.prepare(sql).all(...args).map(plain),
    exec: (sql, ...args) => d1.raw.prepare(sql).run(...args),
  });
}
