// host-only: the "start at arena N" chip row, shared by any screen that offers checkpoints.
import { content } from './registry.js';
import { progress, setChosenStart } from './storage.js';

export const availableStarts = () => content.arenas.map((_, i) => i).filter(i => i + 1 <= progress.bestArena);

// Screens put their "start at" label right before the chip row; both hide when the mode has no checkpoints.
export function renderCheckpointChips(el) {
  el.innerHTML = '';
  el.hidden = !content.checkpoints;
  if (el.previousElementSibling?.tagName === 'LABEL') el.previousElementSibling.hidden = el.hidden;
  if (el.hidden) { setChosenStart(0); return; }
  const avail = availableStarts();
  if (!avail.includes(progress.chosenStart)) setChosenStart(0);
  content.arenas.forEach((a, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (i === progress.chosenStart ? ' on' : '');
    b.textContent = avail.includes(i) ? `${i + 1} · ${a.name}` : `${i + 1} · ???`;
    b.disabled = !avail.includes(i);
    b.onclick = () => { setChosenStart(i); renderCheckpointChips(el); };
    el.appendChild(b);
  });
}
