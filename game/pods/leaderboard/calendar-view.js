// How the calendar looks: a month of days (Monday first), each marked when anyone played it, with your medal when you
// placed; under it the chosen day's top five per challenge, and your trophies as a list of days to jump to.
// Names are other people's typing: escaped.
import { esc } from './board-view.js';
import { MEDALS, shortDay, modeLabel } from './trophy-view.js';

document.head.insertAdjacentHTML('beforeend', `<style>
.lbc{text-align:left}
.lbc-top{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.lbc-top h2{flex:1;margin:0;text-align:center;font-size:17px}
.lbc-nav{background:#0e1118;border:1px solid var(--line);color:var(--fg);border-radius:8px;width:34px;height:32px;font:inherit;
  font-size:16px;cursor:pointer}
.lbc-nav:disabled{opacity:.3;cursor:default}
.lbc-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}
.lbc-wd{text-align:center;font-size:10px;color:var(--dim);letter-spacing:.1em}
.lbc-cell{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;height:40px;border-radius:7px;
  border:1px solid transparent;background:#10141f;color:var(--fg);font:inherit;font-size:13px;padding:0;cursor:pointer}
.lbc-cell:disabled{background:transparent;color:var(--dim);opacity:.45;cursor:default}
.lbc-cell.today{border-color:var(--line)}
.lbc-cell.sel{border-color:var(--accent);background:#132a24}
.lbc-mark{font-size:12px;line-height:1;height:13px}
.lbc-cell.open .lbc-mark{opacity:.45} /* still being played: where you stand, not a trophy yet */
.lbc-dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--ghost);opacity:.7;vertical-align:middle}
.lbc-dot.you{background:var(--accent);opacity:1}
.lbc-day{margin-top:10px}
.lbc-mine{margin-top:10px;display:flex;flex-wrap:wrap;gap:5px;align-items:center;font-size:12px}
.lbc-mine .chip{font-size:12px;padding:3px 9px}
.lbc-close{display:block;margin:12px auto 0}
@media (max-height:480px){.lbc-top{margin-bottom:4px}.lbc-cell{height:28px;flex-direction:row;gap:4px}.lbc-day{margin-top:6px}}
</style>`);

const pad = n => String(n).padStart(2, '0');
const sameName = (a, b) => !!a && !!b && a.toLocaleLowerCase('en') === b.toLocaleLowerCase('en');
const longDay = day => new Date(day + 'T12:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const monthTitle = month => new Date(month + '-15T12:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
const WEEKDAYS = [...Array(7)].map((_, i) => new Date(2026, 10, 2 + i).toLocaleDateString(undefined, { weekday: 'narrow' }));

// Your best place that day across the challenges (1 to 5), or 0.
function yourPlace(entry, you) {
  if (!entry || !you) return 0;
  const places = Object.values(entry.modes).map(rows => rows.findIndex(r => sameName(r?.name, you)) + 1).filter(Boolean);
  return places.length ? Math.min(...places) : 0;
}

function cell(day, n, { data, selected, today, you }) {
  if (day > today) return `<button class="lbc-cell" disabled>${n}<span class="lbc-mark"></span></button>`;
  const entry = data?.days[day], place = yourPlace(entry, you);
  const mark = place && place <= 3 ? MEDALS[place - 1] : place ? '<span class="lbc-dot you"></span>' : entry ? '<span class="lbc-dot"></span>' : '';
  const cls = ['lbc-cell', day === today && 'today', day === selected && 'sel', entry && !entry.final && 'open'].filter(Boolean).join(' ');
  return `<button class="${cls}" data-cal-day="${day}" aria-label="${esc(longDay(day))}">${n}<span class="lbc-mark">${mark}</span></button>`;
}

function grid(month, ctx) {
  const [y, m] = month.split('-').map(Number), days = new Date(y, m, 0).getDate();
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7; // Monday first
  const cells = [...Array(lead)].map(() => '<span></span>');
  for (let n = 1; n <= days; n++) cells.push(cell(`${month}-${pad(n)}`, n, ctx));
  return `<div class="lbc-grid">${WEEKDAYS.map(w => `<div class="lbc-wd">${esc(w)}</div>`).join('')}${cells.join('')}</div>`;
}

// An open day closes at midnight in Sweden: "midnight" where that's local midnight, else the local time.
function openUntil(closes) {
  const at = new Date(closes);
  if (at <= Date.now()) return 'closing';
  if (!at.getHours() && !at.getMinutes()) return 'open until midnight';
  return `open until ${at.toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}`;
}

const rank = i => i < 3 ? MEDALS[i] : i + 1;
function modeColumn(mode, rows, you) {
  const list = rows?.length ? rows.map((r, i) => `<div class="lb-row${sameName(r.name, you) ? ' you' : ''}"><span class="lb-rank">${rank(i)}</span>
    <span class="lb-name" title="${esc(r.name)}">${esc(r.name)}</span><span class="lb-score">${esc(mode.fmt(r.score))}</span></div>`).join('')
    : '<div class="lb-empty">nobody</div>';
  return `<div><div class="lb-mode" style="color:${mode.color}">${esc(mode.label.toUpperCase())}</div>${list}</div>`;
}

function dayBoard(day, { data, modes, you, today }) {
  if (data === undefined) return '<div class="lbc-day lb-empty">Loading…</div>';
  if (data === null) return '<div class="lbc-day lb-empty">Can\'t reach the board right now.</div>';
  const entry = data.days[day];
  const when = entry && !entry.final ? openUntil(entry.closes) : entry ? 'final' : '';
  const body = entry ? `<div class="lb-cols">${modes.map(m => modeColumn(m, entry.modes[m.id], you)).join('')}</div>`
    : `<div class="lb-empty">${day === today ? 'nobody yet today' : 'nobody played that day'}</div>`;
  return `<div class="lbc-day"><div class="lb-head"><span>${esc(longDay(day).toUpperCase())}</span><span class="dim">${esc(when)}</span></div>${body}</div>`;
}

// Your trophies as days to jump to, newest first.
function mine(list) {
  if (!list.length) return '';
  const chips = list.slice(0, 12).map(t => `<button class="chip" data-cal-day="${esc(t.day)}">${MEDALS[t.place - 1]} ${esc(shortDay(t.day))} ${esc(modeLabel(t.mode))}</button>`);
  return `<div class="lbc-mine"><span class="dim">Your trophies:</span>${chips.join('')}${list.length > 12 ? '<span class="dim">…</span>' : ''}</div>`;
}

// month 'YYYY-MM'; data: that month's answer, undefined while loading, null when it can't be reached; modes: [{id,
// label, color, fmt}]; trophies: yours, newest first.
export function calendarHtml({ month, selected, today, data, modes, you, trophies, canPrev, canNext }) {
  const ctx = { data, selected, today, you, modes };
  return `<div class="lbc">
    <div class="lbc-top"><button class="lbc-nav" data-cal-prev aria-label="Previous month"${canPrev ? '' : ' disabled'}>‹</button>
      <h2>${esc(monthTitle(month))}</h2>
      <button class="lbc-nav" data-cal-next aria-label="Next month"${canNext ? '' : ' disabled'}>›</button></div>
    ${grid(month, ctx)}${dayBoard(selected, ctx)}${mine(trophies)}
    <button class="ghost lbc-close" data-cal-close>Close</button></div>`;
}
