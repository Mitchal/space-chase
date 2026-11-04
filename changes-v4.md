# Lure v4: what changed and why

Every change traces to `vision.md` revision 4. Earlier builds are in `game/legacy/`.

## Design changes

| Change | Pillar | Detail |
|---|---|---|
| **Keys open the exit** (his design from run 12) | P8 | 3 keys per arena, spread out, each with a **dotted line to the exit**: the onboarding and the reminder. The exit label counts `EXIT 1/3`. No timers, no charge bar. |
| **Movement only** | P7 | Dash removed (run 11: "stresses me out… movement only is best so far"). |
| **Rocks hurt you too**, static and drifting | P10, reference moment 2 | Hit a rock: you lose a heart and bounce off. Rocks now have a warm rim instead of v3's neutral grey. |
| **Two hearts** | P11 | Run 13: "second touch should kill me". You get one back when entering a new arena (max 2). |
| **Breathing cadence** | P2 revised, P1 | Pressure rises and falls; spawners scale with it. **The arena border warms as pressure rises**, so the rhythm is readable. Once the exit opens, it's a full-pressure getaway. |
| Door slam **removed** | Not validated | Never mentioned in 5 runs. |
| More pursuers from the start | P11, P4 | Tuned with bots (see `data/sim-v4.json`). |

Unchanged: chasers (speed 168, wide turns), chargers with readable windups (arena 4+), mines with blast rings, lasers (arena 3+), checkpoints, hit-stop and "hit by X" labels, the "doesn't count" button.

## The blind A/B in v4: who sets the rhythm?
- **A: the clock.** A fixed 16s cycle: 5s lull, 6s build, 5s peak.
- **B: you.** Calm until you take a key; each key triggers a surge that fades over ~8s. You choose when the storm comes (P8: "set the pace myself"; P1: room to set traps).
- Controls are identical in both. The difference shows only in *when* the border warms and the pursuers pour in.

## Architecture (his global rules: removable pods, small files, tracer bullets)
v4 is a rewrite from one 750-line file into a **small core plus 14 feature pods** (`game/core/`, `game/pods/<feature>/`).
- The server discovers pods by folder (`/api/pods`), so **deleting a pod folder removes the feature** with no code change. For example, delete `pods/rocks/` and the arenas simply have no rocks.
- Pods depend only on `core/` and talk to each other through events. **`node tools/check-pods.js`** statically enforces this (verified: it catches sideways pod imports and core→pod imports). Largest file: 82 lines.

## Expected run sequence
Runs on disk: 13. Next: **14 = B, 15 = A, 16 = B, 17 = A** (variants alternate by run number; run 14 happens to start with B). Every v4 run starts at arena 1 until he gets further; checkpoints are per version.
