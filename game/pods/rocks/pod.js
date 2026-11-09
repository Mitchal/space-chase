// Asteroids (reference moment 2, his favourite movement): "flying about like asteroids", never static (run 17).
// What they do is sim.js; here, how they look.
import './sim.js';
import { addDrawer, LAYER } from '../../core/registry.js';
import { inView } from '../../core/camera.js';
import { rocks } from './sim.js';

addDrawer(LAYER.hazards, ctx => {
  for (const k of rocks()) {
    if (!inView(k, k.r + 4)) continue;
    ctx.beginPath(); ctx.arc(k.x, k.y, k.r, 0, Math.PI * 2);
    ctx.fillStyle = '#1f2533'; ctx.fill();
    ctx.strokeStyle = '#c9a27a'; ctx.lineWidth = 2.5; ctx.stroke();
  }
});
