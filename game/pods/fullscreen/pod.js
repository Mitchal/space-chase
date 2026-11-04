// Full screen, for playing on a phone: the first touch goes full screen and turns the screen sideways (the course is
// wide); while the phone is upright, a card asks you to turn it. F toggles it on a keyboard. Browsers only allow this in response to a tap or key press.
// Delete this folder and the game stays in the browser window.
import { on } from '../../core/events.js';

// The course is wide: on a phone held upright, ask to turn it (where the screen can't be locked sideways).
document.body.insertAdjacentHTML('beforeend', `
<style>#rotate{display:none;position:fixed;inset:0;z-index:5;background:#0b0d12;color:#e8ecf3;align-items:center;justify-content:center;
  flex-direction:column;gap:10px;font:600 18px system-ui,sans-serif;text-align:center}
@media (orientation:portrait) and (pointer:coarse){#rotate{display:flex}}</style>
<div id="rotate"><div style="font-size:44px">⟲</div>Turn your phone sideways</div>`);

function enter() {
  if (document.fullscreenElement || !document.documentElement.requestFullscreen) return;
  document.documentElement.requestFullscreen({ navigationUI: 'hide' })
    .then(() => screen.orientation?.lock?.('landscape'))
    .catch(() => {}); // not allowed here (e.g. iPhone Safari): play in the window
}

addEventListener('pointerdown', e => { if (e.pointerType === 'touch') enter(); }, { capture: true });
on('keyPressed', code => {
  if (code !== 'KeyF' || document.activeElement?.tagName === 'TEXTAREA') return;
  if (document.fullscreenElement) document.exitFullscreen(); else enter();
});
