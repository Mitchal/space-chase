// The flight (his format, run 16): one continuous left-to-right run through an asteroid field,
// steady auto-scroll, pursuers on your tail, split into sectors with checkpoints. Reach the end and you win.
//
// Blind A/B for v5, something he can *see* (method lesson: invisible dials don't register):
//   A: cruising speed, 95 px/s.   B: fast, 140 px/s.   Sectors last the same time and spawn at the same rate in both.
import { world } from '../../core/world.js';
import { on, emit } from '../../core/events.js';
import { content, addSystem, ORDER } from '../../core/registry.js';
import { player } from '../../core/player.js';
import { SECTORS, SECTOR_S } from './sector-list.js';
import { drawProgress } from './progress-draw.js';

const SCROLL_SPEED = { A: 95, B: 140 };

content.arenas = SECTORS;
content.stageLabel = 'Sector';
content.stageFlow = { clearBetween: false, pauseS: 0, recenter: false, clearedText: 'YOU MADE IT' };
player.startX = 0.3; // start left of centre: the field comes at you
content.howToPlay = ['Fly through the asteroid field to the <b style="color:#7cf2c8">end</b>. Pursuers come from behind: lead them into the rocks.'];

on('arenaEnter', () => { world.scrollSpeed = SCROLL_SPEED[world.run.variant] ?? 110; });
on('runEnd', () => { world.scrollSpeed = 0; });

addSystem(ORDER.rules, () => {
  if (world.arena.t >= SECTOR_S) emit('arenaCleared');
});

drawProgress(SECTOR_S);
