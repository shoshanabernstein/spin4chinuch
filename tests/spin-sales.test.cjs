/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { PGlite } = require(process.env.PGLITE_TEST_MODULE || '@electric-sql/pglite');
const moduleExports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/spin-sales.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: moduleExports });

test('sales availability reaches zero at 1100 and rejects invalid counts', () => {
  const { remainingSpinsForSale: remaining } = moduleExports;
  assert.equal(remaining(0), 1100);
  assert.equal(remaining('1099'), 1);
  assert.equal(remaining(1100), 0);
  assert.equal(remaining(1101), 0);
  for (const count of [-1, 1.5, 'bad', undefined, null, '']) assert.throws(() => remaining(count));
});

test('database allows the final purchase, replays safely, and rolls back excess sales', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role;
      create table profiles(id uuid primary key, remaining_spins integer, total_spins integer, updated_at timestamptz);
      create table payment_logs(payment_intent_id text unique, user_id uuid, spins integer, amount integer);
      insert into profiles values ('11111111-1111-1111-1111-111111111111',0,0,now());
      insert into payment_logs values ('prior', '11111111-1111-1111-1111-111111111111',1099,1978200);`);
    await db.exec(fs.readFileSync('supabase/campaign-1100-spin-limit.sql', 'utf8'));
    const credit = id => db.query(`select public.credit_completed_payment($1,'11111111-1111-1111-1111-111111111111',1,1800) as credited`, [id]);
    assert.equal((await credit('last')).rows[0].credited, true);
    assert.equal((await credit('last')).rows[0].credited, false);
    await assert.rejects(credit('excess'), /1100 spin limit/);
    assert.equal((await db.query('select sum(spins)::integer as sold from payment_logs')).rows[0].sold, 1100);
    assert.equal((await db.query('select remaining_spins from profiles')).rows[0].remaining_spins, 1);
  } finally { await db.close(); }
});
