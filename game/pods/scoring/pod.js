// Score and chains: kills close together multiply. In a mode scored by time (content.scoring), only the chains show.
import { W } from '../../core/world.js';
import { on } from '../../core/events.js';
import { content, addSystem, addDrawer, addSummary, ORDER, LAYER } from '../../core/registry.js';
import { floatText, fx } from '../../core/effects.js';
import { hudFont, view } from '../../core/canvas.js';

const CHAIN_WINDOW = 1.2;
let score = 0, chain = 0, chainT = 0, maxChain = 0, chainsOf3 = 0;

on('runStart', () => { score = chain = chainT = maxChain = chainsOf3 = 0; });
on('hurt', () => { chain = 0; chainT = 0; });
on('arenaCleared', () => { score += 500; });
on('nearMiss', () => { score += 50; });

on('kill', ({ e, cause }) => {
  if (cause === 'player') return;
  chain = chainT > 0 ? chain + 1 : 1;
  chainT = CHAIN_WINDOW;
  score += 100 * chain;
  maxChain = Math.max(maxChain, chain);
  if (chain === 3) chainsOf3++;
  const points = content.scoring === 'points';
  if (chain > 1 || points) floatText(e.x, e.y - 14, chain > 1 ? `CHAIN ×${chain}` : '+100', { col: chain > 1 ? '#7cf2c8' : '#e8ecf3' });
  fx.shake = Math.max(fx.shake, 2 + chain);
});

addSystem(ORDER.late, dt => { if (chainT > 0 && (chainT -= dt) <= 0) chain = 0; });

addSummary('score', () => ({ score, maxChain, chainsOf3 }));

addDrawer(LAYER.hud, ctx => {
  if (content.scoring !== 'points') return;
  ctx.font = hudFont(15); ctx.textAlign = 'right'; ctx.fillStyle = '#e8ecf3';
  const x = W - view.inset.right - 16, top = view.inset.top;
  ctx.fillText(String(score), x, top + 26 * view.hud);
  if (chain > 1) { ctx.fillStyle = '#7cf2c8'; ctx.fillText(`chain ×${chain}`, x, top + 46 * view.hud); }
});
