// The login_codes table (migrations/0003): the one code each email's login is waiting for.
//   - A code lasts CODE_TTL_MS and takes MAX_ATTEMPTS tries (the right one included); then a new code is needed.
//   - An email gets at most MAX_SENDS codes per SEND_WINDOW_MS, so nobody can flood an inbox, and guessing is capped at
//     MAX_SENDS × MAX_ATTEMPTS tries an hour out of a million codes.
// Both checks are single statements, so two requests at once can't slip past them.
import { codeHash } from './secrets.js';

export const CODE_TTL_MS = 10 * 60_000;
export const MAX_ATTEMPTS = 5;
export const MAX_SENDS = 5;
export const SEND_WINDOW_MS = 60 * 60_000;

// Stores a new code for the email (replacing any earlier one). false: the email has had its codes for this hour.
export async function storeCode(db, email, code, now = Date.now()) {
  const row = await db.prepare(`
    INSERT INTO login_codes (email, code_hash, expires_at, attempts, window_start, sends) VALUES (?1, ?2, ?3, 0, ?4, 1)
    ON CONFLICT (email) DO UPDATE SET
      code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0,
      sends = CASE WHEN login_codes.window_start <= ?5 THEN 1 ELSE login_codes.sends + 1 END,
      window_start = CASE WHEN login_codes.window_start <= ?5 THEN excluded.window_start ELSE login_codes.window_start END
    WHERE login_codes.window_start <= ?5 OR login_codes.sends < ?6
    RETURNING sends`).bind(email, await codeHash(email, code), now + CODE_TTL_MS, now, now - SEND_WINDOW_MS, MAX_SENDS).first();
  return !!row;
}

// Checks a typed code. Each check uses up one try, before comparing, so parallel guesses all count.
//   → 'ok' (the code is used up), 'wrong' (with left: tries remaining), or 'expired' (no code, too old, or out of tries).
export async function checkCode(db, email, code, now = Date.now()) {
  const row = await db.prepare(`UPDATE login_codes SET attempts = attempts + 1
    WHERE email = ?1 AND expires_at > ?2 AND attempts < ?3 RETURNING code_hash, attempts`)
    .bind(email, now, MAX_ATTEMPTS).first();
  if (!row) return { result: 'expired' };
  if (row.code_hash !== await codeHash(email, code)) return { result: 'wrong', left: MAX_ATTEMPTS - row.attempts };
  // Used up, but the row stays so this hour's count of sent codes still holds.
  await db.prepare('UPDATE login_codes SET expires_at = 0 WHERE email = ?1').bind(email).run();
  return { result: 'ok' };
}

// Rows whose code and hourly count have both run out (the hourly job).
export async function dropStaleCodes(db, now = Date.now()) {
  const { meta } = await db.prepare('DELETE FROM login_codes WHERE expires_at < ?1 AND window_start < ?2')
    .bind(now, now - SEND_WINDOW_MS).run();
  return meta?.changes ?? 0;
}

export const forgetCodes = (db, email) => db.prepare('DELETE FROM login_codes WHERE email = ?1').bind(email);
