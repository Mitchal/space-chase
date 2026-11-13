# Space Chase leaderboard

A small Cloudflare Worker with a D1 (SQLite) database. It keeps each player's best score per daily challenge per day,
and the game shows today's top scores on the main menu and under the results. Each day's top five is kept for good:
the game's calendar shows any past day, and places 1 to 3 are that player's gold, silver and bronze trophies. It was built for Cloudflare's free plan
(100,000 requests a day, which is roughly a thousand daily players) and never goes to sleep. Scores are trusted when
they arrive and checked a minute or so later by a GitHub Action that replays each run (see "Every score is checked"
below), so the Worker itself stays within the free plan's 10 ms of CPU per request.

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

Then turn on score checks (next section).

The first time a player finishes a daily run, the board shows under the results with a box for their name. A name
belongs to the device that first posts a score with it (capitals don't matter): nobody else can post under it, so the
same name can't be used from a second phone. Clearing the site's data in the browser, or uninstalling the app, loses
the device's key and with it the name; the player then picks a new name, or you free the old one (below).

## Turn on score checks (once, about 10 minutes)

Two secrets connect the Worker and GitHub. Nothing else is shared: GitHub never gets Cloudflare or database access,
and the Worker can only start the checking workflow.

1. **Make the shared secret** (the Action shows it to the Worker when it fetches runs and sends verdicts):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Give it to the Worker (paste it when asked):
   ```bash
   npx wrangler secret put RUN_CHECK_SECRET
   ```
   And to GitHub: the repository's **Settings → Secrets and variables → Actions → New repository secret**, named
   `RUN_CHECK_SECRET`, with the same value (or `gh secret set RUN_CHECK_SECRET` in the repo root).
2. **Make a token for the Worker to start the check:** https://github.com/settings/personal-access-tokens/new
   (a *fine-grained* token). Resource owner: you. Expiration: the longest offered (write the date down: when it runs
   out, see "When checks stop" below). Repository access: **Only select repositories → space-chase**. Permissions →
   Repository permissions → **Actions: Read and write**; nothing else (Metadata: read-only is added by itself). This
   token can start, cancel and read workflow runs in this one repository; it can't touch code or settings.
   Give it to the Worker:
   ```bash
   npx wrangler secret put GITHUB_DISPATCH_TOKEN
   ```
   The repository, workflow and branch it starts are `[vars]` in `wrangler.toml`.
3. **Release in this order** whenever a release brings a new file in `migrations/` (this one brings
   `0003_name_owners.sql` and `0004_run_checks.sql`):
   1. `npm run db:remote`: the new columns have defaults, so the Worker that's running keeps working.
   2. The secrets above (only the first time).
   3. `npm run deploy`: the new Worker.
   4. Release the game as usual (bump the version, push to `master`). This also puts the workflow
      (`.github/workflows/check-runs.yml`) on `master`, where GitHub needs it to be started. Until then the Worker's
      starts fail with a log line and are tried again; scores keep being stored.
4. **Check it works:** after the next score, the repository's **Actions** tab shows a "Check leaderboard runs" run
   ending with `checked N runs: N ok, 0 failed`. You can also start one by hand there (**Run workflow**).

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

For score checks, put a made-up secret in `.dev.vars` (not committed), e.g. `RUN_CHECK_SECRET=local-0123456789abcdef`.
Without `GITHUB_DISPATCH_TOKEN` the local Worker never starts GitHub; check by hand from the repo root instead:
```bash
BOARD_URL=http://127.0.0.1:8787 RUN_CHECK_SECRET=local-0123456789abcdef node tools/run-checks/check-pending.js
```
`RUN_CHECK_SECRET=… node tests/check-runs-e2e.js` (repo root) does the whole round trip: it posts a genuine run of
today's challenges and two cheats, runs the checker and confirms that only the cheats are gone.

Then start the game as usual (`npm run dev` in the repo root) and open
http://localhost:8765/?leaderboard=http://127.0.0.1:8787 to play against the local board. The `?leaderboard=` switch
only works on localhost. The local database lives in `.wrangler/`; delete that folder to start over.

## Look after it

- **Who can post:** browsers only from the game's own addresses (spacechase.mikaelbrandt.com, mitchal.github.io, the
  Android app and localhost); the list is in `src/cors.js`. If the game moves to another address, add it there and deploy.
