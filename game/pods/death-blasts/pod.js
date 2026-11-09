// Death blasts: every pursuer that dies explodes (run 45: "would be even more fun if more than one could collide at
// once, maybe if each one collides with a little explosion radius like a mine!"; then, 2026-11-03: "every death of a
// chaser should lead to it personally exploding with a blast"). The blast kills pursuers nearby, which explode in turn,
// so a crowd you gather tightly goes up together. It's small, so chains only happen when you packed them (P1).
// It never hurts you: the hero exception to P10 (run 48: "maybe their blast should not hurt me. A bit unfair perhaps
// but hey I'm the hero here"). Won v11's blind A/B (run 47, from a run without: "I would have done better if chasers
// exploded in this run"). Delete this folder and pursuers just die. What they do is sim.js; here, how they look.
import './sim.js';
import { addDrawer, LAYER } from '../../core/registry.js';
import { RADIUS, GROW_S, LIFE_S, deathBlasts } from './sim.js';

const COLOR = '255,122,89';

addDrawer(LAYER.hazards, ctx => {
  for (const b of deathBlasts()) {
    const k = b.t / LIFE_S, rad = RADIUS * Math.min(1, b.t / GROW_S);
    ctx.beginPath(); ctx.arc(b.x, b.y, rad, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${COLOR},${0.35 * (1 - k)})`; ctx.fill();
    ctx.strokeStyle = `rgba(${COLOR},${1 - k})`; ctx.lineWidth = 3; ctx.stroke();
  }
});
