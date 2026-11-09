// Who is logged in on this device: the session token the Worker handed out at login (sent as "Authorization: Bearer",
// not a cookie: the Android app's pages come from https://localhost, which can't keep cookies for the Worker's site)
// and the account it belongs to. A session lasts 30 days; then, or if the Worker stops taking it, it's forgotten and
// the game asks to log in again. The last email used stays, to fill in the login form next time.
// The email address lives only here, on the device: the Worker keeps a keyed hash of it, so it can't send it back.
import { readSaved, writeSaved } from '../../core/storage.js';

const KEY = 'spacechase.session.v1', EMAIL_KEY = 'spacechase.loginEmail.v1';
const listeners = [];

// {token, expires, account: {id, name, email}} while logged in, else null. email: as typed at login, on this device only.
export function session() {
  const s = readSaved(KEY);
  return s?.token && s.expires > Date.now() && s.account?.id ? s : null;
}
export const account = () => session()?.account ?? null;
export const myId = () => account()?.id ?? null;
export const authHeader = () => { const s = session(); return s ? { authorization: `Bearer ${s.token}` } : {}; };
export const lastEmail = () => readSaved(EMAIL_KEY) ?? '';

// Something to redraw when you log in, change your name or log out.
export const onSessionChange = fn => { listeners.push(fn); };
const changed = () => { for (const fn of listeners) try { fn(account()); } catch (err) { console.error(err); } };

// email: the address just logged in with (the Worker's answer has none).
export function saveSession({ token, expires, account }, email) {
  writeSaved(KEY, { token, expires, account: { ...account, email } });
  writeSaved(EMAIL_KEY, email);
  changed();
}

// next: the account as the Worker sent it ({id, name}); the email stays as this device has it.
export function updateAccount(next) {
  const s = session();
  if (!s) return;
  writeSaved(KEY, { ...s, account: { ...s.account, ...next } });
  changed();
}

export function forgetSession() {
  if (!readSaved(KEY)) return;
  writeSaved(KEY, null);
  changed();
}
