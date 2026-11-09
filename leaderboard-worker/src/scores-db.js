// The scores table (migrations/0004): one row per player, mode and day, holding that player's best. Boards show each
// player's name as it is now (players table), so a new name shows on every board at once.
export const TOP_N = 10;

// Keeps the better of the stored score and this one (and when it was set).
export async function saveBest(db, { mode, day, playerId, score, now = Date.now() }) {
  await db.prepare(`
    INSERT INTO scores (mode, day, player_id, score, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)
    ON CONFLICT (mode, day, player_id) DO UPDATE SET
      updated_at = CASE WHEN excluded.score > scores.score THEN excluded.updated_at ELSE scores.updated_at END,
      score = MAX(scores.score, excluded.score)`).bind(mode, day, playerId, score, now).run();
  return db.prepare('SELECT score, updated_at FROM scores WHERE mode = ?1 AND day = ?2 AND player_id = ?3')
    .bind(mode, day, playerId).first();
}

// 1 + how many players are ahead: a higher score, or the same score set earlier.
export async function rankOf(db, { mode, day }, best) {
  const row = await db.prepare(`SELECT COUNT(*) AS ahead FROM scores WHERE mode = ?1 AND day = ?2
    AND (score > ?3 OR (score = ?3 AND updated_at < ?4))`).bind(mode, day, best.score, best.updated_at).first();
  return row.ahead + 1;
}

// [{id, name, score}] best first: id is the player's, so the game can light up your own row.
export async function topScores(db, { mode, day }, limit = TOP_N) {
  const { results } = await db.prepare(`SELECT s.player_id AS id, p.name, s.score FROM scores s
    JOIN players p ON p.id = s.player_id WHERE s.mode = ?1 AND s.day = ?2
    ORDER BY s.score DESC, s.updated_at ASC LIMIT ?3`).bind(mode, day, limit).all();
  return results;
}

export async function playerCount(db, { mode, day }) {
  const row = await db.prepare('SELECT COUNT(*) AS n FROM scores WHERE mode = ?1 AND day = ?2').bind(mode, day).first();
  return row.n;
}
