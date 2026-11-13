// How this device gets its daily reminder: 'app' (a notification the Android app schedules) or 'push' (a web
// notification the server sends). null where neither works; on iPhone and iPad that's until the game is on the
// Home Screen, which the ask then explains.
import { inApp, scheduleInApp, cancelInApp } from './app-notification.js';
import { pushAvailable, schedulePush, cancelPush, prepareKey } from './web-push.js';

export const bestWay = inApp ? 'app' : pushAvailable ? 'push' : null;
export const notifies = way => way === 'app' || way === 'push';

// iPhone and iPad browsers only allow web notifications once the game is on the Home Screen.
export const iosBrowser = /iP(hone|ad|od)/.test(navigator.userAgent) && !navigator.standalone;

// Whether to offer a reminder at all: one can be set here, or (iPhone) we can say how to get one.
export const canOffer = !!bestWay || iosBrowser;

export const prepare = () => { if (bestWay === 'push') prepareKey(); };

// Resolves to 'on', 'denied', 'off' (the server can't send pushes right now) or 'failed'.
export function scheduleReminder(way, hour, minute) {
  return (way === 'app' ? scheduleInApp(hour, minute) : schedulePush(hour, minute)).catch(() => 'failed');
}

export const cancelReminder = way => way === 'app' ? cancelInApp() : way === 'push' ? cancelPush() : Promise.resolve();
