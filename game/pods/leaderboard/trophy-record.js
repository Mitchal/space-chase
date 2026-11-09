// Your trophies: gold, silver and bronze from closed days (the Worker hands them out at 35 past each hour, so a fetch
// is kept until its next run), and which ones you've already been told about. They belong to your account: logged
// out, you have none to show; log in on another device and they're there too. (Trophies won under a name typed before
// accounts stay with that name on the calendar.)
import { readSaved, writeSaved } from '../../core/storage.js';
import { fetchTrophies } from './leaderboard-api.js';
import { myId } from './session-record.js';

const KEY = 'spacechase.trophies.v2', SEEN_KEY = 'spacechase.trophiesSeen.v2';
const HOUR_MS = 3_600_000, JOB_MS = 36 * 60_000; // the Worker's hourly job (wrangler.toml: 35 past), plus a minute to run
// Which run of the job a moment comes after: a fetch from before the latest run may be missing a trophy.
const jobRun = ms => Math.floor((ms - JOB_MS) / HOUR_MS);
const idOf = (player, t) => `${player}/${t.mode}/${t.day}`; // a player places at most once per challenge per day

// [{mode, day, place}] newest first, as last fetched for the account you're logged in to.
export function trophies() {
  const player = myId(), saved = readSaved(KEY);
  return player && saved?.player === player && Array.isArray(saved.list) ? saved.list : [];
}

// Fetches them again once the job has run since the last fetch (or for another account); resolves to the list either
// way. fresh: fetch now whatever the time (the profile screen).
export async function refreshTrophies({ now = Date.now(), fresh = false } = {}) {
  const player = myId(), saved = readSaved(KEY);
  if (!player) return [];
  if (!fresh && saved?.player === player && jobRun(saved.at) === jobRun(now)) return saved.list;
  const answer = await fetchTrophies(player);
  if (!Array.isArray(answer?.trophies)) return trophies();
  writeSaved(KEY, { player, at: now, list: answer.trophies });
  return answer.trophies;
}

const seenIds = () => new Set(readSaved(SEEN_KEY) ?? []);

// The trophies you haven't been shown yet, newest first.
export function unseen() {
  const player = myId(), seen = seenIds();
  return player ? trophies().filter(t => !seen.has(idOf(player, t))) : [];
}

export function markSeen() {
  const player = myId(), seen = seenIds();
  if (!player) return;
  for (const t of trophies()) seen.add(idOf(player, t));
  writeSaved(SEEN_KEY, [...seen]);
}
