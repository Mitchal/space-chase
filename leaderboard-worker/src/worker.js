// Space Chase's leaderboard: today's best runs per daily challenge.
//   POST /score  {mode, day, name, score, was?}  → {best, rank, players, top}   keeps each player's best of the day;
//                was: the name used before a rename, whose row for that day is dropped
//   GET  /top?mode=flight&day=2026-11-06  → {mode, day, players, top: [{name, score}]}
import { originAllowed, corsHeaders } from './cors.js';
import { cleanMode, cleanDay, cleanName, cleanScore, nameKey } from './score-rules.js';
import { saveBest, dropRow, rankOf, topScores, playerCount } from './scores-db.js';

const json = (body, status, cors) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...cors },
});

async function postScore(request, env, cors) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'expected JSON' }, 400, cors); }
  const mode = cleanMode(body?.mode), day = cleanDay(body?.day), name = cleanName(body?.name), score = cleanScore(body?.score);
  if (!mode || !day || !name || score === null) return json({ error: 'bad mode, day, name or score' }, 400, cors);
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

export default {
  async fetch(request, env) {
    const origin = request.headers.get('origin'), cors = corsHeaders(origin);
    if (!originAllowed(origin)) return json({ error: 'origin not allowed' }, 403, {});
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url);
    try {
      if (url.pathname === '/score' && request.method === 'POST') return await postScore(request, env, cors);
      if (url.pathname === '/top' && request.method === 'GET') return await getTop(url, env, cors);
      return json({ error: 'not found' }, 404, cors);
    } catch (err) {
      console.error(err);
      return json({ error: 'server error' }, 500, cors);
    }
  },
};
