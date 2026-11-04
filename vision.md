# Lure: vision (living document)

> Coordinates tell an agent *where*. This file tells it *why*.
> When a metric and a pillar disagree, the pillar wins. When a pillar and Mikael's reaction disagree, the pillar is wrong: update it.

## Status
Revision 15 (2026-11-03), after 61 playtested runs (v1: 4, v2: 4, v3: 5, v4: 3, v5: 1, v6: 5, v7: 5, v8: 6, v9: 6, v10: 6, v11: 7, v12: 4, v13: 2, v14: 3 on his phone).

**Milestone (run 58): "this seems like a basically complete core loop to me."** The core loop is settled: fly right through a field of big, drifting asteroids ahead of a death wave; pursuers come in on your tail; you out-turn them into rocks and each other; every death explodes and chains; a pursuer roaring past within a hair slows time ("a reward as well as a little breather"). Next design question: **the meta loop.** v13 (run 60, a no-hit win): "I basically love it now, and can't wait to make it infinitely replayable somehow." See `taste-log.md` for the evidence behind each change.
Labels: **supported** (backed by 2+ reactions), **hypothesis** (plausible, not yet tested), **retired**.

## Reference moments (the north star)
1. > A hero chased by two heat-seeking missiles spins at the last moment, and the missiles collide with each other. (run 1)
2. > Being chased by TIE fighters through an asteroid field: dodging between moving rocks and watching the pursuers smash into them. (run 13, his favorite moment so far)

In both, **the hero is in danger from the same things that destroy the pursuers**, and survives by *using* the danger. Every design question can be checked against these.

**Moment 1, scaled up (run 45, tagged clever + satisfying):** "It's fun to make chasers collide, would be even more fun if more than one could collide at once, maybe if each one collides with a little explosion radius like a mine! Now I lured three of them together but only two of them died." Gathering a crowd and setting it off together is the payoff he wants.
**Built in v11 (every pursuer death explodes) and confirmed blind:** "Haha I loved it when chain reactions took the chasers!" (run 50); from a no-blast run, "I would have done better if chasers exploded in this run" (run 47). The chain reaction is the game's peak.
**And the dodge itself:** "Loved maneouvering between chasers, dodging precisely and seeing them roar by" (run 48).

**Moment 2 is his favorite *movement*** ("dodging between asteroids, which was my favorite movement", run 15). An objective must route you *through* the field, never let you bypass it.
**The field is a toolkit.** Rocks are what you lure pursuers into, so they must be near you. v8 blind A/B: walls (B) drew no comment and left thin scatter between them ("I should have gone for the asteroids… they never came", run 32); scatter (A) reached sector 2.3 vs 1.3 with 10× the rock kills. **Fewer, larger rocks:** "The small ones are too small I think, I want fewer and larger ones" (run 31). ~~Walls of asteroids~~ (run 24 liked one; lost blind in v8). **v9: big rocks are right** ("I think I like these asteroids", run 38, on the fewest-and-huge variant); both counts tied. Settled for now.
**And asteroids move.** "The asteroids are static, which is boring. I want them to be flying about like asteroids" (run 17); "especially when they were moving" (run 12). A static field is an obstacle course, not an asteroid field.
**And the TIE fighters are faster than you.** "I like that the chasers are faster than me! But they turn slower, so I need to do some clever dodging!" (run 19). You can't outrun them; you out-turn them. **The margin must hold under the current controls:** thrusters made his turning worse, and pursuers became "nasty… I can't shake em" (run 37). His fix: "Maybe they need a slightly bigger turn radius to compensate for my harder controls now with the thruster" (run 36).
**And you know where they come from.** "It's really hard that they (chasers) spawn anywhere basically. Hard to keep a plan in the back pocket" (run 36). A warning says *when*; planning also needs *where*. **v10:** with wider turns, where they come from stopped mattering. Behind vs flanks went unnamed; "I did notice the chasers coming from the front before, and it was mostly fun" (run 43). Behind won slightly on results (2.7 vs 2.3) and fits the fantasy. The wider turns were praised: "seems fun that the chasers have worse controls now" (run 40).
**The pursuers are the star.** "Didn't see enough chasers, which are the most fun part" (run 23); "didn't see any chasers, which was a bit lame" (run 25). Anything that keeps them off his screen (v7: the wave ate them off-screen) breaks the game, however well it plays otherwise. v8 put them back (on screen 30–66% of each run): "the satisfaction when I tricked three of them was high!" (run 29), "Loved when I was able to outsmart a couple chasers" (run 31).

