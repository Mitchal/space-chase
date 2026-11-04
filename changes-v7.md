# Lure v7: a ship, a ramp, and a wave you feel

Built from session 6 (runs 18–22): "let me find my bearings", "the wave chasing me is too slow", "turning on a dime is thematically weird… some momentum, still faster handling than the chasers", "asteroids should float through the walls and away".

## What changed (every run)
| Change | Why (his words) |
|---|---|
| **Momentum.** Your ship accelerates and drifts (grip 4/s, was 14). A 90° turn sweeps ~70px; a pursuer's sweeps ~130px, so you still out-turn them. A small nose shows your heading. | Run 20: "Maybe I should have some momentum too, still faster handling than the chasers but not instant." Run 19: out-turning is the clever part. |
| **Ramp-in.** The sector you start in gives you 8s with no pursuers, then they trickle in one at a time. | Run 18: "got killed immediately… ease off in the beginning to let me find my bearings." 3 of 5 v6 runs died in sector 1. |
| **Asteroids float through the walls** and away. The field also exists beyond the walls and streams in from outside. Walls still hurt you and still kill pursuers. | Run 20: "Asteroids look weird bouncing inside the walls, they should float through it and away." |
| **All asteroids stream** (v6's B). The drift variant is gone. | He progressed in B (sector 6 twice), never named a difference; A's denser opening killed him early. |

## The blind A/B in v7: how the death wave presses (run 20: "too slow, no pressure from it")
- **A: leash.** The wave never falls more than 620px behind you: always just off-screen, the "WAVE ◀" warning glowing. Slow down and it's on you.
- **B: surges.** Between surges it's v6's lazy wave. Every 13s it flares ("SURGE ◀◀", pulsing edge, 1.6s warning), then charges at 450px/s (faster than you) for 3.2s: break away or die.
- Bots: A reaches sector 4.8 (8/20 wins), B 4.4 (3/20 wins). Reach is matched; **B is somewhat harder to finish**.

## Architecture
- `core/player.js` gained `handling.grip` (a mode may lower it); the flight pod sets it. The core still knows nothing about the flight.
- `core/spawn-points.js` `fieldPoint` takes an optional `spill` beyond the lane.
- Chasers read an optional `rampS` from the stage definition.
- The wave moved into `pods/flight/death-wave.js` (owns the A/B).
- `node tools/check-pods.js`: OK (33 files).

## Expected run sequence
Runs on disk: 22. Next: **23 = A, 24 = B, 25 = A, 26 = B, 27 = A, 28 = B**.
