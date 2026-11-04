// Sets up the daily reminder. In the Android app: a local notification at the same time every day (the Capacitor
// LocalNotifications plugin; no server). On the web a page can't wake itself up daily without a push server, so it
// hands you a calendar event that repeats daily with an alert (.ics: works with Google, Apple and Outlook calendars).
import { GAME_URL } from '../../core/game-url.js';

const LN = window.Capacitor?.isNativePlatform?.() ? window.Capacitor.Plugins?.LocalNotifications : null;
export const inApp = !!LN;
const ID = 1701; // the one notification this app schedules
const TITLE = 'Space Chase', BODY = "Today's course is up. Can you get out alive?";

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

const pad = n => String(n).padStart(2, '0');
const icsStamp = d => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

// A daily event starting today at hour:minute local time ("floating" time: it stays at that clock time wherever you are).
export function calendarEvent(hour, minute, now = new Date()) {
  const day = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Space Chase//Daily reminder//EN', 'BEGIN:VEVENT',
    `UID:daily-${now.getTime()}@spacechase.mikaelbrandt.com`, `DTSTAMP:${icsStamp(now)}`,
    `DTSTART:${day}T${pad(hour)}${pad(minute)}00`, 'DURATION:PT15M', 'RRULE:FREQ=DAILY',
    `SUMMARY:${TITLE}: today's course`, `DESCRIPTION:${BODY} ${GAME_URL}`, `URL:${GAME_URL}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${TITLE}`, 'TRIGGER:PT0M', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR', '',
  ].join('\r\n');
}

// Hands the event to the browser, which offers to add it to your calendar (or saves the file to open).
export function addToCalendar(hour, minute) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([calendarEvent(hour, minute)], { type: 'text/calendar' }));
  a.download = 'space-chase-reminder.ics';
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}
