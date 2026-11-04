# Lure v8: the pursuers are back on screen, and you fly with thrusters

Built from session 7 (runs 23–27): "didn't see enough chasers, which are the most fun part", "the death wave lunging forward", "let's try classic relative-turns-plus-throttle", "fewer asteroids that vary more in size", "came to a wall of asteroids, it was actually fun".

## What changed (every run)
| Change | Why |
|---|---|
| **Pursuers swoop in from the sides** (80%) **or ahead** (20%), never just in front of the wave. At most 3–5 alive at once (by sector), spawning less often, since they now survive long enough to chase. | His complaint was "didn't see any chasers". Telemetry showed v7's leash wave swallowed them off-screen (27 wave kills vs 19 rock kills in run 23). Bots now see a pursuer about half of every run; the wave kills ~0. |
| **The death wave is steady:** sector pace, never more than 800px behind (v7 A was 620). No surges. | "I do not appreciate the death wave lunging forward like that." |
| **Thrusters**, a block test for all runs: ◀ ▶ (A/D) rotate, ▲ (W) thrusts, ▼ (S) brakes, and you coast when you let go. You still out-turn pursuers (your tightest full-speed turn is ~85px across; theirs is ~130). A flame shows thrust. | "Let's try classic relative-turns-plus-throttle, with a decent level of inertia." If you miss direct control, v9 goes back to no momentum at all. |
| **Fewer asteroids (×0.6), pebbles to boulders** (radius 10–80, mostly small). | "Fewer asteroids that vary more in size." |
| New telemetry: `pursuersSeenS` (time with a pursuer on screen) and `pursuerScreenS`. | So "I don't see them" can't go invisible again. |

## The blind A/B in v8: the shape of the asteroid field
- **A: scattered.** Rocks spread evenly, each stretch streaming one way.
- **B: walls.** Most rocks gather into walls across the lane with one or two ~210px gaps; each wall slides up or down as one, so the gaps move. Thin scatter between. The total number of rocks is about the same.
- Bots (direct control): A reaches sector 2.8, B 2.3. **B is somewhat harder for bots**, which avoid rocks rather than threading gaps.
- **Overall, v8 is harder than v7** for bots (they reached 4–4.8 in v7) because pursuers now survive to chase you.

## Architecture
- New **thrusters pod** (`pods/thrusters/`). Core `handling.steer` is a hook; delete the folder and the ship reverts to direct movement. The title screen shows `content.controlsHelp` if a pod sets it.
- `core/input.js` marks mouse/bot intents as `absolute`; the thrusters' autopilot turns toward them.
- `core/spawn-points.js` adds `flankPoint`; chasers read `max` from the stage.
- `pods/rocks/field-patterns.js` owns the A/B; the wave lost its surges.
- Bots: `LureSim.run({ direct: true })` bypasses installed steering.
- `node tools/check-pods.js`: OK. Removability got a live test by accident: a syntax error made the flight pod fail to load, and the rest of the game still ran.

## Expected run sequence
Runs on disk: 27. Next: **28 = B, 29 = A, 30 = B, 31 = A, 32 = B, 33 = A**.
