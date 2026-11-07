// Your trophies: gold, silver and bronze from closed days (the Worker hands them out at 35 past each hour, so a fetch
// is kept until its next run), and which ones you've already been told about. They belong to the name you go by: change it, and
// you see the new name's trophies (changing back brings yours back).
import { readSaved, writeSaved } from '../../core/storage.js';
import { fetchTrophies } from './leaderboard-api.js';
import { loadName } from './player-record.js';

const KEY = 'spacechase.trophies.v1', SEEN_KEY = 'spacechase.trophiesSeen.v1';
const HOUR_MS = 3_600_000, JOB_MS = 36 * 60_000; // the Worker's hourly job (wrangler.toml: 35 past), plus a minute to run
// Which run of the job a moment comes after: a fetch from before the latest run may be missing a trophy.
const jobRun = ms => Math.floor((ms - JOB_MS) / HOUR_MS);
const keyOf = name => name.toLocaleLowerCase('en');
const idOf = (name, t) => `${keyOf(name)}/${t.mode}/${t.day}`; // a name places at most once per challenge per day

// [{mode, day, place}] newest first, as last fetched for the name you go by now.
export function trophies() {
  const name = loadName(), saved = readSaved(KEY);
  return name && saved?.key === keyOf(name) && Array.isArray(saved.list) ? saved.list : [];
}

// Fetches them again once the job has run since the last fetch (or for another name); resolves to the list either way.
export async function refreshTrophies(now = Date.now()) {
  const name = loadName(), saved = readSaved(KEY);
  if (!name) return [];
  if (saved?.key === keyOf(name) && jobRun(saved.at) === jobRun(now)) return saved.list;
  const answer = await fetchTrophies(name);
  if (!Array.isArray(answer?.trophies)) return trophies();
  writeSaved(KEY, { key: keyOf(name), at: now, list: answer.trophies });
  return answer.trophies;
}

const seenIds = () => new Set(readSaved(SEEN_KEY) ?? []);

// The trophies you haven't been shown yet, newest first.
export function unseen() {
  const name = loadName(), seen = seenIds();
  return name ? trophies().filter(t => !seen.has(idOf(name, t))) : [];
}

export function markSeen() {
  const name = loadName(), seen = seenIds();
  if (!name) return;
  for (const t of trophies()) seen.add(idOf(name, t));
  writeSaved(SEEN_KEY, [...seen]);
}
