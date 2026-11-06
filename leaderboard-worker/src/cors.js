// Only the game itself may call the board from a browser: the web version, the Android app and local development.
// Requests without an Origin (curl, a quick check from the terminal) are let through; browsers always send one.
const ALLOWED = new Set([
  'https://spacechase.mikaelbrandt.com', // the web version (GitHub Pages, custom domain)
  'https://mitchal.github.io', // the same site before the custom domain kicks in
  'https://localhost', // the Android app (Capacitor serves the game from here)
  'capacitor://localhost', // the same app, should it ever run on iOS
]);
const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/; // the dev server (npm run dev) on any port

export const originAllowed = origin => !origin || ALLOWED.has(origin) || LOCAL.test(origin);

export function corsHeaders(origin) {
  if (!origin || !originAllowed(origin)) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'Origin',
  };
}
