// Part of the game's service worker (loaded by tools/build-web.js and the dev server; see core/app-worker.js).
// Shows the daily reminder when the server's push arrives (leaderboard-worker/src/reminder-sender.js sends it at the
// time you picked, with nothing in it), and opens the game when you tap it. Delete this folder and it isn't loaded.
// Keep the words in step with reminder-text.js.
self.addEventListener('push', e => {
  e.waitUntil(self.registration.showNotification('Space Chase', {
    body: "Today's course is up. Can you get out alive?",
    icon: 'icons/icon-192.png',
    tag: 'daily-course', // a new one replaces yesterday's if it's still there
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(open => {
    const game = open.find(c => new URL(c.url).pathname.startsWith(new URL(self.registration.scope).pathname));
    return game ? game.focus() : self.clients.openWindow(self.registration.scope);
  }));
});
