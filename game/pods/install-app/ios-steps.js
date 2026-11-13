// iPhone and iPad have no install prompt: you add a web app from Safari's Share menu. This card shows how, and says
// why it's worth it (full screen, its own icon, and the daily reminder as a notification).
import { on } from '../../core/events.js';

export const iosDevice = /iP(hone|ad|od)/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS says it's a Mac

// Already running as the installed app: from the home screen (standalone, or fullscreen without the Fullscreen API),
// or the Android app.
export const installedView = () => navigator.standalone === true || !!window.Capacitor?.isNativePlatform?.()
  || matchMedia('(display-mode: standalone)').matches
  || (matchMedia('(display-mode: fullscreen)').matches && !document.fullscreenElement);

const SHARE_ICON = '<svg width="16" height="18" viewBox="0 0 16 20" fill="none" stroke="currentColor" stroke-width="1.8" '
  + 'style="vertical-align:-3px"><path d="M8 13V1M4 5l4-4 4 4M5 8H2v11h12V8h-3"/></svg>';

export function wireIosSteps() {
  document.body.insertAdjacentHTML('beforeend', `
<div id="iosSteps" class="overlay" style="z-index:3"><div class="card menu">
  <h2>📲 Add to Home Screen</h2>
  <div class="dim">Space Chase opens full screen from its own icon, like an app, and can send you the daily reminder.</div>
  <ol style="text-align:left;margin:14px 0 0;padding-left:22px;line-height:1.9">
    <li>In Safari, tap Share ${SHARE_ICON}</li>
    <li>Scroll down and tap <b>Add to Home Screen</b></li>
    <li>Open Space Chase from your Home Screen</li>
  </ol>
  <div class="row center"><button class="main" id="iosOk">Got it</button></div>
</div></div>`);
  const card = document.getElementById('iosSteps');
  document.getElementById('iosOk').onclick = () => card.classList.remove('show');
  on('back', e => { if (!e.handled && card.classList.contains('show')) { e.handled = true; card.classList.remove('show'); } });
}

export const showIosSteps = () => document.getElementById('iosSteps').classList.add('show');
