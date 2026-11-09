// Shared state of the current run and stage, plus the entity store: the simulation's state.
// Entities live in world coordinates. The game plays in a MIN_W × H frame around world.focus (core/focus.js); the screen
// may show more of it (core/view-size.js), but nothing the screen does reaches the simulation.
import { emit } from './events.js';

export const H = 640, MIN_W = 960;

export const world = {
  t: 0,
  mode: null, // the game mode being played (core/game-modes.js)
  run: null, // { index, variant, startArena, ai, over, outcome, ... }
  arena: null, // { index, def, t, startedAt }
  ents: [],
  pressure: 1, // 0..~1.4, set by a pacing pod; spawners scale with it
  transition: 0, // seconds left in the between-stages pause
  paused: false,
  botPolicy: null, // when set, a bot drives the player instead of the keyboard (the host asks it for input each tick)
  input: { ix: 0, iy: 0, grip: 14 }, // this tick's input, from a live player, a bot or a replay (core/sim-input.js)
  focus: { x: MIN_W / 2, y: H / 2 }, // the centre of the play frame (core/focus.js)
  cam: { x: 0, y: 0 }, // top-left of the view, in world coordinates: drawing only (core/camera.js)
  cameraFollows: false, // a mode pod sets this to keep the view centred on the player
  flipView: false, // a mode pod sets this to show the world end for end (ahead to the left, or down an upright screen)
  bounds: { minX: 0, maxX: MIN_W, minY: 0, maxY: H }, // hard limits for anything that moves
  rearX: -Infinity, // nothing should appear behind this x (e.g. a death wave)
  cullBehind: false, // drop entities flagged `cull` once they're far left of the view (a forward flight)
  // The open lane at a given x (and time t, default now): { top, bottom }. A mode pod can replace this with a shaped corridor.
  laneAt: () => ({ top: world.bounds.minY, bottom: world.bounds.maxY }),
};

export function addEntity(e) {
  world.ents.push(e);
  return e;
}

// Entities that are present and active (not dead, not still spawning in).
export const live = type => world.ents.filter(e => !e.dead && !(e.spawn > 0) && (!type || e.type === type));

// Entities flagged `lurable` are the pursuers: anything deadly in the world can kill them.
export const lurables = () => live().filter(e => e.lurable);

export function kill(e, cause) {
  if (e.dead) return;
  e.dead = true;
  emit('kill', { e, cause });
}

export function sweepDead() {
  world.ents = world.ents.filter(e => !e.dead);
}
