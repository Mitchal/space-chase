// The board on the main menu: today's top three in each daily challenge. The menu draws the last board fetched straight
// away, then this fills in the fresh one when the Worker answers (or leaves the spot empty if it can't be reached).
import { on } from '../../core/events.js';
import { content } from '../../core/registry.js';
import { modeList, formatScore } from '../../core/game-modes.js';
import { fetchTop } from './leaderboard-api.js';
import { today, loadName } from './player-record.js';
import { menuCard } from './board-view.js';

const ID = 'lbMenu';
let columns = [];
const html = () => menuCard(columns, loadName());

async function refresh() {
  const day = today(), modes = modeList();
  const boards = await Promise.all(modes.map(m => fetchTop(m.id, day)));
  columns = modes.map((m, i) => ({ mode: { label: m.label, color: m.color, fmt: n => formatScore(n, m) }, board: boards[i] }));
  const el = document.getElementById(ID);
  if (el) el.innerHTML = html();
}

export function wireMenuBoard() {
  content.titleNotes.push(() => `<div id="${ID}">${html()}</div>`);
  on('ready', refresh);
  on('showTitle', refresh);
}
