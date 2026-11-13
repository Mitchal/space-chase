// The daily reminder on the web (game/pods/daily-reminder/web-push.js):
//   GET  /reminder/key  → {key}: the public key a browser subscribes to pushes with; null while reminders are off.
//   POST /reminder      {endpoint, hour, minute, timeZone}  → {nextAt}: remind this browser every day at that time.
//                       Setting it again changes the time. 503 {error: 'off'} while the keys aren't set (README).
//   POST /reminder/off  {endpoint}  → {ok}: stop.
// Only addresses at the big browsers' push services are taken, so this can't be used to make the Worker call anywhere else.
import { json } from './json-response.js';
import { cleanTimeZone, nextReminderAt } from './reminder-time.js';

const PUSH_HOSTS = /^(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)$/;
const MAX_BODY = 2000;

export function cleanEndpoint(value) {
  if (typeof value !== 'string' || value.length > 1000) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && PUSH_HOSTS.test(url.hostname) ? url.href : null;
  } catch { return null; }
}

const cleanPart = (v, max) => Number.isInteger(v) && v >= 0 && v <= max ? v : null;

async function readBody(request) {
  const text = await request.text();
  if (text.length > MAX_BODY) return null;
  try { return JSON.parse(text); } catch { return null; }
}

export const getKey = (request, env, cors) => json({ key: env.VAPID_PRIVATE_KEY && env.VAPID_PUBLIC_KEY || null }, 200, cors);

export async function postReminder(request, env, cors) {
  if (!env.VAPID_PRIVATE_KEY || !env.VAPID_PUBLIC_KEY) return json({ error: 'off' }, 503, cors);
  const body = await readBody(request);
  const endpoint = cleanEndpoint(body?.endpoint), hour = cleanPart(body?.hour, 23), minute = cleanPart(body?.minute, 59);
  const timeZone = cleanTimeZone(body?.timeZone) ?? 'UTC';
  if (!endpoint || hour === null || minute === null) return json({ error: 'bad endpoint or time' }, 400, cors);
  const now = Date.now(), nextAt = nextReminderAt({ hour, minute, timeZone }, now);
  await env.DB.prepare(`INSERT INTO reminders (endpoint, hour, minute, time_zone, next_at, fails, updated_at)
    VALUES (?1, ?2, ?3, ?4, ?5, 0, ?6)
    ON CONFLICT (endpoint) DO UPDATE SET hour = ?2, minute = ?3, time_zone = ?4, next_at = ?5, fails = 0, updated_at = ?6`)
    .bind(endpoint, hour, minute, timeZone, nextAt, now).run();
  return json({ nextAt }, 200, cors);
}

export async function postReminderOff(request, env, cors) {
  const endpoint = cleanEndpoint((await readBody(request))?.endpoint);
  if (!endpoint) return json({ error: 'bad endpoint' }, 400, cors);
  await env.DB.prepare('DELETE FROM reminders WHERE endpoint = ?1').bind(endpoint).run();
  return json({ ok: true }, 200, cors);
}
