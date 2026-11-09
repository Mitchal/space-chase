// The board under the results card after a daily run. With a name, the run's day-best is sent and the board that comes
// back shows your place; without one yet, the board is only looked at, with a box to pick a name and join. Nothing
// shows until the Worker answers, and nothing at all if it doesn't. A name the Worker refuses (a rude one) is taken
// back, and the box asks for another.
import { content } from '../../core/registry.js';
import { modeById, formatScore } from '../../core/game-modes.js';
import { postScore, fetchTop, nameRefused, needsUpdate } from './leaderboard-api.js';
import { loadName, restoreName, bestsOn } from './player-record.js';
import { resultCard, esc } from './board-view.js';
import { nameFormHtml, whoHtml, wireNameForm } from './name-form.js';
import { trophies } from './trophy-record.js';
import { medalCounts } from './trophy-view.js';

const REFUSED = "That name can't be used on the board. Try another.";
const OUTDATED = 'Update the game to put your scores on the board.';
let pending = null, panel = null;

// At the end of a run: best is today's best in that challenge ({score, simVersion, replay}), which the board keeps if
// it's your highest. Without a replay (a run the board can't check) it's only looked at.
export function boardAfterRun(mode, day, best) {
  const name = loadName();
  const ask = name && best.replay ? postScore({ mode, day, name, ...best }) : fetchTop(mode, day);
  pending = ask.then(async board => {
    if (needsUpdate(board)) { const top = await fetchTop(mode, day); return top && { ...top, mode, day, notice: OUTDATED }; }
    if (!nameRefused(board)) return board && { ...board, mode, day };
    restoreName(null); // a name saved before the Worker refused it: ask for a new one
    const top = await fetchTop(mode, day);
    return top && { ...top, mode, day, retry: { typed: name, problem: REFUSED } };
  });
}
export const forgetRun = () => { pending = null; };

// board.retry: a refused name to show back in the box, with why. board.notice: why your score isn't on it.
function show(el, board) {
  if (panel !== el) return; // a newer run's results took over
  const def = modeById(board.mode), name = loadName(), retry = board.retry;
  const mode = { label: def?.label ?? board.mode, color: def?.color ?? 'var(--ghost)', fmt: n => formatScore(n, def) };
  const foot = retry ? nameFormHtml('Your name', retry.typed, retry.problem)
    : name ? whoHtml(name, medalCounts(trophies())) : nameFormHtml('Your name, to join the board');
  el.innerHTML = resultCard(mode, board, name, (board.notice ? `<div class="lb-problem">${esc(board.notice)}</div>` : '') + foot);
  wireNameForm(el, (newName, was) => join(el, board, newName, was));
}

// A new name sends today's best of every challenge played so far, then shows this one's board again.
// After a rename (was), the old name's rows for today go, so nobody is on the board twice.
async function join(el, board, name, was) {
  const sent = await Promise.all(bestsOn(board.day).map(b => postScore({ ...b, day: board.day, name, was })));
  if (sent.some(nameRefused)) {
    restoreName(was);
    return show(el, { ...board, retry: { typed: name, problem: REFUSED } });
  }
  const mine = sent.find(r => r?.mode === board.mode && !needsUpdate(r));
  const notice = sent.some(needsUpdate) ? OUTDATED : null;
  show(el, mine ? { ...mine, mode: board.mode, day: board.day, notice } : { ...board, retry: null, notice });
}

export function wireResultsBoard() {
  content.resultPanels.push(el => {
    panel = el;
    pending?.then(board => { if (board) show(el, board); });
  });
}
