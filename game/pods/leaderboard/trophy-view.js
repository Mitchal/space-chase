// How trophies look: your count of each medal (tap it for the calendar, on your newest trophy's day), and the news of
// ones you haven't seen yet on the main menu ("🥈 Silver in Escape · 6 Nov"). Every [data-lb-cal] opens the calendar
// (calendar.js), on its day if it names one.
import { modeById } from '../../core/game-modes.js';
import { esc } from './board-view.js';

document.head.insertAdjacentHTML('beforeend', `<style>
.lb-medals{white-space:nowrap;text-decoration:none;color:var(--fg);font-weight:700;letter-spacing:0}
.lb-medals span+span{margin-left:6px}
.lb-cal-link{white-space:nowrap;text-decoration:none;letter-spacing:0;font-weight:700}
.lb-news{display:block;margin:2px 0 6px;padding:6px 10px;border-radius:8px;background:#2a2410;border:1px solid #6b5a1e;
  color:#ffe08a;font-size:13px;text-decoration:none}
.lb-news b{color:#fff}
</style>`);

export const MEDALS = ['🥇', '🥈', '🥉'];
const WORDS = ['Gold', 'Silver', 'Bronze'];
export const shortDay = day => new Date(day + 'T12:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
export const modeLabel = id => modeById(id)?.label ?? id;

// list: [{mode, day, place}] newest first. '' with no trophies.
export function medalCounts(list) {
  if (!list.length) return '';
  const counts = [0, 0, 0];
  for (const t of list) counts[t.place - 1]++;
  const shown = counts.map((n, i) => n ? `<span>${MEDALS[i]}${n}</span>` : '').join('');
  return `<a href="#" class="lb-medals" data-lb-cal="${esc(list[0].day)}" title="Your trophies: see which days">${shown}</a>`;
}

// The menu's news: up to two new trophies by name, then how many more.
export function trophyNews(list) {
  if (!list.length) return '';
  const lines = list.slice(0, 2).map(t => `${MEDALS[t.place - 1]} ${WORDS[t.place - 1]} in <b>${esc(modeLabel(t.mode))}</b> · ${esc(shortDay(t.day))}`);
  const more = list.length > 2 ? ` · and ${list.length - 2} more` : '';
  return `<a href="#" class="lb-news" data-lb-cal="${esc(list[0].day)}">New trophy! ${lines.join(' · ')}${more}</a>`;
}
