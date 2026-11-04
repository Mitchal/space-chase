// The flight (his spec, run 17): no auto-scroll. The camera stays centred on you; a death wave rolls in
// from the left and forces you right; dynamic death walls bound the top and bottom of a lane wider than the
// screen. Reach the finish line to win. Pursuers die on the walls and in the wave too (P10: one set of rules).
import { world, addEntity, lurables, kill } from '../../core/world.js';
import { on, emit } from '../../core/events.js';
import { content, addSystem, ORDER } from '../../core/registry.js';
import { player, hurt } from '../../core/player.js';
import { SECTORS, SECTOR_LEN, COURSE_END, laneShape } from './course.js';
import { drawFlight } from './flight-draw.js';
import { stepWave } from './death-wave.js';

const WAVE_START_GAP = 700;

content.arenas = SECTORS;
content.stageLabel = 'Sector';
content.stageFlow = { clearBetween: false, pauseS: 0, recenter: false, clearedText: 'YOU MADE IT' };
content.forward = { x: 1, y: 0 }; // for bots: progress is to the right
content.howToPlay = [
  'Fly right to the <b style="color:#7cf2c8">finish</b>. The <b style="color:#ff4d6d">death wave</b> rolls in from behind; the <b style="color:#ff4d6d">walls</b> above and below kill on touch.',
  "Missiles are faster than you but turn wider, so lead them into rocks, walls and the wave. A red arrow on the edge of the screen shows where one is coming in.",
];
world.cameraFollows = true;
world.bounds = { minX: -1e6, maxX: COURSE_END + 300, minY: -1e6, maxY: 1e6 };
world.laneAt = (x, t = world.t) => laneShape(x, t);

let wave = null;

// The first sector of a run places you at its start with the wave behind you; later sectors just flow on.
on('arenaEnter', a => {
  if (a.index !== world.run.startArena) return;
  const startX = a.index * SECTOR_LEN + 300, lane = world.laneAt(startX);
  Object.assign(player, { x: startX, y: (lane.top + lane.bottom) / 2, vx: 0, vy: 0 });
  wave = addEntity({ type: 'wave', x: startX - WAVE_START_GAP, y: player.y, r: 0 });
});

addSystem(ORDER.move, dt => { stepWave(wave, dt); world.rearX = wave.x; });

// A wall hit knocks you back into the lane (run 34: "Two deaths from the same cause, I never got free in between":
// with thrusters you kept your speed into the wall and stayed pinned there).
const KNOCK = 160;
function keepInLane(o, onHit) {
  const lane = world.laneAt(o.x);
  if (o.y - o.r < lane.top) { onHit(); o.y = lane.top + o.r + 2; o.vy = Math.max(Math.abs(o.vy) * 0.6, KNOCK); }
  else if (o.y + o.r > lane.bottom) { onHit(); o.y = lane.bottom - o.r - 2; o.vy = -Math.max(Math.abs(o.vy) * 0.6, KNOCK); }
}

addSystem(ORDER.collide, () => {
  if (player.x - player.r < wave.x) hurt('wave', { x: wave.x, y: player.y }, { fatal: true });
  keepInLane(player, () => hurt('wall', { x: player.x, y: player.y }));
  for (const e of lurables()) {
    if (e.x < wave.x) { kill(e, 'wave'); continue; }
    const lane = world.laneAt(e.x);
    if (e.y - e.r < lane.top || e.y + e.r > lane.bottom) kill(e, 'wall');
  }
});

addSystem(ORDER.rules, () => {
  const sectorEnd = Math.min(COURSE_END, (world.run.ai + 1) * SECTOR_LEN);
  if (player.x >= sectorEnd) emit('arenaCleared');
});

drawFlight(() => wave, { SECTOR_LEN, COURSE_END });
