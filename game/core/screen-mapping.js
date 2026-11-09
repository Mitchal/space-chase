// host-only: between the screen and the world. The view can be turned in quarter turns (view.turn, set each frame by
// core/canvas.js): on a tall screen (a phone held upright, for one-handed play) it's turned so the course runs along
// the screen's length, and a mode may flip it end for end (world.flipView). The world, the play frame and the daily
// course are exactly the same either way: only how they're shown changes.
// Screen space: view.w × view.h game pixels, x right, y down, as the player sees it.
// View space: W × H, the world through the camera (world.cam) before any turn. Ahead (+x) lands on the screen:
//   turn 0: right · 1: up · 2: left · 3: down
import { world, H } from './world.js';
import { W } from './view-size.js';
import { view, cvs } from './canvas.js';

// Per turn: the canvas transform from view to screen [a, b, c, d, e, f] (x' = a·x + c·y + e, y' = b·x + d·y + f),
// and which screen edge each edge of the view lands on.
const TURNS = [
  { m: () => [1, 0, 0, 1, 0, 0], edges: { top: 'top', bottom: 'bottom', left: 'left', right: 'right' }, ahead: '▶', behind: '◀' },
  { m: () => [0, -1, 1, 0, 0, W], edges: { top: 'left', bottom: 'right', left: 'bottom', right: 'top' }, ahead: '▲', behind: '▼' },
  { m: () => [-1, 0, 0, -1, W, H], edges: { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }, ahead: '◀', behind: '▶' },
  { m: () => [0, 1, -1, 0, H, 0], edges: { top: 'right', bottom: 'left', left: 'top', right: 'bottom' }, ahead: '▼', behind: '▲' },
];
const turn = () => TURNS[view.turn];

// The view → screen transform for the current turn, for ctx.transform(...).
export const viewTransform = () => turn().m();

// A world point → screen space (for screen-space text and UI that follows something in the world).
export function toScreen(x, y) {
  const [a, b, c, d, e, f] = turn().m(), vx = x - world.cam.x, vy = y - world.cam.y;
  return { x: a * vx + c * vy + e, y: b * vx + d * vy + f };
}

// A direction on the screen (a joystick drag, arrow keys) → a direction in the world. The turns are rotations, so the
// inverse is the transpose.
export function worldDir(dx, dy) {
  const [a, b, c, d] = turn().m();
  return { x: a * dx + b * dy, y: c * dx + d * dy };
}

// A screen-space point → world.
export function screenToWorld(sx, sy) {
  const [, , , , e, f] = turn().m(), v = worldDir(sx - e, sy - f);
  return { x: v.x + world.cam.x, y: v.y + world.cam.y };
}

// A pointer's client coordinates → screen space.
export function clientToScreen(clientX, clientY) {
  const r = cvs.getBoundingClientRect();
  return { x: (clientX - r.left) / r.width * view.w, y: (clientY - r.top) / r.height * view.h };
}

// view.inset (notches and rounded corners, by screen edge) along the view's own edges: top/bottom across the course,
// left/right behind and ahead. For world-space things kept inside the view (edge markers).
export function viewInset() {
  const n = view.inset, e = turn().edges;
  return { top: n[e.top], bottom: n[e.bottom], left: n[e.left], right: n[e.right] };
}

// Text at a world point that reads upright on the screen whichever way the view is turned.
export function uprightText(ctx, s, x, y) {
  if (view.turn === 0) { ctx.fillText(s, x, y); return; }
  ctx.save(); ctx.translate(x, y); ctx.rotate(view.turn * Math.PI / 2); ctx.fillText(s, 0, 0); ctx.restore();
}

// Arrows that point ahead (forward along the course) and behind, as they look on the screen.
export const arrows = () => ({ ahead: turn().ahead, behind: turn().behind });
// True when the course runs across the screen right to left (a flipped landscape view).
export const aheadIsLeft = () => view.turn === 2;
