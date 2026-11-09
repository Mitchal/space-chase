// host-only: how wide the view is. The view is always H tall; its width W follows the screen's shape (a phone on its
// side is ~2:1), between MIN_W and MAX_W. W is a live binding: importers always see the current width.
// Only drawing may use it: the simulation plays in a fixed MIN_W-wide frame (core/focus.js), so a wide phone shows more
// of the same game rather than playing a different one, and a replay comes out the same on any screen.
import { MIN_W } from './world.js';

export const MAX_W = 1440;
export let W = MIN_W;
export function setViewWidth(w) { W = Math.round(Math.max(MIN_W, Math.min(MAX_W, w))); }
