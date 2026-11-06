// Keyboard and mouse turned into a movement intent. A bot policy can take over.
import { world } from './world.js';
import { emit } from './events.js';
import { cvs } from './canvas.js';
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

// Pods may add input sources (e.g. an on-screen joystick): fn() returns {ix, iy} while it's in use, else null.
// The first source in use wins over keys and mouse. Sources and keys give a direction on the screen (up is up, as the
// player sees it); it's turned into the world's frame here (core/screen-mapping.js). A bot policy steers in the world.
const sources = [];
export const addInputSource = fn => { sources.push(fn); };
const fromSources = () => { for (const fn of sources) { const v = fn(); if (v) return v; } return null; };

// Returns {ix, iy, absolute} with length ≤ 1. absolute: a direction to go in (mouse, joystick, bots); otherwise raw keys.
export function intent(player) {
  let ix, iy, src = null;
  if (world.botPolicy) ({ ix, iy } = world.botPolicy(player));
  else if ((src = fromSources())) ({ x: ix, y: iy } = worldDir(src.ix, src.iy));
  else {
    ({ x: ix, y: iy } = worldDir(
      (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0),
      (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0)));
    if (mouse.down) {
      // mouse is in screen space; the player is in world space
      const m = screenToWorld(mouse.x, mouse.y), dx = m.x - player.x, dy = m.y - player.y, d = Math.hypot(dx, dy);
      if (d > 4) { const k = Math.min(1, d / 40); ix = dx / d * k; iy = dy / d * k; } else ix = iy = 0;
    }
  }
  const m = Math.hypot(ix, iy), absolute = !!world.botPolicy || !!src || mouse.down;
  return m > 1 ? { ix: ix / m, iy: iy / m, absolute } : { ix, iy, absolute };
}

export function releaseKeys() { for (const k in keys) keys[k] = false; }
