// Game modes: each one a daily challenge played with the same pieces (missiles, rocks, lasers…). A mode pod registers
// itself here; the menu offers every mode and a run starts in the one picked. Starting a run puts the world's shape
// back to the kernel's defaults before the mode sets it up, so one mode never leaks into the next.
// Systems and drawers can be limited to one mode (the `mode` option in registry.js).
import { world } from './world.js';
import { content } from './registry.js';

// What a mode may change. Snapshotted here, before any pod loads.
const CONTENT_KEYS = ['arenas', 'stageLabel', 'stageFlow', 'forward', 'scoring'];
const WORLD_KEYS = ['cameraFollows', 'flipView', 'bounds', 'laneAt', 'rearX', 'cullBehind'];
const pick = (o, keys) => Object.fromEntries(keys.map(k => [k, o[k]]));
const defaults = { content: pick(content, CONTENT_KEYS), world: pick(world, WORLD_KEYS) };

const modes = new Map(), notes = new Map();

// def: { id, label, color, tagline, howToPlay: [html], setup(),
//        score(summary, run) → number (higher is better), format(score) → text,
//        result?(run, summary) → { title, score, newBest, line, share } for the results screen }
// A mode pod may add its def in parts: the simulation's (setup, score: its sim.js, which a headless replay loads too)
// and then how it looks (the rest). Each call adds to what's there.
export function addMode(def) { modes.set(def.id, { ...modes.get(def.id), ...def }); }
export const modeList = () => [...modes.values()];
export const modeById = id => modes.get(id) || null;
export const currentMode = () => modes.get(world.mode) || null;

// Pods may add short lines about a mode for the menu (today's best, tries). fn() → text, or '' for nothing.
export function addModeNote(id, fn) {
  if (!notes.has(id)) notes.set(id, []);
  notes.get(id).push(fn);
}
export const modeNotes = id => (notes.get(id) || []).map(f => f()).filter(Boolean);

// Switches to a mode (unknown id: stay in the current one, else the first registered).
export function useMode(id) {
  const def = modes.get(id) || currentMode() || modeList()[0];
  Object.assign(content, defaults.content);
  Object.assign(world, defaults.world, { bounds: { ...defaults.world.bounds } });
  world.mode = def?.id ?? null;
  def?.setup?.();
}

// A run's score in its mode's terms, and how to show it.
export const runScore = (summary, run) => currentMode()?.score?.(summary, run) ?? summary.score?.score ?? 0;
export const formatScore = (n, mode = currentMode()) => mode?.format?.(n) ?? String(n); // each mode formats its own (locale-aware)
