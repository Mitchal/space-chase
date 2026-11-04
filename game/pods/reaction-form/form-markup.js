// The reaction form's HTML. The gut-reaction box comes first and is free-form: his best ideas arrive there.
export const FORM_HTML = `
<div id="react" class="overlay"><div class="card">
  <h2 id="rTitle">Run over</h2>
  <p id="rStats" class="dim small"></p>
  <label for="rText">Gut reaction, in one sentence (or more)</label>
  <textarea id="rText" rows="3" placeholder="Whatever comes first: 'felt cheap when…', 'loved when…', 'what if…'"></textarea>
  <label>Tags (any)</label>
  <div id="rTags" class="chips"></div>
  <label>Compared to your previous run</label>
  <div id="rCmp" class="seg"></div>
  <label>Did you want to play again right away?</label>
  <div id="rAgain" class="seg"></div>
  <label>Next run starts at</label>
  <div id="rStarts" class="seg"></div>
  <div class="chips" style="margin-top:12px"><button type="button" class="chip warn" id="rInvalid">This run doesn't count (interrupted)</button></div>
  <div class="row">
    <button class="main" id="rSave">Save &amp; play next</button>
    <button class="ghost" id="rSaveStop">Save &amp; stop</button>
  </div>
  <p class="dim small" style="margin-top:12px"><kbd>Ctrl</kbd>+<kbd>Enter</kbd> saves and starts the next run.</p>
</div></div>`;

export const TAGS = ['clever', 'satisfying', 'flow', 'tense', 'learning', 'boring', 'unfair', 'confusing', 'too easy', 'too hard', 'samey', 'chaotic'];
