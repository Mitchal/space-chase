// Between the screen and the world. On a tall screen (a phone held upright, for one-handed play) the view is turned a
// quarter turn so the course runs up the screen: the world, the play frame and the daily course are exactly the same,
// only how they're shown changes. Screen space: view.w × view.h game pixels, x right, y down, as the player sees it.
// View space: W × H, the world through the camera (world.cam) before any turn.
import { world, W } from './world.js';
import { view, cvs } from './canvas.js';

// A world point → screen space (for screen-space text and UI that follows something in the world).
export function toScreen(x, y) {
  const vx = x - world.cam.x, vy = y - world.cam.y;
  return view.portrait ? { x: vy, y: W - vx } : { x: vx, y: vy };
}

// A screen-space point → world.
export function screenToWorld(sx, sy) {
  const vx = view.portrait ? W - sy : sx, vy = view.portrait ? sx : sy;
  return { x: vx + world.cam.x, y: vy + world.cam.y };
}

// A direction on the screen (a joystick drag, arrow keys) → a direction in the world. Up the screen is forward.
export const worldDir = (dx, dy) => view.portrait ? { x: -dy, y: dx } : { x: dx, y: dy };

// A pointer's client coordinates → screen space.
export function clientToScreen(clientX, clientY) {
  const r = cvs.getBoundingClientRect();
  return { x: (clientX - r.left) / r.width * view.w, y: (clientY - r.top) / r.height * view.h };
}

// view.inset (notches and rounded corners, by screen edge) along the view's own edges: top/bottom across the course,
// left/right behind and ahead. For world-space things kept inside the view (edge markers).
export function viewInset() {
  const n = view.inset;
  return view.portrait ? { top: n.left, bottom: n.right, left: n.bottom, right: n.top } : n;
}

// Text at a world point that reads upright on the screen whichever way the view is turned.
export function uprightText(ctx, s, x, y) {
  if (!view.portrait) { ctx.fillText(s, x, y); return; }
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 2); ctx.fillText(s, 0, 0); ctx.restore();
}

// Arrows that point ahead (forward along the course) and behind, as they look on the screen.
export const arrows = () => view.portrait ? { ahead: '▲', behind: '▼' } : { ahead: '▶', behind: '◀' };
