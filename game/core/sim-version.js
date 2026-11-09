// Which simulation this is. A replay only checks out in the same simulation it was played in, so the leaderboard turns
// away replays from another one (the player needs to update the game). Bump it whenever anything changes what a run
// does with the same input: speeds, spawns, sizes, scoring, the course, the tick, the order of systems. tests/sim-golden
// fails when replays stop coming out the same, as a reminder.
export const SIM_VERSION = 1;
