/* eslint-disable @typescript-eslint/no-require-imports -- Node's CommonJS test runner and isolated module mocks. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, imports, env = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const testModule = { exports: {} };
  vm.runInNewContext(source, {
    module: testModule, exports: testModule.exports, Buffer, console,
    process: { env }, URL,
    require(name) { if (!(name in imports)) throw new Error(`Unexpected import ${name}`); return imports[name]; },
  });
  return testModule.exports;
}

test('existing email stays standard; gift email attaches PDF and uses a stable key', async () => {
  const calls = [];
  class Resend { emails = { send: async (...args) => { calls.push(args); return { data: { id: 'receipt' }, error: null }; } }; }
  const { sendWinEmail } = load('lib/server/win-email.ts', { resend: { Resend } }, { RESEND_API_KEY: 'fake', WIN_EMAIL_FROM: 'test@example.invalid' });
  await sendWinEmail('winner@example.invalid', 'Prize <A>');
  assert.match(calls[0][0].html, /What happens next\?/);
  assert.match(calls[0][0].html, /Prize &lt;A&gt;/);
  assert.equal(calls[0][0].attachments, undefined);
  assert.equal(calls[0][1], undefined);
  const content = Buffer.from('%PDF-test');
  await sendWinEmail('winner@example.invalid', 'Prize A', null, { content, id: 'unique-card' });
  assert.match(calls[1][0].html, /Your E-Gift Card Is Here!/);
  assert.doesNotMatch(calls[1][0].html, /What happens next\?/);
  assert.match(calls[1][0].text, /attached.*PDF/);
  assert.equal(calls[1][0].attachments[0].content, content);
  assert.equal(calls[1][1].idempotencyKey, 'gift-card/unique-card');
});

test('provider rejection and missing receipt are errors', async () => {
  for (const response of [{ error: { message: 'Rejected' } }, { data: {} }]) {
    class Resend { emails = { send: async () => response }; }
    const { sendWinEmail } = load('lib/server/win-email.ts', { resend: { Resend } }, { RESEND_API_KEY: 'fake', WIN_EMAIL_FROM: 'test@example.invalid' });
    await assert.rejects(sendWinEmail('winner@example.invalid', 'Prize A'));
  }
});

function service({ exists = true, lookupError = false, claimError = false, claimed = true, downloadError = false, emailError = false, finishError = false } = {}) {
  const calls = [];
  const card = { id: 'card-id', storage_path: 'private.pdf', recipient: 'winner@example.invalid', prize_name: 'Prize A', image_url: null, lease_token: 'lease' };
  const client = {
    from() {
      const query = {
        select() { return this; }, eq() { return this; },
        maybeSingle: async () => ({ data: exists ? { id: card.id } : null, error: lookupError }),
        update(value) { calls.push(['update', value]); return this; },
        is: async () => ({ error: null }),
      };
      return query;
    },
    rpc: async (name, args) => {
      calls.push([name, args]);
      if (name === 'claim_gift_card_email') return { data: claimed ? card : null, error: claimError };
      return { error: finishError };
    },
    storage: { from: () => ({ download: async () => ({ data: { arrayBuffer: async () => Buffer.from('%PDF-test') }, error: downloadError }) }) },
  };
  const sendWinEmail = async (...args) => { calls.push(['send', args]); if (emailError) throw new Error('Provider error'); return 'receipt'; };
  const api = load('lib/server/gift-cards.ts', { '@/lib/server/supabase': { supabaseAdmin: client }, '@/lib/server/win-email': { sendWinEmail } });
  return { ...api, calls };
}

test('no assigned PDF is the only path permitting the standard email', async () => {
  const noCard = service({ exists: false });
  assert.equal(await noCard.deliverGiftCard(1), false);
  assert.equal(noCard.calls.length, 0);
  for (const options of [{ lookupError: true }, { claimError: true }, { downloadError: true }, { emailError: true }, { finishError: true }]) {
    const current = service(options);
    await assert.rejects(current.deliverGiftCard(1));
    if (!options.finishError) assert.equal(current.calls.some(call => call[0] === 'finish_gift_card_email'), false);
    for (const [, update] of current.calls.filter(call => call[0] === 'update')) {
      assert.equal(update.win_id, undefined, 'never release a reserved PDF');
    }
  }
});

test('already claimed emails do not send again; success records receipt and lease', async () => {
  const leased = service({ claimed: false });
  assert.equal(await leased.deliverGiftCard(5), true);
  assert.equal(leased.calls.some(call => call[0] === 'send'), false);
  const success = service();
  assert.equal(await success.deliverGiftCard(5), true);
  const finish = success.calls.find(call => call[0] === 'finish_gift_card_email')[1];
  assert.equal(finish.p_win_id, 5);
  assert.equal(finish.p_email_id, 'receipt');
  assert.equal(finish.p_token, 'lease');
});

test('admin PDF routes reject non-admin access before touching storage or data', async () => {
  for (const file of ['app/api/admin/gift-cards/route.ts', 'app/api/admin/gift-cards/download/route.ts', 'app/api/admin/gift-card-deliveries/route.ts']) {
    const routes = load(file, {
      'node:crypto': require('node:crypto'),
      'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
      '@/lib/server/admin': { requireAdmin: async () => ({ error: 'Administrator access required', status: 403 }) },
      '@/lib/server/supabase': { supabaseAdmin: new Proxy({}, { get() { throw new Error('Unauthorized data access'); } }) },
      '@/lib/server/gift-cards': { giftCardsEnabled: () => true },
    });
    for (const method of ['GET', 'POST', 'DELETE']) {
      if (routes[method]) assert.equal((await routes[method]({})).status, 403);
    }
  }
});

test('disabled feature keeps the original spin RPC and original email', async () => {
  let usedRpc;
  let emails = 0;
  const routes = load('app/api/spin/route.ts', {
    'next/server': { NextResponse: { json: body => body } },
    '@/lib/server/supabase': {
      getRequestUser: async () => ({ id: 'user', email: 'test@example.invalid' }),
      supabaseAdmin: {
        rpc: async name => { usedRpc = name; return { data: { won: true, prize: { id: 1, name: 'Prize A' } } }; },
        from: () => ({ select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: { image_url: null } }) }),
      },
    },
    '@/lib/server/win-email': { sendWinEmail: async () => { emails++; } },
    '@/lib/server/sponsor-notification': { notifyPrizeSponsor: async () => {} },
    '@/lib/server/gift-cards': { giftCardsEnabled: () => false, deliverGiftCard: () => { throw new Error('Disabled feature was invoked'); } },
  });
  const response = await routes.POST({});
  assert.equal(response.success, true);
  assert.equal(usedRpc, 'perform_spin');
  assert.equal(emails, 1);
});


test('sponsor email uses requested copy, escapes winner details, and has no PDF', async () => {
  const calls = [];
  class Resend { emails = { send: async (...args) => { calls.push(args); return { data: { id: 'receipt' } }; } }; }
  const { sendSponsorWinEmail } = load('lib/server/win-email.ts', { resend: { Resend } }, { RESEND_API_KEY: 'fake', WIN_EMAIL_FROM: 'test@example.invalid' });
  await sendSponsorWinEmail('sponsor@example.invalid', '<Winner>', 'winner@example.invalid', 'Prize <A>', 42);
  const [message, options] = calls[0];
  assert.equal(message.to, 'sponsor@example.invalid');
  assert.equal(message.subject, 'Chinuch Yehudi Campaign – Winner Prize Delivery');
  assert.match(message.html, /&lt;Winner&gt;/);
  assert.match(message.html, /&lt;A&gt;/);
  assert.match(message.text, /Please email the prize directly to the winner/);
  assert.match(message.text, /winner@example.invalid/);
  assert.equal(message.attachments, undefined);
  assert.equal(options.idempotencyKey, 'sponsor-win/42');
});

test('sponsor notifications are opt-in and use the profile name', async () => {
  const calls = [];
  let address = null;
  const client = { from(table) { return { select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: { notification_email: address } }), single: async () => ({ data: { first_name: 'First', last_name: 'Last' } }) }; } };
  const { notifyPrizeSponsor } = load('lib/server/sponsor-notification.ts', {
    '@/lib/server/supabase': { supabaseAdmin: client },
    '@/lib/server/win-email': { sendSponsorWinEmail: async (...args) => calls.push(args) },
  });
  await notifyPrizeSponsor(1, 'user', 'winner@example.invalid', 'Prize', 42);
  assert.equal(calls.length, 0);
  address = 'sponsor@example.invalid';
  await notifyPrizeSponsor(1, 'user', 'winner@example.invalid', 'Prize', 42);
  assert.equal(calls[0][1], 'First Last');
  assert.equal(calls[0][2], 'winner@example.invalid');
});


test('spin notifies sponsors only for standard delivery, never assigned or failed PDF delivery', async () => {
  for (const delivery of ['standard', 'pdf', 'failed']) {
    let winnerEmails = 0;
    let sponsorEmails = 0;
    const routes = load('app/api/spin/route.ts', {
      'next/server': { NextResponse: { json: body => body } },
      '@/lib/server/supabase': {
        getRequestUser: async () => ({ id: 'user', email: 'winner@example.invalid' }),
        supabaseAdmin: {
          rpc: async () => ({ data: { won: true, winId: 42, prize: { id: 1, name: 'Prize A' } } }),
          from: () => ({ select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: { image_url: null } }) }),
        },
      },
      '@/lib/server/win-email': { sendWinEmail: async () => { winnerEmails++; } },
      '@/lib/server/sponsor-notification': { notifyPrizeSponsor: async () => { sponsorEmails++; } },
      '@/lib/server/gift-cards': { giftCardsEnabled: () => true, deliverGiftCard: async () => { if (delivery === 'failed') throw new Error('Simulated PDF failure'); return delivery === 'pdf'; } },
    });
    const response = await routes.POST({});
    assert.equal(response.success, true);
    assert.equal(winnerEmails, delivery === 'standard' ? 1 : 0);
    assert.equal(sponsorEmails, delivery === 'standard' ? 1 : 0);
  }
});
