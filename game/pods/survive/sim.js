// Survive as the simulation sees it: a round arena about four screens big; missiles and rocks come in from its edge and
// it builds up (timeline.js). The day seeds all of it (core/run.js seeds every run by its mode and day), so every run
// that day meets the same missiles and rocks at the same moments. The score is how long you last, to the millisecond.
import { world, lurables, kill } from '../../core/world.js';
import { on } from '../../core/events.js';
import { content, addSystem, ORDER } from '../../core/registry.js';
import { addMode } from '../../core/game-modes.js';
import { player, hurt } from '../../core/player.js';
import { bounds, chordAt, wallContact, knockInside } from './arena-shape.js';
import { beginTimeline, stepTimeline } from './timeline.js';

export const MODE = 'survive';
const KNOCK = 160;

// How long the run has lasted (or lasted), in whole milliseconds of game time: the score.
export const runMs = () => Math.round((world.run.endedAt ?? world.t - world.run.startedAt) * 1000);

addMode({
  id: MODE,
  score: () => runMs(),
  setup() {
    content.arenas = [{ name: 'Arena', banner: 'SURVIVE' }];
    content.stageLabel = 'Arena';
    content.scoring = 'time';
    world.cameraFollows = true;
    world.bounds = bounds();
    world.laneAt = chordAt;
  },
});

on('arenaEnter', () => {
  if (world.mode !== MODE) return;
  Object.assign(player, { x: 0, y: 0, vx: 0, vy: 0 });
  beginTimeline();
});

addSystem(ORDER.director, () => stepTimeline(world.t - world.run.startedAt), { mode: MODE });

addSystem(ORDER.collide, () => {
  const hit = wallContact(player);
  if (hit.over > 0) { hurt('wall', { x: player.x, y: player.y }); knockInside(player, hit, KNOCK); }
  for (const e of lurables()) if (wallContact(e).over > 0) kill(e, 'wall');
}, { mode: MODE });
