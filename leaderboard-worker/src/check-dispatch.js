// Asks GitHub to start the run checker (.github/workflows/check-runs.yml) when there's something to check: after a
// score is stored unchecked, and from the hourly job while any run is still waiting. At most once a minute
// (DISPATCH_GAP_MS): the checker takes every run waiting and keeps looking for a minute more, so nothing that arrived
// in between is missed. GitHub itself starts it every few hours too, as a backstop.
// Needs the Worker secret GITHUB_DISPATCH_TOKEN: a fine-grained GitHub token for this repository only, with just
// "Actions: read and write" (README). Without it (as on your computer), nothing is sent.
export const DISPATCH_GAP_MS = 60_000;

// → 'off' (no token), 'throttled', 'sent' or 'failed'.
export async function requestCheck(env, now = Date.now()) {
  const token = env.GITHUB_DISPATCH_TOKEN, repo = env.GITHUB_REPO, workflow = env.CHECK_WORKFLOW || 'check-runs.yml';
  if (!token || !repo) return 'off';
  // Claims the minute: only the request that moves last_at forward sends.
  const { meta } = await env.DB.prepare('UPDATE check_dispatch SET last_at = ?1 WHERE id = 1 AND last_at <= ?2')
    .bind(now, now - DISPATCH_GAP_MS).run();
  if (!meta?.changes) return 'throttled';
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        'user-agent': 'space-chase-leaderboard',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ ref: env.CHECK_REF || 'master' }),
    });
    if (res.ok) return 'sent';
    console.error(`check dispatch: GitHub answered ${res.status} ${(await res.text()).slice(0, 200)}`);
  } catch (err) {
    console.error('check dispatch:', err);
  }
  return 'failed';
}
