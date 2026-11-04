// Swipe steering: the ship flies the way your thumb last moved (v17, his ask after the v15 joystick: "as soon as I
// start moving left, it will actually move left… the latest direction of my movement is the input movement rather than
// my relative position in this kind of joystick thing"). The joystick needed a drag back across its base to reverse,
// which felt like a delay next to the keyboard. Now:
// - put your thumb down anywhere; once it has moved a few pixels, the ship goes full speed that way;
// - every few pixels of thumb movement re-aims the ship, so reversing is a tiny flick and curves follow your thumb;
// - hold still and the ship keeps its course; lift your thumb and it stops.
// Touch steering grips harder than keys (TOUCH_GRIP vs the kernel's default), so the ship answers at once.
// Delete this folder and touch falls back to the kernel's hold-to-steer.
import { world, W, H } from '../../core/world.js';
import { content, addDrawer, LAYER } from '../../core/registry.js';
import { addInputSource } from '../../core/input.js';
import { handling } from '../../core/player.js';
import { cvs } from '../../core/canvas.js';

// STEP: thumb movement (CSS pixels, the same on any screen) that sets a new direction; small enough to feel instant,
// big enough to ignore a resting thumb's jitter.
const STEP = 6, TOUCH_GRIP = 30, MARK_R = 18;
const KEY_GRIP = handling.grip;
const thumb = { id: null, x: 0, y: 0, ax: 0, ay: 0, dx: 0, dy: 0 }; // a = where the last step was measured from
const area = document.getElementById('wrap');
area.style.touchAction = 'none'; // no scrolling or zooming while you steer

if (matchMedia('(pointer: coarse)').matches) {
  content.controlsHelp = 'Put your thumb down anywhere and swipe: you fly the way your thumb last moved. Lift it to stop.';
}

area.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'touch' || thumb.id !== null) return;
  Object.assign(thumb, { id: e.pointerId, x: e.clientX, y: e.clientY, ax: e.clientX, ay: e.clientY, dx: 0, dy: 0 });
  handling.grip = TOUCH_GRIP;
  e.preventDefault(); e.stopImmediatePropagation();
}, { capture: true });

// Coalesced events give every sample since the last frame, so a fast flick still turns on its first few pixels.
addEventListener('pointermove', e => {
  if (e.pointerId !== thumb.id) return;
  const samples = e.getCoalescedEvents?.() ?? [];
  for (const p of samples.length ? samples : [e]) {
    thumb.x = p.clientX; thumb.y = p.clientY;
    const mx = thumb.x - thumb.ax, my = thumb.y - thumb.ay, d = Math.hypot(mx, my);
    if (d >= STEP) { thumb.dx = mx / d; thumb.dy = my / d; thumb.ax = thumb.x; thumb.ay = thumb.y; }
  }
});
const release = e => { if (e.pointerId === thumb.id) thumb.id = null; };
addEventListener('pointerup', release);
addEventListener('pointercancel', release);
addEventListener('keydown', () => { handling.grip = KEY_GRIP; });

addInputSource(() => thumb.id === null ? null : { ix: thumb.dx, iy: thumb.dy });

// A faint ring under the thumb with a dot on its rim pointing the way you're flying (in canvas space).
addDrawer(LAYER.hud, ctx => {
  if (thumb.id === null || world.botPolicy) return;
  const r = cvs.getBoundingClientRect(), sx = W / r.width, sy = H / r.height;
  const x = (thumb.x - r.left) * sx, y = (thumb.y - r.top) * sy, rad = MARK_R * sx;
  ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(232,236,243,.18)'; ctx.lineWidth = 2; ctx.stroke();
  if (thumb.dx || thumb.dy) {
    ctx.beginPath(); ctx.arc(x + thumb.dx * rad, y + thumb.dy * rad, 4 * sx, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(124,242,200,.6)'; ctx.fill();
  }
});
