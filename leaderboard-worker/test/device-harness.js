// Calls the Worker the way the game does, against a fake D1 (fake-d1.js): each "device" is a random key, sent as
// `Authorization: Bearer` like game/pods/leaderboard/device-key.js does.
import { randomBytes } from 'node:crypto';
import worker from '../src/worker.js';
import { swedishDay } from '../src/day-close.js';
import { fakeD1 } from './fake-d1.js';

export const GAME = 'http://localhost:8765';
export const today = () => swedishDay();
export const newDevice = () => randomBytes(32).toString('hex');
export const makeEnv = () => ({ DB: fakeD1() });

// → {status, body, headers}
export async function call(env, method, path, { body, key, origin = GAME, headers: extra = {} } = {}) {
  const headers = { 'cf-connecting-ip': '10.0.0.1', ...extra };
  if (origin) headers.origin = origin;
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (key) headers.authorization = `Bearer ${key}`;
  const res = await worker.fetch(new Request(`http://worker${path}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  }), env);
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null, headers: res.headers };
}

export const postScore = (env, key, name, score, { mode = 'flight', day = today(), ...extra } = {}) =>
  call(env, 'POST', '/score', { key, body: { mode, day, name, score, ...extra } });

// The day's rows straight from the table: {name_key: score} for one challenge.
export function rows(env, { mode = 'flight', day = today() } = {}) {
  const all = env.DB.raw.prepare('SELECT name_key, score FROM scores WHERE mode = ? AND day = ?').all(mode, day);
  return Object.fromEntries(all.map(r => [r.name_key, r.score]));
}

export const owners = env =>
  Object.fromEntries(env.DB.raw.prepare('SELECT name_key, owner FROM name_owners').all().map(r => [r.name_key, r.owner]));

// A row put there before names had owners (or by hand): nobody owns it.
export const oldRow = (env, name, score, { mode = 'flight', day = today() } = {}) =>
  env.DB.raw.prepare('INSERT INTO scores (mode, day, name_key, name, score, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(mode, day, name.toLowerCase(), name, score, Date.now() - 60_000);
