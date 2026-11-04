// The hero: movement only (P7), two hits per arena (P11), readable hits (P5).
import { world, W, H } from './world.js';
import { emit } from './events.js';
import { addSystem, addDrawer, ORDER, LAYER } from './registry.js';
import { intent } from './input.js';
import { clamp } from './geometry.js';
import { burst, floatText, fx } from './effects.js';

export const PSPEED = 270;
// How the hero turns input into motion. Default: grip the input direction (1/s; high = turns on a dime).
// A pod may install steer(player, intent, dt) to set player.vx/vy itself (e.g. thrusters).
export const handling = { grip: 14, steer: null };
export const player = { x: W / 2, y: H / 2, r: 9, vx: 0, vy: 0, hp: 2, maxHp: 2, inv: 0 };

const LABELS = {
  chaser: 'a chaser', charger: 'a charger', 'charger dash': 'a charger dash', mine: 'a mine blast',
  laser: 'a laser', rock: 'a rock', wall: 'a death wall', wave: 'the death wave', blast: 'a pursuer blast',
};
export const hurtLabel = cause => LABELS[cause] || cause;

// Each new stage gives one heart back (max 2). Room-style stages also recentre you with brief invulnerability.
export function resetPlayer(heal, recenter = true) {
  if (recenter) Object.assign(player, { x: W / 2, y: H / 2, vx: 0, vy: 0, inv: 1.2 });
  if (heal) player.hp = Math.min(player.maxHp, player.hp + 1);
}

// Returns true if the hit landed (false while invulnerable or between stages). fatal: down regardless of hearts.
export function hurt(cause, src, { fatal = false } = {}) {
  if (!world.run || world.run.over || world.transition > 0) return false;
  if (player.inv > 0 && !fatal) return false;
  player.hp = fatal ? 0 : player.hp - 1; player.inv = 1.4; fx.shake = 12; fx.hitstop = 0.35;
  burst(player.x, player.y, '#ffffff', 20);
  floatText(player.x, player.y - 22, 'hit by ' + hurtLabel(cause), { col: '#ff9aa8', t: 1.2 });
  emit('hurt', { cause, src });
  if (player.hp <= 0) emit('playerDown', { cause, src });
  return true;
}

addSystem(ORDER.input, dt => {
  const want = intent(player);
  if (handling.steer) handling.steer(player, want, dt);
  else {
    const k = Math.min(1, dt * handling.grip);
    player.vx += (want.ix * PSPEED - player.vx) * k;
    player.vy += (want.iy * PSPEED - player.vy) * k;
  }
  const b = world.bounds;
  player.x = clamp(player.x + player.vx * dt, b.minX + player.r, b.maxX - player.r);
  player.y = clamp(player.y + player.vy * dt, b.minY + player.r, b.maxY - player.r);
  if (player.inv > 0) player.inv -= dt;
});

addDrawer(LAYER.player, ctx => {
  if (world.run.outcome === 'dead' || world.transition > 0) return;
  if (player.inv > 0 && Math.floor(world.t * 16) % 2) return;
  ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fillStyle = '#7cf2c8'; ctx.shadowColor = '#7cf2c8'; ctx.shadowBlur = 16; ctx.fill(); ctx.shadowBlur = 0;
  // A nose: the ship's heading if it has one, else the direction of travel.
  const s = Math.hypot(player.vx, player.vy);
  if (player.heading !== undefined || s > 30) {
    const ux = player.heading !== undefined ? Math.cos(player.heading) : player.vx / s;
    const uy = player.heading !== undefined ? Math.sin(player.heading) : player.vy / s, n = player.r + 7;
    ctx.beginPath(); ctx.moveTo(player.x + ux * n, player.y + uy * n);
    ctx.lineTo(player.x - uy * 6 + ux * 4, player.y + ux * 6 + uy * 4); ctx.lineTo(player.x + uy * 6 + ux * 4, player.y - ux * 6 + uy * 4);
    ctx.closePath(); ctx.fill();
  }
});
