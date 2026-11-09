// The login box, in three steps: your email → the 6-digit code emailed to it → (a new account) the name everyone sees
// on the board. No passwords. Used under the results (to post your score) and on the profile screen. The game's keys
// ignore typing in it (core/input.js), so Space and Enter don't start a run meanwhile.
import { esc } from './board-view.js';
import { NAME_MAX, oldName } from './player-record.js';
import { account, lastEmail } from './session-record.js';
import { startLogin, verifyCode, saveName } from './account-api.js';

const UNREACHABLE = "Can't reach the board right now. Try again in a moment.";
const START_PROBLEMS = {
  email: "That doesn't look like an email address.",
  'slow down': 'That email has had a lot of codes. Try again in a while.',
  'email off': "Logging in isn't switched on yet.",
};
export const NAME_REFUSED = "That name can't be used on the board. Try another.";

const problemHtml = p => p ? `<div class="lb-problem">${esc(p)}</div>` : '';
const form = (step, input, button) => `<form class="lb-form" data-login="${step}">${input}<button class="main" type="submit">${button}</button></form>`;

function stepHtml({ step, email, problem, intro, typedName }) {
  if (step === 'code') return `<div class="small">We sent a code to <b>${esc(email)}</b>. It works for 10 minutes.</div>
    ${problemHtml(problem)}${form('code', `<input name="v" inputmode="numeric" autocomplete="one-time-code" maxlength="7"
      placeholder="6-digit code" aria-label="The code from the email" enterkeyhint="go">`, 'Log in')}
    <div class="small lb-fine"><a href="#" data-login-resend>Send a new code</a> · <a href="#" data-login-back>Use another email</a></div>`;
  if (step === 'name') return `<div class="small">Pick the name everyone sees on the board (you can change it later).</div>
    ${problemHtml(problem)}${form('name', `<input name="v" maxlength="${NAME_MAX}" value="${esc(typedName ?? oldName())}" autocomplete="nickname"
      placeholder="Your name on the board" aria-label="Your name on the board" enterkeyhint="done">`, 'Save')}`;
  return `${intro ? `<div class="small">${intro}</div>` : ''}${problemHtml(problem)}
    ${form('email', `<input name="v" type="email" inputmode="email" autocomplete="email" value="${esc(email)}"
      placeholder="Your email" aria-label="Your email" enterkeyhint="send">`, 'Send code')}
    <div class="dim small lb-fine">We email you a code: no password. <a href="privacy.html" target="_blank" rel="noopener">Privacy</a></div>`;
}

// Fills el with the login box. intro: HTML above the email box; focus: put the cursor in it (not when it just appears,
// or a phone's keyboard would cover the results). onDone(account) once logged in with a name.
export function mountLogin(el, { intro = '', focus = false, onDone }) {
  const me = account();
  const state = { step: me && !me.name ? 'name' : 'email', email: me?.email ?? lastEmail(), problem: '', intro };

  function render(focus) {
    el.innerHTML = stepHtml(state);
    el.querySelector('[data-login]').onsubmit = e => { e.preventDefault(); submit(e.target); };
    const link = (sel, fn) => { const a = el.querySelector(sel); if (a) a.onclick = e => { e.preventDefault(); fn(); }; };
    link('[data-login-resend]', () => sendCode());
    link('[data-login-back]', () => go('email'));
    if (focus) el.querySelector('input').focus();
  }
  const go = (step, problem = '') => { Object.assign(state, { step, problem }); render(true); };

  async function sendCode() {
    const answer = await startLogin(state.email);
    if (answer?.ok) return go('code');
    go('email', START_PROBLEMS[answer?.error] ?? UNREACHABLE);
  }

  async function checkCode(code) {
    const answer = await verifyCode(state.email, code);
    if (answer?.account) return answer.account.name ? onDone(answer.account) : go('name');
    if (answer?.error === 'code') return go('code', `That's not the code. ${answer.left} ${answer.left === 1 ? 'try' : 'tries'} left.`);
    if (answer?.error === 'expired') return go('code', 'That code has run out. Send a new one.');
    go('code', answer ? 'Type the 6 digits from the email.' : UNREACHABLE);
  }

  async function pickName(name) {
    state.typedName = name; // shown again if it's refused
    const answer = await saveName(name);
    if (answer?.account) return onDone(answer.account);
    if (answer?.error === 'login') return go('email', 'Your login ran out. Log in again.');
    go('name', answer?.error === 'name' ? NAME_REFUSED : UNREACHABLE);
  }

  async function submit(f) {
    const value = f.v.value.trim();
    if (!value) return f.v.focus();
    f.querySelector('button').disabled = true;
    f.v.blur();
    if (state.step === 'email') { state.email = value; return sendCode(); }
    if (state.step === 'code') return checkCode(value);
    return pickName(value);
  }

  render(focus);
}
