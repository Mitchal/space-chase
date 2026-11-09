// Space Chase's leaderboard: today's best runs per daily challenge, posted by players logged in with their email.
//   POST /score  {mode, day, score}  → {best, rank, players, top}   keeps each player's best of the day. Needs
//                "Authorization: Bearer <token>" (auth/auth-routes.js): 401 {error: 'login'} without a working one,
//                422 {error: 'no name'} while the account has no name yet (accounts/profile-routes.js).
//                409 {error: 'closed'} once that day has stopped taking scores (day-close.js).
//   GET  /top?mode=flight&day=2026-11-06  → {mode, day, players, top: [{id, name, score}]}
//   GET  /month, GET /trophies: the calendar of past days (history-routes.js).
//   POST /auth/start, /auth/verify, /auth/logout: logging in with an emailed code (auth/auth-routes.js).
//   GET, POST, DELETE /me: your account (accounts/profile-routes.js).
// Too many calls from one address in a minute: 429 (rate-limits.js). Every hour, closed days' top fives are kept for
// good (podium-db.js), and old days, expired sessions and spent login codes are deleted (cleanup.js).
import { originAllowed, corsHeaders } from './cors.js';
import { cleanMode, cleanDay, cleanScore } from './score-rules.js';
import { overLimit } from './rate-limits.js';
import { cleanUp } from './cleanup.js';
import { saveBest, rankOf, topScores, playerCount } from './scores-db.js';
import { dayOpen, lastClosedDay } from './day-close.js';
import { archiveClosedDays } from './podium-db.js';
import { getMonth, getTrophies } from './history-routes.js';
import { postStart, postVerify, postLogout } from './auth/auth-routes.js';
import { sessionPlayer } from './auth/sessions-db.js';
import { getMe, postMe, deleteMe, loginNeeded } from './accounts/profile-routes.js';
import { json } from './json-response.js';

const MAX_BODY = 1024; // bytes; a real score is about 100

async function postScore(request, env, cors) {
  const player = await sessionPlayer(request, env.DB);
  if (!player) return loginNeeded(cors);
  const text = await request.text();
  if (text.length > MAX_BODY) return json({ error: 'too big' }, 413, cors);
  let body;
  try { body = JSON.parse(text); } catch { return json({ error: 'expected JSON' }, 400, cors); }
  const mode = cleanMode(body?.mode), day = cleanDay(body?.day), score = cleanScore(body?.score);
  if (!mode || !day || score === null) return json({ error: 'bad mode, day or score' }, 400, cors);
  if (!dayOpen(day)) return json({ error: 'closed' }, 409, cors);
  if (!player.name) return json({ error: 'no name' }, 422, cors);
  const where = { mode, day };
  const best = await saveBest(env.DB, { ...where, playerId: player.id, score });
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
  'POST /auth/start': [postStart, 'auth'],
  'POST /auth/verify': [postVerify, 'auth'],
  'POST /auth/logout': [postLogout, 'write'],
  'GET /me': [getMe, 'read'],
  'POST /me': [postMe, 'write'],
  'DELETE /me': [deleteMe, 'write'],
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
    console.log(`podium: kept ${kept} rows; cleanup: removed ${JSON.stringify(await cleanUp(env.DB))}`);
  },
};
