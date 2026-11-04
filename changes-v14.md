# Lure v14: Daily flight. One course a day, your best score to beat, and the ghost of your best run is the A/B

Built from his pick on 2026-11-03: *"Let's start with your number 3 meta loop suggestion because it is simple and pure skill."* Also from run 59: *"The 'Rammers' or whatever those other enemy types are, they are basically just a waste of space. Remove them."*

## What changed (every run)
| Change | Why |
|---|---|
| **Daily flight.** The date seeds the course: rocks, mines and laser angles are the same for every run today and different tomorrow. Pursuers still react to you, so they differ. | Meta loop 3: pure skill, a reason to come back. |
| **Every run starts at sector 1.** The checkpoint picker is gone (the pod turns it off). | A daily score only means something from the start line. |
| **Today's best score** is on the title screen, in the top right during a run, and on the results line ("new best today!"). | "An infinite best score to beat" (his notes). |
| **The chargers ("Rammers") are gone.** Sector 4 is renamed from Rams to Minefield. | Run 59. The pod is in `legacy/pods-v13/chargers`; deleting it left the rest working, as a pod should. |
| **Late rock density settled at 16 per 1000px** in Tumble and Breakout (v13's A was 22, B was 13). | v13's A/B was inconclusive, and a daily course must be the same for every run. |

## The blind A/B in v14: the ghost
- **B: the ghost of today's best run flies beside you.** It's a hollow blue ship labelled "best". When it's off screen, a marker on the edge shows whether it is ahead or behind.
- **A: no ghost.** It's still recorded, and the best score shows in both variants.
- The first run of the day has no ghost to show in either variant.
- This tests whether racing your own best pulls you on, beyond the number. It's also the cheapest slice of his race idea: a rival with collisions starts from a ghost.
- **Matched by construction:** the ghost is visual only and changes nothing in the simulation. The bots can't see it, so their A and B numbers are the same game.

## Bots (evader, direct control, random course per bot run)
From sector 1, 12 runs each: reached sector A 3.92, B 4.0; 2 wins each (v13: 3.67–3.83). It's slightly easier without the chargers. No tuning, since the daily score is now the measure of a run.

## Architecture
- `core/course-seed.js` (new): `setCourseSeed`, `courseRng(...keys)`. Each piece of course (a rock slice, a mine, the n-th laser) gets its own generator. This means a mine you set off early can't reshuffle the rocks later. Unseeded, it falls back to `Math.random`.
- `core/spawn-points.js`: `fieldPoint` takes a generator and lays out against the lane at t = 0 (`world.laneAt(x, t)`). That way a seeded course doesn't depend on when you arrive. A test with two very different flight paths produced the same 71 rocks and mines in the same order.
- `core/registry.js`: `content.checkpoints`, `content.titleNotes`, `content.resultNotes`. These are hooks for any mode pod.
- `core/storage.js`: run numbers continue from the highest logged run, not the count of entries, so gaps left by unsaved runs no longer cause clashes. `VERSION = 14`.
- `pods/daily-flight/` (new): `pod.js` (seed, best, notes, HUD), `daily-record.js` (today's record in localStorage), `ghost.js` (recording at 10 Hz of run time, playback, edge marker).
- `pods/rocks`, `pods/mines`, `pods/lasers`: use `courseRng`.
- `node tools/check-pods.js`: OK (39 files).

## Not built yet (his idea, noted)
**Hearts per day, like Candy Crush.** These fit his "no power" rule, because a heart buys a try, not strength. The natural shape is N ranked attempts at today's course, with practice free and more hearts as the sink. They aren't built in this slice: a gate would cut his playtests short, and a blind A/B can't judge them. First we learn whether the daily pulls him back.

## Expected run sequence
The highest logged run is 60, so next come **61 = A, 62 = B, 63 = A, 64 = B, 65 = A, 66 = B**. Run 61 sets today's first best, so B's ghost appears from run 62.
