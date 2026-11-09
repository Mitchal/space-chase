// The players table (migrations/0003): accounts (with an email) and names from before accounts (without one).
import { forgetCodes } from '../auth/login-codes-db.js';

// The account for an email, made on its first login: {id, email, name} (name is null until the player picks one).
export async function accountFor(db, email, now = Date.now()) {
  await db.prepare('INSERT INTO players (email, created_at) VALUES (?1, ?2) ON CONFLICT (email) DO NOTHING')
    .bind(email, now).run();
  return db.prepare('SELECT id, email, name FROM players WHERE email = ?1').bind(email).first();
}

// Names needn't be unique; the name filter has already been applied (profile-routes.js).
export async function rename(db, id, name) {
  await db.prepare('UPDATE players SET name = ?2 WHERE id = ?1 AND email IS NOT NULL').bind(id, name).run();
}

// Deletes an account and everything that points at it: its email, sessions, pending login code and scores. Its places
// in past days' top fives stay without a player (shown as a deleted player), so nobody else's place or trophy moves.
// One batch: all of it or none.
export async function deleteAccount(db, { id, email }) {
  await db.batch([
    db.prepare('DELETE FROM sessions WHERE player_id = ?1').bind(id),
    db.prepare('DELETE FROM scores WHERE player_id = ?1').bind(id),
    db.prepare('UPDATE podium SET player_id = NULL WHERE player_id = ?1').bind(id),
    forgetCodes(db, email),
    db.prepare('DELETE FROM players WHERE id = ?1 AND email IS NOT NULL').bind(id),
  ]);
}
