# Critic calibration notes

What past critics got wrong *about predicting Mikael*. These are lessons about the predictor, not about the game (game values live in `vision.md`). Read this before predicting and correct for these biases.

## After v2 (runs 5–8)
- **Optimism bias on "vs previous run": 0/4.** The critic predicted "better" every time; actual: first run, same, same, worse. Mikael rarely says "better". Over 7 comparisons: better ×1, same ×2, worse ×2, first run ×2. Use that as the prior.
- **The first run of a new version is "first run".** He resets the comparison when the build changes.
- **"Play again" is almost always yes** (6 of 7). Predicting yes is not insight. The informative cases are the rare meh/no; look for what would cause one.
- **More is not better for him.** The critic predicted he'd want more unlocks and variety. He wanted *fewer* inputs (P7). When a build adds things, ask what it costs his focus.
- **He raises new ideas unprompted** (run 6: planned objectives). Leave room in the predicted themes for "he proposes something new" instead of assuming he'll only react to what changed.
- **`learning` is a tag he uses** (2 of 4 runs in v2). Don't leave it out.
- **Hits worth keeping:** mechanics (what kills him, wave reached) and the A/B direction were predicted well. Theme hits came from reasoning about *friction* (run 7, key confusion), so keep doing that.

## After v3 (runs 9–12)
- **The "vs previous" prior overcorrected.** v2's lesson ("he rarely says better") made the v3 critic predict same/worse, but he said "better" three times in a row while the game was improving and he was learning. Condition the prior on the *trajectory*: when a build addresses his explicit complaints and he's winning more, "better" becomes likely. Running tally (13 runs incl. bonus run 13): better ×5, same ×2, worse ×2, first run ×3, blank ×1.
- **Biggest bias: assuming the intended design lands as intended.** The critic predicted he'd love the exit (he didn't see it), the door slam (never mentioned in 5 runs) and "killing opens the door" (never noticed). For every new feature, ask: *will he even perceive it?* Prefer predicting the experienced effect over the designed one.
- **High kill counts ≠ clever.** v3 doubled kills, but he called them "mostly accidental". Constant pressure trades P1 (cleverness) for P2 (intensity); expect him to notice.
- **His preferences are relative.** Dash was "a great balance" next to 3 inputs, and "stresses me out" next to movement only. Re-evaluate settled pillars when the alternative changes.
- **He answers A/B tests with a third option** (keys instead of timer vs kills). Predict that he may reject both variants.
- **He plays more runs than asked** (5 instead of 4 in v3). Late runs are where his design ideas peak.
- **Hits worth keeping:** the risk call ("the getaway becomes a scramble rather than a plan") had the right substance, and "he'll propose a new structure" came true.

## After v4 (runs 14–16)
- **He's a strong player; don't anchor difficulty on the bots.** The critic predicted median arena 2 for his first v4 run; he reached arena 6, then won twice. He has out-performed the evader bot in every version since v2. Treat bot win rates as a floor for him, not an estimate.
- **Watch for enthusiasm decay, not just complaints.** His first "no" to playing again came after he *won*. A build that's solved quickly stops being interesting. The critic gave "no" 4%. When a loop gets fast and repetitive, raise the probability of meh/no on later runs.
- **When he's done with a format, he proposes a new one.** He went from complaining about specifics (v1–v3) to proposing a whole new format (run 16). Leave room for "he reframes the game".
- **Structural calls were good:** P9 "may ask for more arenas", "won't perceive the cadence", "won't name the A/B difference", and "will propose a layout change" all landed. Keep reasoning about what he'll *perceive* and what he'll *ask for next*.
- **He plays fewer runs when a build disappoints** (3 of 5 predicted).

