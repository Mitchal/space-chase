// How the keys, their dotted lines to the exit, and the exit gate look (P5: the objective must read).
import { world, W, H } from '../../core/world.js';
import { addDrawer, LAYER } from '../../core/registry.js';
import { clamp } from '../../core/geometry.js';

const ACCENT = '#7cf2c8';

// The gate is inset from its wall so all of it is on screen.
const gatePoint = e => ({ x: e.x === 0 ? 7 : e.x === W ? W - 7 : e.x, y: e.y === 0 ? 7 : e.y === H ? H - 7 : e.y });

function drawLines(ctx, keys, g) {
  ctx.setLineDash([5, 8]); ctx.lineWidth = 2;
  for (const k of keys) {
    if (k.taken) continue;
    ctx.strokeStyle = 'rgba(124,242,200,.55)';
    ctx.beginPath(); ctx.moveTo(k.x, k.y); ctx.lineTo(g.x, g.y); ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawKey(ctx, k) {
  if (k.taken) return;
  const pulse = 1 + 0.15 * Math.sin(world.t * 5 + k.x);
  ctx.save(); ctx.translate(k.x, k.y); ctx.rotate(Math.PI / 4); ctx.scale(pulse, pulse);
  ctx.fillStyle = ACCENT; ctx.shadowColor = ACCENT; ctx.shadowBlur = 14;
  ctx.fillRect(-k.r, -k.r, k.r * 2, k.r * 2);
  ctx.restore();
}

function drawGate(ctx, exit, keys) {
  const g = gatePoint(exit), half = 46, pulse = 0.6 + 0.4 * Math.sin(world.t * 8);
  const [x1, y1, x2, y2] = exit.horiz ? [g.x - half, g.y, g.x + half, g.y] : [g.x, g.y - half, g.x, g.y + half];
  if (exit.open) {
    const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, 90);
    grad.addColorStop(0, `rgba(124,242,200,${0.35 * pulse})`); grad.addColorStop(1, 'rgba(124,242,200,0)');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(g.x, g.y, 90, 0, Math.PI * 2); ctx.fill();
  }
  ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.strokeStyle = exit.open ? `rgba(124,242,200,${pulse})` : '#4a556c'; ctx.lineWidth = 12;
  if (exit.open) { ctx.shadowColor = ACCENT; ctx.shadowBlur = 24; }
  ctx.stroke(); ctx.shadowBlur = 0; ctx.lineCap = 'butt';
  const taken = keys.filter(k => k.taken).length;
  ctx.font = '700 13px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = exit.open ? ACCENT : '#8a93a6';
  const lx = clamp(exit.x, 40, W - 40) + (exit.x === 0 ? 40 : exit.x === W ? -40 : 0);
  const ly = clamp(exit.y, 0, H) + (exit.y === 0 ? 30 : exit.y === H ? -22 : 4);
  ctx.fillText(exit.open ? 'EXIT' : `EXIT ${taken}/${keys.length}`, lx, ly);
}

export function drawEscape(keysOf, exitOf) {
  addDrawer(LAYER.objective, ctx => {
    const exit = exitOf();
    if (!exit) return;
    const keys = keysOf();
    drawLines(ctx, keys, gatePoint(exit));
    for (const k of keys) drawKey(ctx, k);
    drawGate(ctx, exit, keys);
  });
}
