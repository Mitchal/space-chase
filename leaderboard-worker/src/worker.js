// Space Chase's leaderboard: today's best runs per daily challenge.
//   POST /score  {mode, day, name, score, simVersion, replay, was?}  → {best, rank, players, top}   keeps each player's
//                best of the day. The score only counts if replaying the run gives exactly it (verify-run.js):
//                422 {error: 'replay'} if not, 409 {error: 'update'} if the run was played in another version of the game.
//                was: the name used before a rename, whose row for that day is dropped.
//                422 {error: 'name'} when the name isn't allowed (name-filter.js), so the game can ask for another.
//                409 {error: 'closed'} once that day has stopped taking scores (day-close.js).
//   GET  /top?mode=flight&day=2026-11-06  → {mode, day, players, top: [{name, score}]}
//   GET  /month, GET /trophies: the calendar of past days (history-routes.js).
// Too many calls from one address in a minute: 429 (rate-limits.js). Every hour, closed days' top fives are kept for
// good (podium-db.js), and days over 30 days old are deleted (cleanup.js).
import { originAllowed, corsHeaders } from './cors.js';
import { cleanMode, cleanDay, cleanName, cleanScore, nameKey } from './score-rules.js';
import { nameAllowed } from './name-filter.js';
import { overLimit } from './rate-limits.js';
import { dropOldDays } from './cleanup.js';
import { saveBest, dropRow, rankOf, topScores, playerCount } from './scores-db.js';
import { dayOpen, lastClosedDay } from './day-close.js';
import { archiveClosedDays } from './podium-db.js';
import { getMonth, getTrophies } from './history-routes.js';
import { json } from './json-response.js';
import { verifyRun, MAX_BODY } from './verify-run.js'; // MAX_BODY: a score with its replay


async function postScore(request, env, cors) {
  const text = await request.text();
  if (text.length > MAX_BODY) return json({ error: 'too big' }, 413, cors);
  let body;
  try { body = JSON.parse(text); } catch { return json({ error: 'expected JSON' }, 400, cors); }
  const mode = cleanMode(body?.mode), day = cleanDay(body?.day), claimed = cleanScore(body?.score);
  if (!mode || !day || claimed === null) return json({ error: 'bad mode, day or score' }, 400, cors);
  if (!dayOpen(day)) return json({ error: 'closed' }, 409, cors);
  const name = cleanName(body?.name);
  if (!name || !nameAllowed(name)) return json({ error: 'name' }, 422, cors);
  const run = verifyRun(body, { mode, day, claimed });
  if (!run.ok) { const { ok, status, ...answer } = run; return json(answer, status, cors); }
  const score = run.score;
  const where = { mode, day }, key = nameKey(name), was = cleanName(body?.was);
  if (was && nameKey(was) !== key) await dropRow(env.DB, { ...where, key: nameKey(was) });
  const best = await saveBest(env.DB, { ...where, key, name, score });
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

const ROUTES = {
  'POST /score': [postScore, 'write'],
  'GET /top': [(req, env, cors, url) => getTop(url, env, cors), 'read'],
  'GET /month': [(req, env, cors, url) => getMonth(url, env, cors), 'read'],
  'GET /trophies': [(req, env, cors, url) => getTrophies(url, env, cors), 'read'],
};

export default {
  async fetch(request, env) {
    const origin = request.headers.get('origin'), cors = corsHeaders(origin);
    if (!originAllowed(origin)) return json({ error: 'origin not allowed' }, 403, {});
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url), route = ROUTES[`${request.method} ${url.pathname}`];
    if (!route) return json({ error: 'not found' }, 404, cors);
    try {
      if (await overLimit(request, env, route[1])) return json({ error: 'slow down' }, 429, cors);
      return await route[0](request, env, cors, url);
    } catch (err) {
      console.error(err);
      return json({ error: 'server error' }, 500, cors);
    }
  },

  // Hourly: keep the top fives of days that have closed, then forget old days (in that order, so nothing is missed).
  async scheduled(event, env) {
    const kept = await archiveClosedDays(env.DB, lastClosedDay());
    console.log(`podium: kept ${kept} rows; cleanup: removed ${await dropOldDays(env.DB)} old rows`);
  },
};
