// Title screen with checkpoints, plus the pause overlay.
import { world } from '../../core/world.js';
import { on } from '../../core/events.js';
import { content } from '../../core/registry.js';
import { startRun } from '../../core/run.js';
import { progress, runsLogged, exportLog } from '../../core/storage.js';
import { renderCheckpointChips } from '../../core/checkpoint-chips.js';

content.startScreen = true;
document.body.insertAdjacentHTML('beforeend', `
<div id="title" class="overlay show"><div class="card">
  <h1>LURE</h1>
  <p class="dim">You can't attack. They can. Get out alive.</p>
  <div id="tNotes"></div>
  <ul id="tHow"></ul>
  <label>Start at</label>
  <div id="tStarts" class="seg"></div>
  <div class="row"><button class="main" id="startBtn">Start run</button></div>
  <p class="dim small" style="margin-top:12px">Runs logged: <span id="tCount">0</span> · <a href="#" id="tExport">export log</a></p>
</div></div>
<div id="pause" class="overlay"><div class="card"><h2>Paused</h2><p class="dim">Press <kbd>P</kbd> to resume.</p></div></div>`);

const $ = id => document.getElementById(id);
const begin = () => { $('title').classList.remove('show'); startRun({ startArena: progress.chosenStart }); };

// The game mode pod describes its own goal (content.howToPlay), a controls pod may describe its controls
// (content.controlsHelp); these lines are always true.
const DEFAULT_CONTROLS = 'Move with <kbd>WASD</kbd> / arrows, or hold the mouse to steer. That\'s all.';
const BASE_HOW = [
  '<b style="color:#ff7a59">Pursuers</b> die on each other, <b style="color:#c9a27a">rocks</b>, <b style="color:#ffd166">mines</b> and <b style="color:#ff4d6d">lasers</b>. So do you.',
  'Two hits and you\'re down. <kbd>P</kbd> pauses.',
];

function showTitle() {
  $('tHow').innerHTML = [...(content.howToPlay || []), content.controlsHelp || DEFAULT_CONTROLS, ...BASE_HOW].map(l => `<li>${l}</li>`).join('');
  $('tNotes').innerHTML = content.titleNotes.map(f => f()).join('');
  renderCheckpointChips($('tStarts'));
  $('tCount').textContent = runsLogged();
  $('title').classList.add('show');
}

$('startBtn').onclick = begin;
$('tExport').onclick = e => { e.preventDefault(); exportLog(); };
on('keyPressed', code => { if ($('title').classList.contains('show') && (code === 'Space' || code === 'Enter')) begin(); });
on('ready', showTitle);
on('showTitle', showTitle);
on('runStart', () => $('title').classList.remove('show'));
on('pauseChanged', paused => $('pause').classList.toggle('show', paused));
on('runEnd', () => { if (world.paused) { world.paused = false; $('pause').classList.remove('show'); } });
