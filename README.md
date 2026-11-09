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
| Architecture and determinism lint | `npm run lint` | |
| Replay tests | `npm test` | |
| Replay CPU benchmark | `npm run bench:replay` | |

`npm run android` needs Android Studio installed (it uses its bundled Java and the Android SDK).

**Playtest mode** (the reaction form after each run, the on-disk taste log, checkpoints) is off for players.
Open the dev server with `?playtest=1` to turn it on (it sticks in that browser) and `?playtest=0` to turn it off.

## How it's built

- `game/core/`: the kernel. It holds the simulation (world, player, run, registries, events, course seed, the fixed
  tick) and the browser host around it (frame loop, input, camera, canvas, sprites, storage). Host-only files say so on
  their first line (`// host-only`).
- Game modes (`core/game-modes.js`): each daily challenge is a mode pod (`flight` is Escape, `survive` is Survive). A run starts in one mode; systems and drawers can be limited to a mode, and hazard pods offer spawners (`spawn('rock', …)`) so a mode can place its own.
- `game/pods/<feature>/`: one folder per feature. Each pod registers itself with the core (systems, drawers, events,
  `content` hooks) and never imports another pod, so **deleting a pod folder removes the feature and everything else
  keeps working**. `npm run lint` (`tools/check-pods.js`) checks this statically.
- The dev server discovers pods from disk (`/api/pods`); the player build ships `pods.json` (made by `tools/build-web.js`,
  which also leaves out the dev-only pods `bots` and `reaction-form`).

### Deterministic runs and replays
The leaderboard checks every score by replaying the run (`leaderboard-worker/README.md`), so a run must play out to
the same bits from the same input on any device and engine:
- **Simulation and view are split.** A pod's `sim.js` is what happens (systems, spawners, scoring); its `pod.js`
  imports it and adds how it looks. The simulation is `core/sim-kernel.js` plus every `sim.js`; the leaderboard Worker
  and the tests load exactly that, with no screen.
- **Fixed ticks.** The simulation advances 60 times a second of real time in fixed steps (`core/sim-tick.js`), whatever
  the frame rate; hit-stop and slow-mo are part of it. Frames are drawn blended between the last two ticks
  (`core/render-blend.js`).
- **Input is the only thing that goes in.** Each tick's input is a small whole-number frame (direction and grip,
  `core/sim-input.js`), recorded (`core/replay-recorder.js`) and packed (`core/replay-codec.js`). The screen's size
  and turn never reach the simulation: it plays in a fixed frame around `world.focus` (`core/focus.js`).
- **Seeded and exact.** All randomness comes from the run's seed (its mode and day, `core/course-seed.js`); decoration
  has its own stream (`core/visual-random.js`). Simulation code uses `core/det-math.js` instead of `Math.sin`, `cos`,
  `atan2`, `hypot`, `pow`… which engines may round differently. `npm run lint` (`tools/check-determinism.js`)
  checks all of this statically.
- **`SIM_VERSION`** (`core/sim-version.js`): bump it whenever a change makes the same input play out differently;
  `npm test` fails on the golden replays (`game/dev/sim-golden.json`) as a reminder. To check another engine (Safari on
  an iPhone, Firefox): `await (await import('/dev/replay-check.js')).check()` in its console on the dev server.

### Performance on phones
- Drawing at most 1.5 backing pixels per game pixel. A 3× phone screen was ~9× the fill work, and that was most of the frame.
- No live `shadowBlur`: glows are painted once into cached sprites (`core/sprites.js`).
- The canvas is opaque, the grid is a single path, and off-screen rocks and mines aren't drawn.
- Benchmark in a dev-server console: `await (await import('/dev/bench.js')).bench({ frames: 1500, pixels: 1.5 })`.

### Fair on any screen
The view widens to fill wide screens (H is always 640, W goes from 960 to 1440). Everything that shapes the game uses a
fixed 960-wide **play frame** (`playFrame()` in `core/focus.js`) instead of the visible width: where pursuers spawn,
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
  - other players' ghosts (the leaderboard keeps replays' scores, not the replays);
  - hearts per day (see `meta-loop.md`);
  - cosmetics as the sink.

## The taste experiment
The game was designed by turning one player's reactions into explicit values. The files for that are:
- `vision.md`: the pillars;
- `taste-log.md` and `data/taste-log.jsonl`: every playtest;
- `critic/` and `predictions/`: a model predicting his reactions before he played, sealed with sha256;
- `changes-v*.md`: what each version changed and why;
- `meta-loop.md`: the meta-loop brainstorm.
