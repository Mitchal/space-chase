// This device's secret for the board: 32 random bytes, made the first time you pick a name and kept next to it. Every
// score is sent with it, and the name belongs to the first device that posts with it, so nobody else can post as you
// or move your scores (leaderboard-worker/src/device-key.js; the Worker stores only a hash of it). Clearing the site's
// data or reinstalling loses it, and with it the name: pick another, or ask for it to be freed (that README).
import { readSaved, writeSaved } from '../../core/storage.js';

const KEY = 'spacechase.boardKey.v1';
const WELL_FORMED = /^[0-9a-f]{64}$/;
let kept = null; // so a browser that won't store anything still sends one key all session

const fresh = () => [...crypto.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2, '0')).join('');

// → the key (64 hex digits), made and saved first if this device has none yet (or picked its name before keys existed).
export function deviceKey() {
  const saved = readSaved(KEY);
  if (typeof saved === 'string' && WELL_FORMED.test(saved)) return (kept = saved);
  kept ??= fresh();
  writeSaved(KEY, kept);
  return kept;
}
