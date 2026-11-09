# Space Chase leaderboard

A small Cloudflare Worker with a D1 (SQLite) database. It keeps each player's best score per daily challenge per day,
and the game shows today's top scores on the main menu and under the results. Each day's top five is kept for good:
the game's calendar shows any past day, and places 1 to 3 are that player's gold, silver and bronze trophies. It was built for Cloudflare's free plan
(100,000 requests a day, which is roughly a thousand daily players) and never goes to sleep; replaying every score
needs more CPU than the free plan gives one request (see "Every score is replayed" below).

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
5. **Create the tables:**
   ```bash
   npm run db:remote
   ```
   Run it again whenever `migrations/` gets a new file, before deploying.
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

To run the hourly job by hand while it's running: `curl "http://127.0.0.1:8787/__scheduled?cron=35+*+*+*+*"`.

`npm run dev` first lists the game's pods for the bundled simulation (`[build]` in `wrangler.toml`) and rebuilds when
the game's code changes. `node tests/post-replays.js` in the repo root plays long runs of today's challenges and posts
them to the local Worker, timing each.

Then start the game as usual (`npm run dev` in the repo root) and open
http://localhost:8765/?leaderboard=http://127.0.0.1:8787 to play against the local board. The `?leaderboard=` switch
only works on localhost. The local database lives in `.wrangler/`; delete that folder to start over.

## Look after it

- **Who can post:** browsers only from the game's own addresses (spacechase.mikaelbrandt.com, mitchal.github.io, the
  Android app and localhost); the list is in `src/cors.js`. If the game moves to another address, add it there and deploy.
- **Checks:** a known date (within a day of today), a name of 1 to 16 characters, a whole-number score from 0 to
  10,000,000, and then the score itself, by replaying the run (below).
- **Names:** `src/name-filter.js` refuses the obvious slurs and swearing (English and Swedish, also spelled with
  digits or dots). The game then asks the player for another name. Add words there as they turn up.
- **Floods:** one address can send 20 scores and read the board 120 times a minute (`[[ratelimits]]` in
  `wrangler.toml`); beyond that it gets "slow down" and the game just doesn't show the board for a moment. A whole
  household on one Wi-Fi counts as one address, which these numbers allow for. Requests refused this way still count
  towards the free plan's 100,000 a day; if that's ever used up, the board stops showing until the next day and the
  game carries on without it.
- **When a day closes:** the game's day is Sweden's date for everyone, so each day's course and board turn over at
  midnight in Sweden. A run already flying at midnight still counts for the day it started if it lands within 30
  minutes; then the day is final (`src/day-close.js`, and `game/core/game-day.js` in the game).
- **Every hour at half past** (`[triggers]` in `wrangler.toml`): each closed day's top five per challenge is copied into the
  `podium` table and kept for good (`src/podium-db.js`); then scores rows older than 30 days are deleted
  (`src/cleanup.js`). The privacy page describes both, so change them together.
- **Every score is replayed:** the game sends each score with its run's input (one small frame per 1/60 s tick: the
  steering direction and grip, packed into a few kB) and the version of the game's simulation it was played in. The
  Worker bundles the game's own simulation (`../game/core/` and every `../game/pods/*/sim.js`, listed by
  `tools/list-sim-pods.js` before each build), plays the run again from the day's seed and keeps the score that comes
  out, which must equal the score claimed (`src/verify-run.js`). The simulation is deterministic to the bit on every
  engine (`npm run lint` checks it; `npm test` replays recorded runs), so an honest run always checks out.
  - A made-up score, or a replay that's been edited, cut short or padded, gets 422 `{"error":"replay"}` (and a log line
    `replay mismatch` when only the score was off: worth a look if it ever shows up for an honest player).
  - A run played in another version of the game gets 409 `{"error":"update"}`: its replay can't be checked by this
    simulation. The game then says "Update the game to put your scores on the board." So **deploy the Worker together
    with each game release that changes `SIM_VERSION`** (`game/core/sim-version.js`): until both are out, scores from the
    side that's ahead are turned away.
  - What it can't catch: who or what was steering. A bot, a script or a slowed-down tool-assisted run sends genuinely
    valid input and passes. Replays from before this check (game 1.4.x) can't be checked at all.
  - **Cost:** replaying is real work: about 20 to 30 µs of CPU per tick, so roughly 100 ms for a minute-long Escape run
    and up to ~400 ms for the longest possible one (~4 minutes; `npm run bench:replay` in the repo root measures it).
    The free plan allows 10 ms of CPU per request, so on the free plan long runs' scores would be cut off with an
    error. Decide how to run it (Workers Paid, or checking only some scores, or checking later) before deploying.
- **Remove a row** (a test name, a made-up score, a rude name, or someone asking to be removed):
  ```bash
  npx wrangler d1 execute space-chase-leaderboard --remote --command "DELETE FROM scores WHERE name_key = 'test'"
  ```
  If the day has already closed, its top five is kept separately too. Remove the name there as well, then delete that
  day's kept rows so the next hourly run rebuilds them from the scores (and whoever was 6th moves up). This works for
  days under 30 days old; for older ones, only the name's rows go:
  ```bash
  npx wrangler d1 execute space-chase-leaderboard --remote --command "DELETE FROM podium WHERE name_key = 'test'"
  npx wrangler d1 execute space-chase-leaderboard --remote --command "DELETE FROM podium WHERE day = '2026-11-06' AND mode = 'flight'"
  ```
- **See everything from one day:**
  ```bash
  npx wrangler d1 execute space-chase-leaderboard --remote --command "SELECT * FROM scores WHERE day = '2026-11-06' ORDER BY mode, score DESC"
  ```

## The API

- `POST /score` with JSON `{mode, day, name, score, simVersion, replay, was?}` replays the run and, if it gives exactly
  `score`, keeps the player's best for that day and returns `{best, rank, players, top}`. `replay` is the run's input
  (base64, `game/core/replay-codec.js`); `simVersion` the simulation it was played in. `was` is the name used before a
  rename: that name's row for the day is dropped. A score the replay doesn't bear out gets 422 `{"error":"replay"}`;
  a run from another version of the game gets 409 `{"error":"update", "simVersion"}`. Up to 160 kB per request.
  A refused name gets 422 `{"error":"name"}`; too many calls from one address get 429.
- `GET /top?mode=flight&day=2026-11-06` returns `{players, top: [{name, score}]}`, the top ten.
- `GET /month?m=2026-11` returns every day of that month that anyone played, with its top five per challenge:
  `{month, days: {"2026-11-06": {final, closes?, modes: {flight: [{name, score}], survive: [...]}}}}`. `final` means the
  day has stopped taking scores; an open day has `closes` (ms since 1970).
- `GET /trophies?name=Anna` returns `{trophies: [{mode, day, place}]}`: that name's places 1 to 3, newest first.
- A score for a day that has closed gets 409 `{"error":"closed"}`.

`mode` is the game mode's id: `flight` (Escape, in points) or `survive` (milliseconds). Higher is better in both.
