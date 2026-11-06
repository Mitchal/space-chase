// Old days go: the game only ever shows today's board, so once a day (wrangler.toml [triggers]) rows more than
// KEEP_DAYS old are deleted. The privacy policy (game/privacy.html) promises this, so change both together.
export const KEEP_DAYS = 30;

export function cutoffDay(now = Date.now()) {
  return new Date(now - KEEP_DAYS * 86_400_000).toISOString().slice(0, 10);
}

export async function dropOldDays(db, now = Date.now()) {
  const { meta } = await db.prepare('DELETE FROM scores WHERE day < ?1').bind(cutoffDay(now)).run();
  return meta?.changes ?? 0;
}
