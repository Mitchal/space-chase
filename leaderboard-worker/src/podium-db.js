// The podium table (migrations/0004): each closed day's top five per challenge, kept for good. Rows name a player, so
// the calendar shows each player's current name; a deleted account's places stay with no player (id and name null).
export const PODIUM_SIZE = 5, TROPHY_PLACES = 3;

// Every scores row with its place that day, ranked as the board ranks: higher score first, then whoever set it first.
const RANKED = `SELECT mode, day, player_id, score,
  ROW_NUMBER() OVER (PARTITION BY mode, day ORDER BY score DESC, updated_at ASC) AS place FROM scores`;
const notKept = alias => `NOT EXISTS (SELECT 1 FROM podium p WHERE p.mode = ${alias}.mode AND p.day = ${alias}.day)`;

// Keeps the top five of every closed day (up to lastClosed) not kept yet; returns how many rows it added. A (mode, day)
// already in the podium is left alone, so to redo one (after removing a made-up score), delete its podium rows and the
// next run rebuilds it from the scores, as long as that day is under 30 days old.
export async function archiveClosedDays(db, lastClosed) {
  const { meta } = await db.prepare(`INSERT OR IGNORE INTO podium (mode, day, place, player_id, score)
    SELECT mode, day, place, player_id, score FROM (${RANKED} WHERE day <= ?1) AS r
    WHERE place <= ?2 AND ${notKept('r')}`).bind(lastClosed, PODIUM_SIZE).run();
  return meta?.changes ?? 0;
}

// The kept top fives between two days: [{mode, day, place, id, name, score}].
export async function podiumBetween(db, from, to) {
  const { results } = await db.prepare(`SELECT k.mode, k.day, k.place, k.player_id AS id, p.name, k.score FROM podium k
    LEFT JOIN players p ON p.id = k.player_id WHERE k.day >= ?1 AND k.day <= ?2 ORDER BY k.day, k.mode, k.place`)
    .bind(from, to).all();
  return results;
}

// The top fives of days not kept yet (still open, or closed within the last hour), from the live scores.
export async function liveBetween(db, from, to) {
  const { results } = await db.prepare(`SELECT r.mode, r.day, r.place, r.player_id AS id, p.name, r.score FROM (${RANKED}
    WHERE day >= ?1 AND day <= ?2) AS r JOIN players p ON p.id = r.player_id WHERE r.place <= ?3 AND ${notKept('r')}
    ORDER BY r.day, r.mode, r.place`).bind(from, to, PODIUM_SIZE).all();
  return results;
}

// Every trophy a player holds, newest first: [{mode, day, place}].
export async function trophiesOf(db, playerId) {
  const { results } = await db.prepare(`SELECT mode, day, place FROM podium WHERE player_id = ?1 AND place <= ?2
    ORDER BY day DESC, mode`).bind(playerId, TROPHY_PLACES).all();
  return results;
}
