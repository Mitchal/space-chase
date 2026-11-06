// The scores table (migrations/0001_scores.sql): one row per name, mode and day, holding that player's best.
export const TOP_N = 10;

// Keeps the better of the stored score and this one (and when it was set), and the name as typed this time.
export async function saveBest(db, { mode, day, key, name, score, now = Date.now() }) {
  await db.prepare(`
    INSERT INTO scores (mode, day, name_key, name, score, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
    ON CONFLICT (mode, day, name_key) DO UPDATE SET
      name = excluded.name,
      updated_at = CASE WHEN excluded.score > scores.score THEN excluded.updated_at ELSE scores.updated_at END,
      score = MAX(scores.score, excluded.score)`).bind(mode, day, key, name, score, now).run();
  return db.prepare('SELECT score, updated_at FROM scores WHERE mode = ?1 AND day = ?2 AND name_key = ?3')
    .bind(mode, day, key).first();
}

// A player who changes their name takes today's row along: the old name's row goes (its score is sent again).
export async function dropRow(db, { mode, day, key }) {
  await db.prepare('DELETE FROM scores WHERE mode = ?1 AND day = ?2 AND name_key = ?3').bind(mode, day, key).run();
}

// 1 + how many players are ahead: a higher score, or the same score set earlier.
export async function rankOf(db, { mode, day }, best) {
  const row = await db.prepare(`SELECT COUNT(*) AS ahead FROM scores WHERE mode = ?1 AND day = ?2
    AND (score > ?3 OR (score = ?3 AND updated_at < ?4))`).bind(mode, day, best.score, best.updated_at).first();
  return row.ahead + 1;
}

export async function topScores(db, { mode, day }, limit = TOP_N) {
  const { results } = await db.prepare(`SELECT name, score FROM scores WHERE mode = ?1 AND day = ?2
    ORDER BY score DESC, updated_at ASC LIMIT ?3`).bind(mode, day, limit).all();
  return results;
}

export async function playerCount(db, { mode, day }) {
  const row = await db.prepare('SELECT COUNT(*) AS n FROM scores WHERE mode = ?1 AND day = ?2').bind(mode, day).first();
  return row.n;
}
