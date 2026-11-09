// The leaderboard Worker (leaderboard-worker/src/worker.js) run in Node against an in-memory database, with GitHub
// stood in for: requests go straight to its fetch handler, and its calls to GitHub are recorded instead of sent.
import { createHash } from 'node:crypto';
import worker from '../leaderboard-worker/src/worker.js';
import { memoryD1 } from './memory-d1.js';
import { encodeReplay } from '../game/core/replay-codec.js';
import { SIM_VERSION } from '../game/core/sim-version.js';
import { swedishDay } from '../leaderboard-worker/src/day-close.js';

export const SECRET = 'test-secret-0123456789abcdef';
export const TODAY = swedishDay();

// A device key per player (leaderboard-worker/src/device-key.js): the same player name posts from the same device.
const deviceOf = player => createHash('sha256').update(`device|${player.toLowerCase()}`).digest('hex');

// Any well-formed replay: the Worker only checks its shape (the checker replays it later).
export const replayOf = ticks => encodeReplay(Array.from({ length: ticks }, (_, i) => ({ x: 64, y: (i % 50) - 25, grip: 30 })));

export function makeBoard(envExtra = {}) {
  const DB = memoryD1(), dispatches = [], waits = [];
  const env = { DB, RUN_CHECK_SECRET: SECRET, GITHUB_REPO: 'someone/space-chase', GITHUB_DISPATCH_TOKEN: 'github-token',
    CHECK_WORKFLOW: 'check-runs.yml', CHECK_REF: 'master', ...envExtra };
  const ctx = { waitUntil: p => waits.push(p) };

  async function call(method, path, { body, secret, device } = {}) {
    const headers = { 'content-type': 'application/json' };
    if (secret || device) headers.authorization = `Bearer ${secret ?? deviceOf(device)}`;
    const realFetch = globalThis.fetch;
    globalThis.fetch = async (url, init) => { dispatches.push({ url, body: JSON.parse(init.body), auth: init.headers.authorization }); return new Response(null, { status: 204 }); };
    try {
      const res = await worker.fetch(new Request(`http://board.test${path}`, { method, headers, body: body && JSON.stringify(body) }), env, ctx);
      await Promise.all(waits.splice(0));
      return { status: res.status, body: await res.json() };
    } finally { globalThis.fetch = realFetch; }
  }

  async function scheduled() {
    const realFetch = globalThis.fetch, realLog = console.log;
    globalThis.fetch = async (url, init) => { dispatches.push({ url, body: JSON.parse(init.body) }); return new Response(null, { status: 204 }); };
    console.log = () => {};
    try { await worker.scheduled({ cron: '35 * * * *' }, env, ctx); } finally { globalThis.fetch = realFetch; console.log = realLog; }
  }

  // device: whose device posts it (default: the player of that name's own).
  const post = (name, score, { device = name, ...extra } = {}) => call('POST', '/score', { device,
    body: { mode: 'flight', day: TODAY, name, score, simVersion: SIM_VERSION, replay: replayOf(600 + score % 97), ...extra } });
  const top = (mode = 'flight', day = TODAY) => call('GET', `/top?mode=${mode}&day=${day}`).then(r => r.body);
  const pending = (secret = SECRET) => call('GET', '/checks/pending', { secret });
  const verdicts = (list, secret = SECRET) => call('POST', '/checks/verdicts', { body: { verdicts: list }, secret });
  const verdict = (run, ok, why) => ({ mode: run.mode, day: run.day, key: run.key, at: run.at, score: run.score, ok, why });
  const row = (key, mode = 'flight', day = TODAY) =>
    DB.query('SELECT * FROM scores WHERE mode = ? AND day = ? AND name_key = ?', mode, day, key)[0];

  return { env, DB, dispatches, call, scheduled, post, top, pending, verdicts, verdict, row };
}
