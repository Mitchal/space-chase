// The two calls the run checker (a GitHub Action, ../tools/run-checks/check-pending.js) makes. Both need
// `Authorization: Bearer <RUN_CHECK_SECRET>`, a Worker secret the Action holds too; without the secret set, they don't
// exist (404).
//   GET  /checks/pending?limit=50  → {runs: [{mode, day, key, at, score, simVersion, replay}]}: the oldest unchecked.
//   POST /checks/verdicts {verdicts: [{mode, day, key, at, score, ok, why?}]}  → {applied}: how many rows changed.
import { json } from './json-response.js';
import { cleanMode } from './score-rules.js';
import { pendingRuns, applyVerdicts, PENDING_MAX } from './run-checks-db.js';

const MAX_VERDICTS_BODY = 64 * 1024;
const MIN_SECRET = 16;

const digest = async text => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));

// Compares hashes of the two, every byte, so the time taken says nothing about how much of a guess was right.
async function sameSecret(given, secret) {
  const [a, b] = await Promise.all([digest(given), digest(secret)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// → null when the caller holds the secret, else the answer to send.
async function refused(request, env, cors) {
  const secret = env.RUN_CHECK_SECRET;
  if (typeof secret !== 'string' || secret.length < MIN_SECRET) return json({ error: 'not found' }, 404, cors);
  const given = /^Bearer (.+)$/.exec(request.headers.get('authorization') || '')?.[1];
  return given && await sameSecret(given, secret) ? null : json({ error: 'unauthorized' }, 401, cors);
}

export async function getPending(request, env, cors, url) {
  const no = await refused(request, env, cors);
  if (no) return no;
  const limit = Number(url.searchParams.get('limit')) || 50;
  return json({ runs: await pendingRuns(env.DB, limit) }, 200, cors);
}

const isDay = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
const cleanVerdict = v => cleanMode(v?.mode) && isDay(v.day) && typeof v.key === 'string' && v.key.length <= 64
  && Number.isInteger(v.at) && Number.isInteger(v.score) && typeof v.ok === 'boolean'
  ? { mode: v.mode, day: v.day, key: v.key, at: v.at, score: v.score, ok: v.ok, why: String(v.why ?? 'replay').slice(0, 32) }
  : null;

export async function postVerdicts(request, env, cors) {
  const no = await refused(request, env, cors);
  if (no) return no;
  const text = await request.text();
  if (text.length > MAX_VERDICTS_BODY) return json({ error: 'too big' }, 413, cors);
  let list;
  try { list = JSON.parse(text)?.verdicts; } catch { return json({ error: 'expected JSON' }, 400, cors); }
  const verdicts = Array.isArray(list) && list.length <= PENDING_MAX ? list.map(cleanVerdict) : null;
  if (!verdicts || verdicts.includes(null)) return json({ error: 'bad verdicts' }, 400, cors);
  return json({ applied: await applyVerdicts(env.DB, verdicts) }, 200, cors);
}
