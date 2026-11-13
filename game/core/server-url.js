// Where the game's server lives: one small Cloudflare Worker (leaderboard-worker/) that keeps the leaderboard and sends
// the daily reminder on the web. Paste its address here once it's deployed (leaderboard-worker/README.md), e.g.
// 'https://space-chase-leaderboard.your-name.workers.dev'. Left empty, pods that need it do nothing.
const DEPLOYED = 'https://space-chase-leaderboard.mikael-brandt90.workers.dev';

// While developing on this machine, ?leaderboard=http://127.0.0.1:8787 points the game at a local Worker instead.
const LOCAL_PAGE = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const asked = LOCAL_PAGE ? new URLSearchParams(location.search).get('leaderboard') : null;

export const SERVER_URL = (asked ?? DEPLOYED).replace(/\/+$/, '');
