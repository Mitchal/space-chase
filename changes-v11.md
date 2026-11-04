# Lure v11: direct control again, pursuers on your tail, and every pursuer death explodes (blind A/B)

Built from session 10 (runs 40–45) and his follow-ups (2026-11-03): "Feel like I want to try the non-thruster version again tbh", "I am terrible at flying near but not into rocks and the wall", "would be even more fun if more than one could collide at once, maybe if each one collides with a little explosion radius like a mine!", then "every death of a chaser should lead to it personally exploding with a blast", and "Go back to previous turn radius for chasers also, since my direct control will definitely make it too easy otherwise."

## What changed (every run)
| Change | Why |
|---|---|
| **Direct control again.** WASD / arrows, or hold the mouse. The ship's nose points where you're going. The thrusters pod moved to `game/legacy/pods-v10/thrusters`; nothing else needed changing. | His request (run 44). Rocks and walls caused 10 of his 15 v10 hits under thrusters. |
| **Pursuers turn as tightly as before** (2.3 rad/s, ~130px radius; v10 had 1.8). | His call: "my direct control will definitely make it too easy otherwise". |
| **Pursuers always come from behind**, entering at the left edge of the screen with the warning arrow. | v10's A/B: behind reached further (2.7 vs 2.3), best run, clever/satisfying tags; the TIE-fighter fantasy. |
| **Pursuers are faster: 315 (was 300; you: 270), come more often, and more can be alive at once.** | With direct control bots reached sector 4.7–5 (thrusters: ~2). Pursuers from behind rarely catch a ship flying straight, so speed is the lever that matters. |
| Asteroids, wave, walls, entry warning: unchanged. | |

## The blind A/B in v11: death blasts
- **B: every pursuer death explodes.** Whatever kills it (a rock, a wall, the wave, a laser, a mine, another pursuer, or ramming you), it bursts with a small orange blast (66px; mines are 64). The blast kills pursuers nearby, which explode in turn: pack them tight and the whole crowd goes. **The blast hurts you too** (one set of rules), except the blast of a pursuer that rammed you (that hit already counted).
- **A: pursuers just die**, as before.
- Blasts clear crowds, so B sends pursuers more often (every × 0.35 vs × 0.6) and allows more alive (max + 4 vs + 1). Expect **busier screens and many more kills in B** (bots: 26–30 kills per run vs 15).
- Bots from sector 1 (direct control): **A 3.35, B 3.5–3.65**. Matched within noise. For reference, v8–v9 direct-control bots reached 2.3–3.4.
- The blasts are a new pod (`pods/death-blasts/`), which reacts to the core `kill` event; delete the folder and pursuers just die.
- New hurt cause: **"a pursuer blast"**.

## Architecture
- `pods/thrusters` → `game/legacy/pods-v10/thrusters` (a live removability test: the game runs on core handling).
- `pods/death-blasts/pod.js` (new, 46 lines).
- `pods/chasers/pod.js`: TURN 2.3. `pods/flight/course.js`: from behind; per-variant `pace` / `extra`; speed 315.
- `core/player.js`: label for the "blast" cause.
- `node tools/check-pods.js`: OK.

## Expected run sequence
Runs on disk: 45. Next: **46 = B, 47 = A, 48 = B, 49 = A, 50 = B, 51 = A**.
