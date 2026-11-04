// Pausing: P on a keyboard, a small button on screen (phones have no P), and automatically when the app or tab goes
// into the background. The pause card can resume or quit to the menu.
import { world } from '../../core/world.js';
import { on, emit } from '../../core/events.js';
import { setPaused } from '../../core/loop.js';

document.body.insertAdjacentHTML('beforeend', `
<button id="pauseBtn" class="pause-btn" aria-label="Pause" hidden>❚❚</button>
<div id="pause" class="overlay"><div class="card menu">
  <h2>Paused</h2>
  <div class="row"><button class="main big" id="resumeBtn">Resume</button><button class="ghost" id="quitBtn">Quit to menu</button></div>
  <p class="dim small">Keyboard: <kbd>P</kbd> pauses and resumes.</p>
</div></div>`);
const $ = id => document.getElementById(id);

$('pauseBtn').onclick = () => setPaused(true);
$('resumeBtn').onclick = () => setPaused(false);
$('quitBtn').onclick = () => {
  setPaused(false);
  world.run = null;
  $('pauseBtn').hidden = true;
  emit('showTitle');
};
document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });

on('pauseChanged', paused => $('pause').classList.toggle('show', paused));
on('runStart', () => { if (!world.botPolicy) $('pauseBtn').hidden = false; });
on('runEnd', () => { $('pauseBtn').hidden = true; });
