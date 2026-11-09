// The leaderboard Worker's two calls for the checker (leaderboard-worker/src/run-check-routes.js), with the shared
// secret. board: the Worker's address; secret: RUN_CHECK_SECRET.
export function boardCalls(board, secret) {
  const base = board.replace(/\/+$/, '');
  const call = async (path, init = {}) => {
    const res = await fetch(base + path, {
      ...init, headers: { authorization: `Bearer ${secret}`, 'content-type': 'application/json', ...init.headers },
    });
    if (!res.ok) throw new Error(`${init.method || 'GET'} ${path}: ${res.status} ${(await res.text()).slice(0, 200)}`);
    return res.json();
  };
  return {
    // The oldest unchecked runs: [{mode, day, key, at, score, simVersion, replay}].
    pending: async limit => (await call(`/checks/pending?limit=${limit}`)).runs,
    // verdicts: [{mode, day, key, at, score, ok, why?}] → how many rows changed.
    send: async verdicts => (await call('/checks/verdicts', { method: 'POST', body: JSON.stringify({ verdicts }) })).applied,
  };
}
