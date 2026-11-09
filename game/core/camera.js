// host-only: the camera, for drawing. It looks at the simulation's focus (core/focus.js), with the view's own width
// (core/view-size.js): a wide screen sees further to the sides, but the game it shows is the same.
import { world, H } from './world.js';
import { W } from './view-size.js';

// Sets world.cam (the view's top-left in the world) from the focus, just before a frame is drawn.
export function placeCamera() {
  world.cam.x = world.focus.x - W / 2;
  world.cam.y = world.focus.y - H / 2;
}

// True if a world point (with radius) is inside the view.
export const inView = (p, r = 0) => p.x + r > world.cam.x && p.x - r < world.cam.x + W && p.y + r > world.cam.y && p.y - r < world.cam.y + H;
