// Logging in with an emailed code. There are no passwords, and an account is made the first time its email logs in.
//   POST /auth/start  {email}        → 200 {ok: true}, whether or not the email has an account, and a code is emailed.
//                                      400 {error: 'email'}; 429 when the email has had its codes this hour;
//                                      503 {error: 'email off'} when no email provider is set up (send-login-code.js).
//   POST /auth/verify {email, code}  → 200 {token, expires, account: {id, email, name}}; the game sends the token as
//                                      "Authorization: Bearer …" from then on, for 30 days.
//                                      401 {error: 'code', left} for a wrong code; 401 {error: 'expired'} when a new
//                                      code is needed (too old, used, or 5 wrong tries).
//   POST /auth/logout                → 200 {ok: true}; the token stops working.
import { json } from '../json-response.js';
import { readJsonBody } from '../read-json-body.js';
import { cleanEmail, cleanCode } from './email-address.js';
import { randomCode, CODE_DIGITS } from './secrets.js';
import { storeCode, checkCode } from './login-codes-db.js';
import { startSession, sessionPlayer, endSession } from './sessions-db.js';
import { accountFor } from '../accounts/players-db.js';
import { emailOn, sendLoginCode } from '../email/send-login-code.js';

export const publicAccount = ({ id, email, name }) => ({ id, email, name });

export async function postStart(request, env, cors) {
  const { body, error } = await readJsonBody(request, cors);
  if (error) return error;
  const email = cleanEmail(body.email);
  if (!email) return json({ error: 'email' }, 400, cors);
  if (!emailOn(env)) return json({ error: 'email off' }, 503, cors);
  const code = randomCode();
  if (!await storeCode(env.DB, email, code)) return json({ error: 'slow down' }, 429, cors);
  try {
    await sendLoginCode(env, email, code);
  } catch (err) {
    console.error('login code not sent:', err.message);
    return json({ error: 'email failed' }, 502, cors);
  }
  return json({ ok: true }, 200, cors);
}

export async function postVerify(request, env, cors) {
  const { body, error } = await readJsonBody(request, cors);
  if (error) return error;
  const email = cleanEmail(body.email), code = cleanCode(body.code, CODE_DIGITS);
  if (!email || !code) return json({ error: 'email or code' }, 400, cors);
  const check = await checkCode(env.DB, email, code);
  if (check.result === 'expired') return json({ error: 'expired' }, 401, cors);
  if (check.result === 'wrong') return json({ error: 'code', left: check.left }, 401, cors);
  const account = await accountFor(env.DB, email);
  const { token, expires } = await startSession(env.DB, account.id);
  return json({ token, expires, account: publicAccount(account) }, 200, cors);
}

export async function postLogout(request, env, cors) {
  const player = await sessionPlayer(request, env.DB);
  if (player) await endSession(env.DB, player.tokenHash);
  return json({ ok: true }, 200, cors);
}
