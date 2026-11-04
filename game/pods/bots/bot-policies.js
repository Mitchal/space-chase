// Bot players. They measure skill floors and pacing, not fun.
//   random: no-skill floor.
//   evader: crude competent player. Flees and swirls (which makes pursuers converge), dodges telegraphs,
//           keeps off rocks and mines, collects the nearest key, then heads for the exit.
import { world, W } from '../../core/world.js';
import { content } from '../../core/registry.js';
import { rand, lineDist } from '../../core/geometry.js';

export function randomPolicy() {
  const s = {};
  return () => {
    if (!s.until || world.t > s.until) { s.until = world.t + rand(0.3, 0.9); s.a = Math.random() * Math.PI * 2; }
    return { ix: Math.cos(s.a), iy: Math.sin(s.a) };
  };
}

// Swirl turns toward the middle of the lane, so circling pursuers never steers the bot into a wall.
function swirlSign(p) {
  const lane = world.laneAt(p.x);
  return p.y > (lane.top + lane.bottom) / 2 ? -1 : 1;
}

function avoid(p, e, f) {
  const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
  if (e.lurable) {
    const w = 9000 / (d * d);
    const s = swirlSign(p) * 0.7;
    f.x += dx / d * w - dy / d * w * s; f.y += dy / d * w + dx / d * w * s;
    if (e.state === 'windup' || e.state === 'dash') {
      const off = dx * -e.dy + dy * e.dx;
      if (Math.abs(off) < 60) { const s = off >= 0 ? 1 : -1; f.x += -e.dy * s * 5; f.y += e.dx * s * 5; }
    }
  } else if (e.type === 'mine' && d < 100) {
    const w = (100 - d) / 100 * 3; f.x += dx / d * w; f.y += dy / d * w;
  } else if (e.type === 'rock' && d - e.r < 60) {
    const w = (60 - (d - e.r)) / 60 * 4; f.x += dx / d * w; f.y += dy / d * w;
  } else if (e.type === 'laser' && lineDist(e, p) < 45) {
    const nx = -e.s, ny = e.c, s = (dx * nx + dy * ny) >= 0 ? 1 : -1; f.x += nx * s * 4; f.y += ny * s * 4;
  }
}

function goal(p) {
  const exit = world.ents.find(e => e.type === 'exit');
  if (exit?.open) return { at: exit, w: 3 };
  const keys = world.ents.filter(e => e.type === 'key' && !e.taken).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
  return keys.length ? { at: keys[0], w: 1.4 } : null;
}

export function evaderPolicy() {
  return p => {
    const f = { x: 0, y: 0 };
    for (const e of world.ents) if (!e.dead && !(e.spawn > 0)) avoid(p, e, f);
    // Keep off the lane's walls (in room modes the lane is the screen).
    const lane = world.laneAt(p.x), m = 90;
    if (p.y - lane.top < m) f.y += (m - (p.y - lane.top)) / m * 3;
    if (lane.bottom - p.y < m) f.y -= (m - (lane.bottom - p.y)) / m * 3;
    if (world.cameraFollows) {
      // Flight: keep moving forward, harder when the wave is close; drift toward the lane's middle.
      const wave = world.ents.find(e => e.type === 'wave'), gap = wave ? p.x - wave.x : Infinity;
      f.x += (content.forward?.x ?? 0) * (gap < 350 ? 4 : 1.1);
      f.y += ((lane.top + lane.bottom) / 2 - p.y) * 0.002;
    } else {
      if (p.x < m) f.x += (m - p.x) / m * 2; if (p.x > W - m) f.x -= (p.x - (W - m)) / m * 2;
    }
    const g = goal(p);
    if (g) { const dx = g.at.x - p.x, dy = g.at.y - p.y, d = Math.hypot(dx, dy) || 1; f.x += dx / d * g.w; f.y += dy / d * g.w; }
    return { ix: f.x, iy: f.y };
  };
}
