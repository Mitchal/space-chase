// How the board looks: a compact card of today's top three per challenge on the main menu, and the challenge you just
// played on the results screen (top five, your place, your row lit up). Names are other people's typing: escaped.
document.head.insertAdjacentHTML('beforeend', `<style>
.lb{margin:12px 0 2px;padding:10px 14px;border:1px solid var(--line);border-radius:10px;background:#10141f;text-align:left}
.lb-head{display:flex;justify-content:space-between;gap:8px;color:var(--ghost);font-weight:800;letter-spacing:.1em;font-size:11px;margin-bottom:4px}
.lb-head .dim{font-weight:400;letter-spacing:0;white-space:nowrap}
.lb-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:6px 14px} /* side by side at 375px */
.lb-mode{font-weight:800;letter-spacing:.1em;font-size:11px;margin-top:2px}
.lb-row{display:flex;gap:6px;font-size:13px;line-height:1.55}
.lb-rank{min-width:1.3em;text-align:right;color:var(--dim)}
.lb-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lb-score{font-weight:700;font-variant-numeric:tabular-nums}
.lb-row.you .lb-name{color:var(--accent);font-weight:700}
.lb-more{text-align:center;color:var(--dim);line-height:1}
.lb-empty{font-size:13px;color:var(--dim)}
.lb-form{display:flex;gap:6px;margin-top:8px}
.lb-form input{flex:1;min-width:0;background:#0e1118;color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:7px 10px;
  font:inherit;-webkit-user-select:text;user-select:text}
.lb-form button{padding:7px 14px}
.lb-foot{margin-top:6px}
.lb-problem{color:var(--warn);font-size:12px;margin-top:6px}
@media (max-height:480px){.lb{margin:6px 0 0;padding:6px 12px}.lb-row{line-height:1.4}}
/* Short and narrow, the results board sits under the score: only the top three (and you). Short and wide, it sits
   beside the score (results-screen) with room for all five. */
@media (max-height:480px) and (max-width:559px){.lb-extra{display:none}}
/* A phone on its side has no room for the menu's board under the challenges: one line of today's leaders instead. */
.lb-line{display:none;gap:14px;align-items:baseline;margin-top:6px;font-size:12px;text-align:left}
.lb-leader{flex:1;min-width:0;display:flex;gap:5px;align-items:baseline}
.lb-leader b{font-size:11px;letter-spacing:.1em}
@media (max-height:480px){.lb-full{display:none}.lb-line{display:flex}}
</style>`);

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = s => String(s).replace(/[&<>"']/g, c => ENTITIES[c]);
const same = (a, b) => !!a && !!b && a.toLocaleLowerCase('en') === b.toLocaleLowerCase('en');
const ordinal = n => `#${n}`;

// top: [{name, score}] best first. You beyond the shown rows: a gap, then your row.
function rows(top, { fmt, you, limit, rank = null, best = null }) {
  const shown = top.slice(0, limit).map((r, i) => row(i + 1, r.name, fmt(r.score), same(r.name, you), i >= 3));
  if (rank > limit && best !== null) shown.push('<div class="lb-more">⋯</div>', row(rank, you, fmt(best), true));
  return shown.join('');
}
// extra: a row past the top three, left out on short, narrow screens unless it's yours.
const row = (rank, name, score, you, extra = false) => `<div class="lb-row${you ? ' you' : extra ? ' lb-extra' : ''}"><span class="lb-rank">${rank}</span>
  <span class="lb-name" title="${esc(name)}">${esc(name)}</span><span class="lb-score">${esc(score)}</span></div>`;

// columns: [{ mode: {label, color, fmt}, board: {players, top} | null }] in menu order. '' when the board can't be reached.
export function menuCard(columns, you) {
  if (!columns.some(c => c.board)) return '';
  const cols = columns.map(({ mode, board }) => `<div>
    <div class="lb-mode" style="color:${mode.color}">${esc(mode.label.toUpperCase())}</div>
    ${!board ? '<div class="lb-empty">–</div>' : board.top.length ? rows(board.top, { fmt: mode.fmt, you, limit: 3 })
      : '<div class="lb-empty">nobody yet today</div>'}</div>`).join('');
  return `<div class="lb lb-full"><div class="lb-head">TODAY'S LEADERBOARD</div><div class="lb-cols">${cols}</div></div>
    <div class="lb-line" title="Today's leaderboard"><span aria-hidden="true">🏆</span>${columns.map(leaderLine).join('')}</div>`;
}

// One challenge's leader for the short-screen line: "ESCAPE Anna 7,300".
function leaderLine({ mode, board }) {
  const top = board?.top[0], who = top ? `<span class="lb-name">${esc(top.name)}</span><span class="lb-score">${esc(mode.fmt(top.score))}</span>`
    : `<span class="lb-empty">${board ? 'nobody yet' : '–'}</span>`;
  return `<span class="lb-leader"><b style="color:${mode.color}">${esc(mode.label.toUpperCase())}</b>${who}</span>`;
}

// board: {players, top, rank?, best?} for the challenge just played; foot: HTML under it (the name form, or who you are).
export function resultCard(mode, board, you, foot) {
  const place = board.rank ? `<span class="dim">${ordinal(board.rank)} of ${board.players}</span>` : '';
  const list = board.top.length ? rows(board.top, { fmt: mode.fmt, you, limit: 5, rank: board.rank, best: board.best })
    : '<div class="lb-empty">nobody on the board yet today</div>';
  return `<div class="lb"><div class="lb-head"><span style="color:${mode.color}">TODAY'S LEADERBOARD · ${esc(mode.label.toUpperCase())}</span>
    ${place}</div>${list}<div class="lb-foot">${foot}</div></div>`;
}
