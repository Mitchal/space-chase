// Sends a login code by email, through whichever provider EMAIL_PROVIDER names (wrangler.toml [vars]):
//   "log"     – no email: the code is written to the Worker's console. `npm run dev` uses this, so logging in works
//               on this computer with no provider at all. Never deploy it: nobody could log in.
//   "resend"  – Resend (resend.js);  "mailgun" – Mailgun (mailgun.js). Setup for both is in the README.
// Unset (or anything else): logging in is switched off, and /auth/start answers 503.
import { loginCodeMessage } from './login-code-message.js';
import { sendWithResend } from './resend.js';
import { sendWithMailgun } from './mailgun.js';

function logCode(env, { to, code }) {
  console.log(`[email: log mode] login code for ${to}: ${code}`);
}

const PROVIDERS = {
  log: logCode,
  resend: (env, { to, code }) => sendWithResend(env, { to, ...loginCodeMessage(code) }),
  mailgun: (env, { to, code }) => sendWithMailgun(env, { to, ...loginCodeMessage(code) }),
};

export const emailOn = env => Object.hasOwn(PROVIDERS, env.EMAIL_PROVIDER ?? '');

// Resolves once the provider has taken the email; throws if it refused.
export const sendLoginCode = (env, to, code) => PROVIDERS[env.EMAIL_PROVIDER](env, { to, code });
