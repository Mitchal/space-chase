// A floating on-screen joystick (his spec, 2026-11-03: "I want to steer with an on-screen joystick like roblox. I don't
// want 'fly to where my finger is' controls… the whole screen could be the joystick area"). Put a thumb down anywhere
// and that spot becomes the stick's centre; drag to steer.
// v14 on his phone: "controls have a built in inertia on phone, i think the joystick radius might be too large". So:
// - full speed after a short drag (RADIUS), with a curve that gets most of the speed early;
// - the base follows your thumb once you drag past the rim, so reversing is one short flick, never a long drag back;
// - touch steering grips harder than keys (TOUCH_GRIP vs the kernel's default), so the ship answers at once.
// v17: after trying swipe steering (fly the way the thumb last moved), back to the joystick "with smaller radius than
// before": 20px (was 30), so full speed and reversing both take an even shorter flick.
// Delete this folder and touch falls back to the kernel's hold-to-steer.
import { world, W, H } from '../../core/world.js';
import { content, addDrawer, LAYER } from '../../core/registry.js';
import { addInputSource } from '../../core/input.js';
import { handling } from '../../core/player.js';
import { cvs } from '../../core/canvas.js';

const RADIUS = 20, DEADZONE = 0.1, CURVE = 0.7, TOUCH_GRIP = 30; // RADIUS in CSS pixels: the same on any screen
const KEY_GRIP = handling.grip;
const stick = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
const area = document.getElementById('wrap');
area.style.touchAction = 'none'; // no scrolling or zooming while you steer

if (matchMedia('(pointer: coarse)').matches) content.controlsHelp = 'Put your thumb down anywhere and drag to steer: a joystick wherever you touch.';

area.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'touch' || stick.id !== null) return;
  Object.assign(stick, { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY });
  handling.grip = TOUCH_GRIP;
  e.preventDefault(); e.stopImmediatePropagation();
}, { capture: true });

addEventListener('pointermove', e => {
  if (e.pointerId !== stick.id) return;
  stick.x = e.clientX; stick.y = e.clientY;
  const dx = stick.x - stick.ox, dy = stick.y - stick.oy, d = Math.hypot(dx, dy);
  if (d > RADIUS) { stick.ox += dx * (1 - RADIUS / d); stick.oy += dy * (1 - RADIUS / d); } // the base trails the thumb
});
const release = e => { if (e.pointerId === stick.id) stick.id = null; };
addEventListener('pointerup', release);
addEventListener('pointercancel', release);
addEventListener('keydown', () => { handling.grip = KEY_GRIP; });

// The drag as a vector of length ≤ 1: a small dead zone, then a curve that reaches most of the speed early.
function drag() {
  const dx = stick.x - stick.ox, dy = stick.y - stick.oy, d = Math.hypot(dx, dy), k = Math.min(1, d / RADIUS);
  if (d === 0 || k < DEADZONE) return { ix: 0, iy: 0 };
  const m = ((k - DEADZONE) / (1 - DEADZONE)) ** CURVE;
  return { ix: dx / d * m, iy: dy / d * m };
}

addInputSource(() => stick.id === null ? null : drag());

// Drawn in canvas space: the base where the stick is centred, the knob where the thumb is (at most on the rim).
addDrawer(LAYER.hud, ctx => {
  if (stick.id === null || world.botPolicy) return;
  const r = cvs.getBoundingClientRect(), sx = W / r.width, sy = H / r.height;
  const bx = (stick.ox - r.left) * sx, by = (stick.oy - r.top) * sy, rad = RADIUS * sx;
  const kx = (stick.x - r.left) * sx, ky = (stick.y - r.top) * sy;
  ctx.beginPath(); ctx.arc(bx, by, rad, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(232,236,243,.06)'; ctx.fill();
  ctx.strokeStyle = 'rgba(232,236,243,.25)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.arc(kx, ky, rad * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(124,242,200,.35)'; ctx.fill();
});
