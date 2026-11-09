// The scores table (migrations/0001_scores.sql, 0004_run_checks.sql): one row per name, mode and day, holding that
// player's best, with the replay of the run that set it until the run has been checked (run-checks-db.js).
// A row whose run failed its check is hidden from everything here, and is frozen: later posts don't change it and a
// rename doesn't drop it, so the evidence stays (until the day is deleted after 30 days, cleanup.js).
export const TOP_N = 10;
const SHOWN = "check_status != 'failed'";

// Keeps the better of the stored score and this one: a better one comes with its replay, when it was set, and starts
// out unchecked. The name is kept as typed this time.
export async function saveBest(db, { mode, day, key, name, score, simVersion, replay, now = Date.now() }) {
  const better = 'excluded.score > scores.score';
  await db.prepare(`
    INSERT INTO scores (mode, day, name_key, name, score, updated_at, check_status, sim_version, replay)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'unchecked', ?7, ?8)
    ON CONFLICT (mode, day, name_key) DO UPDATE SET
      name = excluded.name,
      updated_at = CASE WHEN ${better} THEN excluded.updated_at ELSE scores.updated_at END,
      check_status = CASE WHEN ${better} THEN 'unchecked' ELSE scores.check_status END,
      sim_version = CASE WHEN ${better} THEN excluded.sim_version ELSE scores.sim_version END,
      replay = CASE WHEN ${better} THEN excluded.replay ELSE scores.replay END,
      score = MAX(scores.score, excluded.score)
    WHERE scores.check_status != 'failed'`).bind(mode, day, key, name, score, now, simVersion, replay).run();
  return db.prepare('SELECT score, updated_at, check_status FROM scores WHERE mode = ?1 AND day = ?2 AND name_key = ?3')
    .bind(mode, day, key).first();
}

// A player who changes their name takes today's row along: the old name's row goes (its score is sent again).
export async function dropRow(db, { mode, day, key }) {
  await db.prepare(`DELETE FROM scores WHERE mode = ?1 AND day = ?2 AND name_key = ?3 AND ${SHOWN}`)
    .bind(mode, day, key).run();
}

// 1 + how many players are ahead: a higher score, or the same score set earlier.
export async function rankOf(db, { mode, day }, best) {
  const row = await db.prepare(`SELECT COUNT(*) AS ahead FROM scores WHERE mode = ?1 AND day = ?2 AND ${SHOWN}
    AND (score > ?3 OR (score = ?3 AND updated_at < ?4))`).bind(mode, day, best.score, best.updated_at).first();
  return row.ahead + 1;
}

export async function topScores(db, { mode, day }, limit = TOP_N) {
  const { results } = await db.prepare(`SELECT name, score FROM scores WHERE mode = ?1 AND day = ?2 AND ${SHOWN}
    ORDER BY score DESC, updated_at ASC LIMIT ?3`).bind(mode, day, limit).all();
  return results;
}

export async function playerCount(db, { mode, day }) {
  const row = await db.prepare(`SELECT COUNT(*) AS n FROM scores WHERE mode = ?1 AND day = ?2 AND ${SHOWN}`)
    .bind(mode, day).first();
  return row.n;
}
