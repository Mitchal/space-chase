// The six escape arenas (P8/P9). Each arena adds something to the world, never to the controller (P6/P7).
// Each key configures one pod; a key whose pod is missing is simply ignored.
//   chasers: { start, every }   seconds between spawns at pressure 1
//   chargers: { every, max }    lasers: { every }    mines: { count }    rocks: { count, drift }
//   keys: number of keys that open the exit
import { content } from '../../core/registry.js';

content.arenas = [
  { name: 'Hangar', keys: 3, chasers: { start: 5, every: 1.05 }, mines: { count: 3 } },
  { name: 'Debris field', keys: 3, chasers: { start: 5, every: 0.95 }, rocks: { count: 6 }, mines: { count: 1 } },
  { name: 'Crossfire', keys: 3, chasers: { start: 6, every: 0.9 }, rocks: { count: 4 }, mines: { count: 2 }, lasers: { every: 6 } },
  { name: 'Rams', keys: 3, chasers: { start: 6, every: 0.9 }, rocks: { count: 4 }, mines: { count: 2 }, chargers: { every: 9, max: 2 } },
  { name: 'Drift', keys: 3, chasers: { start: 6, every: 0.82 }, rocks: { count: 6, drift: true }, mines: { count: 2 }, chargers: { every: 10, max: 1 }, lasers: { every: 7 } },
  { name: 'Breakout', keys: 3, chasers: { start: 7, every: 0.75 }, rocks: { count: 5, drift: true }, mines: { count: 3 }, chargers: { every: 8, max: 2 }, lasers: { every: 5.5 } },
];
