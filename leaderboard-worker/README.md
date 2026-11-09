# Space Chase leaderboard

A small Cloudflare Worker with a D1 (SQLite) database. It keeps each player's best score per daily challenge per day,
and the game shows today's top scores on the main menu and under the results. Each day's top five is kept for good:
the game's calendar shows any past day, and places 1 to 3 are that player's gold, silver and bronze trophies. It runs on Cloudflare's free plan
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

The first time a player finishes a daily run, the board shows under the results with a box for their name. A name
belongs to the device that first posts a score with it (capitals don't matter): nobody else can post under it, so the
same name can't be used from a second phone. Clearing the site's data in the browser, or uninstalling the app, loses
the device's key and with it the name; the player then picks a new name, or you free the old one (below).

## Run it on your computer

```bash
npm run db:local
npm run dev
```

The tests need no Cloudflare at all (Node 22.5 or later; they run the Worker against an in-memory SQLite):

```bash
npm test
```

To run the hourly job by hand while it's running: `curl "http://127.0.0.1:8787/__scheduled?cron=35+*+*+*+*"`.

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
- **When a day closes:** the game's day is Sweden's date for everyone, so each day's course and board turn over at
  midnight in Sweden. A run already flying at midnight still counts for the day it started if it lands within 30
  minutes; then the day is final (`src/day-close.js`, and `game/core/game-day.js` in the game).
- **Every hour at half past** (`[triggers]` in `wrangler.toml`): each closed day's top five per challenge is copied into the
  `podium` table and kept for good (`src/podium-db.js`); then scores rows older than 30 days are deleted
  (`src/cleanup.js`). The privacy page describes both, so change them together.
- **Who owns a name:** the first time a player picks a name, the game makes a random 32-byte secret (the device key)
  and keeps it next to the name. Every score is sent with it (`Authorization: Bearer`), and the Worker keeps only its
  SHA-256 in `name_owners`, with the name it claimed (`src/device-key.js`, `src/name-owners.js`). The first device to
  post with a name owns it; any other device gets "taken" and the game asks for another name. A score sent without a
  key is refused. Renaming moves that day's rows to the new name and frees the old one, and only works for the device
  that owns the old name. Names already on the board before this went live (November 2026) have no owner until
  someone posts with them; the first to do so gets them.
- **What that stops, and what it doesn't:** nobody can post under someone else's name any more, or move or delete
  their scores. It does **not** stop made-up scores: anyone who reads the game's code can still send one under their
  own name from a terminal. If that happens, remove the row (below). One device can also hold several names.
- **Free a name** (someone lost their phone or cleared their browser, and wants their name back): delete its claim.
  The next device to post with it, which should be theirs, gets it. Their scores and trophies stay where they are.
  ```bash
  npx wrangler d1 execute space-chase-leaderboard --remote --command "DELETE FROM name_owners WHERE name_key = 'anna'"
  ```
  `name_key` is the name in lower case. To see who has claimed what:
  `npx wrangler d1 execute space-chase-leaderboard --remote --command "SELECT name_key, claimed_at FROM name_owners ORDER BY claimed_at DESC"`.
- **Remove a row** (a test name, a made-up score, a rude name, or someone asking to be removed):
  ```bash
  npx wrangler d1 execute space-chase-leaderboard --remote --command "DELETE FROM scores WHERE name_key = 'test'"
  ```
  Removing a rude name's rows doesn't free the name: delete its `name_owners` row too, or leave it there so nobody can
  use it again. If the day has already closed, its top five is kept separately too. Remove the name there as well, then delete that
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

- `POST /score` with JSON `{mode, day, name, score, was?}` and the header `Authorization: Bearer <device key>` (64
  lower-case hex digits) keeps the player's best for that day and returns `{best, rank, players, top}`. Without a
  well-formed key: 401 `{"error":"key"}`. A name another device owns: 422 `{"error":"taken"}`. `was` is the name used
  before a rename: if this device owns it, that name's rows for the day (every challenge) move to the new name and
  the old name is freed; otherwise `was` is ignored. A refused name gets 422 `{"error":"name"}`; too many calls from
  one address get 429.
- `GET /top?mode=flight&day=2026-11-06` returns `{players, top: [{name, score}]}`, the top ten.
- `GET /month?m=2026-11` returns every day of that month that anyone played, with its top five per challenge:
  `{month, days: {"2026-11-06": {final, closes?, modes: {flight: [{name, score}], survive: [...]}}}}`. `final` means the
  day has stopped taking scores; an open day has `closes` (ms since 1970).
- `GET /trophies?name=Anna` returns `{trophies: [{mode, day, place}]}`: that name's places 1 to 3, newest first.
- A score for a day that has closed gets 409 `{"error":"closed"}`.

`mode` is the game mode's id: `flight` (Escape, in points) or `survive` (milliseconds). Higher is better in both.
