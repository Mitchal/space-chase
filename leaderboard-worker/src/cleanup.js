// What the hourly job (wrangler.toml [triggers]) forgets:
//   - scores rows more than KEEP_DAYS old (the game only shows today's board; closed days' top fives are kept apart),
//   - sessions past their 30 days, and login codes that have expired and no longer count towards an hour's limit.
// The privacy policy (game/privacy.html) promises this, so change both together.
import { dropExpiredSessions } from './auth/sessions-db.js';
import { dropStaleCodes } from './auth/login-codes-db.js';

export const KEEP_DAYS = 30;

export function cutoffDay(now = Date.now()) {
  return new Date(now - KEEP_DAYS * 86_400_000).toISOString().slice(0, 10);
}

export async function dropOldDays(db, now = Date.now()) {
  const { meta } = await db.prepare('DELETE FROM scores WHERE day < ?1').bind(cutoffDay(now)).run();
  return meta?.changes ?? 0;
}

// → how many rows of each went: {scores, sessions, codes}.
export async function cleanUp(db, now = Date.now()) {
  return {
    scores: await dropOldDays(db, now),
    sessions: await dropExpiredSessions(db, now),
    codes: await dropStaleCodes(db, now),
  };
}
