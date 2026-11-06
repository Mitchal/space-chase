// Caps how fast one address can call the board (Cloudflare's rate limiting, wrangler.toml [[ratelimits]]). A player
// sends one score per run and reads the board a few times per menu visit, far below these. The address is only the
// counter's key for a minute; nothing here stores it.
// Without the bindings (an older wrangler.toml), nothing is limited.
export async function overLimit(request, env, kind) {
  const limiter = kind === 'write' ? env.SCORE_WRITES : env.SCORE_READS;
  if (!limiter) return false;
  const key = request.headers.get('cf-connecting-ip') || 'unknown';
  try { return !(await limiter.limit({ key })).success; } catch { return false; }
}
