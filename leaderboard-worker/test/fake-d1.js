// A D1 database for the tests: the same SQLite, in memory (node:sqlite), behind the part of D1's API the Worker uses
// (prepare → bind → run / first / all, and batch). Every migration in migrations/ is applied, in order, like
// `npm run db:local` does.
import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';

const MIGRATIONS = new URL('../migrations/', import.meta.url);

class Statement {
  constructor(db, sql, args = []) { Object.assign(this, { db, sql, args }); }
  bind(...args) { return new Statement(this.db, this.sql, args); }
  async run() { return this.runNow(); }
  runNow() {
    const stmt = this.db.prepare(this.sql);
    if (/\breturning\b/i.test(this.sql)) return { results: stmt.all(...this.args), meta: {} };
    const { changes } = stmt.run(...this.args);
    return { results: [], meta: { changes } };
  }
  async first(column) {
    const row = this.db.prepare(this.sql).get(...this.args);
    return row === undefined ? null : column ? row[column] : { ...row };
  }
  async all() { return { results: this.db.prepare(this.sql).all(...this.args).map(r => ({ ...r })) }; }
}

export function fakeD1({ migrateUpTo = Infinity } = {}) {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON'); // D1 enforces foreign keys too
  const d1 = {
    raw: db,
    prepare: sql => new Statement(db, sql),
    async batch(statements) {
      db.exec('BEGIN');
      try { const out = statements.map(s => s.runNow()); db.exec('COMMIT'); return out; } catch (err) { db.exec('ROLLBACK'); throw err; }
    },
    migrate(upTo = Infinity) {
      for (const file of readdirSync(MIGRATIONS).filter(f => f.endsWith('.sql')).sort()) {
        if (parseInt(file, 10) > upTo || applied.has(file)) continue;
        db.exec(readFileSync(new URL(file, MIGRATIONS), 'utf8'));
        applied.add(file);
      }
    },
  };
  const applied = new Set();
  d1.migrate(migrateUpTo);
  return d1;
}
