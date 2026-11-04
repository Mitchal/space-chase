// Frame-cost benchmark (dev only), run in the browser console:
//   await (await import('/dev/bench.js')).bench({ frames: 2400, pixels: 3 })
// Plays a seeded weaving run, drawing every frame at `pixels`× the 960×640 resolution, and reports the main-thread cost
// of sim and draw in ms. (No pixel readback: that flips Chrome to a software canvas and distorts sprite costs.)
export async function bench({ frames = 2400, pixels = 3, seed = 'bench' } = {}) {
  const { world } = await import('/core/world.js');
  const { step } = await import('/core/loop.js');
  const { startRun } = await import('/core/run.js');
  const { drawFrame, cvs, ctx } = await import('/core/canvas.js');
  const { setCourseSeed } = await import('/core/course-seed.js');
  const { on } = await import('/core/events.js');
  const { player } = await import('/core/player.js');
  let force = seed;
  on('runStart', () => { if (force) setCourseSeed(force); });
  cvs.width = 960 * pixels; cvs.height = 640 * pixels; ctx.setTransform(pixels, 0, 0, pixels, 0, 0);
  // A steady weave forward, invulnerable, so the run lasts and pursuers pile up.
  world.botPolicy = () => ({ ix: 1, iy: Math.sin(world.t * 1.3) });
  startRun({ variant: 'A', startArena: 0, index: -1 });
  world.botPolicy = null; // drawers skip some things for bots; play as the player would see it
  const pol = () => ({ ix: 1, iy: Math.sin(world.t * 1.3) });
  const sim = [], draw = [];
  for (let i = 0; i < frames && !world.run.over; i++) {
    player.inv = 0.5; world.botPolicy = pol;
    let t0 = performance.now(); step(1 / 60); sim.push(performance.now() - t0);
    world.botPolicy = null;
    t0 = performance.now(); drawFrame(); draw.push(performance.now() - t0);
  }
  force = null; world.run = null; addEventListener('resize', () => {}); dispatchEvent(new Event('resize'));
  const stat = a => { const s = [...a].sort((x, y) => x - y); return { mean: +(a.reduce((p, q) => p + q, 0) / a.length).toFixed(3), p95: +s[Math.floor(s.length * 0.95)].toFixed(3), max: +s[s.length - 1].toFixed(2) }; };
  return { frames: sim.length, sim: stat(sim), draw: stat(draw), ents: world.ents.length };
}
