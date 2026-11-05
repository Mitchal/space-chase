// The daily challenges card: today's date, then one big play button per game mode in its colour, each with the
// mode's own notes (today's best, tries). Two challenges a day, side by side (his pick, 2026-11-05).
import { content } from '../../core/registry.js';
import { modeList, modeNotes } from '../../core/game-modes.js';

document.head.insertAdjacentHTML('beforeend', `<style>
.modes{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:10px}
.mode-play{display:flex;flex-direction:column;align-items:center;gap:2px;padding:12px 10px;border-radius:12px;cursor:pointer;
  font:inherit;color:var(--fg);border:2px solid var(--mode);background:color-mix(in srgb,var(--mode) 12%,#0e1118)}
.mode-play:hover,.mode-play:focus-visible{background:color-mix(in srgb,var(--mode) 22%,#0e1118);outline:none}
.mode-name{color:var(--mode);font-size:20px;font-weight:800;letter-spacing:.1em}
.mode-tag{font-size:12px;color:var(--dim)}
.mode-note{font-size:13px;margin-top:4px}
.daily-sub{float:right;color:var(--fg);font-weight:600;letter-spacing:0}
@media (max-height:480px){.modes{margin-top:6px;gap:8px}.mode-play{padding:7px 8px}.mode-name{font-size:17px}.mode-tag{display:none}}
</style>`);

const dayLabel = () => new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' }).toUpperCase();

// Fills el with the card; onPlay(modeId) when a button is pressed. Without any mode pod, a plain Play button.
export function renderChallenges(el, onPlay) {
  const modes = modeList();
  if (!modes.length) {
    el.innerHTML = '<button class="main big" data-mode="">Play</button>';
  } else {
    const extra = content.dailyNotes.map(f => f()).filter(Boolean).join(' · ');
    el.innerHTML = `<div class="daily"><div class="daily-head">${modes.length > 1 ? 'TODAY\'S CHALLENGES' : 'DAILY CHALLENGE'} · ${dayLabel()}
      ${extra ? `<span class="daily-sub">${extra}</span>` : ''}</div>
      <div class="dim small">The same for everyone all day. Beat your best.</div>
      <div class="modes">${modes.map(m => `<button class="mode-play" style="--mode:${m.color}" data-mode="${m.id}">
        <span class="mode-name">${m.label.toUpperCase()} ▶</span><span class="mode-tag">${m.tagline || ''}</span>
        <span class="mode-note">${modeNotes(m.id).join(' · ') || '&nbsp;'}</span></button>`).join('')}</div></div>`;
  }
  for (const b of el.querySelectorAll('[data-mode]')) b.onclick = () => onPlay(b.dataset.mode || undefined);
}

// How to play: each mode's goal under its name, then the lines that hold everywhere.
export function howToPlayLines(always) {
  const perMode = modeList().map(m => `<b style="color:${m.color}">${m.label}.</b> ${(m.howToPlay || []).join(' ')}`);
  return [...perMode, ...(content.howToPlay || []), ...always];
}
