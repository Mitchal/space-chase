// The six sectors of the flight. Each one adds something to the world (P6), never to the controls (P7).
// Keys configure other pods and are ignored if that pod is missing:
//   chasers / chargers: { from: 'behind', start, every, max }   rocks: { every, drift }   mines: { every }   lasers: { every }
// `start` pursuers arrive from behind as each sector begins: "here they come".

export const SECTOR_S = 40;

export const SECTORS = [
  { name: 'Outer debris', chasers: { from: 'behind', start: 3, every: 2.4 }, rocks: { every: 1.9 }, mines: { every: 7 } },
  { name: 'Asteroid belt', chasers: { from: 'behind', start: 2, every: 1.9 }, rocks: { every: 1.0 }, mines: { every: 9 } },
  { name: 'Crossfire', chasers: { from: 'behind', start: 2, every: 1.5 }, rocks: { every: 1.2 }, lasers: { every: 6 } },
  { name: 'Rams', chasers: { from: 'behind', start: 2, every: 1.5 }, rocks: { every: 1.1 }, chargers: { from: 'behind', every: 9, max: 2 }, mines: { every: 8 } },
  { name: 'Drift', chasers: { from: 'behind', start: 2, every: 1.3 }, rocks: { every: 0.9, drift: true }, lasers: { every: 7 } },
  { name: 'Breakout', chasers: { from: 'behind', start: 3, every: 1.1 }, rocks: { every: 0.8, drift: true }, chargers: { from: 'behind', every: 8, max: 2 }, lasers: { every: 5.5 }, mines: { every: 6 } },
];
