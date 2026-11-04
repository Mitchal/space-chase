// Shares a run's line with a link to the game. On phones, the system share sheet. On computers, the clipboard: a
// desktop share sheet is a clumsy detour. Every failure falls through to the next way, so the button never does
// nothing. The last fallback hands the text back so the screen can show it for copying by hand.
import { GAME_URL } from '../../core/game-url.js';
export { GAME_URL };

const touch = matchMedia('(pointer: coarse)').matches;

// Copies with the old selection trick: works where the async clipboard is missing or refused (unfocused, old WebViews).
function copyBySelection(text) {
  const ta = Object.assign(document.createElement('textarea'), { value: text, readOnly: true });
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  document.body.append(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch {}
  ta.remove();
  return ok;
}

// Resolves to 'shared' (share sheet), 'cancelled' (closed the share sheet), 'copied' (clipboard) or 'failed'.
export async function shareRun(text) {
  const full = `${text}\n${GAME_URL}`;
  if (touch && navigator.share) {
    try { await navigator.share({ text: full }); return 'shared'; }
    catch (e) { if (e?.name === 'AbortError') return 'cancelled'; } // any other failure: copy instead
  }
  try { await navigator.clipboard.writeText(full); return 'copied'; } catch {}
  return copyBySelection(full) ? 'copied' : 'failed';
}
