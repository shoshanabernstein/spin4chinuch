/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const loaded = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/wheel-feedback.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { module: loaded, exports: loaded.exports });
const { crossedWheelBoundary } = loaded.exports;

test('feedback happens at slice crossings under the right-side pointer', () => {
  assert.equal(crossedWheelBoundary(89, 90, 18), true);
  assert.equal(crossedWheelBoundary(90, 91, 18), false);
  assert.equal(crossedWheelBoundary(107, 108, 18), true);
  assert.equal(crossedWheelBoundary(449, 450, 18), true);
});

test('idle frames, stationary wheel and animation loop resets do not cause extra clicks', () => {
  assert.equal(crossedWheelBoundary(91, 91.5, 18), false);
  assert.equal(crossedWheelBoundary(108, 108, 18), false);
  assert.equal(crossedWheelBoundary(1800, 0, 18), false);
});

test('slow movement still clicks once per boundary for different slice counts', () => {
  for (const count of [8, 20, 37]) {
    const angle = 360 / count;
    let ticks = 0;
    for (let i = 0; i < 3600; i++) {
      if (crossedWheelBoundary(90 + i / 10, 90 + (i + 1) / 10, angle)) ticks++;
    }
    assert.equal(ticks, count);
  }
});
