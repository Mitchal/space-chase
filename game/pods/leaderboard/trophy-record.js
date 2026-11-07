// Your trophies: gold, silver and bronze from closed days (the Worker hands them out once an hour, so a fetch is kept
// for an hour), and which ones you've already been told about. They belong to the name you go by: change it, and
// you see the new name's trophies (changing back brings yours back).
import { readSaved, writeSaved } from '../../core/storage.js';
import { fetchTrophies } from './leaderboard-api.js';
import { loadName } from './player-record.js';

const KEY = 'spacechase.trophies.v1', SEEN_KEY = 'spacechase.trophiesSeen.v1', FRESH_MS = 3_600_000;
const keyOf = name => name.toLocaleLowerCase('en');
const idOf = (name, t) => `${keyOf(name)}/${t.mode}/${t.day}`; // a name places at most once per challenge per day

// [{mode, day, place}] newest first, as last fetched for the name you go by now.
export function trophies() {
  const name = loadName(), saved = readSaved(KEY);
  return name && saved?.key === keyOf(name) && Array.isArray(saved.list) ? saved.list : [];
}

// Fetches them again when the saved ones are over an hour old (or someone else's); resolves to the list either way.
export async function refreshTrophies(now = Date.now()) {
  const name = loadName(), saved = readSaved(KEY);
  if (!name) return [];
  if (saved?.key === keyOf(name) && now - saved.at < FRESH_MS) return saved.list;
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
