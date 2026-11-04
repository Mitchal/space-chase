// After every run in playtest mode (core/mode.js): capture his gut reaction plus everything the summary providers
// know, and log it. Players get the results screen instead.
import { world } from '../../core/world.js';
import { on, emit } from '../../core/events.js';
import { content, collectSummary } from '../../core/registry.js';
import { startRun } from '../../core/run.js';
import { VERSION, appendEntry, noteArenaReached, progress } from '../../core/storage.js';
import { renderCheckpointChips } from '../../core/checkpoint-chips.js';
import { hurtLabel } from '../../core/player.js';
import { FORM_HTML, TAGS } from './form-markup.js';
import { playtest } from '../../core/mode.js';

if (playtest) {
  content.runOverScreen = true;
  document.body.insertAdjacentHTML('beforeend', FORM_HTML);
  const $ = id => document.getElementById(id);
  const form = { tags: new Set(), cmp: null, again: null, invalid: false };

  function chipRow(id, options, onPick) {
    const el = $(id); el.innerHTML = '';
    for (const o of options) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = o;
      b.onclick = () => onPick(o, b, el);
      el.appendChild(b);
    }
  }
  const single = key => (o, b, el) => { form[key] = o; [...el.children].forEach(c => c.classList.toggle('on', c === b)); };

  function show(run) {
    Object.assign(form, { tags: new Set(), cmp: null, again: null, invalid: false });
    $('rInvalid').classList.remove('on');
    $('rText').value = '';
    chipRow('rTags', TAGS, (o, b) => { form.tags.has(o) ? form.tags.delete(o) : form.tags.add(o); b.classList.toggle('on'); });
    chipRow('rCmp', ['better', 'same', 'worse', 'first run'], single('cmp'));
    chipRow('rAgain', ['yes', 'meh', 'no'], single('again'));
    noteArenaReached(run.ai + 1);
    renderCheckpointChips($('rStarts'));
    const name = world.arena.def.name;
    $('rTitle').textContent = run.outcome === 'win' ? `Run ${run.index + 1}: you got out` : `Run ${run.index + 1}: down in ${content.stageLabel.toLowerCase()} ${run.ai + 1} (${name})`;
    const s = collectSummary();
    const kills = Object.values(s.telemetry?.kills || {}).reduce((a, b) => a + b, 0);
    $('rStats').textContent = `${Math.round(run.endedAt)}s · lured kills ${kills}` + (s.score ? ` · score ${s.score.score}` : '')
      + (run.killer ? ` · killed by ${hurtLabel(run.killer.cause)}` : '') + content.resultNotes.map(f => ' · ' + f(run)).join('');
    $('react').classList.add('show');
    setTimeout(() => $('rText').focus(), 50);
  }

  function save(andContinue) {
    const run = world.run;
    appendEntry({
      version: VERSION, run: run.index + 1, at: new Date().toISOString(), variant: run.variant,
      ...(form.invalid ? { invalid: true } : {}),
      reaction: { text: $('rText').value.trim(), tags: [...form.tags], vsPrevious: form.cmp, playAgain: form.again },
      ...collectSummary(),
    });
    $('react').classList.remove('show');
    if (andContinue) startRun({ startArena: progress.chosenStart });
    else { world.run = null; emit('showTitle'); }
  }

  $('rInvalid').onclick = () => { form.invalid = !form.invalid; $('rInvalid').classList.toggle('on', form.invalid); };
  $('rSave').onclick = () => save(true);
  $('rSaveStop').onclick = () => save(false);
  $('rText').addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); save(true); } });
  on('runSettled', show);
}
