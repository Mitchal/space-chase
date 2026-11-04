# Lure v10: pursuers turn wider, walls knock you free, and where pursuers come from is the A/B

Built from session 9 (runs 34–39): "They are nasty. I can't shake em", "it's really hard that they (chasers) spawn anywhere basically. Hard to keep a plan in the back pocket", "Maybe they need a slightly bigger turn radius to compensate for my harder controls now with the thruster", "Two deaths from the same cause, I never got free in between". Asteroids unchanged ("I think I like these asteroids").

## What changed (every run)
| Change | Why |
|---|---|
| **Pursuers turn wider:** turn rate 2.3 → 1.8 rad/s, so their tightest circle at full speed grows from ~130px to ~167px radius. Still faster than you. | His own fix (run 36). Thrusters made his turning worse, so the "out-turn them" margin had shrunk. |
| **A wall hit knocks you back into the lane** (at least 160px/s away from the wall) instead of leaving you sliding into it. | Run 34: "I never got free in between". The wall hit kept his velocity, and a second hit landed as invulnerability ran out. Same pattern in run 37. |
| **An announced pursuer holds its place on screen** for its 1.5s warning, then aims at you as it comes in. **Pursuers far from you (>450px) fly 35% faster** until they've closed in. | Needed for A: a pursuer waiting at the left edge was left behind and eaten by the wave (bots: 29 wave kills per run, pursuers seen 9% of the time, the v7 problem). Now: ~0.6 wave kills, seen ~65%. |
| Title text no longer says where pursuers come from (so it doesn't give the A/B away), and mentions the red arrow. | |
| Asteroids, thrusters, wave: unchanged. Asteroids are v9's A (radius 22–70, 65% of v8's count) in every run; the size A/B is closed. | v9 asteroid A/B was a tie; he liked them. |

## The blind A/B in v10: where pursuers come from
- **A: from behind.** They enter at the left edge of the screen, on your tail, like TIE fighters on the Falcon. Because they're easier to keep ahead of, A sends them more often (every × 0.55) and allows two more alive at once.
- **B: from the sides and ahead**, as in v8–v9.
- Bots, sector reached from sector 1, thruster autopilot (the controls he uses), two batches of 14 with all runs on the same rocks: **A 1.9–2.2, B 1.9**. Matched within noise.
- Bots with direct control: **A 3.8–3.9, B 2.9–3.1**. A direct-control bot flies straight at full speed, and pursuers from behind rarely catch that; no pace setting closed this gap. So A may be easier for him if he flies straight a lot.
- Pursuers on screen (direct): A ~67% of the run, B ~57%. Wave kills: A ~0.7 per run, B ~0.1.

## Architecture
- `pods/chasers/pod.js`: TURN 1.8; `pace` / `extra` per variant; announced pursuers pinned to the screen; catch-up speed when far.
- `pods/flight/course.js`: `from: { A: 'behind', B: 'flank' }`; pods resolve per-variant config for themselves.
- `pods/flight/pod.js`: the wall knock-back.
- `node tools/check-pods.js`: OK (36 files).

## Expected run sequence
Runs on disk: 39. Next: **40 = B, 41 = A, 42 = B, 43 = A, 44 = B, 45 = A**.
