// Thrusters (run 23: "classic relative-turns-plus-throttle, with a decent level of inertia when I release the throttle").
// Left/right rotate the ship, up is throttle, down is a brake. Let go and you coast.
// Still out-handles the pursuers (run 19's "faster than me but they turn slower"): at full speed your tightest turn
// is ~85px across; a pursuer's is ~130px.
// Mouse and bots give a direction to go in (intent.absolute): an autopilot turns toward it and throttles.
// Delete this folder and the ship goes back to direct movement.
import { world } from '../../core/world.js';
import { on } from '../../core/events.js';
import { content, addDrawer, LAYER } from '../../core/registry.js';
import { player, handling } from '../../core/player.js';
import { wrapAngle, clamp } from '../../core/geometry.js';

const TURN = 4.2, ACCEL = 900, MAX = 280, COAST_DRAG = 0.4, BRAKE_DRAG = 3;

content.controlsHelp = 'Fly with <kbd>A</kbd>/<kbd>D</kbd> (or ◀ ▶) to turn and <kbd>W</kbd> (or ▲) to thrust; <kbd>S</kbd> brakes. Let go and you coast.';

on('arenaEnter', a => { if (a.index === world.run.startArena) player.heading = 0; });

// Keys: turn and throttle. Absolute (mouse, bots): turn toward the direction, throttle once roughly facing it.
function controls(want) {
  if (!want.absolute) return { turn: want.ix, thrust: want.iy < 0, brake: want.iy > 0 };
  const m = Math.hypot(want.ix, want.iy);
  if (m < 0.15) return { turn: 0, thrust: false, brake: false };
  const off = wrapAngle(Math.atan2(want.iy, want.ix) - player.heading);
  return { turn: clamp(off * 3, -1, 1), thrust: Math.abs(off) < 0.9, brake: false };
}

handling.steer = (p, want, dt) => {
  const c = controls(want);
  p.heading = wrapAngle((p.heading ?? 0) + c.turn * TURN * dt);
  p.thrusting = c.thrust;
  if (c.thrust) { p.vx += Math.cos(p.heading) * ACCEL * dt; p.vy += Math.sin(p.heading) * ACCEL * dt; }
  const drag = Math.exp(-(c.brake ? BRAKE_DRAG : COAST_DRAG) * dt);
  p.vx *= drag; p.vy *= drag;
  const s = Math.hypot(p.vx, p.vy);
  if (s > MAX) { p.vx *= MAX / s; p.vy *= MAX / s; }
};

// The flame, so thrust reads.
addDrawer(LAYER.player - 1, ctx => {
  if (!player.thrusting || !world.run || world.run.outcome === 'dead' || world.transition > 0) return;
  const ux = Math.cos(player.heading), uy = Math.sin(player.heading), len = 14 + 6 * Math.random();
  ctx.beginPath();
  ctx.moveTo(player.x - ux * (player.r + len), player.y - uy * (player.r + len));
  ctx.lineTo(player.x - ux * player.r - uy * 5, player.y - uy * player.r + ux * 5);
  ctx.lineTo(player.x - ux * player.r + uy * 5, player.y - uy * player.r - ux * 5);
  ctx.closePath(); ctx.fillStyle = '#ffd166'; ctx.fill();
});
