// After a run (for players; playtest mode uses the reaction form instead): your score, whether it beat today's best,
// and one tap to fly again. Share sends a short, spoiler-free line and a link to the game (see share-run.js).
import { world } from '../../core/world.js';
import { on, emit } from '../../core/events.js';
import { content, collectSummary } from '../../core/registry.js';
import { startRun } from '../../core/run.js';
import { currentMode } from '../../core/game-modes.js';
import { playtest } from '../../core/mode.js';
import { shareRun, GAME_URL } from './share-run.js';

if (!playtest) {
  content.runOverScreen = true;
  document.body.insertAdjacentHTML('beforeend', `
<div id="results" class="overlay"><div class="card menu">
  <div id="xBadge" class="badge" hidden>NEW BEST</div>
  <h2 id="xTitle"></h2>
  <div id="xScore" class="score-big"></div>
  <p id="xLine" class="dim"></p>
  <div class="row center"><button class="main big" id="xAgain">Fly again</button></div>
  <div class="row center"><button class="ghost" id="xMenu">Menu</button><button class="ghost" id="xShare">Share</button></div>
  <p id="xShared" class="dim small" hidden>Copied: paste it anywhere.</p>
  <textarea id="xShareText" rows="3" style="margin-top:8px" readonly hidden></textarea>
</div></div>`);
  const $ = id => document.getElementById(id);
  let shareText = '';

  const hide = () => $('results').classList.remove('show');
  const again = () => { hide(); startRun({ startArena: 0 }); }; // same mode as the run just played

  // A points run through stages (the Escape challenge). A game mode may describe its runs itself (mode.result).
  function stagesCard(run, s) {
    const score = s.score?.score ?? 0, d = s.daily, sectors = content.arenas.length, bits = [];
    if (d && !d.newBest && d.best !== null) bits.push(`Today's best ${d.best.toLocaleString()}`);
    if (s.score?.maxChain > 1) bits.push(`chain ×${s.score.maxChain}`);
    if (s.telemetry?.nearMisses) bits.push(`${s.telemetry.nearMisses} close call${s.telemetry.nearMisses === 1 ? '' : 's'}`);
    if (d?.streak > 1) bits.push(`🔥 ${d.streak} days`);
    const where = run.outcome === 'win' ? 'escaped' : `sector ${run.ai + 1}/${sectors}`;
    return {
      title: run.outcome === 'win' ? 'You got out!' : `Down in ${content.stageLabel.toLowerCase()} ${run.ai + 1} of ${sectors}`,
      score: score.toLocaleString(), newBest: !!d?.newBest, line: bits.join(' · '),
      share: `SPACE CHASE daily ${d?.day ?? ''}\n${score.toLocaleString()} · ${where}${s.score?.maxChain > 1 ? ` · chain ×${s.score.maxChain}` : ''}`,
    };
  }

  on('runSettled', run => {
    const s = collectSummary(), mode = currentMode(), card = mode?.result?.(run, s) || stagesCard(run, s);
    $('xTitle').textContent = card.title;
    $('xScore').textContent = card.score;
    $('xScore').style.color = mode?.color || '';
    $('xBadge').hidden = !card.newBest;
    $('xLine').textContent = card.line;
    shareText = card.share;
    $('xShared').hidden = $('xShareText').hidden = true;
    $('results').classList.add('show');
  });

  $('xAgain').onclick = again;
  const toMenu = () => { hide(); world.run = null; emit('showTitle'); };
  $('xMenu').onclick = toMenu;
  on('back', e => { if (!e.handled && $('results').classList.contains('show')) { e.handled = true; toMenu(); } });
  $('xShare').onclick = async () => {
    const how = await shareRun(shareText);
    $('xShared').hidden = how !== 'copied';
    if (how === 'failed') { // nothing could copy it: show it, selected, to copy by hand
      const box = $('xShareText');
      box.value = shareText + '\n' + GAME_URL; box.hidden = false; box.focus(); box.select();
    }
  };
  on('keyPressed', code => { if ($('results').classList.contains('show') && (code === 'Space' || code === 'Enter')) again(); });
}
