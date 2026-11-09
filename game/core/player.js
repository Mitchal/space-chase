// The hero: movement only (P7), two hits per arena (P11), readable hits (P5). Drawn by core/player-view.js.
import { world, MIN_W, H } from './world.js';
import { emit } from './events.js';
import { addSystem, ORDER } from './registry.js';
import { clamp } from './geometry.js';
import { burst, floatText, fx } from './effects.js';

export const PSPEED = 270;
// How the hero turns input into motion. Default: grip the input direction (1/s; high = turns on a dime). The grip comes
// with each tick's input (core/sim-input.js): `grip` here is what keys and the mouse use; a controls pod may ask for
// more (core/input.js). A pod may install steer(player, input, dt) to set player.vx/vy itself (e.g. thrusters).
export const handling = { grip: 14, steer: null };
export const player = { x: MIN_W / 2, y: H / 2, r: 9, vx: 0, vy: 0, hp: 2, maxHp: 2, inv: 0 };

// What players see ("hit by a missile"); also the killedBy values in the taste log ("a chaser" before v16).
const LABELS = {
  chaser: 'a missile', charger: 'a charger', 'charger dash': 'a charger dash', mine: 'a mine blast',
  laser: 'a laser', rock: 'a rock', wall: 'a death wall', wave: 'the death wave', blast: 'a missile blast',
};
export const hurtLabel = cause => LABELS[cause] || cause;

// Each new stage gives one heart back (max 2). Room-style stages also recentre you with brief invulnerability.
export function resetPlayer(heal, recenter = true) {
  if (recenter) Object.assign(player, { x: MIN_W / 2, y: H / 2, vx: 0, vy: 0, inv: 1.2 });
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
  const want = world.input;
  if (handling.steer) handling.steer(player, want, dt);
  else {
    const k = Math.min(1, dt * want.grip);
    player.vx += (want.ix * PSPEED - player.vx) * k;
    player.vy += (want.iy * PSPEED - player.vy) * k;
  }
  const b = world.bounds;
  player.x = clamp(player.x + player.vx * dt, b.minX + player.r, b.maxX - player.r);
  player.y = clamp(player.y + player.vy * dt, b.minY + player.r, b.maxY - player.r);
  if (player.inv > 0) player.inv -= dt;
});
