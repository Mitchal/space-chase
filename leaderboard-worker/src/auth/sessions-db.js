// The sessions table (migrations/0003): who is logged in. The game sends its token as "Authorization: Bearer <token>"
// (not a cookie: the Android app's pages come from https://localhost, and browsers drop cookies sent across sites).
// A session lasts SESSION_TTL_MS from login, then the player logs in again.
import { randomToken, sha256Hex } from './secrets.js';

export const SESSION_TTL_MS = 30 * 86_400_000;

// → {token, expires}: the token is handed to the game once and never stored here.
export async function startSession(db, playerId, now = Date.now()) {
  const token = randomToken(), expires = now + SESSION_TTL_MS;
  await db.prepare('INSERT INTO sessions (token_hash, player_id, expires_at) VALUES (?1, ?2, ?3)')
    .bind(await sha256Hex(token), playerId, expires).run();
  return { token, expires };
}

const bearer = request => /^Bearer ([A-Za-z0-9_-]{20,100})$/.exec(request.headers.get('authorization') ?? '')?.[1] ?? null;

// The logged-in player behind a request: {id, email, name, tokenHash}, or null (no token, unknown, or expired).
export async function sessionPlayer(request, db, now = Date.now()) {
  const token = bearer(request);
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const row = await db.prepare(`SELECT p.id, p.email, p.name, s.expires_at FROM sessions s JOIN players p ON p.id = s.player_id
    WHERE s.token_hash = ?1`).bind(tokenHash).first();
  if (!row || row.expires_at <= now) return null;
  return { id: row.id, email: row.email, name: row.name, tokenHash };
}

export async function endSession(db, tokenHash) {
  await db.prepare('DELETE FROM sessions WHERE token_hash = ?1').bind(tokenHash).run();
}

export async function dropExpiredSessions(db, now = Date.now()) {
  const { meta } = await db.prepare('DELETE FROM sessions WHERE expires_at <= ?1').bind(now).run();
  return meta?.changes ?? 0;
}
