# Space Chase

You can't attack. Fly right through an asteroid field ahead of a death wave, with missiles on your tail. Lead them
into rocks, walls, mines, lasers and each other. Every death explodes, and a missile roaring past within a hair slows time.

**The hook is the daily challenges,** two a day, the same for everyone:
- **Escape:** fly through the course to the finish. Beat your best score; the ghost of your best run flies with you.
- **Survive:** a round arena that only gets busier. Your score is how long you last, to the millisecond. The day seeds every missile and rock, so you can practise it.

## Run it

| What | Command | Where |
|---|---|---|
| Dev server (the game straight from `game/`) | `npm run dev` | http://127.0.0.1:8765 |
| …on your phone over Wi-Fi | `LURE_HOST=0.0.0.0 npm run dev` | `http://<this PC's IP>:8765` |
| Player build (offline-capable web app in `dist/`) | `npm run build` | serve `dist/` from any static host |
| …served locally | `LURE_DIST=1 LURE_HOST=0.0.0.0 node serve.js` | `http://<IP>:8766`, APK at `/space-chase.apk` |
| Android app (debug APK) | `npm run android` | `release/space-chase.apk` |
| Android app for Google Play (signed bundle) | `npm run android:release` | `release/space-chase.aab` |
| Architecture lint | `npm run lint` | |

`npm run android` needs Android Studio installed (it uses its bundled Java and the Android SDK).

**Playtest mode** (the reaction form after each run, the on-disk taste log, checkpoints) is off for players.
Open the dev server with `?playtest=1` to turn it on (it sticks in that browser) and `?playtest=0` to turn it off.

## How it's built

- `game/core/`: the kernel. It holds the loop, world, player, input, camera, canvas, events, registries, course seed, sprites and storage.
- Game modes (`core/game-modes.js`): each daily challenge is a mode pod (`flight` is Escape, `survive` is Survive). A run starts in one mode; systems and drawers can be limited to a mode, and hazard pods offer spawners (`spawn('rock', …)`) so a mode can place its own.
- `game/pods/<feature>/`: one folder per feature. Each pod registers itself with the core (systems, drawers, events,
  `content` hooks) and never imports another pod, so **deleting a pod folder removes the feature and everything else
  keeps working**. `npm run lint` (`tools/check-pods.js`) checks this statically.
- The dev server discovers pods from disk (`/api/pods`); the player build ships `pods.json` (made by `tools/build-web.js`,
  which also leaves out the dev-only pods `bots` and `reaction-form`).

### Performance on phones
- Drawing at most 1.5 backing pixels per game pixel. A 3× phone screen was ~9× the fill work, and that was most of the frame.
- No live `shadowBlur`: glows are painted once into cached sprites (`core/sprites.js`).
- The canvas is opaque, the grid is a single path, and off-screen rocks and mines aren't drawn.
- Benchmark in a dev-server console: `await (await import('/dev/bench.js')).bench({ frames: 1500, pixels: 1.5 })`.

### Fair on any screen
The view widens to fill wide screens (H is always 640, W goes from 960 to 1440). Everything that shapes the game uses a
fixed 960-wide **play frame** (`playFrame()` in `core/camera.js`) instead of the visible width: where pursuers spawn,
when the course ahead is generated, and what is culled. A wide phone shows more of the same game; it doesn't play a different one.

Held upright (one-handed play), the view is turned a quarter turn rather than shrunk: the same W×H world, drawn so the
course runs along the screen's length (`core/screen-mapping.js`). Screen-space UI lays out in `view.w × view.h`; touch
and keys are screen directions, turned into the world in `core/input.js`.

## Shipping notes

- **Web:** upload `dist/` anywhere static (GitHub Pages, Netlify, Cloudflare Pages). It installs as an app and runs offline.
- **Google Play:** step by step in [PUBLISHING.md](PUBLISHING.md). `npm run android:release` builds the signed bundle; store text and art are in `store/`.
- **Not built yet:**
  - sound;
  - haptics;
  - a shared daily leaderboard and other players' ghosts (needs a small server);
  - hearts per day (see `meta-loop.md`);
  - cosmetics as the sink.

## The taste experiment
The game was designed by turning one player's reactions into explicit values. The files for that are:
- `vision.md`: the pillars;
- `taste-log.md` and `data/taste-log.jsonl`: every playtest;
- `critic/` and `predictions/`: a model predicting his reactions before he played, sealed with sha256;
- `changes-v*.md`: what each version changed and why;
- `meta-loop.md`: the meta-loop brainstorm.
