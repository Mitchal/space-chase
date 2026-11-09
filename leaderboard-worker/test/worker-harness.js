// Calls the Worker the way the game does, against a fake D1 (fake-d1.js), with email in "log" mode: the codes it
// would have mailed are caught from the console instead.
import worker from '../src/worker.js';
import { swedishDay } from '../src/day-close.js';
import { fakeD1 } from './fake-d1.js';

export const GAME = 'http://localhost:8765';
export const today = () => swedishDay();

// A rate limiter like Cloudflare's: limit calls per key, counted until reset().
export function fakeLimiter(limit) {
  const counts = new Map();
  return {
    async limit({ key }) { const n = (counts.get(key) ?? 0) + 1; counts.set(key, n); return { success: n <= limit }; },
    reset: () => counts.clear(),
  };
}

export function makeEnv(extra = {}) {
  return { DB: fakeD1(), EMAIL_PROVIDER: 'log', ...extra };
}

const sentCodes = [];
const realLog = console.log;
console.log = (...args) => {
  const m = /login code for (\S+): (\d{6})/.exec(args.join(' '));
  if (m) sentCodes.push({ email: m[1], code: m[2] });
  else realLog(...args);
};
// The last code mailed to an address.
export const lastCode = email => sentCodes.findLast(c => c.email === email)?.code ?? null;

// → {status, body, headers}
export async function call(env, method, path, { body, token, ip = '10.0.0.1', origin = GAME } = {}) {
  const headers = { 'cf-connecting-ip': ip };
  if (origin) headers.origin = origin;
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await worker.fetch(new Request(`http://worker${path}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  }), env);
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null, headers: res.headers };
}

// Logs in (making the account on first login) → {token, account}.
export async function logIn(env, email, { ip } = {}) {
  const start = await call(env, 'POST', '/auth/start', { body: { email }, ip });
  if (start.status !== 200) throw new Error(`start: ${start.status} ${JSON.stringify(start.body)}`);
  const verify = await call(env, 'POST', '/auth/verify', { body: { email, code: lastCode(email.trim().toLowerCase()) }, ip });
  if (verify.status !== 200) throw new Error(`verify: ${verify.status} ${JSON.stringify(verify.body)}`);
  return verify.body;
}

// Logs in and picks a name → {token, account}.
export async function player(env, email, name) {
  const { token } = await logIn(env, email);
  const named = await call(env, 'POST', '/me', { token, body: { name } });
  if (named.status !== 200) throw new Error(`name: ${named.status}`);
  return { token, account: named.body.account };
}

export const postScore = (env, token, score, { mode = 'flight', day = today(), ...extra } = {}) =>
  call(env, 'POST', '/score', { token, body: { mode, day, score, ...extra } });
