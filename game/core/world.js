// Shared state of the current run and stage, plus the entity store.
// Entities live in world coordinates. The screen is a W×H view onto the world through the camera.
import { emit } from './events.js';

// The view is always H tall; its width W follows the screen's shape (a phone on its side is ~2:1), between MIN_W and MAX_W.
// W is a live binding: importers always see the current width.
export const H = 640, MIN_W = 960, MAX_W = 1440;
export let W = MIN_W;
export function setViewWidth(w) { W = Math.round(Math.max(MIN_W, Math.min(MAX_W, w))); }

export const world = {
  t: 0,
  run: null, // { index, variant, startArena, ai, over, outcome, ... }
  arena: null, // { index, def, t, startedAt }
  ents: [],
  pressure: 1, // 0..~1.4, set by a pacing pod; spawners scale with it
  transition: 0, // seconds left in the between-stages pause
  paused: false,
  botPolicy: null, // when set, a bot drives the player instead of the keyboard
  cam: { x: 0, y: 0 }, // top-left of the view, in world coordinates
  cameraFollows: false, // a mode pod sets this to keep the view centred on the player
  bounds: { minX: 0, maxX: W, minY: 0, maxY: H }, // hard limits for anything that moves
  rearX: -Infinity, // nothing should appear behind this x (e.g. a death wave)
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
