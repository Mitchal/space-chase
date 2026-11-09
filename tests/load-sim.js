// Loads the simulation headlessly, as the leaderboard Worker does: the kernel, then every pod's sim.js in name order.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PODS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'game', 'pods');

export async function loadSim() {
  await import('../game/core/sim-kernel.js');
  const names = fs.readdirSync(PODS).filter(n => fs.existsSync(path.join(PODS, n, 'sim.js'))).sort();
  for (const n of names) await import(pathToFileURL(path.join(PODS, n, 'sim.js')).href);
  return names;
}
