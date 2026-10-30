/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const pricing = require('./helpers/spin-pricing.cjs');
const packages = [[3, 5000, 'three-spins'], [6, 9500, 'six-spins'], [10, 15000, 'ten-spins']];

test('approved packages have exact totals and increasing savings; individual pricing is preserved', () => {
  for (const [spins, amount, id] of packages) {
    assert.equal(pricing.getSpinOrderAmount(spins, id), amount);
    assert.equal(pricing.getSpinOrderAmount(spins), spins * 1800);
    assert.throws(() => pricing.getSpinOrderAmount(spins + 1, id));
  }
  assert.equal(pricing.getSpinOrderAmount(1), 1800);
  assert.throws(() => pricing.getSpinOrderAmount(3, 'fake'));
  for (const invalid of [0, -1, 1.5, 101, NaN]) assert.throws(() => pricing.getSpinOrderAmount(invalid));
});

test('versioned payment validation accepts exact bundles and rejects tampering while accepting legacy payments', () => {
  for (const [spins, amount, packageId] of packages) {
    const metadata = { spins: String(spins), packageId, pricingVersion: 'packages-v1' };
    assert.equal(pricing.isValidSpinPayment(metadata, amount), true);
    assert.equal(pricing.isValidSpinPayment(metadata, amount - 1), false);
    assert.equal(pricing.isValidSpinPayment({ ...metadata, spins: '100' }, amount), false);
    assert.equal(pricing.isValidSpinPayment({ ...metadata, pricingVersion: 'fake' }, amount), false);
    assert.equal(pricing.isValidSpinPayment({ spins: String(spins) }, amount), false);
    assert.equal(pricing.isValidSpinPayment({ spins: String(spins) }, spins * 1800), true);
  }
});

function endpoint(file, imports) {
  const testModule = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText, {
    module: testModule, exports: testModule.exports, URL, console: { error() {} },
    process: { env: { STRIPE_SECRET_KEY: 'fake' } },
    require: name => name === '@/lib/spin-pricing' ? pricing : imports[name],
  });
  return testModule.exports;
}

function checkout({ available = 1100, authenticated = true } = {}) {
  const calls = [];
  class Stripe { paymentIntents = { create: async payload => { calls.push(payload); return { client_secret: 'fake-secret' }; } }; }
  const { POST } = endpoint('app/api/create-payment-intent/route.ts', {
    'next/server': { NextResponse: Response }, stripe: Stripe,
    '@/lib/server/supabase': { getRequestUser: async () => authenticated ? { id: 'user' } : null, supabaseAdmin: { rpc: async () => ({ data: 1100 - available, error: null }) } },
    '@/lib/spin-sales': { remainingSpinsForSale: sold => 1100 - sold, SOLD_OUT_MESSAGE: 'Sold out' },
  });
  return { calls, run: body => POST(new Request('https://example.invalid/api/create-payment-intent', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })) };
}

test('checkout computes the approved package amount on the server and ignores submitted prices', async () => {
  for (const [quantity, amount, packageId] of packages) {
    const d = checkout();
    const response = await d.run({ quantity, packageId, amount: 1 });
    assert.equal(response.status, 200);
    const quote = await response.json();
    assert.equal(quote.amount, amount);
    assert.equal(quote.quantity, quantity);
    assert.equal(quote.packageId, packageId);
    assert.equal(d.calls[0].amount, amount);
    assert.equal(d.calls[0].metadata.packageId, packageId);
    assert.equal(d.calls[0].metadata.pricingVersion, 'packages-v1');
  }
});

test('unauthenticated, sold-out, insufficient-stock and forged-package requests never create a payment', async () => {
  for (const [options, body, status] of [
    [{ authenticated: false }, { quantity: 3, packageId: 'three-spins' }, 401],
    [{ available: 0 }, { quantity: 3, packageId: 'three-spins' }, 409],
    [{ available: 5 }, { quantity: 6, packageId: 'six-spins' }, 409],
    [{}, { quantity: 100, packageId: 'three-spins' }, 400],
    [{}, { quantity: 3, packageId: 'fake' }, 400],
  ]) {
    const d = checkout(options);
    assert.equal((await d.run(body)).status, status);
    assert.equal(d.calls.length, 0);
  }
});

test('return-page verification settles discounted purchases and rejects unsupported totals', async () => {
  for (const [spins, amount, packageId] of packages) {
    const payment = { status: 'succeeded', currency: 'usd', amount_received: amount, metadata: { userId: 'user', spins: String(spins), packageId, pricingVersion: 'packages-v1' } };
    const calls = [];
    class Stripe { paymentIntents = { retrieve: async () => payment }; }
    const { GET } = endpoint('app/api/payment-status/route.ts', {
      'next/server': { NextResponse: Response }, stripe: Stripe,
      '@/lib/server/supabase': { getRequestUser: async () => ({ id: 'user' }) },
      '@/lib/server/settle-payment': { settlePayment: async (_stripe, p) => { calls.push(p); return { status: 'succeeded', spins }; } },
    });
    const request = () => new Request('https://example.invalid/api/payment-status?payment_intent=pi_test');
    assert.equal((await GET(request())).status, 200);
    assert.equal(calls.length, 1);
    payment.amount_received = 1;
    assert.equal((await GET(request())).status, 400);
    assert.equal(calls.length, 1);
  }
});
