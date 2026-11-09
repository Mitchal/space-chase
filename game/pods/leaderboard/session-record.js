// Who is logged in on this device: the session token the Worker handed out at login (sent as "Authorization: Bearer",
// not a cookie: the Android app's pages come from https://localhost, which can't keep cookies for the Worker's site)
// and the account it belongs to. A session lasts 30 days; then, or if the Worker stops taking it, it's forgotten and
// the game asks to log in again. The last email used stays, to fill in the login form next time.
import { readSaved, writeSaved } from '../../core/storage.js';

const KEY = 'spacechase.session.v1', EMAIL_KEY = 'spacechase.loginEmail.v1';
const listeners = [];

// {token, expires, account: {id, email, name}} while logged in, else null.
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

export function saveSession({ token, expires, account }) {
  writeSaved(KEY, { token, expires, account });
  writeSaved(EMAIL_KEY, account.email);
  changed();
}

export function updateAccount(next) {
  const s = session();
  if (!s) return;
  writeSaved(KEY, { ...s, account: next });
  changed();
}

export function forgetSession() {
  if (!readSaved(KEY)) return;
  writeSaved(KEY, null);
  changed();
}
