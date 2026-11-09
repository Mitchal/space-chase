// Chasers: fast, wide-turning pursuers (P2). What they do is sim.js; here, how they look, with a warning before one
// comes in (entry-warning.js).
import './sim.js';
import { world } from '../../core/world.js';
import { addDrawer, LAYER } from '../../core/registry.js';
import { glowSprite, drawSprite } from '../../core/sprites.js';
import { COLOR } from './sim.js';
import { drawEntryWarning } from './entry-warning.js';

const ship = () => glowSprite('chaser', 13, 10, COLOR, g => {
  g.beginPath(); g.moveTo(13, 0); g.lineTo(-9, 8); g.lineTo(-5, 0); g.lineTo(-9, -8); g.closePath();
  g.fillStyle = COLOR; g.fill();
});

addDrawer(LAYER.mobs, ctx => {
  for (const e of world.ents) {
    if (e.type !== 'chaser') continue;
    if (e.spawn > 0) { drawEntryWarning(ctx, e, COLOR); continue; }
    drawSprite(ctx, ship(), e.x, e.y, e.a);
  }
});
