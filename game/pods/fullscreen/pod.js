// Full screen, for playing on a phone: the first touch goes full screen. F toggles it on a keyboard. Browsers only allow
// this in response to a tap or key press. Either way up works: held upright (one-handed), the view turns so the course
// runs up the screen (core/screen-mapping.js), so the screen isn't locked to either.
// Delete this folder and the game stays in the browser window.
import { on } from '../../core/events.js';

function enter() {
  if (document.fullscreenElement || !document.documentElement.requestFullscreen) return;
  document.documentElement.requestFullscreen({ navigationUI: 'hide' })
    .catch(() => {}); // not allowed here (e.g. iPhone Safari): play in the window
}

addEventListener('pointerdown', e => { if (e.pointerType === 'touch') enter(); }, { capture: true });
on('keyPressed', code => {
  if (code !== 'KeyF' || document.activeElement?.tagName === 'TEXTAREA') return;
  if (document.fullscreenElement) document.exitFullscreen(); else enter();
});
