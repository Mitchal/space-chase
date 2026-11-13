// Space Chase's leaderboard: today's best runs per daily challenge.
//   POST /score  {mode, day, name, score, simVersion, replay, was?}  → {best, rank, players, top}   keeps each player's
//                best of the day, shown right away and checked afterwards by replaying the run (run-check-routes.js).
//                Needs the device's key (Authorization: Bearer, device-key.js), else 401 {error: 'key'}. A name belongs
//                to the first device that posts with it (name-owners.js): another device gets 422 {error: 'taken'}.
//                409 {error: 'update'} if the run was played in another version of the game, 422 {error: 'replay'} if
//                its replay is unreadable (run-shape.js).
//                was: the name used before a rename; if this device owns it, that day's rows move over (rename.js).
//                422 {error: 'name'} when the name isn't allowed (name-filter.js), so the game can ask for another.
//                409 {error: 'closed'} once that day has stopped taking scores (day-close.js).
//   GET  /top?mode=flight&day=2026-11-06  → {mode, day, players, top: [{name, score}]}
//   GET  /best?mode=survive&day=2026-11-12  → {mode, day, run: {name, score, simVersion, replay} | null}: the day's
//                leader with their run's input, so the game can show it being played.
//   GET  /month, GET /trophies: the calendar of past days (history-routes.js).
//   GET  /checks/pending, POST /checks/verdicts: for the run checker only (run-check-routes.js).
// Too many calls from one address in a minute: 429 (rate-limits.js). Every hour, closed days' top fives are kept for
// good once their runs are checked (podium-db.js), and days over 30 days old are deleted (cleanup.js).
import { originAllowed, corsHeaders } from './cors.js';
import { cleanMode, cleanDay, cleanName, cleanScore, nameKey } from './score-rules.js';
import { nameAllowed } from './name-filter.js';
import { overLimit } from './rate-limits.js';
import { dropOldDays } from './cleanup.js';
import { saveBest, rankOf, topScores, playerCount, leaderRun } from './scores-db.js';
import { deviceOwner } from './device-key.js';
import { claimName } from './name-owners.js';
import { renameDay } from './rename.js';
import { dayOpen, lastClosedDay } from './day-close.js';
import { archiveClosedDays, closedDaysWaiting } from './podium-db.js';
import { getMonth, getTrophies } from './history-routes.js';
import { json } from './json-response.js';
import { checkRunShape, MAX_BODY } from './run-shape.js'; // MAX_BODY: a score with its replay
import { getPending, postVerdicts } from './run-check-routes.js';
import { uncheckedCount } from './run-checks-db.js';
import { requestCheck } from './check-dispatch.js';

async function postScore(request, env, cors, url, ctx) {
  const owner = await deviceOwner(request);
  if (!owner) return json({ error: 'key' }, 401, cors);
  const text = await request.text();
  if (text.length > MAX_BODY) return json({ error: 'too big' }, 413, cors);
  let body;
  try { body = JSON.parse(text); } catch { return json({ error: 'expected JSON' }, 400, cors); }
  const mode = cleanMode(body?.mode), day = cleanDay(body?.day), score = cleanScore(body?.score);
  if (!mode || !day || score === null) return json({ error: 'bad mode, day or score' }, 400, cors);
  if (!dayOpen(day)) return json({ error: 'closed' }, 409, cors);
  const name = cleanName(body?.name);
  if (!name || !nameAllowed(name)) return json({ error: 'name' }, 422, cors);
  const run = checkRunShape(body);
  if (!run.ok) { const { ok, status, ...answer } = run; return json(answer, status, cors); }
  const where = { mode, day }, key = nameKey(name), was = cleanName(body?.was);
  if (!(await claimName(env.DB, key, owner))) return json({ error: 'taken' }, 422, cors);
  if (was) await renameDay(env.DB, { day, from: nameKey(was), to: key, name, owner });
  const best = await saveBest(env.DB, { ...where, key, name, score, simVersion: run.simVersion, replay: run.replay });
  if (best.check_status === 'unchecked') ctx?.waitUntil(requestCheck(env));
  const [rank, players, top] = await Promise.all([rankOf(env.DB, where, best), playerCount(env.DB, where), topScores(env.DB, where)]);
  return json({ mode, day, best: best.score, rank, players, top }, 200, cors);
}

async function getTop(url, env, cors) {
  const mode = cleanMode(url.searchParams.get('mode')), day = cleanDay(url.searchParams.get('day'));
  if (!mode || !day) return json({ error: 'bad mode or day' }, 400, cors);
  const where = { mode, day };
  const [players, top] = await Promise.all([playerCount(env.DB, where), topScores(env.DB, where)]);
  return json({ mode, day, players, top }, 200, cors);
}

async function getBest(url, env, cors) {
  const mode = cleanMode(url.searchParams.get('mode')), day = cleanDay(url.searchParams.get('day'));
  if (!mode || !day) return json({ error: 'bad mode or day' }, 400, cors);
  return json({ mode, day, run: await leaderRun(env.DB, { mode, day }) }, 200, cors);
}

const ROUTES = {
  'POST /score': [postScore, 'write'],
  'GET /top': [(req, env, cors, url) => getTop(url, env, cors), 'read'],
  'GET /best': [(req, env, cors, url) => getBest(url, env, cors), 'read'],
  'GET /month': [(req, env, cors, url) => getMonth(url, env, cors), 'read'],
  'GET /trophies': [(req, env, cors, url) => getTrophies(url, env, cors), 'read'],
  'GET /checks/pending': [getPending, 'read'],
  'POST /checks/verdicts': [postVerdicts, 'read'],
};

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('origin'), cors = corsHeaders(origin);
    if (!originAllowed(origin)) return json({ error: 'origin not allowed' }, 403, {});
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url), route = ROUTES[`${request.method} ${url.pathname}`];
    if (!route) return json({ error: 'not found' }, 404, cors);
    try {
      if (await overLimit(request, env, route[1])) return json({ error: 'slow down' }, 429, cors);
      return await route[0](request, env, cors, url, ctx);
    } catch (err) {
      console.error(err);
      return json({ error: 'server error' }, 500, cors);
    }
  },

  // Hourly: keep the top fives of days that have closed and been checked, then forget old days (in that order, so
  // nothing is missed). Runs still waiting for their check get the checker started again.
  async scheduled(event, env) {
    const closed = lastClosedDay(), kept = await archiveClosedDays(env.DB, closed);
    const [waiting, unchecked] = await Promise.all([closedDaysWaiting(env.DB, closed), uncheckedCount(env.DB)]);
    const dispatch = unchecked ? await requestCheck(env) : 'nothing to check';
    console.log(`podium: kept ${kept} rows, ${waiting} closed days waiting for checks; ${unchecked} runs unchecked `
      + `(checker: ${dispatch}); cleanup: removed ${await dropOldDays(env.DB)} old rows`);
  },
};
