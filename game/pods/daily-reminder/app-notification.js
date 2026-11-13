// The daily reminder in the Android app: a local notification at the same time every day (the Capacitor
// LocalNotifications plugin; no server needed).
import { TITLE, BODY } from './reminder-text.js';

const LN = window.Capacitor?.isNativePlatform?.() ? window.Capacitor.Plugins?.LocalNotifications : null;
export const inApp = !!LN;
const ID = 1701; // the one notification this app schedules

// Resolves to 'on', or 'denied' if notifications aren't allowed for the app.
export async function scheduleInApp(hour, minute) {
  let p = await LN.checkPermissions();
  if (p.display !== 'granted') p = await LN.requestPermissions();
  if (p.display !== 'granted') return 'denied';
  await LN.cancel({ notifications: [{ id: ID }] });
  await LN.schedule({ notifications: [{ id: ID, title: TITLE, body: BODY, schedule: { on: { hour, minute }, allowWhileIdle: true } }] });
  return 'on';
}

export async function cancelInApp() {
  try { await LN.cancel({ notifications: [{ id: ID }] }); } catch {}
}
