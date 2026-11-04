// The taste log (browser copy + the on-disk copy via the server), run numbering and checkpoint progress.

export const VERSION = 15;
const LOG_KEY = 'lure.tasteLog.v1', RUN_KEY = 'lure.runCount.v1', START_KEY = 'lure.startArena.v15';
const mem = { log: [], runs: 0 };

export const progress = { bestArena: 1, chosenStart: 0, serverRuns: 0 };
try { progress.chosenStart = parseInt(localStorage.getItem(START_KEY) || '0', 10) || 0; } catch {}

function loadLocal() { try { return JSON.parse(localStorage.getItem(LOG_KEY)) || mem.log; } catch { return mem.log; } }
function saveLocal(log) { mem.log = log; try { localStorage.setItem(LOG_KEY, JSON.stringify(log)); } catch {} }

// Reads the on-disk log so run numbers and checkpoints survive a wiped browser.
export async function loadServerLog() {
  let entries = loadLocal();
  // The highest run number, not the count: runs started but never saved leave gaps.
  try { entries = await (await fetch('api/log')).json(); progress.serverRuns = Math.max(entries.length, ...entries.map(e => e.run || 0)); } catch {}
  for (const e of entries) if (e.version === VERSION && !e.invalid) noteArenaReached(e.telemetry.arenaReached);
  return entries;
}

export function noteArenaReached(n) { progress.bestArena = Math.max(progress.bestArena, n || 1); }

export function setChosenStart(i) {
  progress.chosenStart = i;
  try { localStorage.setItem(START_KEY, String(i)); } catch {}
}

export function nextRunIndex() {
  let n = mem.runs;
  try { n = parseInt(localStorage.getItem(RUN_KEY) || '0', 10) || 0; } catch {}
  n = Math.max(n, progress.serverRuns);
  mem.runs = n + 1;
  try { localStorage.setItem(RUN_KEY, String(n + 1)); } catch {}
  return n;
}

export function appendEntry(entry) {
  saveLocal([...loadLocal(), entry]);
  progress.serverRuns = Math.max(progress.serverRuns, entry.run);
  fetch('api/log', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(entry) }).catch(() => {});
}

export const runsLogged = () => Math.max(loadLocal().length, progress.serverRuns);

export function exportLog() {
  const json = JSON.stringify(loadLocal(), null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a.download = 'lure-taste-log.json';
  a.click();
}
