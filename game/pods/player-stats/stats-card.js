// The main menu's stats card: the high score up front, runs and escapes under it, and a week of daily bests as a
// row of small bars (today's bar in the accent colour; a day you didn't fly is a flat line).
import { lastDays } from './stats-record.js';

document.head.insertAdjacentHTML('beforeend', `<style>
.stats{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin:10px 0 2px;padding:10px 14px;
  border:1px solid var(--line);border-radius:10px;background:#10141f;text-align:left}
.stats-label{color:var(--dim);font-weight:800;letter-spacing:.1em;font-size:11px}
.stats-num{font-size:24px;font-weight:800;letter-spacing:.03em;line-height:1.15;color:var(--accent)}
.stats-week{display:grid;grid-template-columns:repeat(7,14px);gap:5px;align-items:end;height:46px}
.stats-day{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:3px}
.stats-bar{width:100%;border-radius:3px 3px 1px 1px;background:var(--accent);opacity:.4;min-height:2px}
.stats-bar.today{opacity:1}
.stats-bar.none{background:var(--line);opacity:1}
.stats-dl{font-size:10px;line-height:1;color:var(--dim)}
@media (max-height:480px){.stats{margin:6px 0 0;padding:6px 12px}.stats-num{font-size:20px}.stats-week{height:38px}}
</style>`);

const BAR_MAX = 30; // px: the tallest bar, the week's best day
const fmt = n => n.toLocaleString();
const shortDate = day => new Date(day + 'T12:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

function weekBars(s) {
  const week = lastDays(s), top = Math.max(1, ...week.map(d => d.best ?? 0));
  return week.map((d, i) => {
    const today = i === week.length - 1, label = d.date.toLocaleDateString(undefined, { weekday: 'narrow' });
    const h = d.best === null ? 2 : Math.max(4, Math.round(d.best / top * BAR_MAX));
    const tip = `${d.date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}: ${d.best === null ? 'not flown' : fmt(d.best)}`;
    return `<div class="stats-day" title="${tip}"><div class="stats-bar${d.best === null ? ' none' : ''}${today ? ' today' : ''}" style="height:${h}px"></div><div class="stats-dl">${label}</div></div>`;
  }).join('');
}

export function statsCard(s) {
  if (!s.runs) return '';
  const bits = [`${fmt(s.runs)} run${s.runs === 1 ? '' : 's'}`];
  if (s.escapes) bits.push(`${fmt(s.escapes)} escape${s.escapes === 1 ? '' : 's'}`);
  return `<div class="stats">
    <div><div class="stats-label">HIGH SCORE</div><div class="stats-num">${fmt(s.best)}</div>
      <div class="dim small">${shortDate(s.bestDay)} · ${bits.join(' · ')}</div></div>
    <div class="stats-week" aria-label="Your best score each day this week">${weekBars(s)}</div>
  </div>`;
}
