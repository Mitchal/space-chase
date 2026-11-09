// Score and chains: kills close together multiply (sim.js). In a mode scored by time (content.scoring), only the
// chains show; here, the score in the corner.
import './sim.js';
import { content, addDrawer, LAYER } from '../../core/registry.js';
import { hudFont, view } from '../../core/canvas.js';
import { scoreNow } from './sim.js';

addDrawer(LAYER.hud, ctx => {
  if (content.scoring !== 'points') return;
  const { score, chain } = scoreNow();
  ctx.font = hudFont(15); ctx.textAlign = 'right'; ctx.fillStyle = '#e8ecf3';
  const x = view.w - view.inset.right - 16, top = view.inset.top;
  ctx.fillText(String(score), x, top + 26 * view.hud);
  if (chain > 1) { ctx.fillStyle = '#7cf2c8'; ctx.fillText(`chain ×${chain}`, x, top + 46 * view.hud); }
});
