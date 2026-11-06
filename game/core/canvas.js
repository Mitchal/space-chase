// The canvas, its scaling to the window, and the per-frame draw pass.
import { W, H, world, setViewWidth } from './world.js';
import { runDrawers, LAYER } from './registry.js';
import { fx } from './effects.js';
import { rand } from './geometry.js';
import { measureSafeArea } from './safe-area.js';

const BG = '#0e1118';

export const cvs = document.getElementById('c');
// Opaque: the browser can skip blending the canvas with the page behind it.
export const ctx = cvs.getContext('2d', { alpha: false });

// Render scale: backing pixels per game pixel. Phones have dense screens (3x is common), and filling ~9x the pixels
// was most of the frame cost (v14 on his phone: "Lagging on my phone"). Capped at MAX_SCALE: sharp enough, and cheap.
const MAX_SCALE = 1.5;
// hud: text size multiplier for screen-space text; on a phone the whole view is scaled down, so text needs to grow.
// inset: how far screen-space UI must stay from each edge of the screen (game pixels), clear of notches and rounded
// corners (core/safe-area.js). HUD drawers place things relative to it.
// portrait: the screen is taller than wide, so the view is turned a quarter turn and the course runs up the screen
// (core/screen-mapping.js). w × h: the screen in game pixels (W × H, or H × W when turned); HUD drawers lay out in it.
// css: CSS pixels per game pixel, for UI sized in CSS pixels (the joystick, the HTML pause button).
export const view = { scale: 1, hud: 1, css: 1, portrait: false, w: W, h: H, inset: { top: 0, right: 0, bottom: 0, left: 0 } };
const touch = matchMedia('(pointer: coarse)').matches;
export const hudFont = (px, weight = 600) => `${weight} ${Math.round(px * view.hud)}px system-ui,sans-serif`;

function fit() {
  const dpr = window.devicePixelRatio || 1, margin = touch ? 1 : 0.97;
  view.portrait = innerHeight > innerWidth;
  // The screen as the view sees it: along the course × across it.
  const along = view.portrait ? innerHeight : innerWidth, across = view.portrait ? innerWidth : innerHeight;
  setViewWidth(H * along / across); // fill the screen's length instead of letterboxing
  const s = Math.min(along / W, across / H) * margin;
  view.css = s;
  view.w = view.portrait ? H : W; view.h = view.portrait ? W : H;
  view.hud = touch ? Math.min(1.6, Math.max(1, 0.75 / s)) : 1;
  // The canvas is centred; where it already sits clear of an edge, that edge needs less (or no) inset.
  const safe = measureSafeArea(), gapX = (innerWidth - view.w * s) / 2, gapY = (innerHeight - view.h * s) / 2;
  view.inset = {
    top: Math.max(0, safe.top - gapY) / s, bottom: Math.max(0, safe.bottom - gapY) / s,
    left: Math.max(0, safe.left - gapX) / s, right: Math.max(0, safe.right - gapX) / s,
  };
  cvs.style.width = view.w * s + 'px'; cvs.style.height = view.h * s + 'px';
  view.scale = Math.min(MAX_SCALE, s * dpr);
  cvs.width = Math.round(view.w * view.scale); cvs.height = Math.round(view.h * view.scale);
}
addEventListener('resize', fit);
fit();

// The grid is fixed to the world, so it slides past as the camera moves.
function drawGrid() {
  ctx.strokeStyle = '#151a25'; ctx.lineWidth = 1;
  const ox = ((world.cam.x % 40) + 40) % 40, oy = ((world.cam.y % 40) + 40) % 40;
  ctx.beginPath(); // one path for the whole grid: one stroke instead of forty
  for (let x = 40 - ox; x < W; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 40 - oy; y < H; y += 40) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
}

// World layers are drawn through the camera and shake; HUD and overlay layers are screen-space and stay put.
// Turned for portrait: view point (x, y) lands on screen point (y, W - x), so ahead (+x) is up the screen.
export function drawFrame() {
  ctx.setTransform(view.scale, 0, 0, view.scale, 0, 0);
  if (view.portrait) ctx.transform(0, -1, 1, 0, 0, W);
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  ctx.save();
  if (fx.shake > 0.3) ctx.translate(rand(-fx.shake, fx.shake), rand(-fx.shake, fx.shake));
  drawGrid();
  ctx.translate(-world.cam.x, -world.cam.y);
  if (world.run) runDrawers(ctx, -Infinity, LAYER.hud);
  ctx.restore();
  ctx.setTransform(view.scale, 0, 0, view.scale, 0, 0); // HUD and overlay: screen space, view.w × view.h
  if (world.run) runDrawers(ctx, LAYER.hud, Infinity);
}
