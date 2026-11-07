// The game's calendar reads: a month of daily top fives, and one player's trophies.
//   GET /month?m=2026-11  → {month, days: {'2026-11-06': {final, closes?, modes: {flight: [{name, score}], …}}}}
//                            final: the day has stopped taking scores; closes: when an open day will (ms since 1970).
//   GET /trophies?name=Anna → {trophies: [{mode, day, place}]}: places 1 to 3 of closed days, newest first.
import { json } from './json-response.js';
import { cleanMonth, cleanName, nameKey } from './score-rules.js';
import { lastClosedDay, closesAt } from './day-close.js';
import { podiumBetween, liveBetween, trophiesOf } from './podium-db.js';

const FINAL_MONTH_CACHE = 'public, max-age=3600'; // a month whose days have all closed changes only by hand

export async function getMonth(url, env, cors) {
  const month = cleanMonth(url.searchParams.get('m'));
  if (!month) return json({ error: 'bad month' }, 400, cors);
  const from = `${month}-01`, to = `${month}-31`, closed = lastClosedDay();
  const [kept, live] = await Promise.all([podiumBetween(env.DB, from, to), liveBetween(env.DB, from, to)]);
  const days = {};
  for (const r of [...kept, ...live]) {
    const d = days[r.day] ??= r.day <= closed ? { final: true, modes: {} } : { final: false, closes: closesAt(r.day), modes: {} };
    (d.modes[r.mode] ??= [])[r.place - 1] = { name: r.name, score: r.score };
  }
  return json({ month, days }, 200, cors, to <= closed ? FINAL_MONTH_CACHE : 'no-store');
}

export async function getTrophies(url, env, cors) {
  const name = cleanName(url.searchParams.get('name'));
  if (!name) return json({ error: 'bad name' }, 400, cors);
  return json({ trophies: await trophiesOf(env.DB, nameKey(name)) }, 200, cors);
}
