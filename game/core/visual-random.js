// host-only: decoration. Random numbers for things that are only looked at (sparks, the trail, screen shake). Its own
// stream, so drawing more or fewer particles (a slower phone, a hidden tab) can never change what happens in a run.
import { generator } from './course-seed.js';

const next = generator(0x5eed);
export const visualRandom = () => next();
export const visualRand = (a, b) => a + next() * (b - a);