## Format (settled: the flight. "I think this is the format", run 25)
> "Maybe it should be a side scroller with asteroids and chasers… I can still move across the whole screen but it also scrolls so I make progress. And when I reach the end I win."

The arena loop is exhausted for now (run 16: his first "no" to playing again, and "worse"). A scrolling run through an asteroid field puts moment 2 *in the path*, makes progress the destination (P8), and builds over minutes (P9), with the same single verb (P7). **v6 result:** camera on him, death wave from the left, death walls, flying asteroids: play-again yes on every run, "SO CLOSE!", two runs to the last sector. The format is working; now tune it.

**Interview (forced choices, 2026-11-02):**
- ~~Steady auto-scroll~~ **Rejected after playing it** (run 17): "everyone has a weird gravity towards the right". Flyers live in screen space while the field flows left, so everything that flies drifts right relative to the world; he could also hover idle for a third of the run. **His fix: no auto-scroll; a death wave forces you onward.** The camera follows *your* progress.
- **Spec (his words, 2026-11-02):** "It rolls from the left, of course. And I want the camera to be centred on me all the time. So add some dynamic death walls on the top and bottom as well, so that I might fly wider than a viewport." → The world is bigger than the screen; the camera stays centred on him; the death wave rolls in from the left; dynamic death walls bound the top and bottom; asteroids move.
- Chasers come **from behind**: a tail of pursuers, TIE fighters on the Falcon.
- **Left to right**.
- **Sectors with checkpoints**: one continuous flight split into ~45s sectors, each introducing something.

## Pillars

### P1. The kill is always the player's idea (supported; **broken in v3**)
- **Feeling:** "I made that happen", not "that happened". Setting up traps is what makes him feel clever.
- **Evidence:** run 1 (clever, satisfying). Run 10, as a counter-example: "getting fancy and setting up traps… made me feel clever. But now there was no time for that… all dead enemies were mostly accidental. I couldn't plan it at all. So actually that's a bit of a problem."
- **Rules out:** random kills; enemies dying on their own; **pressure so constant that there's no time to set up a trap**.
- **v6: the mechanism is "out-turn, don't outrun".** Pursuers faster than him but with wider turns made dodging itself the clever act (run 19). He perceives the dodge, not where the kill happens.
- **Tripwire (v7):** pursuer time on screen. If he doesn't see them, there's nothing to lure.
- **Only pursuers that chase belong (v13).** "The 'Rammers' or whatever those other enemy types are, they are basically just a waste of space. Remove them" (run 59). Chargers dash in straight lines: nothing to out-turn, nothing to lure.
- **Tripwire (v12): pursuers that "auto-die".** "When more rocks appear, it's easier actually because the chasers kind of auto-die… Maybe too many rocks. There could be more lasers in the end" (run 58, tagged too easy). Dense late sectors kill pursuers without his help.
- **Tripwires:** `clever` tag; kills that follow a deliberate approach toward a hazard. A high kill count is *not* evidence (v3 had 140 kills per run, mostly accidental).

