// The name you go by on the board, asked the first time the board shows up after a run (and whenever you tap
// "change"). The game's keys ignore typing in it (core/input.js), so Space and Enter don't start a run meanwhile.
import { esc } from './board-view.js';
import { NAME_MAX, loadName, saveName } from './player-record.js';

export const nameFormHtml = (prompt, current = '') => `<form class="lb-form" data-lb-name>
  <input name="n" maxlength="${NAME_MAX}" placeholder="${esc(prompt)}" value="${esc(current)}" autocomplete="nickname"
    enterkeyhint="done" aria-label="Your name on the board">
  <button class="main" type="submit">Join</button></form>`;

export const whoHtml = name => `<span class="dim small">on the board as <b>${esc(name)}</b> ·
  <a href="#" data-lb-rename>change</a></span>`;

// Wires the form and the change link inside el. onName(name, was) gets the saved name and the one before it, if any.
export function wireNameForm(el, onName) {
  const form = el.querySelector('[data-lb-name]');
  if (form) form.onsubmit = e => {
    e.preventDefault();
    const was = loadName(), name = saveName(form.n.value);
    if (!name) return form.n.focus();
    form.n.blur();
    onName(name, was);
  };
  const rename = el.querySelector('[data-lb-rename]');
  if (rename) rename.onclick = e => {
    e.preventDefault();
    rename.parentElement.outerHTML = nameFormHtml('Your name', rename.parentElement.querySelector('b').textContent);
    wireNameForm(el, onName);
    el.querySelector('[data-lb-name] input').focus();
  };
}
