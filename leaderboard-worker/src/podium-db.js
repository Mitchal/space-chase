// The podium table (migrations/0002_podium.sql): each closed day's top five per challenge, kept for good.
export const PODIUM_SIZE = 5, TROPHY_PLACES = 3;

// Every scores row with its place that day, ranked as the board ranks: higher score first, then whoever set it first.
const RANKED = `SELECT mode, day, name_key, name, score,
  ROW_NUMBER() OVER (PARTITION BY mode, day ORDER BY score DESC, updated_at ASC) AS place FROM scores`;
const notKept = alias => `NOT EXISTS (SELECT 1 FROM podium p WHERE p.mode = ${alias}.mode AND p.day = ${alias}.day)`;

// Keeps the top five of every closed day (up to lastClosed) not kept yet; returns how many rows it added. A (mode, day)
// already in the podium is left alone, so to redo one (after removing a made-up score), delete its podium rows and the
// next run rebuilds it from the scores, as long as that day is under 30 days old.
export async function archiveClosedDays(db, lastClosed) {
  const { meta } = await db.prepare(`INSERT OR IGNORE INTO podium (mode, day, place, name_key, name, score)
    SELECT mode, day, place, name_key, name, score FROM (${RANKED} WHERE day <= ?1) AS r
    WHERE place <= ?2 AND ${notKept('r')}`).bind(lastClosed, PODIUM_SIZE).run();
  return meta?.changes ?? 0;
}

// The kept top fives between two days: [{mode, day, place, name, score}].
export async function podiumBetween(db, from, to) {
  const { results } = await db.prepare(`SELECT mode, day, place, name, score FROM podium
    WHERE day >= ?1 AND day <= ?2 ORDER BY day, mode, place`).bind(from, to).all();
  return results;
}

// The top fives of days not kept yet (still open, or closed within the last hour), from the live scores.
export async function liveBetween(db, from, to) {
  const { results } = await db.prepare(`SELECT mode, day, place, name, score FROM (${RANKED}
    WHERE day >= ?1 AND day <= ?2) AS r WHERE place <= ?3 AND ${notKept('r')} ORDER BY day, mode, place`)
    .bind(from, to, PODIUM_SIZE).all();
  return results;
}

// Every trophy a name holds, newest first: [{mode, day, place}].
export async function trophiesOf(db, key) {
  const { results } = await db.prepare(`SELECT mode, day, place FROM podium WHERE name_key = ?1 AND place <= ?2
    ORDER BY day DESC, mode`).bind(key, TROPHY_PLACES).all();
  return results;
}
