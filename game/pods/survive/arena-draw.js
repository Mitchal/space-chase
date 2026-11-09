// How the arena looks: the red wall around it (everything beyond tinted), and the clock at the top of the screen.
import { world, H } from '../../core/world.js';
import { W } from '../../core/view-size.js';
import { addDrawer, LAYER } from '../../core/registry.js';
import { hudFont, view } from '../../core/canvas.js';
import { RADIUS } from './arena-shape.js';

export const COLOR = '#ffb454';
const WALL = '#ff4d6d';

function drawWall(ctx) {
  const c = world.cam;
  ctx.beginPath();
  ctx.rect(c.x - 20, c.y - 20, W + 40, H + 40);
  ctx.arc(0, 0, RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,77,109,.12)'; ctx.fill('evenodd');
  ctx.beginPath(); ctx.arc(0, 0, RADIUS, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,77,109,.22)'; ctx.lineWidth = 12; ctx.stroke();
  ctx.strokeStyle = WALL; ctx.lineWidth = 3; ctx.stroke();
}

// clock() → { ms, best (ms or null) }; fmt formats a time.
function drawClock(ctx, { ms, best }, fmt) {
  const top = view.inset.top;
  ctx.textAlign = 'center';
  ctx.font = hudFont(26, 800); ctx.fillStyle = COLOR;
  ctx.fillText((ms / 1000).toFixed(3), view.w / 2, top + 32 * view.hud);
  if (best === null) return;
  ctx.font = hudFont(12); ctx.fillStyle = best > ms ? '#8a93a6' : COLOR;
  ctx.fillText(`best today ${fmt(best)}`, view.w / 2, top + 50 * view.hud);
}

export function drawArena(clock, fmt, mode) {
  addDrawer(LAYER.floor, drawWall, { mode });
  addDrawer(LAYER.hud, ctx => drawClock(ctx, clock(), fmt), { mode });
}