## After v5 (run 17)
- **His own ideas are hypotheses, not wishes.** The critic assumed the format he proposed would delight him ("this is way more like it", play again: yes 80%). He tested it, found it off after one run ("meh"), diagnosed why, and proposed a fix. When the build implements *his* idea, predict an *evaluation*, not applause.
- **Feel choices made in an interview don't survive play.** He picked steady auto-scroll in the abstract and rejected it on contact. Discount interview answers about feel when predicting.
- **Re-read the evidence for "obvious" carry-overs.** "Moving asteroids" was already in the log (v3 run 12); v5 shipped mostly static rocks and he called them boring. The critic didn't flag it either.
- **Risk reasoning is now the critic's strongest output.** "The scroll, not the player, sets the pace… expect a request to push right" was nearly verbatim. Keep leading with mechanism-level risks.

## After v6 (runs 18–22)
- **He perceives the dodge, not the kill.** The critic predicted P1 failing because telemetry showed kills happening behind him. He experienced the *dodge* (out-turning faster pursuers) as the clever part. Reason from what's on his screen and under his thumbs, not from kill attribution.
- **Don't predict a fix evaluation.** v5's lesson ("predict an evaluation, not applause") overshot: he didn't evaluate his gravity fix at all. When something stops bothering him it vanishes from his comments; he moves straight to the next problem.
- **Cold starts kill him.** Three of five runs died in sector 1 (6s, 12s, 23s), though he reached sector 6 twice. His skill is bimodal: early deaths while orienting, then deep runs. Put real weight on "dies in the first stage" when a stage opens at full pressure.
- **Fiction and feel are a new axis.** "Thematically weird" (instant turning, rocks bouncing inside walls). When the physics contradicts the fantasy he notices, even if it plays fine. Look for those contradictions in the build.
- **Undersized threats get flagged.** "The wave is too slow, no pressure." A threat that a good player can ignore is a predictable complaint.

## After v7 (runs 23–27)
- **Check what a change silently removes.** The leash wave ate most pursuers off-screen; his top complaint was "didn't see any chasers". Ask of every change: does it reduce the time his favourite things spend on screen?
- **Small feel changes go unperceived.** Grip 14 → 4 was "no difference in practice". Before predicting a feel reaction, ask whether the change is big enough to notice. He thinks in clear alternatives ("no momentum or full thrusters").
- **Sudden rule changes read as unfair, not exciting.** Surges ("lunging forward") were resented. Predict "unfair / too hard" for threats that break their own pattern, even when telegraphed.
- **He misattributes causes** (blamed asteroids for missing chasers). Predict his *explanation* separately from the real mechanism: his complaint is reliable, his diagnosis less so.
- **"vs previous" drops to "same" once a format is settled** and he's tuning. Don't carry the "better" trend from a format change into tuning rounds.
- **Mood is well calibrated now** (Brier 0.08). Spend effort on topics and valence.

## After v8 (runs 28–33)
- **A change he asked for and that works is absorbed silently.** All six predicted sentences were about thrusters; he never mentioned them. Predict silence about controls unless they fail, and predict that he blames himself ("skill issue") when they're merely hard.
- **He narrates moments, not systems.** "Tricked three of them", "came from out of nowhere near the bottom". Write the gut sentence as a story about one moment in the run.
- **One unreadable death flips play-again**, even in a session he's enjoying. Weight "no" by the chance of a death with no warning (spawn on screen, close), not by overall difficulty.
- **Harder is fine if it's his fault.** v8 was much harder than v7 and drew "Haha" and "challenges me". Don't predict "too hard" from difficulty alone.
- **Anchor sector medians on this version's bot results.** When a version gets harder, his previous sectors overestimate.
- **Ask what a layout removes from his toolkit.** Walls took the scatter away; he lost the rocks he lures pursuers into. The same lesson as v7 (check what a change silently removes), applied to the field.

