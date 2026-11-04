# Lure v3: what changed and why

Every change traces to a pillar in `vision.md` (revision 3). Earlier builds are preserved at `game/v1.html` and `game/v2.html`.

| Change | Pillar | Detail |
|---|---|---|
| **The run is 6 escape arenas** instead of 10 waves | P8 open the exit, P9 runs build over minutes | Each arena has an exit gate on a wall, visible and locked from the moment you enter. It charges up; once open, reach it to escape. A winning run takes about 2.5 min (bot). |
| **Door slam** | Reference moment | When you escape, every pursuer within 170px of the gate is crushed (counts as a lured kill and chains). The slam radius is drawn once the exit opens. |
| Pressure ramps within an arena and spikes when the exit opens | P2, P9 | Continuous spawning that speeds up during the arena; spawns run 1.7× faster once the exit is open (the "alarm"). |
| **Each arena adds a world element**, not a button | P6 (revised), P7 | 1 Hangar: chasers + mines. 2 Debris field: **rocks** (chasers and dashing chargers die on them; you bump off harmlessly). 3 Crossfire: + lasers. 4 Rams: + chargers. 5 Drift: rocks move. 6 Breakout: everything. |
| Decoy, pocket mine and the unlock system **removed** | P7 two verbs | Run 8: "The Decoy one seems a bit much. Movement + dash… great balance." |
| **Dash is always on** (Shift/Space) | P7, v2 A/B result | The same controls in every run. |
| +1 heart (max 3) on entering each new arena | P9 | So a run can build instead of being attrition. |
| Checkpoints: start at any arena you've reached | P6 ("I liked checkpoints") | |
| "This run doesn't count (interrupted)" button on the form | Method | Run 7 was spoiled by a popup. |

Carried over from v2: chaser tuning, charger readability (one windup at a time, full aim lane), mine blast rings, hit-stop and "hit by X" labels, the in-path assist mine (now only in rock-free arenas).

## The blind A/B in v3: *why* does the exit open?
- **A: timer.** The exit opens on time alone; a pure getaway.
- **B: kills charge it.** Time plus every lured kill pushes the charge forward, so the lure game *is* the way out (P1 feeds P8).
- Arena length is matched across variants (bot: 22.7s vs 21.9s per arena), so this isn't a difficulty test. Controls are identical (per the method lesson).
- The difference is visible only as how fast the exit % climbs when you get kills.

## Expected run sequence
Runs on disk: 8. Next: **9 = A, 10 = B, 11 = A, 12 = B**. Every v3 run starts at arena 1 until he reaches further, after which checkpoints open.
