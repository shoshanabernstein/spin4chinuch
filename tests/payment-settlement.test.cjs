/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const payment = { id: 'pi_test', status: 'succeeded', metadata: { userId: 'user', spins: '2' }, currency: 'usd', amount_received: 3600 };
function setup(error = null, existing = [], refundStatus = 'succeeded') {
  const calls = [];
  const testModule = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/server/settle-payment.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports: testModule.exports, module: testModule,
    require: name => name === '@/lib/spin-pricing' ? require('./helpers/spin-pricing.cjs') : ({ supabaseAdmin: { rpc: async (...args) => { calls.push(['credit', ...args]); return { error }; } } }),
  });
  const stripe = { refunds: {
    list: async () => ({ data: existing }),
    create: async (...args) => { calls.push(['refund', ...args]); return { id: 're_test', status: refundStatus }; },
  } };
  return { settle: (p = payment) => testModule.exports.settlePayment(stripe, p), calls };
}
test('successful credit and duplicate database delivery do not refund', async () => {
  const { settle, calls } = setup();
  assert.equal((await settle()).status, 'succeeded');
  assert.equal((await settle()).status, 'succeeded');
  assert.equal(calls.filter(c => c[0] === 'refund').length, 0);
});

test('all package payments credit the actual discounted amount and excess-sale refunds return that amount', async () => {
  for (const [spins, amount, packageId] of [[3, 4500, 'three-spins'], [6, 8000, 'six-spins']]) {
    const p = { ...payment, amount_received: amount, metadata: { userId: 'user', spins: String(spins), packageId, pricingVersion: 'packages-v2' } };
    const credited = setup();
    assert.equal((await credited.settle(p)).spins, spins);
    assert.equal(credited.calls[0][2].p_amount, amount);
    const capped = setup({ code: 'P0001', message: 'The 1100 spin limit has been reached' });
    assert.equal((await capped.settle(p)).status, 'refunded');
    assert.equal(capped.calls[1][1].amount, amount);
  }
});
test('losing checkout at the sales cap requests a full refund with stable key', async () => {
  const { settle, calls } = setup({ code: 'P0001', message: 'The 1100 spin limit has been reached' });
  assert.equal((await settle()).status, 'refunded');
  assert.equal(calls[1][1].amount, 3600);
  assert.equal(calls[1][2].idempotencyKey, 'spin-limit-refund/pi_test');
});

test('legacy cap rejections are still refunded during rollout', async () => {
  assert.equal((await setup({ code: 'P0001', message: 'The 2000 spin limit has been reached' }).settle()).status, 'refunded');
});
test('recorded refunds prevent future credit even after key expiry', async () => {
  for (const status of ['succeeded', 'pending']) {
    const { settle, calls } = setup(null, [{ id: 're_old', status, metadata: { reason: 'spin_limit_reached' } }]);
    assert.equal((await settle()).spins, 0);
    assert.equal(calls.length, 0);
  }
});
test('ambiguous database failures never trigger a refund', async () => {
  const { settle, calls } = setup({ code: '57014', message: 'timeout' });
  await assert.rejects(settle(), /Unable to credit/);
  assert.equal(calls.length, 1);
});
test('failed refunds require review and invalid payments never reach credit', async () => {
  await assert.rejects(setup(null, [{ id: 're_fail', status: 'failed', metadata: { reason: 'spin_limit_reached' } }]).settle(), /requires review/);
  const { settle, calls } = setup();
  await assert.rejects(settle({ ...payment, amount_received: 1 }), /Invalid payment/);
  assert.equal(calls.length, 0);
});