- **Checks:** a known date (within a day of today), a name of 1 to 16 characters, a whole-number score from 0 to
  10,000,000, a run from the game version the checker knows, and a readable replay. The score itself is checked
  afterwards (below).
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
  `podium` table and kept for good (`src/podium-db.js`), but only once every run of that day has been checked, and
  only from runs that checked out (until then the calendar shows it from the live scores). Then scores rows older than
  30 days are deleted (`src/cleanup.js`), and if any run is still waiting for its check, GitHub is asked to check
  again. The privacy page describes all of this, so change them together.
- **Who owns a name:** the first time a player picks a name, the game makes a random 32-byte secret (the device key)
  and keeps it next to the name. Every score is sent with it (`Authorization: Bearer`), and the Worker keeps only its
  SHA-256 in `name_owners`, with the name it claimed (`src/device-key.js`, `src/name-owners.js`). The first device to
  post with a name owns it; any other device gets "taken" and the game asks for another name. A score sent without a
  key is refused. Renaming moves that day's rows to the new name and frees the old one, and only works for the device
  that owns the old name. Names already on the board before this went live (November 2026) have no owner until
  someone posts with them; the first to do so gets them.
- **What that stops, and what it doesn't:** nobody can post under someone else's name any more, or move or delete
  their scores. Made-up scores are a separate matter, caught by the checks below. One device can also hold several
  names.
- **Free a name** (someone lost their phone or cleared their browser, and wants their name back): delete its claim.
  The next device to post with it, which should be theirs, gets it. Their scores and trophies stay where they are.
  ```bash
  npx wrangler d1 execute space-chase-leaderboard --remote --command "DELETE FROM name_owners WHERE name_key = 'anna'"
  ```
  `name_key` is the name in lower case. To see who has claimed what:
  `npx wrangler d1 execute space-chase-leaderboard --remote --command "SELECT name_key, claimed_at FROM name_owners ORDER BY claimed_at DESC"`.
- **Every score is checked**, trusted until proven guilty. The game sends each score with its run's input (one small
  frame per 1/60 s tick: the steering direction and grip, packed into a few kB) and the version of the game's
  simulation it was played in (`SIM_VERSION`, `game/core/sim-version.js`).
  1. **The Worker stores it unchecked** (`check_status = 'unchecked'`, with its replay) and shows it on the board at
     once, like any other score. Replaying costs ~100 ms of CPU (`npm run bench:replay` in the repo root), ten times
     what the free plan gives a request, so the Worker doesn't (`src/run-shape.js` only checks the version and that
     the replay is readable). It then asks GitHub to start the check, at most once a minute (`src/check-dispatch.js`).
  2. **A GitHub Action replays it** (`.github/workflows/check-runs.yml`, running `tools/run-checks/check-pending.js`):
     it fetches every waiting run (`GET /checks/pending`), plays each again from the day's seed with the game's own
     simulation, and sends back a verdict per run (`POST /checks/verdicts`). It keeps looking for a minute after it
     runs out, then stops. Actions minutes are free for a public repository. The Worker's hourly job asks for a check
     too while anything is waiting, and GitHub runs it every six hours anyway.
  3. **A run that checks out** (`'ok'`) stays on the board and keeps its replay, so the game can show the day's
     leader playing (`GET /best`); replays go with their day after 30 days. **A run that doesn't**
     (`'failed'`: the replay gives another score, stops before the run ends or goes on after it) disappears from the
     board, the player counts, the ranks, the calendar and the trophies. Its row stays, frozen with its replay and the
     reason (`check_note`), as evidence: that name can't post a new score that day or rename the row away.
  - **Old versions:** a run is replayed with the code of its own `SIM_VERSION`. The Worker only takes runs from the
    version it was deployed with, but runs still waiting when a new version goes out are replayed with the newest
    `master` commit that still had theirs (`tools/run-checks/sim-code-at.js`, in a temporary git worktree). So **deploy
    the Worker together with each game release that changes `SIM_VERSION`**; until both are out, scores from the side
    that's ahead get 409 `{"error":"update"}` and the game says "Update the game to put your scores on the board."
    Never deploy the Worker from a branch whose `SIM_VERSION` isn't on `master` yet: the checker can't find that
    code, leaves those runs waiting and its run fails (red in the Actions tab).
  - **What it can't catch:** who or what was steering. A bot, a script or a slowed-down tool-assisted run sends
    genuinely valid input and passes. Scores from before checks (game 1.4.x) count as checked.
  - **See failed runs** (GitHub's Actions log also prints each one, without the name):
    ```bash
    npx wrangler d1 execute space-chase-leaderboard --remote --command "SELECT mode, day, name, score, check_note FROM scores WHERE check_status = 'failed' ORDER BY day DESC"
    ```
    A failed run is already hidden: nothing more needs doing. To clear the name for the rest of that day (it loses the
    evidence), delete its row as below. If an honest player's run ever fails (a bug that made the simulation play out
    differently somewhere), put it back with `UPDATE scores SET check_status = 'ok' WHERE …`.
  - **See what's waiting:** `SELECT mode, day, name, score, updated_at FROM scores WHERE check_status = 'unchecked'`.
  - **When checks stop** (the token has expired, or the workflow has failed or been switched off): scores still show
    as usual, but closed days' top fives aren't kept until their runs are checked, and they're lost if that takes 30
    days. Look in the Actions tab; make a new token (step 2 of "Turn on score checks") if GitHub's answers in the
    Worker's logs (`npx wrangler tail`) say 401. GitHub also turns off the six-hourly schedule after 60 days without
    commits; the Worker's starts don't depend on it.
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

