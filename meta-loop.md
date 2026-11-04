# Lure: meta loop brainstorm

Living notes for the meta loop (what makes him come back), started 2026-11-03 after he called the core loop "basically complete". Decisions go to `vision.md` once he's played them.

## What he said (2026-11-03)
- Baseline: **roguelite**. Modes: **both** (a finite run to a finish line, and endless after a win).
- Picked: space weather, daily seed, forks you fly into, boons for chains/blasts and near misses, scores and ghosts.
- Didn't pick: shuffled sectors, new species, salvage pods, 1-of-3 boon menus, bargains, heat levels, content unlocks, ship hulls, permanent power.
- His notes, in his words:
  > Should be no menus mid run, I agree. Also, it would be sad if the feel we worked so hard to build regarding the controls and the chasers interactions would break somehow. Becoming more powerful would probably break that and make it feel too easy. Rather, I probably just want new worlds (shapes of rocks?) or an infinite best score to beat. But that will probably lower the longevity, so maybe I should experiment with some permanent unlocks. Or maybe we can keep the world feeling fresh some other way. Maybe you have different missions and things you need to do during the flight. Like sometimes you gotta look for rabbits in cages on the rocks (rayman is it?) and sometimes you gotta kill a certain number of chasers. I'm drawing a blank on whether this would make sense. Let's keep brainstorming.
  >
  > Also, I would need a way to monetize. Ideally a sink of some kind.

## Decision (2026-11-03, after the brainstorm)
> I was thinking maybe limiting hearts per day Like Candy crush did it. Let's start with your number 3 meta loop suggestion because it is simple and pure skill.

- **Building first: meta loop 3, Daily flight** (v14): a date-seeded course, from sector 1, today's best score, and the ghost of your best run as the A/B.
- **Hearts per day (his idea, not built yet).** A heart buys a try, not strength, so it passes the "no power" rule. My earlier note to avoid selling hearts was wrong on that count. Shape: N ranked attempts at today's course, with practice free and refills as the sink (wait, watch an ad, or buy). Risk: paying for more tries on a pure-skill leaderboard can feel like buying rank, so maybe a leaderboard counts only the first N attempts. Build it once the daily proves it pulls him back, because a gate now would cut his playtests short.

## Constraints that fall out of that
1. **The core feel is sacred.** Controls, pursuer speed and turning, blasts, slow-mo: no meta system may change them. That rules out **power** (permanent or in-run stat boosts), and that includes most boons.
2. **No menus mid-run.** Choices happen by flying (forks), or before or after a run.
3. **Freshness comes from the world and the goal**, not from the ship: new worlds (rock shapes, weather) and new reasons to fly (missions).
4. **Longevity and monetization need a sink** that doesn't sell power.

## Building blocks, judged against the pillars
| Block | Fits because | Risk |
|---|---|---|
| **Worlds** (rock shapes and behaviour: shards, rings, tumbling slabs, ice that splits) | New field, same verbs (P6: progress in the world) | Content cost per world |
| **Space weather** (ion storm: rocks faster; nebula: short sight; gravity well: everything bends toward a point) | Twists the rules everyone obeys (P10) | Must stay readable (P5) |
| **Forks you fly into** | A choice made by steering; no menu (P7) | Needs previews you can read at speed |
| **Missions in flight** | A new reason to lure, not a new verb | Must *use* luring, not distract from it |
| **Daily seed + ghosts + scores** | Pure skill, a reason to return daily, shareable | Alone, longevity is short (his worry) |
| **Endless after a win** | His "both modes"; an infinite score to beat | Needs escalation that stays fair |
| **Cosmetics** (hull paint, trails, blast colours, slow-mo effects) | A sink that never touches the feel | Must look good enough to want |

### Missions that use the core verb (his rabbit-cage idea, made on-pillar)
- **Caged critters on rocks** (Rayman's cages): a cage only breaks in a **pursuer blast**, so you must lure a pursuer into exploding next to it. Rescue them for the mission.
- **Chain goal:** set off a chain of 5+.
- **Cull:** destroy N pursuers in a sector.
- **Graze streak:** 3 near misses within 5 seconds.
- **Escort / beacon:** fly through beacons while pursuers are on your tail.
- **Untouched:** finish a sector without a hit.
Missions are offered **before** the run (a contract board) or appear **in the world** as a visible object (a cage, a beacon). Never as a pop-up.

## Three possible meta loops
### 1. Contracts (recommended)
Before a run you pick a **contract**: a world, its weather and 1–3 missions (e.g. "Ice belt, ion storm: free 3 critters, chain of 6"). Missions pay **salvage**. Salvage is spent on **cosmetics** and on **charting new worlds and weather** (width, never power). A **daily contract** has a fixed seed, ghosts and a leaderboard. Win a contract and **endless** opens for that world.
- Longevity: missions × worlds × weather, plus the daily.
- Sink: salvage → cosmetics + charting; sell salvage packs, a cosmetic season pass, an ad-free option. No power for sale.

### 2. Star map
Forks in flight move you across a **branching star map**. Each node is a world with weather; caged critters are the collectible that opens new regions (Rayman's Electoons). Endless after the map's last node.
- Longevity: a collectathon across a map.
- Sink: map expansions (premium regions) + cosmetics.

### 3. Daily flight
Pure skill: one seeded course + weather a day, ghosts, a leaderboard, a weekly world rotation, streaks and ranks.
- Longevity: habit (Wordle-style), shorter per day.
- Sink: cosmetics, a season pass. Thin, but cheapest to run.

These combine: **1 with 3's daily seed** is the natural pairing, and **2's forks** can live inside a contract.

## Monetization notes (his call; options, not decisions)
- **Cosmetics as the sink** is the only kind that can't break the feel. Hull skins, engine trails, blast and chain colours, near-miss effects, cage-critter companions.
- **Soft currency (salvage) earned by playing**, with an optional purchase to top it up. Spend it on cosmetics and on charting worlds sooner.
- **Rewarded ads**, opt-in only (double salvage after a run), never forced mid-run. An ad-free purchase.
- Avoid: selling continues or slow-mo charges. Those are in-run power, and he's ruled power out. Hearts (tries per day) are not power; see Decision above.

## Thinnest slices to test first (one variable each, played on the current build)
1. **Caged critters:** cages on some rocks, broken only by pursuer blasts, with a counter on the results screen. Tests "do missions add fun, or distract?" Cheapest, and closest to his own idea.
2. **One space weather** (gravity well or ion storm) as a blind A/B. Tests "does weather keep it fresh without breaking feel?"
3. **Daily seed + a ghost of your best run.** Tests "does an infinite best score pull me back?"
