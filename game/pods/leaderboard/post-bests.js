// Sends a day's best in every challenge played on this device (player-record.js) as the logged-in player: right after
// logging in, so runs flown before it still reach the board. → the Worker's answers, one per challenge (see postScore).
import { postScore } from './leaderboard-api.js';
import { bestsOn } from './player-record.js';

export const postBests = day => Promise.all(bestsOn(day).map(b => postScore({ ...b, day })));
