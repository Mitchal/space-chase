// The canvas, its scaling to the window, and the per-frame draw pass.
import { W, H, world } from './world.js';
import { runDrawers, LAYER } from './registry.js';
import { fx } from './effects.js';
import { rand } from './geometry.js';

export const cvs = document.getElementById('c');
export const ctx = cvs.getContext('2d');

function fit() {
  const dpr = window.devicePixelRatio || 1;
  const s = Math.min(innerWidth / W, innerHeight / H) * 0.97;
  cvs.style.width = W * s + 'px'; cvs.style.height = H * s + 'px';
  cvs.width = W * dpr; cvs.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', fit);
fit();

// The grid is fixed to the world, so it slides past as the camera moves.
function drawGrid() {
  ctx.strokeStyle = '#151a25'; ctx.lineWidth = 1;
  const ox = ((world.cam.x % 40) + 40) % 40, oy = ((world.cam.y % 40) + 40) % 40;
  for (let x = 40 - ox; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 40 - oy; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
}

// World layers are drawn through the camera and shake; HUD and overlay layers are screen-space and stay put.
export function drawFrame() {
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  if (fx.shake > 0.3) ctx.translate(rand(-fx.shake, fx.shake), rand(-fx.shake, fx.shake));
  drawGrid();
  ctx.translate(-world.cam.x, -world.cam.y);
  if (world.run) runDrawers(ctx, -Infinity, LAYER.hud);
  ctx.restore();
  if (world.run) runDrawers(ctx, LAYER.hud, Infinity);
}
