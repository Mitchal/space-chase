// Logging in and the account, on the Worker (leaderboard-worker/src/auth, src/accounts). Every call resolves: the
// Worker's answer, an {error} the caller shows, or null when the board can't be reached.
import { call, callAsPlayer } from './worker-call.js';
import { saveSession, updateAccount, forgetSession } from './session-record.js';

const post = (path, body) => call(path, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
}, [400, 401, 429, 503]);

// Emails a 6-digit code. → {ok: true}, {error: 'email' | 'slow down' | 'email off' | …} or null.
export const startLogin = email => post('/auth/start', { email });

// → {account} once logged in (the session is saved), {error: 'code', left}, {error: 'expired'}, or null.
export async function verifyCode(email, code) {
  const answer = await post('/auth/verify', { email, code });
  if (answer?.token) saveSession(answer);
  return answer;
}

// → {account} (saved here too), {error: 'name'} when the name isn't allowed, {error: 'login'}, or null.
export async function saveName(name) {
  const answer = await callAsPlayer('/me', { method: 'POST', body: { name } }, [422]);
  if (answer?.account) updateAccount(answer.account);
  return answer;
}

// The account as the Worker has it now (a name changed on another device), saved here. → {account}, {error: 'login'}
// (the login is forgotten) or null.
export async function fetchMe() {
  const answer = await callAsPlayer('/me');
  if (answer?.account) updateAccount(answer.account);
  return answer;
}

// Ends the session on the Worker too, when it can be reached; this device forgets it either way.
export async function logOut() {
  await callAsPlayer('/auth/logout', { method: 'POST' });
  forgetSession();
}

// → {ok: true} once the account is gone (and this device logged out), {error: 'login'}, or null.
export async function deleteAccount() {
  const answer = await callAsPlayer('/me', { method: 'DELETE' });
  if (answer?.ok) forgetSession();
  return answer;
}
