// host-only: keyboard, mouse and other input sources turned into each tick's input frame (core/sim-input.js).
// A bot policy can take over.
import { world } from './world.js';
import { emit } from './events.js';
import { cvs } from './canvas.js';
import { handling } from './player.js';
import { frameOf } from './sim-input.js';
import { clientToScreen, screenToWorld, worldDir } from './screen-mapping.js';

const keys = {};
const mouse = { down: false, x: 0, y: 0 };
const typing = () => document.activeElement && ['TEXTAREA', 'INPUT'].includes(document.activeElement.tagName);

addEventListener('keydown', e => {
  if (typing()) return;
  keys[e.code] = true;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  emit('keyPressed', e.code);
});
addEventListener('keyup', e => { keys[e.code] = false; });

function setMouse(e) { Object.assign(mouse, clientToScreen(e.clientX, e.clientY)); } // screen space
cvs.addEventListener('pointerdown', e => { mouse.down = true; setMouse(e); });
addEventListener('pointermove', e => { if (mouse.down) setMouse(e); });
addEventListener('pointerup', () => { mouse.down = false; });

// How hard the ship grips its input. A controls pod may ask for more (touch steering grips harder than keys) and
// set it back; it goes into every frame, so a replay steers exactly as the player did.
export const steering = { grip: handling.grip };

// Pods may add input sources (e.g. an on-screen joystick): fn() returns {ix, iy} while it's in use, else null.
// The first source in use wins over keys and mouse. Sources and keys give a direction on the screen (up is up, as the
// player sees it); it's turned into the world's frame here (core/screen-mapping.js). A bot policy steers in the world.
const sources = [];
export const addInputSource = fn => { sources.push(fn); };
const fromSources = () => { for (const fn of sources) { const v = fn(); if (v) return v; } return null; };

// The steering direction in the world's frame, length ≤ 1 (longer is cut to 1 when the frame is played).
function intent(player) {
  if (world.botPolicy) return world.botPolicy(player);
  const src = fromSources();
  if (src) { const d = worldDir(src.ix, src.iy); return { ix: d.x, iy: d.y }; }
  if (mouse.down) {
    // mouse is in screen space; the player is in world space
    const m = screenToWorld(mouse.x, mouse.y), dx = m.x - player.x, dy = m.y - player.y, d = Math.hypot(dx, dy);
    if (d <= 4) return { ix: 0, iy: 0 };
    const k = Math.min(1, d / 40);
    return { ix: dx / d * k, iy: dy / d * k };
  }
  const d = worldDir(
    (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0),
    (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0));
  const m = Math.hypot(d.x, d.y);
  return m > 1 ? { ix: d.x / m, iy: d.y / m } : { ix: d.x, iy: d.y };
}

// This tick's input frame (what the tick plays and the replay records).
export const sampleFrame = player => { const i = intent(player); return frameOf(i.ix, i.iy, world.botPolicy ? handling.grip : steering.grip); };

export function releaseKeys() { for (const k in keys) keys[k] = false; }
