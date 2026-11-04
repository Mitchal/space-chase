# Lure v6: the flight, his way

Built from his run 17 diagnosis and spec: no auto-scroll, the camera centred on him, a death wave from the left, dynamic death walls top and bottom, a world wider than the viewport, and asteroids that fly about.

## What changed

| Change | Why (his words) |
|---|---|
| **No auto-scroll; the camera stays centred on you.** You move through a world bigger than the screen. | "The auto-scrolling… everyone has a weird gravity towards the right"; "I want the camera to be centred on me all the time". Nothing drifts any more unless it flies. |
| **Death wave rolls in from the left** at a sector-dependent pace (70→120 px/s); it rushes to catch up if you're more than 1100px ahead. Touching it is fatal. It kills pursuers too. An **edge warning with distance** shows when it's off-screen, and the progress bar shows its position. | "Force the player to go right by having a death wave rolling… from the left, of course." |
| **Dynamic death walls** above and below: a winding lane ~800–1200px tall (taller than the 640px view) that narrows sector by sector and slowly breathes. Touching a wall costs a heart; **pursuers die on them** (P10). | "Dynamic death walls on the top and bottom… so that I might fly wider than a viewport." |
| **Asteroids fly about**: never static. | "The asteroids are static, which is boring. I want them to be flying about like asteroids." |
| **Pursuers fly at 300 px/s (you: 270)**, with the same wide turns. You can't outrun them, only shed them into rocks, walls, mines or the wave. | Bots showed slower pursuers can't catch a forward-flying player, so there was nothing to lure. Reference moment 2: TIE fighters keep up with the Falcon. |
| Six sectors, 3600px each, with a finish line. Checkpoints per sector, one heart back per sector, 2 hearts. | P9: a flight that builds over minutes. |

Unchanged: movement only (P7); mines, lasers and chargers (sector 3+/4+); readable telegraphs; hit-stop and "hit by X".

## The blind A/B in v6: how the asteroids move (a feel question, so settled by play)
- **A: drifting.** Slow, random directions (10–45 px/s). The field is 1.5× denser so difficulty roughly matches.
- **B: tumbling.** Each stretch has a fast cross-current (70–130 px/s); rocks stream across the lane and bounce off the walls.
- Bots: A reaches sector 3.6 on average, B 5.0. Fast streams sweep pursuers away, so **B is still somewhat easier**.

## Architecture
- The kernel moved from screen space to **world space with a camera** (`core/camera.js`, replacing `core/scroll.js`). World bounds, `laneAt(x)`, `rearX`, view-relative spawn points and world-space floating text are all generic.
- The **flight pod** (`pods/flight/`) owns the course, wave, walls and progress bar.
- Rocks, mines, chasers and chargers adapted to the camera; the HUD, scoring, reaction form, title and telemetry needed no changes beyond labels.
- New telemetry: `closestWavePx` (how close the wave got) and `wallTimeS` (now measured against the lane walls).
- v5's pods are in `game/legacy/pods-v5/`. `node tools/check-pods.js` passes; the largest file is 78 lines.

## Expected run sequence
Runs on disk: 17. Next: **18 = B, 19 = A, 20 = B, 21 = A**.
