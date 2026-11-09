// Near misses as the simulation sees them: a pursuer that roars past within a hair of you slows time for a moment
// (fx.slowmo, simulation time: core/sim-tick.js) and emits 'nearMiss' (scoring gives a bonus, telemetry counts it).
import { world, lurables } from '../../core/world.js';
import { on, emit } from '../../core/events.js';
import { addSystem, ORDER } from '../../core/registry.js';
import { player } from '../../core/player.js';
import { dist } from '../../core/geometry.js';
import { floatText, fx } from '../../core/effects.js';

const GRAZE = 22, CLEAR = GRAZE + 16; // gap between edges that counts as a graze, and that counts as past
const SLOW_S = 0.45, SLOW_SCALE = 0.3;

on('runStart', () => { fx.slowmo = 0; });
on('hurt', () => { for (const e of lurables()) e.grazing = false; });

addSystem(ORDER.late, () => {
  if (!world.run) return;
  for (const e of lurables()) {
    if (e.grazed) continue;
    const gap = dist(e, player) - e.r - player.r;
    if (gap < GRAZE && !(player.inv > 0)) e.grazing = true;
    else if (e.grazing && gap > CLEAR) {
      e.grazing = false; e.grazed = true;
      fx.slowmo = SLOW_S; fx.slowScale = SLOW_SCALE;
      floatText(player.x, player.y - 26, 'CLOSE!', { col: '#7cf2c8', t: 1 });
      emit('nearMiss', { e });
    }
  }
});
