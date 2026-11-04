// Boots the kernel, then loads whatever pods exist on disk. Deleting a pod folder removes the feature.
import './core/loop.js';
import './core/run.js';
import './core/camera.js';
import { content } from './core/registry.js';
import { startRun } from './core/run.js';
import { loadServerLog, progress } from './core/storage.js';
import { playtest } from './core/mode.js';
import { emit } from './core/events.js';

// The dev server lists the pod folders on disk; a packaged build (web or app) ships the list as pods.json.
let pods = [];
try { pods = await (await fetch('/api/pods')).json(); } catch {
  try { pods = await (await fetch('pods.json')).json(); } catch { console.warn('No pod list; running the bare kernel.'); }
}
for (const name of pods) {
  try { await import(`./pods/${name}/pod.js`); } catch (err) { console.error(`Pod "${name}" failed to load`, err); }
}

if (playtest) await loadServerLog();
emit('ready');
if (!content.startScreen) startRun({ startArena: progress.chosenStart });
