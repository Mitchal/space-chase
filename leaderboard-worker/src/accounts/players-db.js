// The players table (migrations/0003): accounts (with an email key, never the address: auth/email-key.js) and names
// from before accounts (without one).
import { forgetCodes } from '../auth/login-codes-db.js';

// The account for an email key, made on its first login: {id, name} (name is null until the player picks one).
export async function accountFor(db, emailKey, now = Date.now()) {
  await db.prepare('INSERT INTO players (email_key, created_at) VALUES (?1, ?2) ON CONFLICT (email_key) DO NOTHING')
    .bind(emailKey, now).run();
  return db.prepare('SELECT id, name FROM players WHERE email_key = ?1').bind(emailKey).first();
}

// Names needn't be unique; the name filter has already been applied (profile-routes.js).
export async function rename(db, id, name) {
  await db.prepare('UPDATE players SET name = ?2 WHERE id = ?1 AND email_key IS NOT NULL').bind(id, name).run();
}

// Deletes an account and everything that points at it: its email key, sessions, pending login code and scores. Its
// places in past days' top fives stay without a player (shown as a deleted player), so nobody else's place or trophy
// moves. One batch: all of it or none.
export async function deleteAccount(db, { id, emailKey }) {
  await db.batch([
    db.prepare('DELETE FROM sessions WHERE player_id = ?1').bind(id),
    db.prepare('DELETE FROM scores WHERE player_id = ?1').bind(id),
    db.prepare('UPDATE podium SET player_id = NULL WHERE player_id = ?1').bind(id),
    forgetCodes(db, emailKey),
    db.prepare('DELETE FROM players WHERE id = ?1 AND email_key IS NOT NULL').bind(id),
  ]);
}
