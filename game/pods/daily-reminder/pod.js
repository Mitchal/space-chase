// Asks once, after your fifth run, whether you'd like a daily reminder for the new course (his ask, 2026-11-04: "an ask
// for a daily reminder after one has played five runs"). In the app it's a phone notification at the time you pick;
// on the web, a daily calendar event (see reminder-schedule.js). The main menu keeps a small link to set or change it.
// Delete this folder and nobody is asked.
import { world } from '../../core/world.js';
import { on } from '../../core/events.js';
import { content } from '../../core/registry.js';
import { ASK_AFTER_RUNS, loadReminder, saveReminder, clock, suggestedTime } from './reminder-state.js';
import { inApp, scheduleInApp, cancelInApp, addToCalendar } from './reminder-schedule.js';

document.body.insertAdjacentHTML('beforeend', `
<div id="remind" class="overlay" style="z-index:3"><div class="card menu">
  <h2>🔔 Daily reminder?</h2>
  <div class="dim">There's a new course every day. Want a nudge when it's up?${inApp ? '' : '<br>It goes in your calendar as a daily event with an alert.'}</div>
  <div style="margin-top:12px">Every day at <input type="time" id="rTime" required
    style="color-scheme:dark;background:#0e1118;color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:5px 8px;font:inherit"></div>
  <div class="row center"><button class="main" id="rYes">${inApp ? 'Remind me' : 'Add to my calendar'}</button>
    <button class="ghost" id="rNo">Not now</button><button class="ghost" id="rOff" hidden>Turn off</button></div>
  <p id="rMsg" class="small" hidden></p>
</div></div>`);
const $ = id => document.getElementById(id);
const isOpen = () => $('remind').classList.contains('show');

function open() {
  const r = loadReminder();
  saveReminder({ asked: true });
  $('rTime').value = r.hour !== null ? clock(r.hour, r.minute) : suggestedTime();
  $('rOff').hidden = r.kind !== 'app';
  $('rYes').hidden = false; $('rNo').textContent = 'Not now'; $('rMsg').hidden = true;
  $('remind').classList.add('show');
  $('rYes').focus();
}
const close = () => $('remind').classList.remove('show');
const say = text => { $('rMsg').textContent = text; $('rMsg').hidden = false; };

$('rYes').onclick = async () => {
  const [hour, minute] = ($('rTime').value || suggestedTime()).split(':').map(Number);
  if (!inApp) {
    addToCalendar(hour, minute);
    saveReminder({ kind: 'calendar', hour, minute });
    say('If your calendar didn\'t open, open the downloaded file to add the reminder.');
    $('rYes').hidden = true; $('rNo').textContent = 'Done';
    return;
  }
  let how = 'failed';
  try { how = await scheduleInApp(hour, minute); } catch {}
  if (how === 'on') { saveReminder({ kind: 'app', hour, minute }); say(`Done: every day at ${clock(hour, minute)}.`); setTimeout(close, 1200); }
  else if (how === 'denied') say('Notifications are off for Space Chase. You can turn them on in Android\'s settings.');
  else say('Couldn\'t set the reminder. Try again later.');
};
$('rNo').onclick = close;
$('rOff').onclick = async () => { await cancelInApp(); saveReminder({ kind: null }); close(); };

// Count your runs; after the fifth, ask once, a moment after the results show (unless you've already flown again).
on('runEnd', () => { if (!world.botPolicy) saveReminder({ runs: loadReminder().runs + 1 }); });
on('runSettled', () => {
  const r = loadReminder();
  if (world.botPolicy || r.asked || r.kind || r.runs < ASK_AFTER_RUNS) return;
  setTimeout(() => { if (world.run?.over) open(); }, 700);
});

// The menu's link: set a reminder, or see and change the one in the app.
content.titleNotes.push(() => {
  const r = loadReminder();
  if (r.runs < ASK_AFTER_RUNS || r.kind === 'calendar') return '';
  const text = r.kind === 'app' ? `🔔 Reminder every day at ${clock(r.hour, r.minute)} · <a href="#" data-remind>change</a>`
    : '<a href="#" data-remind>🔔 Get a daily reminder</a>';
  return `<p class="dim small" style="margin:8px 0 0">${text}</p>`;
});
document.addEventListener('click', e => { if (e.target.closest?.('[data-remind]')) { e.preventDefault(); open(); } });

// While the ask is open, Space and Enter belong to its buttons, not to "fly again" behind it.
addEventListener('keydown', e => { if (isOpen() && (e.code === 'Space' || e.code === 'Enter')) e.stopPropagation(); }, { capture: true });
on('back', e => { if (!e.handled && isOpen()) { e.handled = true; close(); } });
