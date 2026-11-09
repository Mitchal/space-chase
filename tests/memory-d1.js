// A stand-in for Cloudflare D1 in the tests: SQLite in memory (node:sqlite), with every migration in
// leaderboard-worker/migrations/ applied in order, behind the slice of D1's API the Worker uses
// (prepare → bind → run / first / all, and batch).
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const MIGRATIONS = new URL('../leaderboard-worker/migrations/', import.meta.url);
const plain = row => row ? { ...row } : null;

export function memoryD1() {
  const db = new DatabaseSync(':memory:');
  for (const f of fs.readdirSync(MIGRATIONS).filter(f => f.endsWith('.sql')).sort()) {
    db.exec(fs.readFileSync(new URL(f, MIGRATIONS), 'utf8'));
  }
  const statement = (sql, args = []) => ({
    bind: (...values) => statement(sql, values),
    run: async () => ({ meta: { changes: Number(db.prepare(sql).run(...args).changes) } }),
    first: async () => plain(db.prepare(sql).get(...args)),
    all: async () => ({ results: db.prepare(sql).all(...args).map(plain) }),
  });
  return {
    prepare: sql => statement(sql),
    batch: async list => { const out = []; for (const s of list) out.push(await s.run()); return out; },
    // For the tests themselves: plain synchronous SQL.
    query: (sql, ...args) => db.prepare(sql).all(...args).map(plain),
    exec: (sql, ...args) => db.prepare(sql).run(...args),
  };
}
