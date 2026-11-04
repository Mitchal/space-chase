// How the death wave chases you: steady, readable pressure.
// v6's free wave was "too slow, no pressure from it" (run 20); v7's surges were resented ("lunging forward", run 26);
// v7's 620px leash swallowed pursuers off-screen before he ever saw them (run 23: "didn't see enough chasers").
// So: the sector's pace, but never more than LEASH behind you, far enough back that pursuers live on screen.
import { world } from '../../core/world.js';
import { player } from '../../core/player.js';

const LEASH = 800;

export function stepWave(wave, dt) {
  wave.x = Math.max(wave.x + world.arena.def.wave * dt, player.x - LEASH);
  wave.y = player.y;
}
