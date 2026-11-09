// The board under the results card after a daily run. Logged in, the run's day-best is sent and the board that comes
// back shows your place. Logged out (playing never needs a login), the board is only looked at, with "Log in to post
// your score": email → code → (a new account) a name, then today's bests go up. A login that has run out is asked for
// again, quietly. Nothing shows until the Worker answers, and nothing at all if it doesn't.
import { content } from '../../core/registry.js';
import { modeById, formatScore } from '../../core/game-modes.js';
import { postScore, fetchTop } from './leaderboard-api.js';
import { account, onSessionChange } from './session-record.js';
import { resultCard, esc, isYou } from './board-view.js';
import { mountLogin } from './login-form.js';
import { postBests } from './post-bests.js';
import { trophies } from './trophy-record.js';
import { medalCounts } from './trophy-view.js';

let pending = null, panel = null, shown = null;

// At the end of a run: best is today's best in that challenge, which the board keeps if it's your highest.
export function boardAfterRun(mode, day, best) {
  const ask = account()?.name ? postScore({ mode, day, score: best }) : Promise.resolve(null);
  pending = ask.then(async posted => {
    if (posted?.top) return { ...posted, mode, day };
    const top = await fetchTop(mode, day);
    return top && { ...top, mode, day, expired: posted?.error === 'login' };
  });
}
export const forgetRun = () => { pending = null; shown = null; };

const whoHtml = (me, medals) => `<span class="dim small">on the board as <b>${esc(me.name)}</b> ·
  <a href="#" data-lb-profile>profile</a></span>${medals ? ` <span class="small">${medals}</span>` : ''}`;

const loginButton = expired => `${expired ? '<div class="small dim">Your login ran out.</div>' : ''}
  <button class="ghost" data-lb-login>${expired ? 'Log in again to post your score' : 'Log in to post your score'}</button>`;

// board: {mode, day, players, top, rank?, best?}; expired: the Worker didn't take the saved login.
function show(el, board) {
  if (panel !== el) return; // a newer run's results took over
  shown = board;
  const def = modeById(board.mode), me = account();
  const mode = { label: def?.label ?? board.mode, color: def?.color ?? 'var(--ghost)', fmt: n => formatScore(n, def) };
  // A new account that hasn't picked a name yet goes straight back to that step.
  const foot = me?.name ? whoHtml(me, medalCounts(trophies())) : me ? '' : loginButton(board.expired);
  const top = board.top.map(r => isYou(r, me) ? { ...r, name: me.name } : r); // renamed since: your new name
  el.innerHTML = resultCard(mode, { ...board, top }, me, foot);
  const footEl = el.querySelector('.lb-foot'), open = footEl.querySelector('[data-lb-login]');
  const login = focus => mountLogin(footEl, { focus, onDone: () => join(el, board) });
  if (open) open.onclick = () => login(true);
  else if (me && !me.name) login(false);
}

// Logged in: today's best of every challenge played so far goes up, then this one's board shows again with your place.
async function join(el, board) {
  const sent = await postBests(board.day);
  const mine = sent.find(r => r?.mode === board.mode && r.top);
  show(el, mine ? { ...mine, mode: board.mode, day: board.day } : { ...board, expired: sent.some(r => r?.error === 'login') });
}

export function wireResultsBoard() {
  content.resultPanels.push(el => {
    panel = el;
    shown = null;
    pending?.then(board => { if (board) show(el, board); });
  });
  // Logged out or renamed from the profile while the results are up: redraw the foot (and which row is yours).
  onSessionChange(() => { if (panel && shown && panel.isConnected) show(panel, shown); });
}
