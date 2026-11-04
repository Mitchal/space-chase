# Lure v15: the mobile app. Phone performance, joystick, main menu with the Daily Challenge, Android APK, offline web app

Built overnight from his decision on 2026-11-03:
> Actually, smash it out into the most performant mobile app you can. We are going with this. I love all of it, including the ghosts. A simple main menu with a simple daily challenge, that's gonna be the main hook. Keep it on the web as well.

It also builds on run 63 (on his phone): *"Lagging on my phone. Also controls have a built in inertia on phone, i think the joystick radius might be too large."*

## What changed
| Change | Why |
|---|---|
| **Phone performance.** The render scale is capped at 1.5× (a 3× screen was ~9× the pixels to fill). Glows are cached sprites instead of a live `shadowBlur`. The canvas is opaque, the grid is one path, and off-screen rocks and mines are culled. | "Lagging on my phone." Measured on this PC with the old code: drawing at 3× cost ~9 ms/frame, at 1.5× ~2.8 ms, and live shadows added 25–50%. |
| **Joystick.** The stick is 30px (was 56) and reaches most of its speed early (curve 0.7). The base trails your thumb, so reversing takes one short flick. Steering grips harder on touch (30 vs 14 on keys). | "Built in inertia… joystick radius might be too large." |
| **The view fills the screen.** On a phone on its side the game widens (W from 960 to 1440, H stays 640) instead of showing black bars. HUD text grows on touch screens. | Phones are ~2:1, so v14 used ~70% of the width. |
| **Fair on any screen.** Pursuer spawns, course generation and culling use a fixed 960-wide play frame. | Before this fix, bots won 5 of 20 at phone width vs 2 of 20 at 960. After it, both widths average sector 3.55 (75 runs each). |
| **Main menu:** LURE, the Daily Challenge card (date, today's best, tries, 🔥 day streak), one Play button, and "How to play" folded away. | "A simple main menu with a simple daily challenge, that's gonna be the main hook." |
| **Results screen:** the score, a NEW BEST badge, today's best, best chain, close calls and streak, plus Fly again, Menu and Share (a short line for the share sheet or clipboard). | Replaces the reaction form for players. |
| **The ghost is always on.** | "I love all of it, including the ghosts." |
| **Pause:** a ❚❚ button, P, automatically when the app goes to the background, and the Android back button. Back pauses, back again quits to the menu, back on results goes to the menu, back on the menu closes the app. | Phones have no P key. |
| **Playtest mode** (`?playtest=1`): the reaction form, the on-disk log and checkpoints, for continuing the taste experiment. Off for players. | Keeps the method. |
| **Android app** (Capacitor 8): `release/lure.apk`, app id `io.github.mitchal.lure`. It is landscape, edge to edge (system bars hidden), keeps the screen on, and has the game's icon and a dark splash. | "Release this as a standalone Android app." |
| **Offline web app:** `dist/` has a manifest, a service worker (cache-first), preloaded modules and a static pod list. It installs to the home screen and runs offline. | "Keep it on the web as well." |
| A portrait phone sees "Turn your phone sideways". | The course is wide. |

## Not done
- Sound and haptics.
- A shared leaderboard and other players' ghosts (they need a server).
- Hearts per day and cosmetics.
- A signed release build for Google Play (the README covers this).
- Not tested on a real phone or emulator: there's no Android system image on this PC. The browser was tested with phone-sized touch emulation and synthetic touch events.

## Architecture
- New core files:
  - `core/mode.js` (playtest flag);
  - `core/sprites.js` (cached glow sprites);
  - `playFrame()` in `core/camera.js`;
  - `setViewWidth`/`MIN_W`/`MAX_W` in `core/world.js`;
  - `setPaused` in `core/loop.js`;
  - `hudFont`/`view.hud` in `core/canvas.js`.
- New pods:
  - `main-menu` (was title-screen);
  - `results-screen`;
  - `pause`;
  - `back-button`.
- Changed pods: `daily-flight` (streak, menu card, ghost always on), `touch-joystick`, `fullscreen` (rotate hint), and `reaction-form` (playtest only).
- Tools:
  - `tools/build-web.js` → `dist/`;
  - `tools/build-android.js` → `release/lure.apk`;
  - `tools/make-icons.js` (web and Android icons, no dependencies);
  - `game/dev/bench.js` (frame-cost benchmark).
- `npm run lint`: OK (47 files).
