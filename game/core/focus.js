// Where the game is looking: world.focus, the centre of the play frame. It sits on the player when a mode asks for it
// (world.cameraFollows: his spec, "centred on me all the time"), else on the middle of the room.
// The play frame is a fixed MIN_W × H box around the focus. Anything that shapes the game (where things spawn, when the
// course ahead is generated, what's culled) uses it instead of the visible width, so a wide phone shows more of the same
// game rather than playing a different one (the daily course must be fair on any screen, and replays must match).
// What the screen shows is core/camera.js's business, which follows the focus.
// In a forward flight (world.cullBehind), entities flagged `cull` are dropped quietly once they are far behind the frame.
import { world, H, MIN_W } from './world.js';
import { on } from './events.js';
import { addSystem, ORDER } from './registry.js';
import { player } from './player.js';

const CULL_BEHIND = 500;

function follow() {
  if (!world.cameraFollows) { world.focus.x = MIN_W / 2; world.focus.y = H / 2; return; }
  world.focus.x = player.x; world.focus.y = player.y;
}

on('arenaEnter', follow);

export const playFrame = () => {
  const left = world.focus.x - MIN_W / 2, top = world.focus.y - H / 2;
  return { left, right: left + MIN_W, top };
};

addSystem(ORDER.late, () => {
  follow();
  if (!world.cullBehind) return;
  const behind = playFrame().left - CULL_BEHIND;
  for (const e of world.ents) if (e.cull && !e.dead && e.x < behind) e.dead = true;
}, { always: true });
