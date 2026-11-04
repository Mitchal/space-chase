// After a run (for players; playtest mode uses the reaction form instead): your score, whether it beat today's best,
// and one tap to fly again. Share puts a short, spoiler-free line on the clipboard or the phone's share sheet.
import { world } from '../../core/world.js';
import { on, emit } from '../../core/events.js';
import { content, collectSummary } from '../../core/registry.js';
import { startRun } from '../../core/run.js';
import { playtest } from '../../core/mode.js';

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
  <p id="xShared" class="dim small" hidden>Copied to the clipboard.</p>
</div></div>`);
  const $ = id => document.getElementById(id);
  let shareText = '';

  const hide = () => $('results').classList.remove('show');
  const again = () => { hide(); startRun({ startArena: 0 }); };

  on('runSettled', run => {
    const s = collectSummary(), score = s.score?.score ?? 0, d = s.daily, sectors = content.arenas.length;
    $('xTitle').textContent = run.outcome === 'win' ? 'You got out!' : `Down in ${content.stageLabel.toLowerCase()} ${run.ai + 1} of ${sectors}`;
    $('xScore').textContent = score.toLocaleString();
    $('xBadge').hidden = !d?.newBest;
    const bits = [];
    if (d && !d.newBest && d.best !== null) bits.push(`Today's best ${d.best.toLocaleString()}`);
    if (s.score?.maxChain > 1) bits.push(`chain ×${s.score.maxChain}`);
    if (s.telemetry?.nearMisses) bits.push(`${s.telemetry.nearMisses} close call${s.telemetry.nearMisses === 1 ? '' : 's'}`);
    if (d?.streak > 1) bits.push(`🔥 ${d.streak} days`);
    $('xLine').textContent = bits.join(' · ');
    const where = run.outcome === 'win' ? 'escaped' : `sector ${run.ai + 1}/${sectors}`;
    shareText = `LURE daily ${d?.day ?? ''}\n${score.toLocaleString()} · ${where}${s.score?.maxChain > 1 ? ` · chain ×${s.score.maxChain}` : ''}`;
    $('xShared').hidden = true;
    $('results').classList.add('show');
  });

  $('xAgain').onclick = again;
  $('xMenu').onclick = () => { hide(); world.run = null; emit('showTitle'); };
  $('xShare').onclick = async () => {
    try { if (navigator.share) return await navigator.share({ text: shareText }); } catch { return; }
    try { await navigator.clipboard.writeText(shareText); $('xShared').hidden = false; } catch {}
  };
  on('keyPressed', code => { if ($('results').classList.contains('show') && (code === 'Space' || code === 'Enter')) again(); });
}
