// host-only: what a run played in the browser gets from the browser. Its number comes from the taste log's count, its
// day is the game's day (core/game-day.js: midnight in Sweden), and its A/B variant alternates only in playtest mode:
// for players every run is variant A, so every run of a daily challenge is the same challenge.
import { runHost } from './run.js';
import { nextRunIndex } from './storage.js';
import { gameToday } from './game-day.js';
import { playtest } from './mode.js';

runHost.nextIndex = nextRunIndex;
runHost.today = gameToday;
runHost.variant = index => playtest && index % 2 === 1 ? 'B' : 'A';
