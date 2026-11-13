// Asks once, after your fifth run, whether you'd like a daily reminder for the new course (his ask, 2026-11-04: "an ask
// for a daily reminder after one has played five runs"). It's a real notification at the time you pick: in the app,
// one the phone schedules; on the web, a push the game's server sends (his ask, 2026-11-13, replacing the calendar
// event it used to hand out). iPhone browsers only allow that from the Home Screen, so there the ask says how.
// The main menu keeps a link to set or change it. Delete this folder and nobody is asked.
import { world } from '../../core/world.js';
import { on } from '../../core/events.js';
import { content } from '../../core/registry.js';
import { ASK_AFTER_RUNS, loadReminder, saveReminder, clock, suggestedTime } from './reminder-state.js';
import { bestWay, notifies, canOffer, prepare, scheduleReminder, cancelReminder } from './reminder-way.js';

document.body.insertAdjacentHTML('beforeend', `
<div id="remind" class="overlay" style="z-index:3"><div class="card menu">
  <h2>🔔 Daily reminder?</h2>
  <div class="dim" id="rWhy"></div>
  <div style="margin-top:12px" id="rWhen">Every day at <input type="time" id="rTime" required
    style="color-scheme:dark;background:#0e1118;color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:5px 8px;font:inherit"></div>
  <div class="row center"><button class="main" id="rYes">Notify me</button>
    <button class="ghost" id="rNo">Not now</button><button class="ghost" id="rOff" hidden>Turn off</button></div>
  <p id="rMsg" class="small" hidden></p>
</div></div>`);
const $ = id => document.getElementById(id);
const isOpen = () => $('remind').classList.contains('show');
const say = text => { $('rMsg').textContent = text; $('rMsg').hidden = !text; };
const WHY = 'There\'s a new course every day. Want a notification when it\'s up?';
const IOS_HOW = 'There\'s a new course every day. To get a notification when it\'s up, put Space Chase on your Home Screen: '
  + 'in Safari, tap Share, then “Add to Home Screen”. Open it from there and turn the reminder on.';
const hasReminder = r => notifies(r.kind) && r.kind === bestWay; // 'calendar' from older versions doesn't count

function open() {
  const r = loadReminder();
  saveReminder({ asked: true });
  prepare();
  $('rWhy').textContent = bestWay ? WHY : IOS_HOW;
  $('rWhen').hidden = $('rYes').hidden = !bestWay;
  $('rNo').textContent = bestWay ? 'Not now' : 'Got it';
  $('rTime').value = r.hour !== null ? clock(r.hour, r.minute) : suggestedTime();
  $('rOff').hidden = !hasReminder(r);
  say('');
  $('remind').classList.add('show');
  (bestWay ? $('rYes') : $('rNo')).focus();
}
const close = () => $('remind').classList.remove('show');

const DENIED = {
  app: 'Notifications are off for Space Chase. You can turn them on in Android\'s settings.',
  push: 'Notifications are blocked for this site. Allow them in your browser\'s site settings, then try again.',
};

$('rYes').onclick = async () => {
  const [hour, minute] = ($('rTime').value || suggestedTime()).split(':').map(Number);
  $('rYes').disabled = true;
  const how = await scheduleReminder(bestWay, hour, minute);
  $('rYes').disabled = false;
  if (how === 'on') { saveReminder({ kind: bestWay, hour, minute }); say(`Done: every day at ${clock(hour, minute)}.`); setTimeout(close, 1200); }
  else if (how === 'denied') say(DENIED[bestWay]);
  else say('Couldn\'t set the reminder. Try again later.');
};
$('rNo').onclick = close;
$('rOff').onclick = async () => { await cancelReminder(loadReminder().kind); saveReminder({ kind: null }); close(); };

// Count your runs; after the fifth, ask once, a moment after the results show (unless you've already flown again).
on('runEnd', () => { if (!world.botPolicy) saveReminder({ runs: loadReminder().runs + 1 }); });
on('runSettled', () => {
  const r = loadReminder();
  if (world.botPolicy || !canOffer || r.asked || hasReminder(r) || r.runs < ASK_AFTER_RUNS) return;
  setTimeout(() => { if (world.run?.over) open(); }, 700);
});

// The menu's link: set a reminder, or see and change the one you have.
content.titleNotes.push(() => {
  const r = loadReminder();
  if (!canOffer || r.runs < ASK_AFTER_RUNS) return '';
  const text = hasReminder(r) ? `🔔 Reminder every day at ${clock(r.hour, r.minute)} · <a href="#" data-remind>change</a>`
    : '<a href="#" data-remind>🔔 Get a daily reminder</a>';
  return `<p class="dim small" style="margin:8px 0 0">${text}</p>`;
});
document.addEventListener('click', e => { if (e.target.closest?.('[data-remind]')) { e.preventDefault(); open(); } });

// While the ask is open, Space and Enter belong to its buttons, not to "fly again" behind it.
addEventListener('keydown', e => { if (isOpen() && (e.code === 'Space' || e.code === 'Enter')) e.stopPropagation(); }, { capture: true });
on('back', e => { if (!e.handled && isOpen()) { e.handled = true; close(); } });
