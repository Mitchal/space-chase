// The run-wide progress bar (P8: progress is the destination, so it must be visible). One segment per sector.
import { world, W, H } from '../../core/world.js';
import { content, addDrawer, LAYER } from '../../core/registry.js';

export function drawProgress(sectorS) {
  addDrawer(LAYER.hud, ctx => {
    const n = content.arenas.length, x0 = 160, x1 = W - 160, y = H - 16, segW = (x1 - x0) / n;
    const done = Math.min(n, world.run.ai + Math.min(1, world.arena.t / sectorS));
    ctx.fillStyle = '#2a3142'; ctx.fillRect(x0, y, x1 - x0, 4);
    ctx.fillStyle = '#7cf2c8'; ctx.fillRect(x0, y, segW * done, 4);
    ctx.fillStyle = '#0e1118';
    for (let i = 1; i < n; i++) ctx.fillRect(x0 + segW * i - 1, y - 2, 2, 8);
    const px = x0 + segW * done;
    ctx.beginPath(); ctx.arc(px, y + 2, 5, 0, Math.PI * 2); ctx.fillStyle = '#7cf2c8'; ctx.fill();
    ctx.font = '600 12px system-ui,sans-serif'; ctx.fillStyle = '#8a93a6';
    ctx.textAlign = 'right'; ctx.fillText('START', x0 - 8, y + 5);
    ctx.textAlign = 'left'; ctx.fillText('END', x1 + 8, y + 5);
  });
}
