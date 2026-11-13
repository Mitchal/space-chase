// The queue of runs waiting for their check (migrations/0004_run_checks.sql): scores rows whose check_status is
// 'unchecked'. The GitHub Action (../tools/run-checks/) takes them, replays them and sends back a verdict per run.
// A run is named by its row and the score and time it was set (at): if the player beat it while it was being checked,
// the row now holds another run, and a verdict on the old one changes nothing.
export const PENDING_MAX = 200;

// The oldest unchecked runs: [{mode, day, key, at, score, simVersion, replay}]. No names: the checker doesn't need them.
export async function pendingRuns(db, limit = 50) {
  const { results } = await db.prepare(`SELECT mode, day, name_key AS key, updated_at AS at, score,
    sim_version AS simVersion, replay FROM scores WHERE check_status = 'unchecked'
    ORDER BY updated_at LIMIT ?1`).bind(Math.min(Math.max(1, limit | 0), PENDING_MAX)).all();
  return results;
}

export async function uncheckedCount(db) {
  return (await db.prepare("SELECT COUNT(*) AS n FROM scores WHERE check_status = 'unchecked'").first()).n;
}

// verdicts: [{mode, day, key, at, score, ok, why?}]. Every run keeps its replay: one that checked out so the game can
// show it (GET /best), one that didn't, with why, as evidence. Returns how many rows changed.
export async function applyVerdicts(db, verdicts) {
  if (!verdicts.length) return 0;
  const update = db.prepare(`UPDATE scores SET check_status = ?6, check_note = ?7
    WHERE mode = ?1 AND day = ?2 AND name_key = ?3 AND updated_at = ?4 AND score = ?5 AND check_status = 'unchecked'`);
  const done = await db.batch(verdicts.map(v =>
    update.bind(v.mode, v.day, v.key, v.at, v.score, v.ok ? 'ok' : 'failed', v.ok ? null : v.why)));
  return done.reduce((n, r) => n + (r.meta?.changes ?? 0), 0);
}
