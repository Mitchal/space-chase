// Your own account, for the game's profile screen. Each needs "Authorization: Bearer <token>" (auth-routes.js);
// without a working one: 401 {error: 'login'}.
//   GET    /me          → {account: {id, email, name}}
//   POST   /me {name}   → {account}; the name shown on the boards (1 to 16 characters, not unique).
//                          422 {error: 'name'} when the name filter refuses it.
//   DELETE /me          → {ok: true}: the account, its email, sessions and scores are gone (players-db.js).
import { json } from '../json-response.js';
import { readJsonBody } from '../read-json-body.js';
import { sessionPlayer } from '../auth/sessions-db.js';
import { publicAccount } from '../auth/auth-routes.js';
import { cleanName } from '../score-rules.js';
import { nameAllowed } from '../name-filter.js';
import { rename, deleteAccount } from './players-db.js';

export const loginNeeded = cors => json({ error: 'login' }, 401, cors);

export async function getMe(request, env, cors) {
  const player = await sessionPlayer(request, env.DB);
  return player ? json({ account: publicAccount(player) }, 200, cors) : loginNeeded(cors);
}

export async function postMe(request, env, cors) {
  const player = await sessionPlayer(request, env.DB);
  if (!player) return loginNeeded(cors);
  const { body, error } = await readJsonBody(request, cors);
  if (error) return error;
  const name = cleanName(body.name);
  if (!name || !nameAllowed(name)) return json({ error: 'name' }, 422, cors);
  await rename(env.DB, player.id, name);
  return json({ account: publicAccount({ ...player, name }) }, 200, cors);
}

export async function deleteMe(request, env, cors) {
  const player = await sessionPlayer(request, env.DB);
  if (!player) return loginNeeded(cors);
  await deleteAccount(env.DB, player);
  return json({ ok: true }, 200, cors);
}
