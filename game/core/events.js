// Event bus. Pods talk to each other only through events, never through imports.
//
// Events in use: runStart, arenaEnter, arenaExit {…arena, cleared}, arenaCleared, runEnd, runSettled,
// kill {e, cause}, hurt {cause, src}, playerDown {cause, src}, keyTaken {left, total},
// exitOpened, keyPressed (code), pauseChanged (paused), showTitle, ready, nearMiss {e},
// back {handled}: a screen that handles "back" sets handled = true.
// watchStart {mode, day, name, score, …}, watchEnd: a recorded run being shown (core/replay-watch.js).

const handlers = new Map();

export function on(name, fn) {
  if (!handlers.has(name)) handlers.set(name, []);
  handlers.get(name).push(fn);
}

export function emit(name, payload) {
  for (const fn of handlers.get(name) || []) fn(payload);
}
