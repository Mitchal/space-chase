// The board under the results card after a daily run. With a name, the run's day-best is sent and the board that comes
// back shows your place; without one yet, the board is only looked at, with a box to pick a name and join. Nothing
// shows until the Worker answers, and nothing at all if it doesn't.
import { content } from '../../core/registry.js';
import { modeById, formatScore } from '../../core/game-modes.js';
import { postScore, fetchTop } from './leaderboard-api.js';
import { loadName, bestsOn } from './player-record.js';
import { resultCard } from './board-view.js';
import { nameFormHtml, whoHtml, wireNameForm } from './name-form.js';

let pending = null, panel = null;

// At the end of a run: best is today's best in that challenge, which the board keeps if it's your highest.
export function boardAfterRun(mode, day, best) {
  const name = loadName();
  const ask = name ? postScore({ mode, day, name, score: best }) : fetchTop(mode, day);
  pending = ask.then(board => board && { ...board, mode, day });
}
export const forgetRun = () => { pending = null; };

function show(el, board) {
  if (panel !== el) return; // a newer run's results took over
  const def = modeById(board.mode), name = loadName();
  const mode = { label: def?.label ?? board.mode, color: def?.color ?? 'var(--ghost)', fmt: n => formatScore(n, def) };
  el.innerHTML = resultCard(mode, board, name, name ? whoHtml(name) : nameFormHtml('Your name, to join the board'));
  wireNameForm(el, (newName, was) => join(el, board, newName, was));
}

// A new name sends today's best of every challenge played so far, then shows this one's board again.
// After a rename (was), the old name's rows for today go, so nobody is on the board twice.
async function join(el, board, name, was) {
  const sent = await Promise.all(bestsOn(board.day).map(b => postScore({ ...b, day: board.day, name, was })));
  const mine = sent.find(r => r?.mode === board.mode);
  show(el, mine ? { ...mine, mode: board.mode, day: board.day } : board);
}

export function wireResultsBoard() {
  content.resultPanels.push(el => {
    panel = el;
    pending?.then(board => { if (board) show(el, board); });
  });
}
