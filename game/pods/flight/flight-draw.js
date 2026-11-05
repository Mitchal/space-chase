// How the flight looks: the death walls, the death wave (with a warning when it's off-screen),
// the finish line, and a run-wide progress bar showing you and the wave (P5: the threat must read).
import { world, W, H } from '../../core/world.js';
import { content, addDrawer, LAYER } from '../../core/registry.js';
import { player } from '../../core/player.js';
import { hudFont, view } from '../../core/canvas.js';

const WALL = '#ff4d6d';

function drawWalls(ctx) {
  const x0 = world.cam.x - 20, x1 = world.cam.x + W + 20, y0 = world.cam.y - 20, y1 = world.cam.y + H + 20;
  for (const edge of ['top', 'bottom']) {
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 12) { const y = world.laneAt(x)[edge]; x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.lineTo(x1, edge === 'top' ? y0 : y1); ctx.lineTo(x0, edge === 'top' ? y0 : y1); ctx.closePath();
    ctx.fillStyle = 'rgba(255,77,109,.12)'; ctx.fill();
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 12) { const y = world.laneAt(x)[edge]; x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    // The glow is a wide faint stroke under the line (a live shadowBlur here cost a phone dearly).
    ctx.strokeStyle = 'rgba(255,77,109,.22)'; ctx.lineWidth = 12; ctx.stroke();
    ctx.strokeStyle = WALL; ctx.lineWidth = 3; ctx.stroke();
  }
}

function drawWave(ctx, wave) {
  if (wave.x < world.cam.x) return;
  const y0 = world.cam.y - 20, h = H + 40;
  const g = ctx.createLinearGradient(wave.x - 260, 0, wave.x, 0);
  g.addColorStop(0, 'rgba(120,20,60,.85)'); g.addColorStop(1, 'rgba(255,77,109,.9)');
  ctx.fillStyle = g; ctx.fillRect(world.cam.x - 20, y0, wave.x - world.cam.x + 20, h);
  ctx.beginPath(); ctx.moveTo(wave.x, y0);
  for (let y = y0; y <= y0 + h; y += 16) ctx.lineTo(wave.x + 8 * Math.sin(y / 20 + world.t * 8), y);
  ctx.strokeStyle = '#ffd0d8'; ctx.lineWidth = 3; ctx.stroke();
}

function drawFinish(ctx, end) {
  if (end > world.cam.x + W + 40) return;
  for (let y = world.cam.y - 20, i = 0; y < world.cam.y + H + 20; y += 20, i++) {
    ctx.fillStyle = i % 2 ? '#e8ecf3' : '#0e1118'; ctx.fillRect(end - 6, y, 12, 20);
  }
}

// Screen-space warning on the left edge when the wave is close but not visible.
function drawWaveWarning(ctx, wave) {
  const gap = world.cam.x - wave.x;
  if (gap <= 0) return;
  const k = Math.max(0, 1 - gap / 900);
  const g = ctx.createLinearGradient(0, 0, 80, 0);
  g.addColorStop(0, `rgba(255,77,109,${0.15 + 0.5 * k})`); g.addColorStop(1, 'rgba(255,77,109,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 80, H);
  ctx.font = hudFont(12, 700); ctx.textAlign = 'left'; ctx.fillStyle = '#ff9aa8';
  ctx.fillText(`WAVE ◀ ${Math.round(player.x - wave.x)}`, view.inset.left + 10, H / 2);
}

function drawProgress(ctx, wave, sectorLen, end) {
  // Inside the safe area, with room on the right for the on-screen pause button.
  const n = content.arenas.length, x0 = view.inset.left + 160, x1 = W - view.inset.right - 200, y = H - view.inset.bottom - 16;
  const at = x => x0 + (x1 - x0) * Math.max(0, Math.min(1, x / end));
  ctx.fillStyle = '#2a3142'; ctx.fillRect(x0, y, x1 - x0, 4);
  ctx.fillStyle = '#7cf2c8'; ctx.fillRect(x0, y, at(player.x) - x0, 4);
  ctx.fillStyle = '#0e1118';
  for (let i = 1; i < n; i++) ctx.fillRect(at(i * sectorLen) - 1, y - 2, 2, 8);
  ctx.fillStyle = WALL; ctx.fillRect(at(wave.x) - 2, y - 5, 4, 14);
  ctx.beginPath(); ctx.arc(at(player.x), y + 2, 5, 0, Math.PI * 2); ctx.fillStyle = '#7cf2c8'; ctx.fill();
  ctx.font = hudFont(12); ctx.fillStyle = '#8a93a6';
  ctx.textAlign = 'right'; ctx.fillText('START', x0 - 8, y + 5);
  ctx.textAlign = 'left'; ctx.fillText('FINISH', x1 + 8, y + 5);
}

export function drawFlight(waveOf, { SECTOR_LEN, COURSE_END, mode }) {
  addDrawer(LAYER.floor, ctx => { drawWalls(ctx); drawFinish(ctx, COURSE_END); }, { mode });
  addDrawer(LAYER.effects + 1, ctx => { const w = waveOf(); if (w) drawWave(ctx, w); }, { mode });
  addDrawer(LAYER.hud, ctx => {
    const w = waveOf();
    if (!w) return;
    drawWaveWarning(ctx, w);
    drawProgress(ctx, w, SECTOR_LEN, COURSE_END);
  }, { mode });
}
