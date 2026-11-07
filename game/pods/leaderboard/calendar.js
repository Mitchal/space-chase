// The calendar of past boards (his ask, 2026-11-07: "a global calendar that everybody can click and see who was the
// top 5, on any given day"). Opens from the menu's board, your medal count and trophy news; tap a day for its top
// five in each challenge. Months that have closed are fetched once per visit; the current one every time it opens.
import { on } from '../../core/events.js';
import { modeList, formatScore } from '../../core/game-modes.js';
import { fetchMonth } from './leaderboard-api.js';
import { today, loadName } from './player-record.js';
import { trophies, markSeen } from './trophy-record.js';
import { calendarHtml } from './calendar-view.js';

const FIRST_MONTH = '2026-11'; // the board went online in November 2026
document.body.insertAdjacentHTML('beforeend', `<div id="lbCal" class="overlay" style="z-index:3">
  <div class="card menu" id="lbCalCard" role="dialog" aria-label="Calendar of past leaderboards"></div></div>`);
const $ = id => document.getElementById(id);
const isOpen = () => $('lbCal').classList.contains('show');

const months = new Map(); // month → its answer (null: couldn't be reached)
let month = FIRST_MONTH, selected = null;

const monthOf = day => day.slice(0, 7);
function shift(m, by) {
  const d = new Date(m + '-15T12:00');
  d.setMonth(d.getMonth() + by);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
// The day to show when you turn to a month: today in this month, else its last day.
function dayIn(m) {
  const t = today();
  if (monthOf(t) === m) return t;
  const [y, n] = m.split('-').map(Number);
  return `${m}-${String(new Date(y, n, 0).getDate()).padStart(2, '0')}`;
}

function render() {
  const t = today();
  $('lbCalCard').innerHTML = calendarHtml({
    month, selected, today: t, data: months.get(month), you: loadName(), trophies: trophies(),
    modes: modeList().map(m => ({ id: m.id, label: m.label, color: m.color, fmt: n => formatScore(n, m) })),
    canPrev: month > FIRST_MONTH, canNext: month < monthOf(t),
  });
}

async function load(m) {
  if (months.get(m)) return; // a closed month, as fetched (turnTo forgets the current one)
  const answer = await fetchMonth(m);
  months.set(m, answer?.days ? answer : null);
  if (isOpen() && month === m) render();
}

function turnTo(m, day = dayIn(m)) {
  month = m < FIRST_MONTH ? FIRST_MONTH : m;
  selected = monthOf(day) === month ? day : dayIn(month);
  if (monthOf(today()) === month) months.delete(month); // today's board moves: fetch it again
  render();
  load(month);
}

export function openCalendar(day = today()) {
  markSeen();
  $('lbCal').classList.add('show');
  turnTo(monthOf(day), day);
}
const close = () => $('lbCal').classList.remove('show');

export function wireCalendar() {
  document.addEventListener('click', e => {
    const opener = e.target.closest?.('[data-lb-cal]');
    if (opener) { e.preventDefault(); return openCalendar(opener.dataset.lbCal || undefined); }
    if (!isOpen()) return;
    if (e.target === $('lbCal') || e.target.closest('[data-cal-close]')) return close();
    const dayButton = e.target.closest('[data-cal-day]');
    if (dayButton) {
      const day = dayButton.dataset.calDay;
      if (monthOf(day) !== month) return turnTo(monthOf(day), day);
      selected = day;
      return render();
    }
    if (e.target.closest('[data-cal-prev]')) turnTo(shift(month, -1));
    if (e.target.closest('[data-cal-next]')) turnTo(shift(month, 1));
  });
  // While it's open, Space and Enter belong to its buttons, not to "play" behind it.
  addEventListener('keydown', e => { if (isOpen() && (e.code === 'Space' || e.code === 'Enter')) e.stopPropagation(); }, { capture: true });
  on('back', e => { if (!e.handled && isOpen()) { e.handled = true; close(); } });
  on('runStart', close);
}
