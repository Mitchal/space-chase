// The podium table (migrations/0002_podium.sql): each closed day's top five per challenge, kept for good.
// Only checked runs make it (run-checks-db.js): a closed day is kept once none of its runs is waiting for its check,
// ranked among the runs that checked out. Until then the calendar shows it from the live scores, failed runs left out.
export const PODIUM_SIZE = 5, TROPHY_PLACES = 3;

// Scores rows that pass `where`, each with its place that day, ranked as the board ranks: higher score first, then
// whoever set it first.
const ranked = where => `SELECT mode, day, name_key, name, score,
  ROW_NUMBER() OVER (PARTITION BY mode, day ORDER BY score DESC, updated_at ASC) AS place FROM scores WHERE ${where}`;
const notKept = alias => `NOT EXISTS (SELECT 1 FROM podium p WHERE p.mode = ${alias}.mode AND p.day = ${alias}.day)`;
const noneWaiting = alias => `NOT EXISTS (SELECT 1 FROM scores u
  WHERE u.mode = ${alias}.mode AND u.day = ${alias}.day AND u.check_status = 'unchecked')`;

// Keeps the top five of every closed day (up to lastClosed) not kept yet whose runs have all been checked; returns
// how many rows it added. A (mode, day) already in the podium is left alone, so to redo one (after removing a cheat),
// delete its podium rows and the next run rebuilds it from the scores, as long as that day is under 30 days old.
export async function archiveClosedDays(db, lastClosed) {
  const { meta } = await db.prepare(`INSERT OR IGNORE INTO podium (mode, day, place, name_key, name, score)
    SELECT mode, day, place, name_key, name, score FROM (${ranked("check_status = 'ok' AND day <= ?1")}) AS r
    WHERE place <= ?2 AND ${notKept('r')} AND ${noneWaiting('r')}`).bind(lastClosed, PODIUM_SIZE).run();
  return meta?.changes ?? 0;
}

// How many closed (mode, day)s aren't kept yet because some of their runs are still waiting for their check.
export async function closedDaysWaiting(db, lastClosed) {
  const row = await db.prepare(`SELECT COUNT(DISTINCT mode || ' ' || day) AS n FROM scores s
    WHERE day <= ?1 AND check_status = 'unchecked' AND ${notKept('s')}`).bind(lastClosed).first();
  return row.n;
}

// The kept top fives between two days: [{mode, day, place, name, score}].
export async function podiumBetween(db, from, to) {
  const { results } = await db.prepare(`SELECT mode, day, place, name, score FROM podium
    WHERE day >= ?1 AND day <= ?2 ORDER BY day, mode, place`).bind(from, to).all();
  return results;
}

// The top fives of days not kept yet (still open, closed within the last hour, or waiting for checks), from the live
// scores, leaving out runs that failed their check.
export async function liveBetween(db, from, to) {
  const { results } = await db.prepare(`SELECT mode, day, place, name, score FROM (${ranked(
    "check_status != 'failed' AND day >= ?1 AND day <= ?2")}) AS r WHERE place <= ?3 AND ${notKept('r')}
    ORDER BY day, mode, place`).bind(from, to, PODIUM_SIZE).all();
  return results;
}

// Every trophy a name holds, newest first: [{mode, day, place}].
export async function trophiesOf(db, key) {
  const { results } = await db.prepare(`SELECT mode, day, place FROM podium WHERE name_key = ?1 AND place <= ?2
    ORDER BY day DESC, mode`).bind(key, TROPHY_PLACES).all();
  return results;
}
