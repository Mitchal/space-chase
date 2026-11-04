// The canvas, its scaling to the window, and the per-frame draw pass.
import { W, H, world, setViewWidth } from './world.js';
import { runDrawers, LAYER } from './registry.js';
import { fx } from './effects.js';
import { rand } from './geometry.js';

const BG = '#0e1118';

export const cvs = document.getElementById('c');
// Opaque: the browser can skip blending the canvas with the page behind it.
export const ctx = cvs.getContext('2d', { alpha: false });

// Render scale: backing pixels per game pixel. Phones have dense screens (3x is common), and filling ~9x the pixels
// was most of the frame cost (v14 on his phone: "Lagging on my phone"). Capped at MAX_SCALE: sharp enough, and cheap.
const MAX_SCALE = 1.5;
// hud: text size multiplier for screen-space text; on a phone the whole view is scaled down, so text needs to grow.
export const view = { scale: 1, hud: 1 };
const touch = matchMedia('(pointer: coarse)').matches;
export const hudFont = (px, weight = 600) => `${weight} ${Math.round(px * view.hud)}px system-ui,sans-serif`;

function fit() {
  const dpr = window.devicePixelRatio || 1, margin = touch ? 1 : 0.97;
  setViewWidth(H * innerWidth / innerHeight); // fill the screen's width instead of letterboxing
  const s = Math.min(innerWidth / W, innerHeight / H) * margin;
  view.hud = touch ? Math.min(1.6, Math.max(1, 0.75 / s)) : 1;
  cvs.style.width = W * s + 'px'; cvs.style.height = H * s + 'px';
  view.scale = Math.min(MAX_SCALE, s * dpr);
  cvs.width = Math.round(W * view.scale); cvs.height = Math.round(H * view.scale);
  ctx.setTransform(view.scale, 0, 0, view.scale, 0, 0);
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
export function drawFrame() {
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  ctx.save();
  if (fx.shake > 0.3) ctx.translate(rand(-fx.shake, fx.shake), rand(-fx.shake, fx.shake));
  drawGrid();
  ctx.translate(-world.cam.x, -world.cam.y);
  if (world.run) runDrawers(ctx, -Infinity, LAYER.hud);
  ctx.restore();
  if (world.run) runDrawers(ctx, LAYER.hud, Infinity);
}
