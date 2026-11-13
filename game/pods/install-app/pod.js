// Offers to put Space Chase on your home screen as an app (his ask, 2026-11-13: "make it easier to install this to
// your home screen and make it look like an app"). Where the browser can install it (Chrome, Edge, Samsung Internet),
// the menu's link opens the browser's own install prompt; on iPhone and iPad, where only Safari's Share menu can, it
// shows how. Once installed it opens full screen from its own icon (manifest.webmanifest), and the link goes away.
// Delete this folder and there's no link (browsers may still offer to install from their own menus).
import { content } from '../../core/registry.js';
import { installedView, iosDevice, showIosSteps, wireIosSteps } from './ios-steps.js';

let prompt = window.installPrompt ?? null; // the browser's install prompt (index.html keeps an early one), until you tap
let installed = installedView();

addEventListener('beforeinstallprompt', e => { e.preventDefault(); prompt = e; refresh(); });
addEventListener('appinstalled', () => { prompt = window.installPrompt = null; installed = true; refresh(); });

function noteHtml() {
  if (installed) return '';
  if (prompt) return '<a href="#" data-install>📲 Install Space Chase as an app</a>';
  if (iosDevice) return '<a href="#" data-install>📲 Add Space Chase to your Home Screen</a>';
  return '';
}

// The install prompt can turn up after the menu is drawn, so the note keeps a place to fill in.
const note = () => { const html = noteHtml(); return html && `<p class="dim small" style="margin:8px 0 0">${html}</p>`; };
content.titleNotes.push(() => `<div data-install-note>${note()}</div>`);
function refresh() { for (const el of document.querySelectorAll('[data-install-note]')) el.innerHTML = note(); }

async function install() {
  if (!prompt) return showIosSteps();
  const asked = prompt;
  prompt = window.installPrompt = null;
  await asked.prompt();
  const { outcome } = await asked.userChoice;
  if (outcome === 'accepted') installed = true;
  refresh();
}

wireIosSteps();
document.addEventListener('click', e => { if (e.target.closest?.('[data-install]')) { e.preventDefault(); install(); } });
