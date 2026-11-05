// The main menu's stats card: each daily challenge's best up front (in its colour), runs and escapes under them, and
// a week of daily bests as small bars, one per challenge side by side in its colour (his ask, 2026-11-05: "two
// different colors of staples in the diagram"). Today's bars are solid; a day you didn't play is a flat line.
import { lastDays } from './stats-record.js';

document.head.insertAdjacentHTML('beforeend', `<style>
.stats{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin:10px 0 2px;padding:10px 14px;
  border:1px solid var(--line);border-radius:10px;background:#10141f;text-align:left}
.stats-bests{display:flex;gap:18px}
.stats-label{font-weight:800;letter-spacing:.1em;font-size:11px}
.stats-num{font-size:22px;font-weight:800;letter-spacing:.03em;line-height:1.15}
.stats-week{display:grid;grid-template-columns:repeat(7,16px);gap:5px;align-items:end;height:46px}
.stats-day{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:3px}
.stats-pair{display:flex;align-items:flex-end;gap:2px;width:100%;height:100%}
.stats-bar{flex:1;border-radius:3px 3px 1px 1px;opacity:.4;min-height:2px}
.stats-bar.today{opacity:1}
.stats-bar.none{background:var(--line)!important;opacity:1}
.stats-dl{font-size:10px;line-height:1;color:var(--dim)}
@media (max-height:480px){.stats{margin:6px 0 0;padding:6px 12px}.stats-num{font-size:18px}.stats-week{height:38px}}
</style>`);

const BAR_MAX = 30; // px: the tallest bar, each challenge's best day of the week
const shortDate = day => new Date(day + 'T12:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

// shown: [{ mode, rec }] for the modes you've played.
function weekBars(shown) {
  const week = lastDays();
  const tops = shown.map(({ rec }) => Math.max(1, ...week.map(d => rec.days[d.day] ?? 0)));
  return week.map((d, i) => {
    const today = i === week.length - 1, label = d.date.toLocaleDateString(undefined, { weekday: 'narrow' });
    const when = d.date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    const tip = [when, ...shown.map(({ mode, rec }) => `${mode.label}: ${rec.days[d.day] == null ? 'not played' : mode.fmt(rec.days[d.day])}`)].join('\n');
    const bars = shown.map(({ mode, rec }, k) => {
      const v = rec.days[d.day], h = v == null ? 2 : Math.max(4, Math.round(v / tops[k] * BAR_MAX));
      return `<div class="stats-bar${v == null ? ' none' : ''}${today ? ' today' : ''}" style="height:${h}px;background:${mode.color}"></div>`;
    }).join('');
    return `<div class="stats-day" title="${tip}"><div class="stats-pair">${bars}</div><div class="stats-dl">${label}</div></div>`;
  }).join('');
}

// modes: [{ id, label, color, fmt(score) }] in menu order.
export function statsCard(s, modes) {
  const shown = modes.map(mode => ({ mode, rec: s.modes[mode.id] })).filter(x => x.rec?.best != null);
  if (!s.runs || !shown.length) return '';
  const bits = [`${s.runs.toLocaleString()} run${s.runs === 1 ? '' : 's'}`];
  if (s.escapes) bits.push(`${s.escapes.toLocaleString()} escape${s.escapes === 1 ? '' : 's'}`);
  const bests = shown.map(({ mode, rec }) => `<div title="set ${shortDate(rec.bestDay)}">
    <div class="stats-label" style="color:${mode.color}">${mode.label.toUpperCase()} BEST</div>
    <div class="stats-num" style="color:${mode.color}">${mode.fmt(rec.best)}</div></div>`).join('');
  return `<div class="stats">
    <div><div class="stats-bests">${bests}</div><div class="dim small">${bits.join(' · ')}</div></div>
    <div class="stats-week" aria-label="Your best each day this week, per challenge">${weekBars(shown)}</div>
  </div>`;
}
