// How the profile screen looks: your email, the name everyone sees on the board (change it here), your trophies as days
// to jump to on the calendar, and log out / delete account. Logged out, it's the login box instead (profile.js).
import { esc } from './board-view.js';
import { NAME_MAX } from './player-record.js';
import { MEDALS, shortDay, modeLabel, medalCounts } from './trophy-view.js';

document.head.insertAdjacentHTML('beforeend', `<style>
.pf{text-align:left}
.pf h2{text-align:center;margin:0 0 10px}
.pf-field{margin-top:12px}
.pf-label{color:var(--ghost);font-weight:800;letter-spacing:.1em;font-size:11px;margin-bottom:3px}
.pf-email{overflow-wrap:anywhere}
.pf-note{color:var(--accent);font-size:12px;margin-top:6px}
.pf-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}
.pf-chips .chip{font-size:12px;padding:3px 9px}
.pf-confirm{margin-top:14px;padding:10px 12px;border:1px solid var(--warn);border-radius:10px}
.pf .row.center{margin-top:16px}
button.pf-danger{color:var(--warn);border-color:var(--warn)}
.pf-close{display:block;margin:14px auto 0}
</style>`);

const problemHtml = p => p ? `<div class="lb-problem">${esc(p)}</div>` : '';
export const noteHtml = n => n ? `<div class="pf-note">${esc(n)}</div>` : '';
const close = '<button class="ghost pf-close" data-pf-close>Close</button>';

function trophyList(list) {
  if (!list.length) return '<div class="dim small">None yet: finish a day in the top three of a daily challenge.</div>';
  const chips = list.slice(0, 12).map(t => `<button class="chip" data-lb-cal="${esc(t.day)}">${MEDALS[t.place - 1]} ${esc(shortDay(t.day))} ${esc(modeLabel(t.mode))}</button>`);
  return `<div>${medalCounts(list)}</div><div class="pf-chips">${chips.join('')}${list.length > 12 ? '<span class="dim">…</span>' : ''}</div>`;
}

const deleteBox = `<div class="pf-confirm"><b>Delete your account?</b>
  <div class="small" style="margin-top:4px">Your email, your name and your scores go for good, and you're logged out everywhere.
  Past days' top fives keep the place you won, shown as "deleted player", so nobody else's place changes.</div>
  <div class="row center"><button class="ghost pf-danger" data-pf-delete-yes>Delete for good</button>
  <button class="ghost" data-pf-delete-no>Keep it</button></div></div>`;

// Logged out: a heading and an empty box for the login (profile.js mounts it, with any note such as "Logged out.").
export const loggedOutHtml = () => `<div class="pf"><h2>Your profile</h2><div data-pf-login></div>${close}</div>`;

// account: {email, name}; trophies: newest first; problem / note: a line under the name; confirming: the delete box.
export function profileHtml({ account, trophies, problem = '', note = '', confirming = false }) {
  return `<div class="pf"><h2>Your profile</h2>
    <div class="pf-field"><div class="pf-label">EMAIL</div><div class="pf-email">${esc(account.email)}</div>
      <div class="dim small">Only used to send your login codes. Nobody else sees it.</div></div>
    <div class="pf-field"><div class="pf-label">NAME ON THE BOARD</div>
      <form class="lb-form" data-pf-name><input name="v" maxlength="${NAME_MAX}" value="${esc(account.name ?? '')}"
        autocomplete="nickname" aria-label="Your name on the board" enterkeyhint="done"><button class="main" type="submit">Save</button></form>
      ${problemHtml(problem)}${noteHtml(note)}</div>
    <div class="pf-field"><div class="pf-label">TROPHIES</div>${trophyList(trophies)}</div>
    ${confirming ? deleteBox : `<div class="row center"><button class="ghost" data-pf-logout>Log out</button>
      <button class="ghost pf-danger" data-pf-delete>Delete account</button></div>`}
    ${close}</div>`;
}
