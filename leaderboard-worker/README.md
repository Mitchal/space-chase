# Space Chase leaderboard

A small Cloudflare Worker with a D1 (SQLite) database. It keeps each player's best score per daily challenge per day,
and the game shows today's top scores on the main menu and under the results. Each day's top five is kept for good:
the game's calendar shows any past day, and places 1 to 3 are that player's gold, silver and bronze trophies. It runs on Cloudflare's free plan
(100,000 requests a day, which is roughly a thousand daily players) and never goes to sleep.

Playing never needs an account. Posting a score does: players log in with their email and a 6-digit code emailed to
them (no passwords), pick a name for the boards (names needn't be unique), and their scores and trophies belong to that
account. Names typed before accounts (November 2026) stay on their old scores and past days, read-only.

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
6. **Set up login emails** (below). Without them nobody can log in, so nobody can post a score.
7. **Deploy:**
   ```bash
   npm run deploy
   ```
   The first time, it asks you to pick a `workers.dev` subdomain. At the end it prints the Worker's address, like
   `https://space-chase-leaderboard.your-name.workers.dev`.
8. **Check it answers** (use today's date):
   ```bash
   curl "https://space-chase-leaderboard.your-name.workers.dev/top?mode=flight&day=2026-11-06"
   ```
   You should see `{"mode":"flight","day":"2026-11-06","players":0,"top":[]}`.
9. **Tell the game:** paste the address into `DEPLOYED` in `game/pods/leaderboard/leaderboard-url.js`, then release as
   usual (bump the version, push to `master`). The Android app picks it up with its next build.

## Login emails

The Worker sends each login code through an email provider: Resend or Mailgun, both wired in (`src/email/`), neither
picked yet. Until `EMAIL_PROVIDER` in `wrangler.toml` names one, `/auth/start` answers 503 and the game says logging in
isn't switched on (the boards still show). Both need a sending domain; `spacechase.mikaelbrandt.com` is assumed below.

### Choosing (checked 2026-11-09)

| | Resend | Mailgun |
|---|---|---|
| Free plan | 3,000 a month, **100 a day** (the day resets at midnight UTC); 3 domains; 30-day logs; described as free for good | 100 a day; 1 domain; 1-day logs. Without a card on file, a free account only sends to 5 "authorized recipients": expect to add a card before real players get codes |
| EU | Ireland region, on the free plan, chosen per domain. Only where mail is sent from: the account's data stays in the US | EU region, chosen per domain (can't be moved later); message data stays in the EU. API at `api.eu.mailgun.net` (set `MAILGUN_REGION = "eu"`) |
| From a Worker | `POST https://api.resend.com/emails`, Bearer key, JSON (`src/email/resend.js`). Has a Workers guide | `POST /v3/<domain>/messages`, Basic auth `api:<key>`, form data (`src/email/mailgun.js`) |
| DNS | SPF and DKIM (TXT) plus an MX on a return-path subdomain (`send.<domain>`); add DMARC after. Often verified within 15 minutes | SPF (`include:mailgun.org`), DKIM (TXT), MX (mxa/mxb) and a tracking CNAME; allow 24–48 hours |
| Tracking | Off by default | Turned off per message by the Worker (`o:tracking=no`) |
| Deliverability | Shared IPs (dedicated from $30/month, above 3,000 a day) | Shared IPs (dedicated on 100k-a-month plans) |

In short: **Resend** is simpler to start and free with no card at this size; its 100 a day is the cap to watch (a login
needs one email, so that's 100 logins a day, and sessions last 30 days). **Mailgun** keeps message data in the EU, if
that matters, but its free plan is meant for trying it out. Both handle SPF, DKIM and alignment; add a DMARC record
yourself either way. Sources: resend.com/pricing, resend.com/docs (domains, regions, rate limits),
mailgun.com/pricing, documentation.mailgun.com, help.mailgun.com (authorized recipients). Not compared: Cloudflare's own
email sending for Workers, which may be worth a look given everything else runs there.

Use an account that is yours alone (not a work one), and keep the API key out of every file: it's a Worker secret.

### Resend

1. Sign up at https://resend.com, add the domain `spacechase.mikaelbrandt.com`, region **Ireland (eu-west-1)**.
2. Add the DNS records it lists where mikaelbrandt.com's DNS lives (if that's Cloudflare, set them to "DNS only", not
   proxied). Wait until Resend says the domain is verified. Add a DMARC record too, e.g. TXT `_dmarc.spacechase` →
   `v=DMARC1; p=none;`.
3. Make an API key with "sending access" for that domain, then give it to the Worker:
   ```bash
   npx wrangler secret put RESEND_API_KEY
   ```
4. In `wrangler.toml`: `EMAIL_PROVIDER = "resend"` (and check `EMAIL_FROM`), then `npm run deploy`.

### Mailgun

1. Sign up at https://www.mailgun.com, add the domain `spacechase.mikaelbrandt.com` in the **EU** region.
2. Add the DNS records it lists (SPF, DKIM, MX, CNAME; "DNS only" on Cloudflare), wait for "verified", add DMARC as above.
3. Make a sending API key for the domain, then:
   ```bash
   npx wrangler secret put MAILGUN_API_KEY
   ```
4. In `wrangler.toml`: `EMAIL_PROVIDER = "mailgun"`, `MAILGUN_DOMAIN = "spacechase.mikaelbrandt.com"`,
   `MAILGUN_REGION = "eu"`, then `npm run deploy`.

To check: log in from the game with your own email. If no code arrives, `npx wrangler tail` shows why
(`login code not sent: …`).

## Moving the live database to accounts (once)

Migrations `0003` and `0004` add accounts and move every score and kept top five onto players: each name typed before
becomes a player with no email, under the latest spelling it was typed with. The game and the Worker change together,
and the Worker has to go first (the new game needs the new Worker to log in).

1. **Set up login emails first** (above). The new Worker only takes scores from logged-in players, so without email
   nobody can post.
2. **Back up** (keep the file; D1 can also go back to any minute of the last 7 days on the free plan):
   ```bash
   npx wrangler d1 export space-chase-leaderboard --remote --output backup-before-accounts.sql
   ```
3. **Migrate and deploy back to back**, not around half past the hour (the hourly job): between the two, the live
   Worker can't read the rebuilt tables and the board is missing for a minute.
   ```bash
   npm run db:remote
   npm run deploy
   ```
4. **Check** `/top` and `/month` (above) still show today's and past names, then release the game as usual. Until a
   player's browser picks up the new game, posting quietly fails for them and their medal count disappears; boards
   and the calendar still show.
5. **If something's wrong:** `npx wrangler d1 time-travel restore space-chase-leaderboard --timestamp=<a moment before
   step 3>`, then deploy the previous Worker (`git checkout <previous commit> -- .` in this folder, `npm run deploy`).

## Run it on your computer

```bash
npm run db:local
npm run dev
```

`npm run dev` sends no email: each login code is printed in its console (`[email: log mode] login code for …`), so
logging in works with no provider. To run the hourly job by hand while it's running:
`curl "http://127.0.0.1:8787/__scheduled?cron=35+*+*+*+*"`.

Then start the game as usual (`npm run dev` in the repo root) and open
http://localhost:8765/?leaderboard=http://127.0.0.1:8787 to play against the local board. The `?leaderboard=` switch
only works on localhost. The local database lives in `.wrangler/`; delete that folder to start over.

**Tests:** `npm test` runs the Worker against an in-memory SQLite stand-in for D1 (`test/`): logins, codes and their
limits, sessions, posting, deleting an account, and the move from typed names. Needs Node 22.13 or newer.

## Look after it

- **Who can post:** browsers only from the game's own addresses (spacechase.mikaelbrandt.com, mitchal.github.io, the
  Android app and localhost); the list is in `src/cors.js`. If the game moves to another address, add it there and
  deploy. Within those, only logged-in players with a name, and only as themselves.
- **Logins:** a code is 6 digits, lasts 10 minutes, works once and takes 5 tries; an email gets at most 5 codes an hour
  (`src/auth/login-codes-db.js`). A session lasts 30 days (`src/auth/sessions-db.js`). Only hashes of codes and
  session tokens are stored. The game keeps its token in local storage and sends it as `Authorization: Bearer` (not a
  cookie: the Android app's pages come from `https://localhost`, which can't keep cookies for workers.dev).
- **Checks:** a known date (within a day of today), a name of 1 to 16 characters, and a whole-number score from 0 to
  10,000,000.
- **Names:** `src/name-filter.js` refuses the obvious slurs and swearing (English and Swedish, also spelled with
  digits or dots). The game then asks the player for another name. Add words there as they turn up.
- **Floods:** one address can send 20 scores, read the board 120 times and ask for or type in 10 login codes a minute
  (`[[ratelimits]]` in `wrangler.toml`); beyond that it gets "slow down" and the game just doesn't show the board for
  a moment. A whole household on one Wi-Fi counts as one address, which these numbers allow for. Requests refused
  this way still count towards the free plan's 100,000 a day; if that's ever used up, the board stops showing until
  the next day and the game carries on without it.
- **When a day closes:** the game's day is Sweden's date for everyone, so each day's course and board turn over at
  midnight in Sweden. A run already flying at midnight still counts for the day it started if it lands within 30
  minutes; then the day is final (`src/day-close.js`, and `game/core/game-day.js` in the game).
- **Every hour at half past** (`[triggers]` in `wrangler.toml`): each closed day's top five per challenge is copied into the
  `podium` table and kept for good (`src/podium-db.js`); then scores rows older than 30 days, expired sessions and
  spent login codes are deleted (`src/cleanup.js`). The privacy page describes both, so change them together.
- **No anti-cheat:** anyone logged in who looks at the game's code can send a made-up score from a terminal. If that
  happens, remove the row (below); the account's email says who it was.
- **Find a player** (boards show names; ids are in `/top` and `/month` answers):
  ```bash
  npx wrangler d1 execute space-chase-leaderboard --remote --command "SELECT id, email, name FROM players WHERE name LIKE '%anna%' OR email = 'anna@example.com'"
  ```
- **Rename a rude name** (accounts can change it back, so for a repeat, remove the account instead):
  ```bash
  npx wrangler d1 execute space-chase-leaderboard --remote --command "UPDATE players SET name = 'Player 12' WHERE id = 12"
  ```
- **Remove a score** (a test, or made-up):
  ```bash
  npx wrangler d1 execute space-chase-leaderboard --remote --command "DELETE FROM scores WHERE player_id = 12 AND day = '2026-11-06' AND mode = 'flight'"
  ```
  If the day has already closed, its top five is kept separately too. Delete that day's kept rows so the next hourly
  run rebuilds them from the scores (and whoever was 6th moves up). This works for days under 30 days old:
  ```bash
  npx wrangler d1 execute space-chase-leaderboard --remote --command "DELETE FROM podium WHERE day = '2026-11-06' AND mode = 'flight'"
  ```
- **Remove an account by hand** (someone asks by email; players can also do it themselves from their profile). This is
  what the profile's "Delete account" does: the email, sessions, pending code and scores go, and past top-five places
  stay with no player (shown as "deleted player"), so nobody else's place or trophy changes. Find the id first (above):
  ```bash
  npx wrangler d1 execute space-chase-leaderboard --remote --command "DELETE FROM sessions WHERE player_id = 12; DELETE FROM scores WHERE player_id = 12; UPDATE podium SET player_id = NULL WHERE player_id = 12; DELETE FROM login_codes WHERE email = 'anna@example.com'; DELETE FROM players WHERE id = 12"
  ```
  The same works for a name from before accounts (it has no email: leave out the `login_codes` part). To take the
  places out of past days entirely instead, also `DELETE FROM podium WHERE player_id = 12` before the last step (the
  places below don't move up for days over 30 days old).
- **See everything from one day:**
  ```bash
  npx wrangler d1 execute space-chase-leaderboard --remote --command "SELECT s.mode, p.name, s.score FROM scores s JOIN players p ON p.id = s.player_id WHERE s.day = '2026-11-06' ORDER BY s.mode, s.score DESC"
  ```

## The API

Rows on every board are `{id, name, score}`: `id` is the player's, so the game can light up your own rows (names
aren't unique). A deleted account's place in a past day has `id` and `name` null.

- `POST /auth/start` with `{email}` emails a login code and answers `{ok: true}`, the same whether or not the email has
  an account. 400 `{"error":"email"}` for a malformed address, 429 when that email has had 5 codes this hour, 503
  `{"error":"email off"}` with no email provider, 502 when the provider refused.
- `POST /auth/verify` with `{email, code}` → `{token, expires, account: {id, email, name}}`, making the account on its
  first login. 401 `{"error":"code","left":3}` for a wrong code; 401 `{"error":"expired"}` when a new code is needed.
- `POST /auth/logout` ends the session the token belongs to.
- With `Authorization: Bearer <token>` (401 `{"error":"login"}` without a working one):
  - `GET /me` → `{account}`; `POST /me` with `{name}` → `{account}` (422 `{"error":"name"}` when the filter refuses it);
    `DELETE /me` → `{ok: true}`: the account is gone (see "Remove an account by hand").
  - `POST /score` with `{mode, day, score}` keeps the player's best for that day and returns `{best, rank, players,
    top}`. 422 `{"error":"no name"}` until the account has a name; 409 `{"error":"closed"}` once the day has closed.
- `GET /top?mode=flight&day=2026-11-06` returns `{players, top}`, the top ten.
- `GET /month?m=2026-11` returns every day of that month that anyone played, with its top five per challenge:
  `{month, days: {"2026-11-06": {final, closes?, modes: {flight: [{id, name, score}], survive: [...]}}}}`. `final`
  means the day has stopped taking scores; an open day has `closes` (ms since 1970).
- `GET /trophies?player=12` returns `{trophies: [{mode, day, place}]}`: that player's places 1 to 3, newest first.
- Too many calls from one address get 429.

`mode` is the game mode's id: `flight` (Escape, in points) or `survive` (milliseconds). Higher is better in both.
