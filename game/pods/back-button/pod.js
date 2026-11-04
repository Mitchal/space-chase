// The Android back button (and Escape on a keyboard) means "back": whichever screen is showing handles the 'back'
// event and sets handled; if none does (the main menu), the app closes, as Android users expect.
// Delete this folder and back falls back to the system default (it closes the app at once).
import { on, emit } from '../../core/events.js';

function back() {
  const e = { handled: false };
  emit('back', e);
  if (!e.handled) window.Capacitor?.Plugins?.App?.exitApp();
}

window.Capacitor?.Plugins?.App?.addListener('backButton', back);
on('keyPressed', code => { if (code === 'Escape') back(); });
