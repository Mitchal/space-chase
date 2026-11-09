// host-only: the hero as drawn: just the dot (v17: "remove the arrow… cleaner with just being the dot"), blinking
// while it can't be hurt.
import { world } from './world.js';
import { addDrawer, LAYER } from './registry.js';
import { player } from './player.js';
import { glowSprite, drawSprite } from './sprites.js';

addDrawer(LAYER.player, ctx => {
  if (world.run.outcome === 'dead' || world.transition > 0) return;
  if (player.inv > 0 && Math.floor(world.t * 16) % 2) return;
  drawSprite(ctx, glowSprite('player', player.r, 16, '#7cf2c8', g => {
    g.beginPath(); g.arc(0, 0, player.r, 0, Math.PI * 2); g.fillStyle = '#7cf2c8'; g.fill();
  }), player.x, player.y);
});
