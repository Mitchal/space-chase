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

// A player who changes their name takes that day's rows along, in every challenge: each lands on the new name (the
// better score wins if it has one already), then the old name's rows go. Statements for one batch; only rename.js
// calls this, once it has checked the old name belongs to the same device.
export const moveDay = (db, { day, from, to, name }) => [
  db.prepare(`INSERT INTO scores (mode, day, name_key, name, score, updated_at)
    SELECT mode, day, ?3, ?4, score, updated_at FROM scores WHERE day = ?1 AND name_key = ?2
    ON CONFLICT (mode, day, name_key) DO UPDATE SET
      name = excluded.name,
      updated_at = CASE WHEN excluded.score > scores.score THEN excluded.updated_at
        WHEN excluded.score = scores.score THEN MIN(excluded.updated_at, scores.updated_at) ELSE scores.updated_at END,
      score = MAX(scores.score, excluded.score)`).bind(day, from, to, name),
  db.prepare('DELETE FROM scores WHERE day = ?1 AND name_key = ?2').bind(day, from),
];

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
