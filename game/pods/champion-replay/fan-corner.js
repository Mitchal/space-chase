// The fan corner (his ask, 2026-11-12: "a little celebration thing… like an audience corner"): while today's best run
// plays, a crowd of space fans in the bottom-left corner holds up the champion's name and reacts to the flying: a gasp
// at a close call, a cheer when a missile blows up, a groan at a hit. A card in the top right says whose run it is and
// what it ended on. When it's over the crowd goes wild and confetti falls.

import { visualRand } from '../../core/visual-random.js';

document.head.insertAdjacentHTML('beforeend', `<style>
.cr-stage{position:fixed;inset:0;pointer-events:none;display:none} /* under the pause card, which comes later */
.cr-stage.show{display:block}
.cr-stage.party{z-index:1} /* the run is over (nothing can pause it): the party goes over the end card */
.cr-who{position:absolute;top:calc(10px + var(--safe-top,0px));right:calc(10px + var(--safe-right,0px));text-align:right;
  padding:6px 12px;border-radius:10px;border:1px solid var(--mode);background:color-mix(in srgb,var(--mode) 14%,rgba(14,17,24,.8))}
.cr-tag{font-size:10px;font-weight:800;letter-spacing:.14em;color:var(--mode)}
.cr-tag i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#ff4d6d;margin-right:5px;animation:cr-blink 1s steps(2) infinite}
.cr-name{font-size:17px;font-weight:800;max-width:42vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cr-score{font-size:13px;color:var(--dim)}.cr-score b{color:var(--mode);font-variant-numeric:tabular-nums}
.cr-crowd{position:absolute;left:calc(8px + var(--safe-left,0px));bottom:calc(8px + var(--safe-bottom,0px));padding:4px 8px 2px;
  border-radius:12px 12px 4px 4px;background:linear-gradient(#1a2033cc,#10141fcc);border:1px solid var(--line)}
.cr-sign{display:block;margin:0 auto 2px;width:max-content;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  padding:1px 8px;border-radius:4px;background:#f4f1e8;color:#14182a;font-weight:800;font-size:11px;letter-spacing:.06em;transform:rotate(-3deg)}
.cr-row{display:flex;justify-content:center;line-height:1}
.cr-row+.cr-row{margin-top:-4px}
.cr-fan{display:inline-block;font-size:21px;animation:cr-bob 1.6s ease-in-out infinite}
.cr-bubble{position:absolute;left:52%;bottom:100%;margin-bottom:4px;padding:3px 9px;border-radius:10px;background:#f4f1e8;color:#14182a;
  font-weight:800;font-size:13px;white-space:nowrap;opacity:0;transform:translate(-50%,6px) scale(.8);transition:opacity .15s,transform .15s}
.cr-bubble.on{opacity:1;transform:translate(-50%,0) scale(1)}
.cr-crowd.jump .cr-fan{animation:cr-jump .45s ease-out 2}
.cr-crowd.wild .cr-fan{animation:cr-jump .5s ease-out infinite}
.cr-confetti{position:absolute;top:-30px;font-size:18px;animation:cr-fall linear forwards}
@keyframes cr-bob{50%{transform:translateY(-3px)}}
@keyframes cr-jump{40%{transform:translateY(-12px) rotate(-6deg)}}
@keyframes cr-fall{to{transform:translateY(110vh) rotate(540deg)}}
@keyframes cr-blink{50%{opacity:.2}}
@media (prefers-reduced-motion:reduce){.cr-fan,.cr-crowd.jump .cr-fan,.cr-crowd.wild .cr-fan,.cr-tag i{animation:none}.cr-confetti{display:none}}
@media (max-height:480px){.cr-fan{font-size:17px}.cr-name{font-size:15px}}
</style>`);
document.body.insertAdjacentHTML('beforeend', `<div id="crStage" class="cr-stage" aria-hidden="true">
  <div class="cr-who"><div class="cr-tag"><i></i>TODAY'S BEST · REPLAY</div><div class="cr-name" id="crName"></div>
    <div class="cr-score" id="crScore"></div></div>
  <div class="cr-crowd" id="crCrowd"><div class="cr-bubble" id="crBubble"></div><span class="cr-sign" id="crSign"></span>
    <div class="cr-row" id="crBack"></div><div class="cr-row" id="crFront"></div></div>
</div>`);

const $ = id => document.getElementById(id);
const FANS = ['👽', '🤖', '🐙', '🧑‍🚀', '👾', '🦊', '🐸', '🐧', '👩‍🚀', '🦄', '🐻'];
const CONFETTI = ['🎉', '✨', '⭐', '🎊', '👏', '💫'];
const QUIET_MS = 700; // between reactions, so a busy moment doesn't flicker

const fan = i => `<span class="cr-fan" style="animation-delay:${(i * 0.23) % 1.6}s">${FANS[i % FANS.length]}</span>`;
$('crBack').innerHTML = [0, 1, 2, 3, 4].map(i => fan(i + 6)).join('');
$('crFront').innerHTML = [0, 1, 2, 3, 4, 5].map(fan).join('');

let quietUntil = 0, bubbleTimer = 0, jumpTimer = 0;

// who: { name, score (formatted), color }.
export function openCorner(who) {
  $('crStage').style.setProperty('--mode', who.color || 'var(--accent)');
  $('crName').textContent = `👑 ${who.name}`; // names are other people's typing: never HTML
  $('crScore').replaceChildren('ended on ', Object.assign(document.createElement('b'), { textContent: who.score }));
  $('crSign').textContent = `GO ${who.name.toUpperCase()}!`;
  $('crCrowd').classList.remove('wild', 'jump');
  quietUntil = 0;
  $('crStage').classList.add('show');
  react('Here we go! 📣', true);
}

export function closeCorner() {
  $('crStage').classList.remove('show', 'party');
  $('crCrowd').classList.remove('wild', 'jump');
  $('crBubble').classList.remove('on');
  for (const c of document.querySelectorAll('.cr-confetti')) c.remove();
}

// The crowd says something; jump: they leap up too. Ignored if they've only just reacted (unless it's big news).
export function react(text, jump = false, big = false) {
  const now = performance.now();
  if (!$('crStage').classList.contains('show') || (!big && now < quietUntil)) return;
  quietUntil = now + QUIET_MS;
  $('crBubble').textContent = text;
  $('crBubble').classList.add('on');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => $('crBubble').classList.remove('on'), 1100);
  if (!jump) return;
  const crowd = $('crCrowd');
  crowd.classList.remove('jump'); void crowd.offsetWidth; crowd.classList.add('jump'); // restart the leap
  clearTimeout(jumpTimer);
  jumpTimer = setTimeout(() => crowd.classList.remove('jump'), 1000);
}

// The run is over: a standing ovation and confetti.
export function celebrate() {
  react('👏 WHAT A RUN! 👏', false, true);
  clearTimeout(bubbleTimer);
  $('crCrowd').classList.add('wild');
  const stage = $('crStage');
  stage.classList.add('party');
  for (let i = 0; i < 36; i++) {
    const c = document.createElement('span');
    c.className = 'cr-confetti';
    c.textContent = CONFETTI[i % CONFETTI.length];
    c.style.left = `${visualRand(0, 100)}vw`;
    c.style.animationDuration = `${visualRand(2.2, 4.2)}s`;
    c.style.animationDelay = `${visualRand(0, 1.2)}s`;
    stage.append(c);
  }
}
