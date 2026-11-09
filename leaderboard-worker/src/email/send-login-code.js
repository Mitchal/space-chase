// Sends a login code by email, through whichever provider EMAIL_PROVIDER names (wrangler.toml [vars]):
//   "log"     – no email: the code is written to the Worker's console, with the address masked. `npm run dev` uses
//               this, so logging in works on this computer with no provider at all. Never deploy it: nobody could log in.
//   "resend"  – Resend (resend.js);  "mailgun" – Mailgun (mailgun.js). Setup for both is in the README.
// Unset (or anything else): logging in is switched off, and /auth/start answers 503.
// The address is never logged, not even here: only masked (email-key.js).
import { loginCodeMessage } from './login-code-message.js';
import { sendWithResend } from './resend.js';
import { sendWithMailgun } from './mailgun.js';
import { maskEmail } from '../auth/email-key.js';

function logCode(env, { to, code }) {
  console.log(`[email: log mode] login code for ${maskEmail(to)}: ${code}`);
}

const PROVIDERS = {
  log: logCode,
  resend: (env, { to, code }) => sendWithResend(env, { to, ...loginCodeMessage(code) }),
  mailgun: (env, { to, code }) => sendWithMailgun(env, { to, ...loginCodeMessage(code) }),
};

export const emailOn = env => Object.hasOwn(PROVIDERS, env.EMAIL_PROVIDER ?? '');

// Resolves once the provider has taken the email; throws if it refused, with the address masked in the error (a
// provider may quote it back, and the error is logged).
export async function sendLoginCode(env, to, code) {
  try {
    await PROVIDERS[env.EMAIL_PROVIDER](env, { to, code });
  } catch (err) {
    throw new Error(String(err?.message ?? err).split(to).join(maskEmail(to)));
  }
}
