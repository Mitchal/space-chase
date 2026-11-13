// The leaderboard Worker trusts a score first and checks it later: it's stored unchecked with its replay and shown
// right away; the checker takes the waiting runs (GET /checks/pending) and answers (POST /checks/verdicts). A run that
// checks out keeps its replay, so the game can show the day's leader (GET /best); one that fails is hidden everywhere but kept, frozen, as evidence.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeBoard, SECRET, TODAY } from './worker-harness.js';
import { SIM_VERSION } from '../game/core/sim-version.js';

test('a score is stored unchecked with its replay, shown at once, and the checker is started', async () => {
  const b = makeBoard();
  const res = await b.post('Anna', 500);
  assert.equal(res.status, 200);
  assert.deepEqual([res.body.best, res.body.rank, res.body.players], [500, 1, 1]);
  assert.deepEqual((await b.top()).top, [{ name: 'Anna', score: 500 }]);
  const row = b.row('anna');
  assert.equal(row.check_status, 'unchecked');
  assert.equal(row.sim_version, SIM_VERSION);
  assert.ok(row.replay.length > 10);
  assert.equal(b.dispatches.length, 1);
  assert.equal(b.dispatches[0].url, 'https://api.github.com/repos/someone/space-chase/actions/workflows/check-runs.yml/dispatches');
  assert.deepEqual(b.dispatches[0].body, { ref: 'master' });
  assert.equal(b.dispatches[0].auth, 'Bearer github-token');
});

test('the checker is started at most once a minute, and not at all without a token', async () => {
  const b = makeBoard();
  await b.post('Anna', 500);
  await b.post('Bo', 400);
  await b.post('Anna', 600);
  assert.equal(b.dispatches.length, 1);
  b.DB.exec('UPDATE check_dispatch SET last_at = last_at - 60000');
  await b.post('Cy', 300);
  assert.equal(b.dispatches.length, 2);
  const quiet = makeBoard({ GITHUB_DISPATCH_TOKEN: undefined });
  assert.equal((await quiet.post('Anna', 500)).status, 200);
  assert.equal(quiet.dispatches.length, 0);
});

test('runs from another game version, or with an unreadable replay, are turned away and not stored', async () => {
  const b = makeBoard();
  assert.deepEqual(await b.post('Anna', 500, { simVersion: SIM_VERSION + 1 }), { status: 409, body: { error: 'update', simVersion: SIM_VERSION } });
  assert.deepEqual(await b.post('Anna', 500, { replay: 'nonsense' }), { status: 422, body: { error: 'replay', why: 'unreadable' } });
  assert.equal((await b.top()).players, 0);
});

test('only the checker, with the secret, can list or answer runs', async () => {
  const b = makeBoard();
  await b.post('Anna', 500);
  assert.equal((await b.pending(null)).status, 401);
  assert.equal((await b.pending('wrong-secret-0123456789')).status, 401);
  assert.equal((await b.verdicts([], 'wrong-secret-0123456789')).status, 401);
  const off = makeBoard({ RUN_CHECK_SECRET: undefined });
  assert.equal((await off.pending(SECRET)).status, 404);
  const { status, body } = await b.pending();
  assert.equal(status, 200);
  assert.equal(body.runs.length, 1);
  const run = body.runs[0];
  assert.deepEqual(Object.keys(run).sort(), ['at', 'day', 'key', 'mode', 'replay', 'score', 'simVersion']);
  assert.deepEqual([run.mode, run.day, run.key, run.score, run.simVersion], ['flight', TODAY, 'anna', 500, SIM_VERSION]);
  assert.equal((await b.verdicts([{ ...b.verdict(run, true), at: 'soon' }])).status, 400);
});

test('a run that checks out stays on the board and keeps its replay', async () => {
  const b = makeBoard();
  await b.post('Anna', 500);
  const [run] = (await b.pending()).body.runs;
  assert.deepEqual((await b.verdicts([b.verdict(run, true)])).body, { applied: 1 });
  assert.equal(b.row('anna').check_status, 'ok');
  assert.equal(b.row('anna').replay, run.replay);
  assert.deepEqual((await b.pending()).body.runs, []);
  assert.deepEqual((await b.top()).top, [{ name: 'Anna', score: 500 }]);
});

