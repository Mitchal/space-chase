// What the reminder says, wherever it comes from: the app's notification or the web's push.
// service-worker.js has its own copy (a service worker can't load modules here), so change both.
export const TITLE = 'Space Chase';
export const BODY = "Today's course is up. Can you get out alive?";
