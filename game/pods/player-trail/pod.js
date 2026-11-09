// A sparkly trail behind your dot (v17, his ask: "some like swooshing, almost sparkly like thing that appear where I
// just was. So I can be like making patterns by just flying"). Two parts:
// - a swoosh: a short glowing ribbon that tapers and fades behind you, so turns read as curves;
// - sparkles: tiny twinkling stars dropped along your path that linger a little longer, so loops leave a pattern.
// Pure decoration: nothing collides with it. Delete this folder and the dot flies clean.
import { world } from '../../core/world.js';
import { on } from '../../core/events.js';
import { addSystem, addDrawer, ORDER, LAYER } from '../../core/registry.js';
import { player } from '../../core/player.js';
import { glowSprite, drawSprite } from '../../core/sprites.js';
import { visualRand, visualRandom } from '../../core/visual-random.js';

const COLOR = '#7cf2c8', RIBBON_S = 0.45, SPARKLE_EVERY = 6, MAX_SPARKLES = 320, JUMP = 60;
let ribbon = [], sparkles = [], last = null, travelled = 0;

const clear = () => { ribbon = []; sparkles = []; last = null; travelled = 0; };
on('runStart', clear);

// A four-pointed star with a soft glow, painted once.
const star = (key, col) => glowSprite(key, 4, 5, col, g => {
  g.beginPath(); g.moveTo(0, -4);
  for (const [x, y] of [[4, 0], [0, 4], [-4, 0], [0, -4]]) g.quadraticCurveTo(0, 0, x, y);
  g.fillStyle = col; g.fill();
});

function dropSparkle(x, y) {
  if (sparkles.length >= MAX_SPARKLES) sparkles.shift();
  const life = visualRand(1.0, 2.0);
  sparkles.push({ x: x + visualRand(-4, 4), y: y + visualRand(-4, 4), vx: visualRand(-14, 14), vy: visualRand(-14, 14), t: life, life,
    k: visualRand(0.5, 1.1), phase: visualRand(0, 6.3), spin: visualRand(9, 16), white: visualRandom() < 0.3 });
}

// Lays the trail while you fly; keeps fading it after you're down or between stages.
addSystem(ORDER.late, dt => {
  for (const p of ribbon) p.age += dt;
  ribbon = ribbon.filter(p => p.age < RIBBON_S);
  for (const s of sparkles) { s.t -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.96; s.vy *= 0.96; }
  sparkles = sparkles.filter(s => s.t > 0);

  const flying = world.run && !world.run.over && !(world.transition > 0);
  if (!flying) { last = null; return; }
  const here = { x: player.x, y: player.y, age: 0 };
  const step = last ? Math.hypot(here.x - last.x, here.y - last.y) : 0;
  if (step > JUMP) here.gap = true; // a teleport (stage recentre): start a new strand, don't streak across
  else travelled += step;
  ribbon.push(here); last = here;
  while (travelled >= SPARKLE_EVERY) { travelled -= SPARKLE_EVERY; dropSparkle(player.x, player.y); }
}, { always: true });

addDrawer(LAYER.player - 2, ctx => {
  if (!ribbon.length && !sparkles.length) return;
  const prev = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round'; ctx.strokeStyle = COLOR;
  for (let i = 1; i < ribbon.length; i++) {
    const a = ribbon[i - 1], b = ribbon[i];
    if (b.gap) continue;
    const f = 1 - b.age / RIBBON_S; // 1 at the dot, 0 at the tail
    ctx.globalAlpha = 0.45 * f; ctx.lineWidth = player.r * 1.4 * f + 1;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  const mint = star('trail-star', COLOR), white = star('trail-star-white', '#ffffff');
  for (const s of sparkles) {
    const fade = Math.min(1, s.t / s.life * 2), twinkle = 0.5 + 0.5 * Math.sin(s.phase + s.t * s.spin);
    ctx.globalAlpha = fade * (0.35 + 0.65 * twinkle);
    drawSprite(ctx, s.white ? white : mint, s.x, s.y, 0, s.k * (0.7 + 0.5 * twinkle));
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = prev;
});
