// Cross-engine replay check (dev only). The leaderboard replays runs in V8 (the Worker); a run played on an iPhone ran
// in JavaScriptCore. Open the game from the dev server in Safari (or Firefox) on the title screen and run, in the console:
//   await (await import('/dev/replay-check.js')).check()
// It replays the golden runs (sim-golden.json, recorded in Node: tests/sim-golden.test.js) and reports any that end
// differently here. All "same" means this engine plays the simulation exactly as the Worker does.
export async function check() {
  const { replayRun } = await import('/core/replay-run.js');
  const { decodeReplay } = await import('/core/replay-codec.js');
  const { SIM_VERSION } = await import('/core/sim-version.js');
  const { world } = await import('/core/world.js');
  const golden = await (await fetch('/dev/sim-golden.json', { cache: 'no-store' })).json();
  if (golden.simVersion !== SIM_VERSION) return { error: `golden replays are for sim ${golden.simVersion}, this is ${SIM_VERSION}` };
  const rows = golden.runs.map(r => {
    const got = replayRun({ mode: r.mode, day: r.day, frames: decodeReplay(r.replay) });
    const same = got.ok && got.score === r.score && got.ticks === r.ticks && got.fingerprint === r.fingerprint;
    return { run: `${r.by} ${r.mode} ${r.day}`, same, score: got.score, expected: r.score, fingerprint: got.fingerprint, expectedFingerprint: r.fingerprint };
  });
  world.run = null;
  return { engine: navigator.userAgent, allSame: rows.every(r => r.same), rows };
}
