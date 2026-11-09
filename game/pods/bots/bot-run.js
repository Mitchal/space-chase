// Plays one run with a bot at the controls, as fast as it can: each tick the bot's steering becomes an input frame
// (core/sim-input.js), which is recorded and played exactly like a person's. So a bot's run has a replay too
// (core/replay-recorder.js), which the tests play back. Needs no screen: the tests run it headlessly.
import { world } from '../../core/world.js';
import { emit } from '../../core/events.js';
import { collectSummary } from '../../core/registry.js';
import { startRun } from '../../core/run.js';
import { tick, TICK_HZ } from '../../core/sim-tick.js';
import { player, handling } from '../../core/player.js';
import { frameOf } from '../../core/sim-input.js';
import { recordFrame, lastReplay } from '../../core/replay-recorder.js';
import { stateFingerprint } from '../../core/replay-run.js';
import { randomPolicy, evaderPolicy } from './bot-policies.js';

export const POLICIES = { random: randomPolicy, evader: evaderPolicy };

// direct: bypass any installed steering (e.g. thrusters) so bots compare layouts, not their own piloting.
// mode: a game mode's id (left out: the current one). day, seed: the run's course and choices (core/course-seed.js);
// without a seed, that day's daily challenge (what the leaderboard replays). The bot's own dice are seeded too.
// → { summary (the run's summary, as saved for a person's run), replay (core/replay-recorder.js), fingerprint (the
// world at the end, core/replay-run.js) }.
export function playBot({ policy = 'evader', variant = 'A', startArena = 0, maxS = 600, direct = false, mode, seed, day = 'bot' } = {}) {
  const steer = handling.steer;
  if (direct) handling.steer = null;
  world.botPolicy = POLICIES[policy](seed ?? day);
  startRun({ mode, variant, startArena, index: -1, seed, day });
  for (let i = 0; i < maxS * TICK_HZ && !world.run.over; i++) {
    const want = world.botPolicy(player), frame = frameOf(want.ix, want.iy, handling.grip);
    recordFrame(frame);
    tick(frame);
  }
  const fingerprint = stateFingerprint();
  if (!world.run.over) { world.run.outcome = 'timeout'; emit('arenaExit', world.arena); world.run.endedAt = world.t - world.run.startedAt; }
  const summary = collectSummary();
  world.botPolicy = null; world.run = null; handling.steer = steer;
  return { summary, replay: lastReplay(), fingerprint };
}
