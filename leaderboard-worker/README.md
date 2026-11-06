# Space Chase leaderboard

A small Cloudflare Worker with a D1 (SQLite) database. It keeps each player's best score per daily challenge per day,
and the game shows today's top scores on the main menu and under the results. It runs on Cloudflare's free plan
(100,000 requests a day, which is roughly a thousand daily players) and never goes to sleep.

Until its address is in `game/pods/leaderboard/leaderboard-url.js`, the game has no board and works exactly as before.

## Put it online (once, about 10 minutes)

All commands run in this folder (`leaderboard-worker/`).

1. **Make a free Cloudflare account** at https://dash.cloudflare.com/sign-up. No card is needed for the free plan.
2. **Install the tools:**
   ```bash
   npm install
   ```
3. **Log in** (opens the browser; approve it there):
   ```bash
   npx wrangler login
   ```
4. **Create the database:**
   ```bash
   npx wrangler d1 create space-chase-leaderboard
   ```
   It prints a `database_id`. Paste it into `wrangler.toml` in place of `00000000-0000-0000-0000-000000000000`.
   (If wrangler offers to add the database to the config for you, say no: it's already there.)
5. **Create the table:**
   ```bash
   npm run db:remote
   ```
6. **Deploy:**
   ```bash
   npm run deploy
   ```
   The first time, it asks you to pick a `workers.dev` subdomain. At the end it prints the Worker's address, like
   `https://space-chase-leaderboard.your-name.workers.dev`.
7. **Check it answers** (use today's date):
   ```bash
   curl "https://space-chase-leaderboard.your-name.workers.dev/top?mode=flight&day=2026-11-06"
   ```
   You should see `{"mode":"flight","day":"2026-11-06","players":0,"top":[]}`.
8. **Tell the game:** paste the address into `DEPLOYED` in `game/pods/leaderboard/leaderboard-url.js`, then release as
   usual (bump the version, push to `master`). The Android app picks it up with its next build.

The first time a player finishes a daily run, the board shows under the results with a box for their name. Names are
kept on each device; the same name on two devices counts as one player (capitals don't matter).

## Run it on your computer

```bash
npm run db:local
npm run dev
```

Then start the game as usual (`npm run dev` in the repo root) and open
http://localhost:8765/?leaderboard=http://127.0.0.1:8787 to play against the local board. The `?leaderboard=` switch
only works on localhost. The local database lives in `.wrangler/`; delete that folder to start over.

## Look after it

- **Who can post:** browsers only from the game's own addresses (spacechase.mikaelbrandt.com, mitchal.github.io, the
  Android app and localhost); the list is in `src/cors.js`. If the game moves to another address, add it there and deploy.
- **Checks:** a known date (within a day of today), a name of 1 to 16 characters, and a whole-number score from 0 to
  10,000,000.
- **Names:** `src/name-filter.js` refuses the obvious slurs and swearing (English and Swedish, also spelled with
  digits or dots). The game then asks the player for another name. Add words there as they turn up.
- **Floods:** one address can send 20 scores and read the board 120 times a minute (`[[ratelimits]]` in
  `wrangler.toml`); beyond that it gets "slow down" and the game just doesn't show the board for a moment. A whole
  household on one Wi-Fi counts as one address, which these numbers allow for. Requests refused this way still count
  towards the free plan's 100,000 a day; if that's ever used up, the board stops showing until the next day and the
  game carries on without it.
- **Old days:** once a day (03:30 UTC) rows older than 30 days are deleted (`src/cleanup.js`, `[triggers]` in
  `wrangler.toml`). The privacy page promises 30 days, so change both together.
- **No anti-cheat:** anyone who looks at the game's code can send a made-up score from a terminal. If that happens,
  remove the row (below).
- **Remove a row** (a test name, a made-up score, a rude name, or someone asking to be removed):
  ```bash
  npx wrangler d1 execute space-chase-leaderboard --remote --command "DELETE FROM scores WHERE name_key = 'test'"
  ```
- **See everything from one day:**
  ```bash
  npx wrangler d1 execute space-chase-leaderboard --remote --command "SELECT * FROM scores WHERE day = '2026-11-06' ORDER BY mode, score DESC"
  ```

## The API

- `POST /score` with JSON `{mode, day, name, score, was?}` keeps the player's best for that day and returns
  `{best, rank, players, top}`. `was` is the name used before a rename: that name's row for the day is dropped.
  A refused name gets 422 `{"error":"name"}`; too many calls from one address get 429.
- `GET /top?mode=flight&day=2026-11-06` returns `{players, top: [{name, score}]}`, the top ten.

`mode` is the game mode's id: `flight` (Escape, in points) or `survive` (milliseconds). Higher is better in both.
