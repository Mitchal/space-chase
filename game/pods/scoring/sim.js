// Score and chains as the simulation keeps them: kills close together multiply. The score is part of the run's
// outcome, so the leaderboard's replay (core/replay-run.js) counts it exactly as the game did.
import { on } from '../../core/events.js';
import { content, addSystem, addSummary, ORDER } from '../../core/registry.js';
import { floatText, fx } from '../../core/effects.js';

const CHAIN_WINDOW = 1.2;
let score = 0, chain = 0, chainT = 0, maxChain = 0, chainsOf3 = 0;
export const scoreNow = () => ({ score, chain });

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