## After v9 (runs 34–39)
- **Predict from what kills him, not from what we changed.** Asteroids were the change; pursuers killed him three times and were his theme. Before writing a gut sentence, ask which threat is most likely to kill him in this build (pursuers whenever they've just been made stronger or more present), and write about that.
- **He proposes fixes in the box.** Run 36: "Maybe they need a slightly bigger turn radius". When something is hard, predict a concrete tweak to the thing that's beating him.
- **Silence about controls lasts until they cost him.** Thrusters drew no comment in v8, then came up in v9 framed as "my harder controls" when pursuers became too strong. Silence meant "acceptable", not "settled".
- **Sector fatigue arrives around the ninth run without progress.** The first "meh" came at the end of v9's session. Predict it when many runs in a row start at sector 1 and stall at 2–3.

## After v10 (runs 40–45)
- **Killed-by: start from the last session's hit causes, then adjust for this build's changes.** v10 had rocks and walls at 10 of 15 hits under thrusters, and the build made pursuers *weaker*; the critic still led with chasers (0/6). Don't let the A/B's subject choose the killer.
- **Control complaints build across sessions.** Silence (v8) → "my harder controls" (v9) → "I want to try the non-thruster version again" (v10). One mention as a cost means the next session is likely to escalate. P12 was forecast "will hold" in both v9 and v10, and was wrong both times.
- **A visible A/B he asked for can still go unnamed.** Entry side (behind vs flanks) drew no direct comment; his one remark contradicted his earlier complaint ("chasers coming from the front… mostly fun"). Once the underlying pain is gone (pursuers too strong), the proposal that was meant to fix it stops mattering.
- **His proposals arrive tagged clever/satisfying, on a good moment.** Run 45: chain collisions. Predict a proposal that amplifies the moment he just enjoyed, not only fixes for what hurt.

## After v11 (runs 46–52)
- **The best round yet** (play-again Brier 0.075, killed-by 4/5, top tag 4/6; biggest risk and A/B verdict both hit). Keep doing: start killed-by from recent hit causes; predict the payoff he'll praise and the one way it bites him.
- **When the build is his own idea, he names the A/B.** Run 47: "I would have done better if chasers exploded in this run". Visible + self-designed variables get named; invisible or ours don't.
- **The hero exception.** He wants the world's rules to apply to him (rocks hurt, run 13), but not his own payoff ("their blast should not hurt me… I'm the hero here"). Predict "unfair" when his reward punishes him.
- **He can sense a gap without naming it** (run 49: "one more thing could somehow make it even more exciting. Not sure what"). Predict such reflections after a win or a deep run, when the current loop is working.
- **He plays more runs when it's going well** (seven this time). Expect an extra unpredicted run, often ending tired or sad.

## After v12 (runs 55–58)
- **He turns rewards into goals.** Slow-mo became something he hunted ("got a bit too greedy"). When a mechanic pays out for risk, predict that he chases it and blames his own greed for the death.
- **A pause he earns is a breather, not lag.** The predicted "stutter" never came. Interruptions he causes himself read as rewards; interruptions the game imposes (surges, v7) read as unfair.
- **"vs previous" climbs while he's learning a loop he likes.** Three "better"s in a row; "same" was the wrong default here. Use "same" only once his results plateau.
- **Watch for milestone statements.** After a first win from the start, he stepped back to the design level ("basically complete core loop", "what the meta loop should be"). Predict a shift from tuning to structure after a breakthrough run.

## After v13 (runs 59–60)
- **Short sessions after a milestone.** Two runs, both happy: once the core feels done, he plays less and thinks about structure. Predict fewer runs and design-level comments.
- **He prunes.** "Rammers… basically just a waste of space. Remove them." Like the dash in v3, a part that doesn't serve the core verb gets cut. Before predicting, list the parts he never praises; one may get a removal request.
- **Turning to the meta loop came as excitement, not fatigue** ("can't wait to make it infinitely replayable"). After a win, expect forward-looking ambition, not boredom.

## After v14 (runs 62–64)
- **The newest thing to him dominates his sentence.** Here that was the device (phone, lag, joystick), not the build's feature (ghost, daily). If he plays on a new device or with new controls, predict comments on feel and performance first, and expect the A/B to go unnoticed.
- **A first session on a new device resets his skill.** "Too hard maybe" from someone who wins on PC. Use reached-sector ranges from his early runs, not his recent ones.
