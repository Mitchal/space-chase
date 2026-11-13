// The daily reminder on the web, as a real notification: the browser asks your permission, subscribes to push, and
// the game's server sends a push at your time every day (leaderboard-worker/src/reminder-sender.js), which
// service-worker.js shows. A web page can't wake itself up daily, so the server does the waking.
// Works in Chrome, Edge and Firefox, and on iPhone once Space Chase is on the Home Screen (iOS 16.4+).
import { SERVER_URL } from '../../core/server-url.js';
import { appWorker, workerAvailable } from '../../core/app-worker.js';

export const pushAvailable = !!SERVER_URL && workerAvailable && 'PushManager' in window && 'Notification' in window;

const fromB64url = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const post = (path, body) => fetch(SERVER_URL + path, { method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body) });

// The server's public key, fetched as the ask opens so the subscribe right after the tap doesn't wait on it.
let keyAsked = null;
export const prepareKey = () => keyAsked ??= fetch(SERVER_URL + '/reminder/key').then(r => r.json()).then(r => r.key)
  .catch(() => { keyAsked = null; return null; });

async function subscription(reg, key) {
  const old = await reg.pushManager.getSubscription();
  if (old) return old;
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: fromB64url(key) });
}

// Call straight from a tap: the permission prompt needs one. Resolves to 'on', 'denied' (you said no, or notifications
// are blocked for the site), 'off' (the server has no push set up) or 'failed'.
export async function schedulePush(hour, minute) {
  if (await Notification.requestPermission() !== 'granted') return 'denied';
  const [reg, key] = await Promise.all([appWorker(), prepareKey()]);
  if (!reg || !key) return 'off';
  const sub = await subscription(reg, key);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const res = await post('/reminder', { endpoint: sub.endpoint, hour, minute, timeZone });
  return res.ok ? 'on' : res.status === 503 ? 'off' : 'failed';
}

export async function cancelPush() {
  try {
    const sub = await (await appWorker())?.pushManager.getSubscription();
    if (!sub) return;
    await post('/reminder/off', { endpoint: sub.endpoint });
    await sub.unsubscribe();
  } catch {}
}
