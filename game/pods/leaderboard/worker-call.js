// One request to the leaderboard Worker (leaderboard-worker/). Every call resolves, never throws: null when the board
// can't be reached (offline, no Worker, a slow network, a server error), so the game simply carries on without it.
// answers: error statuses the caller handles itself (e.g. 422 for a refused name); their {error} body comes back.
import { LEADERBOARD_URL } from './leaderboard-url.js';
import { authHeader, forgetSession } from './session-record.js';

const TIMEOUT_MS = 6000;

export async function call(path, init = {}, answers = []) {
  const stop = new AbortController(), timer = setTimeout(() => stop.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(LEADERBOARD_URL + path, { ...init, signal: stop.signal });
    return res.ok || answers.includes(res.status) ? await res.json() : null;
  } catch { return null; } finally { clearTimeout(timer); }
}

// A call as the logged-in player (the token from session-record.js). A 401 means the login ran out or was ended
// elsewhere: it's forgotten here, and the answer is {error: 'login'} so the caller can ask to log in again.
export async function callAsPlayer(path, { method = 'GET', body } = {}, answers = []) {
  const headers = { ...authHeader(), ...(body === undefined ? {} : { 'content-type': 'application/json' }) };
  const answer = await call(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }, [401, ...answers]);
  if (answer?.error === 'login') forgetSession();
  return answer;
}
