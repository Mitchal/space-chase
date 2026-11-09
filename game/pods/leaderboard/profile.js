// The profile screen: opens from every [data-lb-profile] (the menu board's 👤, "profile" under the results). Logged
// out, it's the login box; logging in from here also sends today's bests. Logged in: your email, your name on the
// board, your trophies, log out and delete account.
import { on } from '../../core/events.js';
import { today } from './player-record.js';
import { account } from './session-record.js';
import { fetchMe, saveName, logOut, deleteAccount } from './account-api.js';
import { mountLogin, NAME_REFUSED } from './login-form.js';
import { postBests } from './post-bests.js';
import { trophies, refreshTrophies } from './trophy-record.js';
import { profileHtml, loggedOutHtml, noteHtml } from './profile-view.js';

const UNREACHABLE = "Can't reach the board right now. Try again in a moment.";
document.body.insertAdjacentHTML('beforeend', `<div id="lbProfile" class="overlay" style="z-index:3">
  <div class="card menu" id="lbProfileCard" role="dialog" aria-label="Your profile"></div></div>`);
const $ = id => document.getElementById(id);
const isOpen = () => $('lbProfile').classList.contains('show');

let view = {}; // {problem, note, confirming}: what the screen says besides the account itself

function render(next = {}) {
  view = next;
  const me = account();
  if (!me?.name) { // logged out, or a new account still to pick its name: the login box picks up from there
    $('lbProfileCard').innerHTML = loggedOutHtml();
    mountLogin($('lbProfileCard').querySelector('[data-pf-login]'), {
      intro: `${noteHtml(view.note)}Log in to post your daily scores and keep your trophies on any device. Playing never needs it.`,
      onDone: loggedIn,
    });
    return;
  }
  $('lbProfileCard').innerHTML = profileHtml({ account: me, trophies: trophies(), ...view });
  $('lbProfileCard').querySelector('[data-pf-name]').onsubmit = e => { e.preventDefault(); rename(e.target); };
}

async function loggedIn() {
  render({ note: 'Logged in.' });
  await postBests(today());
  refresh();
}

// Brings the account and trophies up to date, then redraws (if still open, and you aren't typing in it).
async function refresh() {
  if (account()) await fetchMe();
  await refreshTrophies({ fresh: true });
  if (isOpen() && !$('lbProfileCard').contains(document.activeElement)) render(view);
}

async function rename(form) {
  const name = form.v.value.trim();
  if (!name || name === account()?.name) return;
  form.querySelector('button').disabled = true;
  const answer = await saveName(name);
  render(answer?.account ? { note: 'Saved. The boards show your new name.' }
    : answer?.error === 'name' ? { problem: NAME_REFUSED } : answer?.error === 'login' ? {} : { problem: UNREACHABLE });
}

async function remove() {
  const answer = await deleteAccount();
  render(answer?.ok ? { note: 'Your account is deleted.' } : answer?.error === 'login' ? {} : { problem: UNREACHABLE, confirming: true });
}

export function openProfile() {
  $('lbProfile').classList.add('show');
  render();
  refresh();
}
const close = () => $('lbProfile').classList.remove('show');

export function wireProfile() {
  document.addEventListener('click', e => {
    if (e.target.closest?.('[data-lb-profile]')) { e.preventDefault(); return openProfile(); }
    if (!isOpen()) return;
    if (e.target === $('lbProfile') || e.target.closest('[data-pf-close]') || e.target.closest('[data-lb-cal]')) return close();
    if (e.target.closest('[data-pf-logout]')) return logOut().then(() => render({ note: 'Logged out.' }));
    if (e.target.closest('[data-pf-delete]')) return render({ confirming: true });
    if (e.target.closest('[data-pf-delete-no]')) return render();
    if (e.target.closest('[data-pf-delete-yes]')) return remove();
  });
  // While it's open, Space and Enter belong to its buttons and boxes, not to "play" behind it.
  addEventListener('keydown', e => { if (isOpen() && (e.code === 'Space' || e.code === 'Enter')) e.stopPropagation(); }, { capture: true });
  on('back', e => { if (!e.handled && isOpen()) { e.handled = true; close(); } });
  on('runStart', close);
}
