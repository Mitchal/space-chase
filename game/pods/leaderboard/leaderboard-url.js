// Where the family leaderboard lives. Paste the Worker's address here once it's deployed (leaderboard-worker/README.md),
// e.g. 'https://space-chase-leaderboard.your-name.workers.dev'. Left empty, there's no board and the game is as before.
const DEPLOYED = '';

// While developing on this machine, ?leaderboard=http://127.0.0.1:8787 points the game at a local Worker instead.
const LOCAL_PAGE = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const asked = LOCAL_PAGE ? new URLSearchParams(location.search).get('leaderboard') : null;

export const LEADERBOARD_URL = (asked ?? DEPLOYED).replace(/\/+$/, '');
