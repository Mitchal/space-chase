// The camera: centred on the player when a mode asks for it (his spec: "centred on me all the time").
// Entities flagged `cull` are dropped quietly once they are far behind the view.
import { world, W, H } from './world.js';
import { on } from './events.js';
import { addSystem, ORDER } from './registry.js';
import { player } from './player.js';

const CULL_BEHIND = 500;

function follow() {
  if (!world.cameraFollows) { world.cam.x = 0; world.cam.y = 0; return; }
  world.cam.x = player.x - W / 2;
  world.cam.y = player.y - H / 2;
}

on('arenaEnter', follow);

addSystem(ORDER.late, () => {
  follow();
  const behind = world.cam.x - CULL_BEHIND;
  for (const e of world.ents) if (e.cull && !e.dead && e.x < behind) e.dead = true;
}, { always: true });

// True if a world point (with radius) is inside the view.
export const inView = (p, r = 0) => p.x + r > world.cam.x && p.x - r < world.cam.x + W && p.y + r > world.cam.y && p.y - r < world.cam.y + H;
