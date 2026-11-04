// A floating on-screen joystick (his spec, 2026-11-03: "I want to steer with an on-screen joystick like roblox. I don't
// want 'fly to where my finger is' controls… the whole screen could be the joystick area"). Put a thumb down anywhere
// and that spot becomes the stick's centre; drag to steer. How far you drag sets your speed, up to full at RADIUS.
// Delete this folder and touch falls back to the kernel's hold-to-steer.
import { world } from '../../core/world.js';
import { content, addDrawer, LAYER } from '../../core/registry.js';
import { addInputSource } from '../../core/input.js';
import { cvs } from '../../core/canvas.js';
import { W, H } from '../../core/world.js';

const RADIUS = 56, DEADZONE = 0.12; // in CSS pixels, so the stick feels the same size on any screen
const stick = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
const area = document.getElementById('wrap');
area.style.touchAction = 'none'; // no scrolling or zooming while you steer

if (matchMedia('(pointer: coarse)').matches) content.controlsHelp = 'Put your thumb down anywhere and drag to steer: a joystick wherever you touch.';

area.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'touch' || stick.id !== null) return;
  Object.assign(stick, { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY });
  e.preventDefault(); e.stopImmediatePropagation();
}, { capture: true });
addEventListener('pointermove', e => { if (e.pointerId === stick.id) { stick.x = e.clientX; stick.y = e.clientY; } });
const release = e => { if (e.pointerId === stick.id) stick.id = null; };
addEventListener('pointerup', release);
addEventListener('pointercancel', release);

// The drag as a vector of length ≤ 1, with a small dead zone around the centre.
function drag() {
  const dx = stick.x - stick.ox, dy = stick.y - stick.oy, d = Math.hypot(dx, dy), k = Math.min(1, d / RADIUS);
  return d === 0 || k < DEADZONE ? { ix: 0, iy: 0 } : { ix: dx / d * k, iy: dy / d * k };
}

addInputSource(() => stick.id === null ? null : drag());

// Drawn in canvas space: the base where the thumb went down, the knob where it is now (capped at the rim).
addDrawer(LAYER.hud, ctx => {
  if (stick.id === null || world.botPolicy) return;
  const r = cvs.getBoundingClientRect(), sx = W / r.width, sy = H / r.height;
  const { ix, iy } = drag(), bx = (stick.ox - r.left) * sx, by = (stick.oy - r.top) * sy, rad = RADIUS * sx;
  ctx.beginPath(); ctx.arc(bx, by, rad, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(232,236,243,.06)'; ctx.fill();
  ctx.strokeStyle = 'rgba(232,236,243,.25)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.arc(bx + ix * rad, by + iy * rad, rad * 0.42, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(124,242,200,.35)'; ctx.fill();
});
