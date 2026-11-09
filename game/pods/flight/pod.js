// The flight (his spec, run 17): the Escape challenge. What happens is sim.js; here, how it's presented on the menu and
// how it looks (flight-draw.js: the walls, the wave, the finish and the progress bar).
import './sim.js';
import { addMode } from '../../core/game-modes.js';
import { SECTOR_LEN, COURSE_END } from './course.js';
import { drawFlight } from './flight-draw.js';
import { MODE, deathWave } from './sim.js';

addMode({
  id: MODE, label: 'Escape', color: '#7cf2c8', tagline: 'Fly to the finish',
  howToPlay: [
    'Fly to the <b style="color:#7cf2c8">finish</b>. The <b style="color:#ff4d6d">death wave</b> rolls in from behind; the <b style="color:#ff4d6d">walls</b> on either side kill on touch.',
    "Two hits and you're down. Each new sector gives one back.",
  ],
  format: n => n.toLocaleString(),
});

drawFlight(deathWave, { SECTOR_LEN, COURSE_END, mode: MODE });