### P2. Intensity with dynamics (supported; revised)
- **Feeling:** high-octane peaks: swarmed, fast, inches from death. **But the cadence breathes.** There are moments to read the arena and set something up, then a payoff.
- **Evidence:** run 6, "I like the tempo and the intensity"; run 9, "I loved the initial intensity". Run 10: "The cadence was always pretty max so it felt less dynamic than before."
- **Rules out:** flat maximum pressure; pressure that comes from things you can't see coming.
- **Resolves the P1/P2 tension:** intensity in waves (build, peak, release), not a constant.
- **Tripwire:** spawn pressure must have visible lulls; chaos alone isn't the goal.
- **v4 result:** a pressure cycle signalled only by a warming border went **unnoticed** (no mention in 3 runs, under both A and B). Dynamics must come from the *situation* (what's in front of you), not from an invisible dial.
- **v12: the breather he earns.** Near-miss slow-mo gives "a little breather" (run 58): calm bought by his own risk, not handed out by a dial.
- **v6: a run ramps in.** 3 of 5 runs died in sector 1 (6s, 12s) with pursuers at full rate from the first second: "ease off in the beginning to let me find my bearings." And a threat a good player can ignore isn't pressure: "the wave chasing me is too slow, no pressure from it."
- **v7: but a threat that suddenly breaks its pattern is unfair.** Wave surges: "I do not appreciate the death wave lunging forward like that" (too hard, worse). Steady pressure he can read beats spikes; dynamics come from the field ("a wall of asteroids… actually fun"), not from a threat changing its rules.

### P3. Run 5 looks different from run 1 (supported)
- **Evidence:** v1 run 3 "felt like I had improved"; v3: died in arena 1 → won three runs in a row; "as I learn I actually like this more and more."

### P4. No dead air (supported)
- **Feeling:** there is always a lure available. You're never just waiting, including for a timer.
- **Rules out:** lone enemies with nothing to crash into; slow openings; **waiting for an exit to charge** (run 10: "static… forced").

### P5. Everything that matters is readable (supported; widened)
- **Feeling:** "my mistake", never "cheap"; and you never miss the thing you're supposed to do.
- **Evidence:** the v1 charger deaths were "cheap" (fixed in v2/v3: no more complaints). Run 9: **"I did not see the exit actually."**
- **Rules out:** threats whose warning gets lost; objectives that don't announce themselves; **pursuers that appear on screen close to you without warning** (run 33: "another one came from out of nowhere near the bottom of the screen and killed me. Felt bad", his only "no" in v8).
- **v8:** harder is welcome when the death is his fault ("Haha ok I see what I have to do. This challenges me"). One unreadable death outweighs a session of fun ones.
- **v9: the entry warning was praised** ("I like the bigger announcements of enemies", run 34). Also: a hit must leave you free. Run 34: "Two deaths from the same cause, I never got free in between" (wall hits keep your velocity, so under thrusters you stay pinned).

### P6. Every run moves you forward, in the world, not on the controller (supported)
- **Evidence:** "I like the freshness of a new mechanism" (run 7); new world elements in v3 (rocks, drifting rocks) were loved (runs 12–13). Checkpoints are liked.
- **Rules out:** progression delivered as new buttons.

### P7. Fewest verbs possible, and controls that disappear (revised: **movement only** is the current best; v10: thrusters put his attention on the controller)
- **Feeling:** all of your attention is on the arena, none on the controls.
- **Evidence:** run 8, "movement + dash… a great balance" (against *three* inputs). Run 11, "If I disregard the shift dash it's actually more fun. That one stresses me out because I feel like I need to use it. Movement only is best so far." He stopped dashing from run 11 on.
- **Lesson:** his preference was relative to the alternative on offer. Each verb adds pressure to use it.
- **Rules out:** any active ability unless it clearly earns its stress; a new input must name the input it replaces.

### P8. Objectives you plan a route for: keys, not timers (supported; refined)
- **Feeling:** "I need to get *there*, and I'll drag my pursuers through danger on the way." The player sets the pace.
- **Evidence:** run 6 (objectives to plan for, not random pickups); interview chose "open the exit"; v3 run 10, a charging exit felt "unexplained and forced". **His own design (run 12):** "three keys spread out that would open the exit… each with a dotted line toward the exit… would serve as the onboarding and the reminder." Run 13: "when I can set the pace with keys myself it will mostly be shorter levels, which is cool."
- **Rules out:** timers; exits that open on their own; random timed pickups; objectives with no visible connection to their purpose.
- **Retired:** "kills charge the exit" (v3 B). He never noticed it, and it wasn't the answer.
- **v4 result:** keys with dotted lines read instantly (onboarding solved), but turned arenas into 10–17s sprints: "It's just get in get out." The objective must not offer a path *around* the fun.

### P9. Runs build over minutes (supported; at risk in v8–v10, **recovered in v11**: a win, and sector 1 → 6 in 87s)
- A run builds and climaxes over a few minutes, through **a sequence of short, player-paced arenas**. Checkpoints stay.
- Evidence: v3 full runs took 98–153s and felt good. Run 13 accepts shorter arenas once keys let him set the pace. **v4:** ~90s runs of 10–17s arenas felt "fast… we might need more levels". Short *pieces* are fine; the whole should still last minutes.

### P10. One set of rules, except the hero's own payoff (revised in v11)
- **Feeling:** the world is dangerous to everyone. You survive the asteroid field because you're good, not because you're immune.
- **Evidence:** run 13, "the moving obstacles should probably be dangerous to me as well… it feels a bit unfair now that I can hug them while they kill my opponents."
- **Why:** both reference moments put the hero in the same danger as the pursuers.
- **Rules out:** hazards that only hurt enemies; safe zones created by hazards.
- **v11: the hero exception.** "Nooo the blast got me! Ok I'm thinking maybe their blast should not hurt me. A bit unfair perhaps but hey I'm the hero here" (run 48). The world's hazards (rocks, walls, mines, lasers) hurt everyone; the payoff of *his* trap (pursuer blasts) doesn't punish him.

### P11. Unforgiving enough to matter (hypothesis)
- **Evidence:** run 13, "probably a bit too easy with three hearts. Second touch should kill me."
- **Direction:** 2 hits per arena. Danger is only thrilling if it's real.

### P12. The physics matches the fantasy (hypothesis, **loses to P7**: thrusters failed over v8–v10; v11 direct control: "Awesome control with the direct controls back")
- **Feeling:** you fly a ship through space. Things move the way a ship and asteroids would.
- **Evidence:** run 20, "It's a bit weird that I can turn on a dime now. Maybe it's more fun, but it seems thematically weird. Maybe I should have some momentum too, still faster handling than the chasers but not instant." And "asteroids look weird bouncing inside the walls, they should float through it and away."
- **Constraint:** fiction never costs P1: he must still out-handle the pursuers.
- **Rules out:** instant direction changes; hazards that behave like a box's walls instead of space.
- **v7:** a mild drift (grip 4) was "no difference in practice". He wants a clear choice: **no momentum at all, or full thrusters** (relative turns + throttle, inertia on release), and admits he "may miss this level of control". Open; settle by play, in a block.
- **v8 (thrusters, 6 runs): not a single mention.** He blamed himself instead ("I still think it's a skill issue"). Leaning **thrusters**; kept unless he raises it.
- **v9: raised, as a cost, not a rejection.** "my harder controls now with the thruster": compensate in the pursuers (wider turns), keep the ship.
- **v10: rejected.** "I am terrible at flying near but not into rocks and the wall" (41); "I can gain control by easing off the thruster, not sure if that's the most fun though" (42); "Feel like I want to try the non-thruster version again tbh" (44, his "meh"). Rocks and walls caused 10 of 15 hits. Threading close past rocks is his favourite movement (moment 2), and thrusters made it a chore. **When fiction costs the core movement, the movement wins** (P7: attention on the arena, not the controls). Next: direct control again; fiction carried by visuals (nose, flame), not by handling.

## Answered (v12): the "one more thing"
Run 49: "one more thing could somehow make it even more exciting." The first candidate, **near-miss slow-mo**, won blind and was named: "I wanted to trigger the slowmo so I got a bit too greedy" (56), "Luring them and getting the slow-mo as a reward as well as a little breather is awesome" (58). The risky quick turn became a goal.

## Open question (v12): the meta loop
"I'm also thinking about what the meta loop should be like now, because this seems like a basically complete core loop to me" (run 58). Ask him about *goals and values* (what should make him come back, what should change between runs), not about features or feel. Then build a thin slice and let him react.
- **Meta-loop values (2026-11-03, see meta-loop.md):** no menus mid-run; **no power** ("Becoming more powerful would probably break that and make it feel too easy"); freshness from new worlds, weather and missions that use luring; scores and ghosts; both modes (finite run + endless). Needs a monetization **sink** that never touches the feel.
- **His baseline (2026-11-03): roguelite.** "I'm kind of into roguelites, so that would be a cool baseline." Open: which roguelite elements (choices during a run, unlocks across runs, a varied course).
- **Distribution goal (2026-11-03): a standalone Android app.** "I would love to be able to release this as a standalone Android app." Consequences: touch controls become *the* controls (P7: settle by play, on a phone, early); **his choice: an on-screen joystick, like Roblox** ("I don't want 'fly to where my finger is' controls"): touch maps to the same relative intent as WASD, never to a target point; the whole screen is the joystick area (a floating stick appears wherever the thumb lands: "we don't have a camera to control"); portrait vs landscape; no server (logs and pod discovery must work offline).
- **Idea (2026-11-03): a race.** "Would also be cool to experiment with a race feature where you try to beat other players to the end, and you can collide with them." Untested. Cheapest slice: AI rival ships (the bot pilots) in the same run, which you can bump and lure your pursuers onto; then ghosts of other players' runs; live multiplayer last.

- **Meta loop 3 picked (2026-11-03): Daily flight** ("simple and pure skill"), built as v14. Hearts per day (his idea, "like Candy crush") are noted in meta-loop.md and not built yet. Not judged yet: v14 was played on his phone, and lag drowned it.
- **First phone session (v14):** "Lagging on my phone. Also controls have a built in inertia on phone, i think the joystick radius might be too large" (63); "Fun even though laggy" (64). On touch, P7 means a small thumb movement gives full speed with no felt smoothing, and the game must run smoothly on a phone before anything else is judged there.

- **Decision (2026-11-03, after v14): ship it.** "Actually, smash it out into the most performant mobile app you can. We are going with this. I love all of it, including the ghosts. A simple main menu with a simple daily challenge, that's gonna be the main hook. Keep it on the web as well." v15 is the mobile app (changes-v15.md). **The Daily Challenge is the main hook; ghosts are settled.** On a phone: smooth first (P5/P7), the stick answers at once, and the game must be fair on any screen shape (spawns and course use a fixed play frame).

## Not validated
- **Door slam** (reference moment 1 as a mechanic): 8 slams in 15 escapes, never mentioned. Either it doesn't read or it doesn't matter. Don't build more on it until it earns a reaction.

## Interview lessons (about the method)
- Multiple-choice questions where every option sounds good don't separate anything. Use forced A/B comparisons.
- Look for the mechanism behind a reaction before treating it as a preference (telemetry).
- Don't A/B-test *controls* by alternating runs. Test controls in blocks.
- Answer options must not be ambiguous ("didn't care" ≠ indifferent). Use "like it / fine / dislike it".
- Real-world interruptions happen: the form has a "this run doesn't count" option.
- **Preferences are relative to the alternatives shown** (dash: great against 3 verbs, stressful against 1). Re-test settled values when the context changes.
- **An A/B can be answered "neither"** (timer vs kill-charge → keys). Leave room for his third option instead of forcing a choice.
- **Abstract choices about feel are unreliable.** He chose steady auto-scroll in the interview and rejected it after one run. Ask about *goals and values* in interviews; settle *feel* by building and playing.
- **Invisible dials don't register.** A pressure cycle shown only by a border colour went unnoticed. Test variables he can *see in the situation*.
- **A "no" to play-again is rare and loud.** First one in 16 runs, together with a format proposal. Treat it as a signal to change direction, not to tune.
- **He designs well when given a concrete build to react to.** Several of the best ideas came from him, unprompted, in the gut-reaction box. Keep that box first and free-form.
