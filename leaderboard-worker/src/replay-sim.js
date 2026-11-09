// The game's simulation, loaded headlessly to replay runs: its kernel, then every pod's sim.js in the order the game
// loads pods (sim-pods.generated.js, written by tools/list-sim-pods.js before each build). Nothing here touches a
// screen or a clock (tools/check-determinism.js holds the game to that), so it runs in a Worker as it does in a browser.
import '../../game/core/sim-kernel.js';
import { SIM_PODS } from './sim-pods.generated.js';

export { SIM_PODS };
