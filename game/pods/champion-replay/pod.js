// Watch the best (his ask, 2026-11-12): a small button on the main menu plays today's best Survive run, as it was
// flown, with the champion's name and time and a corner of cheering fans (fan-corner.js). The run comes from whichever
// pod knows the day's leader (content.bestRun: the leaderboard) and plays through the game's own simulation
// (core/replay-watch.js). Without a leaderboard, or when the leader's run can't be shown here (recorded before runs
// were kept, or in another version of the game), there's no button. Delete this folder and the menu is as before.
import { on, emit } from '../../core/events.js';
import { content } from '../../core/registry.js';
import { modeById, formatScore } from '../../core/game-modes.js';
import { gameToday } from '../../core/game-day.js';
import { startRun } from '../../core/run.js';
import { watchRun, watching, canWatch, stopWatching } from '../../core/replay-watch.js';
import { openCorner, closeCorner, react, celebrate } from './fan-corner.js';

const MODE = 'survive'; // the challenge whose best run is offered
const FINALE_DELAY_MS = 1600; // the last explosion plays out before the end card

document.head.insertAdjacentHTML('beforeend', `<style>
.cr-watch{display:inline-flex;align-items:center;gap:6px;margin-top:10px;max-width:100%;padding:5px 12px;border-radius:999px;cursor:pointer;
  font:inherit;font-size:13px;color:var(--fg);border:1px solid var(--mode);background:color-mix(in srgb,var(--mode) 10%,#0e1118)}
.cr-watch:hover,.cr-watch:focus-visible{background:color-mix(in srgb,var(--mode) 22%,#0e1118);outline:none}
.cr-watch>span{white-space:nowrap;flex:none}
.cr-watch>.cr-watch-name{flex:0 1 auto;min-width:2em;overflow:hidden;text-overflow:ellipsis;font-weight:700}
.cr-watch b{color:var(--mode);font-variant-numeric:tabular-nums}
.cr-exit{position:fixed;right:calc(10px + var(--safe-right,0px));bottom:calc(10px + var(--safe-bottom,0px));padding:8px 14px;
  border-radius:999px;border:1px solid var(--line);background:rgba(21,25,37,.8);color:var(--fg);font:inherit;cursor:pointer}
@media (max-height:480px){.cr-watch{margin-top:6px;padding:3px 10px}}
</style>`);
document.body.insertAdjacentHTML('beforeend', `<button id="crExit" class="cr-exit" hidden>✕ Exit replay</button>
<div id="crEnd" class="overlay"><div class="card menu">
  <div class="badge">👑 TODAY'S BEST</div>
  <h2 id="crEndName"></h2>
  <div id="crEndScore" class="score-big"></div>
  <p class="dim" id="crEndLine"></p>
  <div class="row center"><button class="main big" id="crPlay">Beat it ▶</button></div>
  <div class="row center"><button class="ghost" id="crAgain">Watch again</button><button class="ghost" id="crMenu">Menu</button></div>
</div></div>`);
const $ = id => document.getElementById(id);

let best = null, showing = null, finaleTimer = 0;
const mode = () => modeById(MODE);

// The menu's button: "👑 Watch Survive #1: Anna · 83.456s ▶" (a long name gets cut short, never the time).
function button() {
  const m = mode();
  if (!m || !canWatch(best)) return '';
  return `<button class="cr-watch" id="crWatch" style="--mode:${m.color}" title="Watch today's best ${m.label} run">
    <span>👑 Watch ${m.label} #1:</span><span class="cr-watch-name"></span><span>· <b>${formatScore(best.score, m)}</b> ▶</span></button>`;
}

function fillButton() {
  const el = document.getElementById('crWatchSlot');
  if (!el) return;
  el.innerHTML = button();
  const b = document.getElementById('crWatch');
  if (!b) return;
  b.querySelector('.cr-watch-name').textContent = best.name; // other people's typing: text, never HTML
  b.onclick = () => watch();
}

async function refresh() {
  if (!content.bestRun || !mode()) return;
  const day = gameToday(), run = await content.bestRun(MODE, day);
  best = run ? { ...run, mode: MODE, day } : null;
  fillButton();
}

function watch() {
  if (!canWatch(best)) return;
  clearTimeout(finaleTimer);
  $('crEnd').classList.remove('show');
  const m = mode();
  showing = best;
  if (!watchRun(best)) { showing = null; return; } // it hides the menu (runStart) and tells the corner (watchStart)
  openCorner({ name: best.name, score: formatScore(best.score, m), color: m?.color });
  $('crExit').hidden = false;
}

function finale() {
  const m = mode();
  $('crEndName').textContent = showing.name;
  $('crEndScore').textContent = formatScore(showing.score, m);
  $('crEndScore').style.color = m?.color || '';
  $('crEndLine').textContent = `The one to beat in ${m?.label ?? 'today\'s challenge'} today.`;
  $('crEnd').classList.add('show');
}

function leave(then) {
  clearTimeout(finaleTimer);
  $('crEnd').classList.remove('show');
  stopWatching();
  then();
}
const toMenu = () => leave(() => emit('showTitle'));

$('crExit').onclick = toMenu;
$('crMenu').onclick = toMenu;
$('crAgain').onclick = () => { stopWatching(); watch(); };
$('crPlay').onclick = () => leave(() => startRun({ mode: MODE, startArena: 0 }));

content.titleNotes.push(() => `<div id="crWatchSlot">${button()}</div>`);
on('ready', refresh);
on('showTitle', () => { fillButton(); refresh(); });
on('watchEnd', () => { showing = null; closeCorner(); $('crExit').hidden = true; });

// The crowd follows the flying.
on('nearMiss', () => { if (watching()) react('OOOH! 😮', true); });
on('kill', ({ cause }) => { if (watching() && cause !== 'player') react('BOOM! 💥', true); });
on('hurt', () => { if (watching()) react('NOOO! 😱', false, true); });
on('runEnd', () => {
  if (!watching() || !showing) return;
  celebrate();
  $('crExit').hidden = true;
  finaleTimer = setTimeout(finale, FINALE_DELAY_MS);
});
on('back', e => { if (!e.handled && watching()) { e.handled = true; toMenu(); } });
