/* eslint-disable @typescript-eslint/no-require-imports -- Isolated server-module mocks. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, imports, env = {}, clock = Date) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const testModule = { exports: {} };
  vm.runInNewContext(output, {
    module: testModule, exports: testModule.exports, Buffer, Date: clock, Intl, console: { error() {} },
    process: { env, cwd: () => process.cwd() },
    require(name) {
      if (name === '@/lib/spin-pricing') return require('./helpers/spin-pricing.cjs');
      if (!(name in imports)) throw new Error(`Unexpected import ${name}`);
      return imports[name];
    },
  });
  return testModule.exports;
}

function mailer(response = { data: { id: 'email-receipt' }, error: null }) {
  const calls = [];
  class Resend {
    emails = { send: async (...args) => { calls.push(args); return response; } };
  }
  const exports = load('lib/server/purchase-email.ts', {
    'node:fs/promises': require('node:fs/promises'), 'node:path': require('node:path'), resend: { Resend },
  }, { RESEND_API_KEY: 'fake', WIN_EMAIL_FROM: 'Spin for Chinuch <prizes@example.invalid>' });
  return { ...exports, calls };
}

test('chosen navy email uses exact subject, actual purchase values, and all six inline graphics', async () => {
  const { sendPurchaseConfirmation, calls } = mailer();
  assert.equal(await sendPurchaseConfirmation('buyer@example.invalid', { id: 'pi_test', spins: 3, amount: 5400 }), 'email-receipt');
  const [email, options] = calls[0];
  assert.equal(email.subject, 'Your Purchase is Confirmed');
  assert.equal(email.to, 'buyer@example.invalid');
  assert.equal(email.from, 'Spin for Chinuch <prizes@example.invalid>');
  assert.equal(email.replyTo, 'spinforchinuchyehudi@gmail.com');
  assert.match(email.html, />3<\/p>/);
  assert.match(email.html, /\$54\.00/);
  assert.match(email.html, /background-color:#102A52/);
  assert.match(email.html, /https:\/\/www\.spinforchinuchyehudi\.com\/spin/);
  assert.doesNotMatch(email.html, /\{\{|Your payment went through/);
  assert.match(email.text, /Spins purchased: 3\nTotal paid: \$54\.00/);
  assert.equal(options.idempotencyKey, 'purchase-confirmation/pi_test');
  const ids = new Set([...email.html.matchAll(/cid:([^"\s]+)/g)].map(match => match[1]));
  assert.equal(ids.size, 6);
  assert.deepEqual(new Set(email.attachments.map(attachment => attachment.contentId)), ids);
  for (const attachment of email.attachments) {
    assert.equal(attachment.contentType, 'image/png');
    assert.equal(attachment.content.subarray(1, 4).toString(), 'PNG');
  }
});

test('invalid email/amount cannot send; provider rejection or missing receipt must retry', async () => {
  const { sendPurchaseConfirmation, calls } = mailer();
  await assert.rejects(sendPurchaseConfirmation('buyer@example.invalid\nBcc:x@x.invalid', { id: 'pi_test', spins: 2, amount: 3600 }));
  await assert.rejects(sendPurchaseConfirmation('buyer@example.invalid', { id: 'pi_test', spins: 2, amount: 1 }));
  assert.equal(calls.length, 0);
  for (const response of [{ error: { message: 'rejected' } }, { data: {} }]) {
    await assert.rejects(mailer(response).sendPurchaseConfirmation('buyer@example.invalid', { id: 'pi_test', spins: 2, amount: 3600 }), /not accepted/);
  }
});

test('confirmation email shows discounted package totals instead of the old per-spin price', async () => {
  for (const [spins, amount, total] of [[3, 5000, '$50.00'], [6, 9500, '$95.00'], [10, 15000, '$150.00']]) {
    const { sendPurchaseConfirmation, calls } = mailer();
    await sendPurchaseConfirmation('buyer@example.invalid', { id: 'pi_package', spins, amount });
    assert.ok(calls[0][0].html.includes(total));
    assert.ok(calls[0][0].text.includes(`Spins purchased: ${spins}`));
  }
});

function delivery({ missingPayment = false, authError = false, failStart = false, failReceipt = 0, providerFailure = false, bundle } = {}) {
  let now = 1800000000000;
  let email = 'buyer@example.invalid';
  const payment = { id: 'pi_test', status: 'succeeded', currency: 'usd', amount_received: 3600, metadata: { userId: 'user', spins: '2' } };
  if (bundle) {
    payment.amount_received = bundle.amount;
    Object.assign(payment.metadata, { spins: String(bundle.spins), packageId: bundle.id, pricingVersion: 'packages-v1' });
  }
  const recorded = { user_id: 'user', spins: Number(payment.metadata.spins), amount: payment.amount_received };
  const clone = value => JSON.parse(JSON.stringify(value));
  const calls = [];
  const accepted = new Map();
  const stripe = { paymentIntents: {
    retrieve: async () => clone(payment),
    update: async (id, update, options) => {
      calls.push(['metadata', clone(update.metadata), options]);
      if (failStart && update.metadata.purchase_confirmation_started_at) throw new Error('Stripe update failed');
      if (update.metadata.purchase_confirmation_email_id && failReceipt-- > 0) throw new Error('Receipt save failed');
      Object.assign(payment.metadata, update.metadata);
      return clone(payment);
    },
  } };
  const client = {
    from: () => ({ select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: missingPayment ? null : recorded, error: null }) }),
    auth: { admin: { getUserById: async id => { calls.push(['recipient', id]); return { data: { user: { email } }, error: authError }; } } },
  };
  const send = async (recipient, purchase) => {
    calls.push(['send', recipient, clone(purchase)]);
    if (providerFailure) throw new Error('Email service unavailable');
    if (!accepted.has(purchase.id)) accepted.set(purchase.id, 'email-receipt');
    return accepted.get(purchase.id);
  };
  const { deliverPurchaseEmail } = load('lib/server/deliver-purchase-email.ts', {
    '@/lib/server/supabase': { supabaseAdmin: client }, '@/lib/server/purchase-email': { sendPurchaseConfirmation: send },
  }, {}, class extends Date { static now() { return now; } });
  return { run: () => deliverPurchaseEmail(stripe, payment.id), payment, calls, accepted,
    advance: hours => { now += hours * 3600000; }, changeEmail: value => { email = value; } };
}

test('successful email stores a durable receipt and late webhook replays do not resend', async () => {
  const d = delivery();
  assert.equal(await d.run(), 'email-receipt');
  assert.equal(d.payment.metadata.purchase_confirmation_email_id, 'email-receipt');
  assert.equal(d.calls.find(call => call[0] === 'metadata')[2].idempotencyKey, 'purchase-confirmation-start/pi_test');
  d.advance(48);
  await d.run();
  assert.equal(d.calls.filter(call => call[0] === 'send').length, 1);
});

test('discounted package confirmation verifies the recorded purchase and sends its actual total', async () => {
  for (const bundle of [{ spins: 3, amount: 5000, id: 'three-spins' }, { spins: 6, amount: 9500, id: 'six-spins' }, { spins: 10, amount: 15000, id: 'ten-spins' }]) {
    const d = delivery({ bundle });
    await d.run();
    const sent = d.calls.find(call => call[0] === 'send')[2];
    assert.equal(sent.spins, bundle.spins);
    assert.equal(sent.amount, bundle.amount);
  }
});

test('lost receipt write retries the same purchase and freezes the original recipient', async () => {
  const d = delivery({ failReceipt: 1 });
  await assert.rejects(d.run(), /Receipt save failed/);
  d.changeEmail('changed@example.invalid');
  d.advance(1);
  await d.run();
  assert.equal(d.accepted.size, 1);
  assert.equal(d.calls.filter(call => call[0] === 'recipient').length, 1);
  const sends = d.calls.filter(call => call[0] === 'send');
  assert.equal(sends.length, 2);
  assert.deepEqual(sends[0], sends[1]);
});

test('uncertain delivery past the provider deduplication window requires manual review', async () => {
  const d = delivery({ failReceipt: 1 });
  await assert.rejects(d.run());
  d.advance(23);
  await assert.rejects(d.run(), /manual review/);
  assert.equal(d.calls.filter(call => call[0] === 'send').length, 1);
});

test('concurrent webhook deliveries share one logical email and durable receipt', async () => {
  const d = delivery();
  await Promise.all([d.run(), d.run()]);
  assert.equal(d.accepted.size, 1);
  assert.equal(d.payment.metadata.purchase_confirmation_email_id, 'email-receipt');
});

test('missing credited purchase, recipient, or durable send marker prevents email', async () => {
  for (const options of [{ missingPayment: true }, { authError: true }, { failStart: true }]) {
    const d = delivery(options);
    await assert.rejects(d.run());
    assert.equal(d.calls.filter(call => call[0] === 'send').length, 0);
  }
  const d = delivery();
  d.payment.status = 'processing';
  await assert.rejects(d.run(), /Invalid completed purchase/);
  assert.equal(d.calls.length, 0);
});

test('provider failure leaves purchase eligible for a safe webhook retry', async () => {
  const d = delivery({ providerFailure: true });
  await assert.rejects(d.run(), /Email service unavailable/);
  assert.ok(d.payment.metadata.purchase_confirmation_started_at);
  assert.equal(d.payment.metadata.purchase_confirmation_email_id, undefined);
});

function webhook({ status = 'succeeded', emailError = false, creditError = false, eventType = 'payment_intent.succeeded' } = {}) {
  const calls = [];
  const payment = { id: 'pi_test', currency: 'usd', amount_received: 3600, metadata: { userId: 'user', spins: '2' } };
  class Stripe { webhooks = { constructEvent: () => ({ type: eventType, data: { object: payment } }) }; }
  const { POST } = load('app/api/webhook/route.ts', {
    'next/server': { NextResponse: Response }, stripe: Stripe,
    '@/lib/server/settle-payment': { settlePayment: async () => { calls.push('credit'); if (creditError) throw new Error('Credit failed'); return { status, spins: 2 }; } },
    '@/lib/server/deliver-purchase-email': { deliverPurchaseEmail: async () => { calls.push('email'); if (emailError) throw new Error('Email failed'); } },
  }, { STRIPE_SECRET_KEY: 'fake', STRIPE_WEBHOOK_SECRET: 'fake' });
  return { calls, payment, run: signature => POST(new Request('https://example.invalid/api/webhook', { method: 'POST', headers: signature === false ? {} : { 'stripe-signature': 'fake' }, body: '{}' })) };
}

test('webhook emails only after successful credit; refunds and unrelated events never send', async () => {
  const success = webhook();
  assert.equal((await success.run()).status, 200);
  assert.deepEqual(success.calls, ['credit', 'email']);
  for (const status of ['refunded', 'refund_pending']) {
    const d = webhook({ status });
    assert.equal((await d.run()).status, 200);
    assert.deepEqual(d.calls, ['credit']);
  }
  const unrelated = webhook({ eventType: 'payment_intent.processing' });
  assert.equal((await unrelated.run()).status, 200);
  assert.deepEqual(unrelated.calls, []);
});

test('webhook failures request retries; missing signatures and invalid purchase values cannot send', async () => {
  for (const options of [{ emailError: true }, { creditError: true }]) {
    const d = webhook(options);
    assert.equal((await d.run()).status, 500);
    assert.deepEqual(d.calls, options.creditError ? ['credit'] : ['credit', 'email']);
  }
  const unsigned = webhook();
  assert.equal((await unsigned.run(false)).status, 400);
  assert.deepEqual(unsigned.calls, []);
  const invalid = webhook();
  invalid.payment.amount_received = 1;
  assert.equal((await invalid.run()).status, 400);
  assert.deepEqual(invalid.calls, []);
});
