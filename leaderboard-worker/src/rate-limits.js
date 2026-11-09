// Caps how fast one address can call the board (Cloudflare's rate limiting, wrangler.toml [[ratelimits]]). A player
// sends one score per run, reads the board a few times per menu visit and logs in now and then, far below these. The
// address is only the counter's key for a minute; nothing here stores it. (Each email also gets at most a few login
// codes an hour, whatever the address, counted by its key: auth/login-codes-db.js.)
// Without the bindings (an older wrangler.toml), nothing is limited.
const BINDINGS = { write: 'SCORE_WRITES', read: 'SCORE_READS', auth: 'AUTH_REQUESTS' };

export async function overLimit(request, env, kind) {
  const limiter = env[BINDINGS[kind]];
  if (!limiter) return false;
  const key = request.headers.get('cf-connecting-ip') || 'unknown';
  try { return !(await limiter.limit({ key })).success; } catch { return false; }
}
