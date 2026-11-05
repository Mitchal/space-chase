// The main menu: today's daily challenges front and centre, one play button each, how to play folded away.
// Playtest mode (core/mode.js) adds the checkpoint picker and the run log.
import { on } from '../../core/events.js';
import { content } from '../../core/registry.js';
import { startRun } from '../../core/run.js';
import { playtest } from '../../core/mode.js';
import { progress, runsLogged, exportLog } from '../../core/storage.js';
import { renderCheckpointChips } from '../../core/checkpoint-chips.js';
import { renderChallenges, howToPlayLines } from './challenge-buttons.js';

content.startScreen = true;
document.body.insertAdjacentHTML('beforeend', `
<div id="title" class="overlay show"><div class="card menu">
  <h1>SPACE CHASE</h1>
  <p class="dim">You can't attack. They can. Get out alive.</p>
  <div id="tModes"></div>
  <div id="tNotes"></div>
  <details id="tHowBox"><summary>How to play</summary><ul id="tHow"></ul></details>
  <div id="tPlaytest" hidden>
    <label>Start at</label>
    <div id="tStarts" class="seg"></div>
    <p class="dim small" style="margin-top:12px">Playtest · runs logged: <span id="tCount">0</span> · <a href="#" id="tExport">export log</a></p>
  </div>
</div></div>`);

const $ = id => document.getElementById(id);
const LAST_KEY = 'spacechase.lastMode';
let lastMode;
try { lastMode = localStorage.getItem(LAST_KEY) || undefined; } catch {}

function begin(mode = lastMode) {
  if (!$('title').classList.contains('show')) return; // Enter on a focused button: the key and the click both ask
  lastMode = mode;
  try { if (mode) localStorage.setItem(LAST_KEY, mode); } catch {}
  $('title').classList.remove('show');
  startRun({ mode, startArena: progress.chosenStart });
}

// A controls pod may describe its controls (content.controlsHelp); these lines are always true.
const DEFAULT_CONTROLS = 'Move with <kbd>WASD</kbd> / arrows, or hold the mouse to steer. That\'s all.';
const BASE_HOW = [
  '<b style="color:#ff7a59">Missiles</b> blow up on each other, <b style="color:#c9a27a">rocks</b>, <b style="color:#ffd166">mines</b>, <b style="color:#ff4d6d">lasers</b> and walls. So do you.',
];

function showTitle() {
  renderChallenges($('tModes'), begin);
  $('tNotes').innerHTML = content.titleNotes.map(f => f()).join('');
  $('tHow').innerHTML = howToPlayLines([content.controlsHelp || DEFAULT_CONTROLS, ...BASE_HOW]).map(l => `<li>${l}</li>`).join('');
  $('tPlaytest').hidden = !playtest;
  if (playtest) { renderCheckpointChips($('tStarts')); $('tCount').textContent = runsLogged(); }
  $('title').classList.add('show');
}

$('tExport').onclick = e => { e.preventDefault(); exportLog(); };
// Space / Enter plays the challenge you played last.
on('keyPressed', code => { if ($('title').classList.contains('show') && (code === 'Space' || code === 'Enter')) begin(); });
on('ready', showTitle);
on('showTitle', showTitle);
on('runStart', () => $('title').classList.remove('show'));
