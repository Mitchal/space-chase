# Lure v5: the flight

His format proposal (run 16), built from his four interview answers. Pillar references are to `vision.md` revision 5.

## What changed

| Change | Why |
|---|---|
| **One continuous left-to-right flight** with steady auto-scroll; reach the END to win | Run 16: "side scroller with asteroids and chasers… when I reach the end I win". Interview: steady scroll, left to right. |
| **The asteroid field is the level**: rocks stream in from ahead and ride the scroll; you weave through them | Reference moment 2, his favourite movement. Run 15: "too little dodging between asteroids… just get in get out". You can't route around it any more. |
| **Pursuers come from behind** (left edge), plus a pack arriving at the start of each sector | Interview: "from behind", TIE fighters on your tail. |
| **6 sectors of 40s** with checkpoints, one heart back per sector | Interview: sectors + checkpoints. P9: a full flight is 4 minutes. |
| **Run-wide progress bar** (START → END, one segment per sector) | P8: progress is the destination, so it has to be visible. |
| Keys, exits and the pressure cycle **removed** (their pods moved to `game/legacy/pods-v4/`) | Keys made a "get in, get out" sprint; the pressure cycle went unnoticed. |
| Mines drift in with the field | They still blow up pursuers and you. |
| Unchanged | Movement only (P7), 2 hearts (P11), rocks/mines/lasers/chargers hurt everyone (P10), readable chargers and lasers, hit-stop and "hit by X". |

Sectors: 1 Outer debris (sparse rocks, mines) · 2 Asteroid belt (dense rocks) · 3 Crossfire (+ lasers) · 4 Rams (+ chargers from behind) · 5 Drift (drifting rocks + lasers) · 6 Breakout (everything).

## The blind A/B in v5: speed itself
- **A: cruising**, 95 px/s. **B: fast**, 140 px/s.
- Same sector length (40s) and the same spawn rate per second, so B's field arrives faster and spaced further apart.
- Chosen because it's **visible in the situation** (method lesson: an invisible dial went unnoticed in v4) and because he picked "speed itself" as a high-octane moment.
- Bot difficulty is matched (sector 2.5 vs 2.9).

## Architecture
The pod structure carried the pivot:
- **Reused unchanged:** chasers and chargers (only an entry side was added), lasers, scoring, HUD, telemetry, reaction form, title screen, bots.
- **New:** `pods/sectors/` (the game mode, progress bar and scroll speed) and `core/scroll.js` (anything flagged `scrolls` rides the scroll).
- **Rewritten:** `pods/rocks/` and `pods/mines/` now stream in from ahead.
- **Core generalized:** stages can flow continuously (`content.stageFlow`) or as separate rooms; the title shows the mode pod's own how-to-play.
- **Removed by moving folders**, with no code edits elsewhere: `arenas`, `escape`, `pacing`. That's the removability rule working as intended.
- `node tools/check-pods.js` passes; the largest file is 76 lines.

## Expected run sequence
Runs on disk: 16. Next: **17 = A, 18 = B, 19 = A, 20 = B**. Every v5 run starts at sector 1 until he gets further.
