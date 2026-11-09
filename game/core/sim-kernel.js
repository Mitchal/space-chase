// The simulation's kernel, in a fixed order: everything a run needs to play out, and nothing that touches a screen,
// a clock or storage (tools/check-determinism.js holds every file reachable from here, and every pod's sim.js, to
// that). The browser loads it first (main.js), then each pod; a headless replay (the leaderboard Worker, the tests)
// loads it and then each pod's sim.js, in the same order (pod folders sorted by name), so systems run in the same order.
import './player.js';
import './run.js';
import './focus.js';
