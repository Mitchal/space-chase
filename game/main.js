// Boots the kernel, then loads whatever pods exist on disk. Deleting a pod folder removes the feature.
import './core/sim-kernel.js'; // first: the simulation's systems register in the same order as in a headless replay
import './core/live-run.js';
import './core/effects-view.js';
import './core/player-view.js';
import './core/loop.js';
import { content } from './core/registry.js';
import { startRun } from './core/run.js';
import { loadServerLog, progress } from './core/storage.js';
import { playtest } from './core/mode.js';
import { emit } from './core/events.js';

// The dev server lists the pod folders on disk; a packaged build (web or app) ships the list as pods.json.
let pods = [];
try { pods = await (await fetch('api/pods')).json(); } catch {
  try { pods = await (await fetch('pods.json')).json(); } catch { console.warn('No pod list; running the bare kernel.'); }
}
for (const name of pods) {
  try { await import(`./pods/${name}/pod.js`); } catch (err) { console.error(`Pod "${name}" failed to load`, err); }
}

if (playtest) await loadServerLog();
emit('ready');
if (!content.startScreen) startRun({ startArena: progress.chosenStart });
