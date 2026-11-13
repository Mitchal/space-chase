// Every five minutes (wrangler.toml): sends a push to each browser whose daily reminder is due, then moves it on to
// the same time tomorrow. The push carries no message (nothing to encrypt): the game's service worker knows what to
// say (game/pods/daily-reminder/service-worker.js). A browser whose subscription is gone (404/410: notifications
// turned off, site data cleared) is deleted; one the push service keeps refusing is deleted after MAX_FAILS days.
import { vapidAuth } from './vapid.js';
import { nextReminderAt } from './reminder-time.js';

export const REMINDER_CRON = '*/5 * * * *';
// Cloudflare's free plan allows 50 outgoing requests per run; the rest wait five minutes for the next run.
export const SENDS_PER_RUN = 45;
const MAX_FAILS = 5;
const TTL_S = 4 * 3600; // a phone that's off for longer than this gets no stale reminder when it wakes

async function sendOne(env, endpoint, now) {
  const authorization = await vapidAuth(env, endpoint, now);
  try {
    const res = await fetch(endpoint, { method: 'POST', headers: { authorization, ttl: String(TTL_S), urgency: 'normal',
      topic: 'daily-course', 'content-length': '0' } });
    return res.ok ? 'sent' : res.status === 404 || res.status === 410 ? 'gone' : 'refused';
  } catch { return 'refused'; }
}

// → {sent, gone, refused} counts, or 'off' while the keys aren't set.
export async function sendDueReminders(env, now = Date.now()) {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return 'off';
  const { results } = await env.DB.prepare(`SELECT endpoint, hour, minute, time_zone, fails FROM reminders
    WHERE next_at <= ?1 ORDER BY next_at LIMIT ?2`).bind(now, SENDS_PER_RUN).all();
  const counts = { sent: 0, gone: 0, refused: 0 };
  const writes = await Promise.all(results.map(async r => {
    const outcome = await sendOne(env, r.endpoint, now);
    counts[outcome]++;
    const fails = outcome === 'refused' ? r.fails + 1 : 0;
    if (outcome === 'gone' || fails >= MAX_FAILS) return env.DB.prepare('DELETE FROM reminders WHERE endpoint = ?1').bind(r.endpoint);
    const nextAt = nextReminderAt({ hour: r.hour, minute: r.minute, timeZone: r.time_zone }, now);
    return env.DB.prepare('UPDATE reminders SET next_at = ?1, fails = ?2 WHERE endpoint = ?3').bind(nextAt, fails, r.endpoint);
  }));
  if (writes.length) await env.DB.batch(writes);
  return counts;
}
