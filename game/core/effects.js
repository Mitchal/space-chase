// Juice that the simulation asks for: particles, floating text, screen shake, hit-stop and slow-mo. Any pod can trigger
// these. hitstop and slowmo are simulation time (core/sim-tick.js); everything else is only shown, by whatever the host
// installs with showEffects (core/effects-view.js in the browser). A headless replay installs nothing, so it's free.
export const fx = { shake: 0, hitstop: 0, slowmo: 0, slowScale: 1 };

const shows = [];
// view: { burst(x, y, col, n), floatText(x, y, s, opts), bigText(s, opts), clear() }
export const showEffects = view => { shows.push(view); };

export function burst(x, y, col, n = 16) { for (const v of shows) v.burst(x, y, col, n); }
// floatText sits at a world position; bigText is a screen-centred banner (y in view pixels, 0..H: scaled to the screen).
export function floatText(x, y, s, opts = {}) { for (const v of shows) v.floatText(x, y, s, opts); }
export function bigText(s, opts = {}) { for (const v of shows) v.bigText(s, opts); }
export function clearEffects() { for (const v of shows) v.clear(); }

// A fresh run starts with no hit-stop or slow-mo left over from the last one.
export function resetTime() { fx.hitstop = 0; fx.slowmo = 0; fx.slowScale = 1; }
