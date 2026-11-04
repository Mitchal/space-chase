# Lure v12: blasts in every run (and they never hurt you), plus near-miss slow-mo (blind A/B)

Built from session 11 (runs 46–52): "maybe their blast should not hurt me. A bit unfair perhaps but hey I'm the hero here", "I would have done better if chasers exploded in this run", "Loved maneouvering between chasers, dodging precisely and seeing them roar by", and run 49: "There is a bit of a lull when I see a chaser coming and I first try to find a rock, but ok now it's too close for a rock, then I need to shake it by a quick turn. But that is risky… I'm thinking one more thing could somehow make it even more exciting. Not sure what thing though."

## What changed (every run)
| Change | Why |
|---|---|
| **Every pursuer death explodes, in every run.** Chains as in v11 B. | Won v11's blind A/B, and he named it unprompted (run 47). |
| **Blasts never hurt you.** | "I'm the hero here" (run 48). Blasts hit him 3 times in v11 B, once fatally. |
| Pursuer pressure as in v11 B (every × 0.35, max + 4) in both variants. | Blasts clear crowds. |
| Direct control, speed 315, from behind, asteroids, wave: unchanged. | |

## The blind A/B in v12: near-miss slow-mo
A first concrete candidate for his "one more thing".
- **B: near misses.** When a pursuer passes within ~22px of your edge and gets clear without hitting you, time slows to 30% for 0.45s, "CLOSE!" pops above you, a green ring snaps out from the ship, and you get +50. Each pursuer counts once. It turns the risky quick turn (no rock near) into a highlight.
- **A: no near misses.**
- Bots, from sector 1: **A 3.67, B 3.39** (18 runs each). Near misses barely change the simulation: slow-mo is real-time only, and bots almost never graze (0.06 per run; they keep their distance). For him, slow-mo gives a little extra reaction time in B.
- For comparison, v11 bots reached 3.35–3.65.

## Architecture
- `pods/near-miss/pod.js` (new): detection, slow-mo request, ring, emits `nearMiss`. Scoring (+50) and telemetry (`nearMisses`) listen to the event.
- `core/effects.js` + `core/loop.js`: generic `fx.slowmo` / `fx.slowScale` (any pod can ask for a moment of slow time).
- `pods/death-blasts/pod.js`: no variant gate, no damage to you.
- `node tools/check-pods.js`: OK (37 files).

## Expected run sequence
Runs on disk: 52. Next: **53 = A, 54 = B, 55 = A, 56 = B, 57 = A, 58 = B**.

## Note
Before the predictions were sealed he tried the near-miss slow-mo in an unlogged run (no run counted, variant order unchanged). He has seen B once.
