// The ghost of today's best run: where you were, every tenth of a second of run time, played back beside you.
// Run time is game time, so slow-mo and hit-stop stretch both runs alike.
import { world, W, H } from '../../core/world.js';
import { player } from '../../core/player.js';
import { clamp } from '../../core/geometry.js';

export const SAMPLE_S = 0.1;
const COLOR = '185,196,255';

export const runTime = () => world.t - world.run.startedAt;

// Adds a sample when one is due. track: [[x, y], …] rounded to whole pixels.
export function recordSample(track) {
  if (track.length <= runTime() / SAMPLE_S) track.push([Math.round(player.x), Math.round(player.y)]);
}

// The ghost's position now, or null once its run is over.
export function ghostAt(track) {
  const f = runTime() / SAMPLE_S, i = Math.floor(f);
  if (!track || i >= track.length - 1) return null;
  const [ax, ay] = track[i], [bx, by] = track[i + 1], k = f - i;
  return { x: ax + (bx - ax) * k, y: ay + (by - ay) * k };
}

// A hollow ship where the ghost is; off screen, a small marker on the edge saying whether it's ahead or behind.
export function drawGhost(ctx, g) {
  const c = world.cam, inside = g.x > c.x && g.x < c.x + W && g.y > c.y && g.y < c.y + H;
  ctx.strokeStyle = `rgba(${COLOR},.85)`; ctx.fillStyle = `rgba(${COLOR},.85)`; ctx.lineWidth = 2.5;
  if (inside) {
    ctx.beginPath(); ctx.arc(g.x, g.y, player.r, 0, Math.PI * 2); ctx.stroke();
    ctx.font = '600 11px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillText('best', g.x, g.y - 16);
    return;
  }
  const x = clamp(g.x, c.x + 18, c.x + W - 18), y = clamp(g.y, c.y + 18, c.y + H - 18);
  ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
  const ahead = g.x > player.x;
  ctx.font = '600 11px system-ui,sans-serif'; ctx.textAlign = ahead ? 'right' : 'left';
  ctx.fillText(ahead ? 'best ▶' : '◀ best', x + (ahead ? -10 : 10), y + 4);
}
