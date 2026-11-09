// The replay format: frames survive the round trip exactly, and anything malformed is refused, not half-read.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeReplay, decodeReplay } from '../game/core/replay-codec.js';
import { frameOf, applyFrame, STEPS } from '../game/core/sim-input.js';
import { world } from '../game/core/world.js';
import { generator } from '../game/core/course-seed.js';

const random = generator(42);
const frames = Array.from({ length: 5000 }, (_, i) => i % 300 < 100 ? frameOf(0, 0, 14)
  : frameOf(random() * 2 - 1, random() * 2 - 1, i % 1000 < 500 ? 30 : 14));

test('frames round-trip exactly', () => {
  assert.deepEqual(decodeReplay(encodeReplay(frames)), frames);
  assert.deepEqual(decodeReplay(encodeReplay([])), []);
});

test('runs of the same frame pack small', () => {
  const still = Array.from({ length: 10000 }, () => frameOf(1, 0, 14));
  assert.ok(encodeReplay(still).length <= 16);
});

test('malformed replays are refused', () => {
  const good = encodeReplay(frames);
  assert.equal(decodeReplay(good.slice(0, good.length - 8)), null, 'truncated');
  assert.equal(decodeReplay('not base64 at all!'), null, 'not base64');
  assert.equal(decodeReplay(123), null, 'not a string');
  assert.equal(decodeReplay(good + 'AAAA'), null, 'trailing bytes');
  assert.equal(decodeReplay(good, 4999), null, 'longer than allowed');
  assert.equal(decodeReplay(btoa('\x02\x01\x04')), null, 'unknown format');
});

test('a frame is quantized and played at length ≤ 1', () => {
  const f = frameOf(5, 5, 400);
  assert.deepEqual(f, { x: STEPS, y: STEPS, grip: 255 });
  applyFrame(f);
  assert.ok(Math.abs(Math.hypot(world.input.ix, world.input.iy) - 1) < 1e-12);
  assert.deepEqual(frameOf(NaN, -0.5, 14), { x: 0, y: -STEPS / 2, grip: 14 });
  assert.ok(Object.is(frameOf(-0.001, 0, 14).x, 0), 'never -0: it would replay as 0');
});