- `POST /score` with JSON `{mode, day, name, score, simVersion, replay, was?}` and the header
  `Authorization: Bearer <device key>` (64 lower-case hex digits) keeps the player's best for that day (unchecked until
  the checker has replayed it) and returns `{best, rank, players, top}`. `replay` is the run's input (base64,
  `game/core/replay-codec.js`); `simVersion` the simulation it was played in. Without a well-formed key: 401
  `{"error":"key"}`. A name another device owns: 422 `{"error":"taken"}`. `was` is the name used before a rename: if
  this device owns it, that name's rows for the day (every challenge) move to the new name and the old name is freed;
  otherwise `was` is ignored. A run from another version of the game gets 409 `{"error":"update", "simVersion"}`; an
  unreadable replay 422 `{"error":"replay"}`. Up to 160 kB per request. A refused name gets 422 `{"error":"name"}`;
  too many calls from one address get 429.
- `GET /top?mode=flight&day=2026-11-06` returns `{players, top: [{name, score}]}`, the top ten.
- `GET /best?mode=survive&day=2026-11-12` returns `{run: {name, score, simVersion, replay}}`: the day's leader and
  their run's input, which the game plays on screen ("Watch the best"), or `{run: null}` when nobody has played. `replay`
  is null for runs checked before replays were kept (game 1.5.x).
- `GET /month?m=2026-11` returns every day of that month that anyone played, with its top five per challenge:
  `{month, days: {"2026-11-06": {final, closes?, modes: {flight: [{name, score}], survive: [...]}}}}`. `final` means the
  day has stopped taking scores; an open day has `closes` (ms since 1970).
- `GET /trophies?name=Anna` returns `{trophies: [{mode, day, place}]}`: that name's places 1 to 3, newest first.
- A score for a day that has closed gets 409 `{"error":"closed"}`.
- For the checker only, with `Authorization: Bearer <RUN_CHECK_SECRET>` (404 while the secret isn't set):
  `GET /checks/pending?limit=50` returns `{runs: [{mode, day, key, at, score, simVersion, replay}]}`, the oldest
  waiting runs; `POST /checks/verdicts` with `{verdicts: [{mode, day, key, at, score, ok, why?}]}` returns `{applied}`.
  A verdict on a run the player has since beaten changes nothing (`at` and `score` no longer match).

`mode` is the game mode's id: `flight` (Escape, in points) or `survive` (milliseconds). Higher is better in both.
