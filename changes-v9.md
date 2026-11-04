# Lure v9: pursuers announce themselves, and the asteroids get bigger

Built from session 8 (runs 28–33): "another one came from out of nowhere near the bottom of the screen and killed me. Felt bad", "The small ones are too small I think, I want fewer and larger ones I believe", "I should have gone for the asteroids, tried to but they never came". Plus the v8 blind A/B: scattered asteroids beat walls (sector 2.3 vs 1.3).

## What changed (every run)
| Change | Why |
|---|---|
| **Entry warning.** For 1.5s before a pursuer comes in, a big pulsing arrowhead sits on the screen edge where it will enter, pointing at you. If the entry point is on screen, a ring closes on it. The pursuer is harmless and immune during the warning. | Run 33's death, and the session's only "no". v8 side pursuers appeared 30px inside the screen edge as close as 220px, under a second from you, with a 0.7s ring that was easy to miss. |
| **Pursuers enter from just off-screen** where the lane extends past the screen, and **never closer than 380px** (was 220). Where a death wall is on screen they still enter inside the lane (the walls kill them), but with the warning. | Same. |
| **Asteroids: scatter only.** Walls are gone. | v8 blind A/B: walls drew no comment and left nothing to lure into; scatter reached further with 10× the rock kills. |
| **No more pebbles; fewer rocks.** | "The small ones are too small… fewer and larger." |
| Thrusters unchanged. | Zero mentions in six runs; you blamed yourself ("skill issue"). |

## The blind A/B in v9: asteroid size
- **A: fewer, larger.** Radius 22–70, mostly mid-sized; 65% of v8's count (about 4 on screen at a time).
- **B: fewest, huge.** Radius 40–100; about half of A's count (about 2–3 on screen, each much bigger).
- Bots, sector reached from sector 1: direct control **A 3.4, B 3.3**; thruster autopilot **A 2.25, B 2.25**. Matched.
- **v9 should be a bit easier than v8** for bots (v8: 2.3–2.8 direct, 1.5–1.7 thrusters): fewer rocks, and no surprise pursuers.

## Architecture
- `pods/chasers/entry-warning.js` (new): the warning drawer and its duration; the chasers pod uses it for its spawn phase.
- `core/spawn-points.js`: `flankPoint` aims just off-screen, minimum distance 380.
- `pods/rocks/field-patterns.js` owns the size A/B; walls removed. `pods/rocks/pod.js` scatters only.
- `node tools/check-pods.js`: OK (36 files).

## Expected run sequence
Runs on disk: 33. Next: **34 = B, 35 = A, 36 = B, 37 = A, 38 = B, 39 = A**.
