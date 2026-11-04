// Hearts and arena name, plus a circle around whatever killed you.
import { world, W } from '../../core/world.js';
import { content, addDrawer, LAYER } from '../../core/registry.js';
import { player } from '../../core/player.js';
import { hudFont, view } from '../../core/canvas.js';

addDrawer(LAYER.hud, ctx => {
  const { top, left } = view.inset, y = top + 26 * view.hud;
  ctx.font = hudFont(15); ctx.fillStyle = '#e8ecf3';
  ctx.textAlign = 'left';
  ctx.fillText('♥'.repeat(Math.max(0, player.hp)) + '♡'.repeat(player.maxHp - Math.max(0, player.hp)), left + 16, y);
  ctx.textAlign = 'center';
  ctx.fillText(`${content.stageLabel} ${world.run.ai + 1} / ${content.arenas.length} · ${world.arena.def.name}`, W / 2, y);
});

addDrawer(LAYER.effects, ctx => {
  const k = world.run.killer;
  if (!k) return;
  ctx.beginPath(); ctx.arc(k.x, k.y, 26, 0, Math.PI * 2);
  ctx.strokeStyle = '#ff9aa8'; ctx.lineWidth = 2; ctx.stroke();
});