test('a run that fails is hidden from the top, the count and the ranks, and kept with its replay', async () => {
  const b = makeBoard();
  await b.post('Cheat', 9000);
  await b.post('Anna', 500);
  assert.equal((await b.post('Anna', 400)).body.rank, 2);
  const cheat = (await b.pending()).body.runs.find(r => r.key === 'cheat');
  await b.verdicts([b.verdict(cheat, false, 'score')]);
  const board = await b.top();
  assert.deepEqual([board.players, board.top], [1, [{ name: 'Anna', score: 500 }]]);
  assert.equal((await b.post('Anna', 400)).body.rank, 1);
  const month = (await b.call('GET', `/month?m=${TODAY.slice(0, 7)}`)).body;
  assert.deepEqual(month.days[TODAY].modes.flight, [{ name: 'Anna', score: 500 }]);
  const row = b.row('cheat');
  assert.deepEqual([row.check_status, row.check_note, row.score], ['failed', 'score', 9000]);
  assert.ok(row.replay);
});

test('a failed row is frozen: a better post or a rename away does not clear it', async () => {
  const b = makeBoard();
  await b.post('Cheat', 9000);
  const [run] = (await b.pending()).body.runs;
  await b.verdicts([b.verdict(run, false, 'score')]);
  const before = b.row('cheat');
  await b.post('Cheat', 12000);
  await b.post('Fresh', 100, { was: 'Cheat', device: 'Cheat' }); // the same device, renaming
  assert.deepEqual(b.row('cheat'), before);
  assert.deepEqual((await b.top()).top, [{ name: 'Fresh', score: 100 }]);
});

test('only a better score starts a new check; a verdict on a run since beaten changes nothing', async () => {
  const b = makeBoard();
  await b.post('Anna', 500);
  const [first] = (await b.pending()).body.runs;
  await b.verdicts([b.verdict(first, true)]);
  await b.post('Anna', 450);
  assert.equal(b.row('anna').check_status, 'ok');
  await b.post('Anna', 700);
  const [second] = (await b.pending()).body.runs;
  assert.equal(b.row('anna').check_status, 'unchecked');
  assert.equal(second.score, 700);
  await b.post('Anna', 800); // beaten again while the checker was busy with 700
  assert.deepEqual((await b.verdicts([b.verdict(second, false, 'score')])).body, { applied: 0 });
  assert.equal(b.row('anna').check_status, 'unchecked');
  assert.equal((await b.top()).top[0].score, 800);
});

test('a rename takes an unchecked run along, still unchecked and with its replay', async () => {
  const b = makeBoard();
  await b.post('Anna', 500);
  const { replay } = b.row('anna');
  await b.post('Annie', 100, { was: 'Anna', device: 'Anna' }); // the same device, renaming
  const row = b.row('annie');
  assert.deepEqual([row.score, row.check_status, row.replay], [500, 'unchecked', replay]);
  assert.equal(b.row('anna'), undefined);
  assert.equal((await b.pending()).body.runs.length, 1);
});

test("the day's leader can be fetched with their run, and a failed run is never the leader", async () => {
  const b = makeBoard();
  const best = mode => b.call('GET', `/best?mode=${mode}&day=${TODAY}`).then(r => r.body);
  assert.deepEqual(await best('flight'), { mode: 'flight', day: TODAY, run: null });
  await b.post('Anna', 500);
  await b.post('Bo', 700);
  const { run } = await best('flight');
  assert.deepEqual([run.name, run.score, run.simVersion, run.replay], ['Bo', 700, SIM_VERSION, b.row('bo').replay]);
  const bo = (await b.pending()).body.runs.find(r => r.key === 'bo');
  await b.verdicts([b.verdict(bo, false, 'score')]);
  assert.equal((await best('flight')).run.name, 'Anna');
  assert.equal((await b.call('GET', `/best?mode=flight&day=nope`)).status, 400);
});
