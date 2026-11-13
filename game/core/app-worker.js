// The game's service worker (sw.js at the site's root): tools/build-web.js builds it for the web version, so the game
// runs offline and installs as an app; the dev server (serve.js) makes a bare one. Pods may add to it with their own
// service-worker.js (e.g. showing a push notification), which both of those load in.
// Not in the Android app: it already has every file, and the app has its own notifications.

export const workerAvailable = 'serviceWorker' in navigator && location.protocol.startsWith('http')
  && !window.Capacitor?.isNativePlatform?.();

// Resolves to the active registration, or null where there's no service worker.
export function appWorker() {
  if (!workerAvailable) return Promise.resolve(null);
  return navigator.serviceWorker.register('sw.js').then(() => navigator.serviceWorker.ready).catch(() => null);
}
