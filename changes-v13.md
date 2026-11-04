# Lure v13: tuning pass. Slow-mo for all, more lasers at the end, and the late rock density is the A/B

Built from session 12 (runs 55–58): "Luring them and getting the slow-mo as a reward as well as a little breather is awesome", and run 58 (his first win from sector 1, tagged too easy): "When more rocks appear, it's easier actually because the chasers kind of auto-die. Interesting. Maybe there are too many rocks. There could be more lasers in the end." He called the core loop "basically complete"; the meta loop comes after this pass (interview pending).

## What changed (every run)
| Change | Why |
|---|---|
| **Near-miss slow-mo in every run.** | Won v12's blind A/B and was named (runs 56, 58). |
| **More lasers in the last two sectors:** Tumble every 7s → 4.5s, Breakout every 5.5s → 3.8s. | "There could be more lasers in the end." |
| Everything else as in v12 (blasts harmless to you, direct control, pursuers from behind at 315). | |

## The blind A/B in v13: rock density in the last two sectors
- **A: as in v12** (22 per 1000px in Tumble and Breakout).
- **B: thinned to 13** (about 40% fewer rocks there).
- Sectors 1–4 are identical in both.
- This tests his "maybe" ("Maybe there are too many rocks"): does B stop pursuers "auto-dying" without becoming a flat, empty ending?
- **Not matched on purpose**: the variable is the late-game difficulty itself. Bots from sector 1 reach A 3.67, B 3.83 (v12: 3.4–3.7). Bots starting at sector 5 mostly win in both (their run starts with the 8s pursuer-free ramp-in), with fewer of the pursuer kills coming from rocks in B (31–35% vs 38–48%).
- Tried and reverted: more pursuers in the last two sectors (max 5 → 7). Blasts turned the extra pursuers into bigger chains; it got easier, not harder.

## Architecture
- `pods/near-miss/pod.js`: no variant gate.
- `pods/flight/course.js`: `LATE_ROCKS = { A: 22, B: 13 }`; laser intervals.
- `pods/rocks/pod.js`: `perKpx` may be per-variant.
- `node tools/check-pods.js`: OK.

## Expected run sequence
Run counter: 58 (runs 53–54 were skipped in v12). Next: **59 = A, 60 = B, 61 = A, 62 = B, 63 = A, 64 = B**.
