// The board on the main menu: today's top three in each daily challenge, your medal count and the way into the calendar,
// your profile (or "Log in"), and news of trophies you haven't seen yet. The menu draws the last board fetched straight
// away, then this fills in the fresh one when the Worker answers (or leaves the spot empty if it can't be reached).
import { on } from '../../core/events.js';
import { content } from '../../core/registry.js';
import { modeList, formatScore } from '../../core/game-modes.js';
import { fetchTop } from './leaderboard-api.js';
import { today } from './player-record.js';
import { account, onSessionChange } from './session-record.js';
import { menuCard } from './board-view.js';
import { trophies, refreshTrophies, unseen } from './trophy-record.js';
import { medalCounts, trophyNews } from './trophy-view.js';

const ID = 'lbMenu';
let columns = [];
const html = () => menuCard(columns, account(), { medals: medalCounts(trophies()), news: trophyNews(unseen()) });
const redraw = () => { const el = document.getElementById(ID); if (el) el.innerHTML = html(); };

async function refresh() {
  const day = today(), modes = modeList();
  const [boards] = await Promise.all([Promise.all(modes.map(m => fetchTop(m.id, day))), refreshTrophies()]);
  columns = modes.map((m, i) => ({ mode: { label: m.label, color: m.color, fmt: n => formatScore(n, m) }, board: boards[i] }));
  redraw();
}

export function wireMenuBoard() {
  content.titleNotes.push(() => `<div id="${ID}">${html()}</div>`);
  on('ready', refresh);
  on('showTitle', refresh);
  onSessionChange(() => { redraw(); refresh(); }); // logged in or out, renamed: whose rows light up, and the trophies
}
