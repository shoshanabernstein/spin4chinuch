/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require(process.env.PGLITE_TEST_MODULE || '@electric-sql/pglite');

test('reset archives purchases, clears balances, restores stock, and prevents old payment replay', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role;
      create table profiles(id uuid primary key, remaining_spins integer, total_spins integer, updated_at timestamptz);
      create table prizes(id bigint primary key, quantity integer, original_quantity integer);
      create table wins(id bigint primary key, prize_id bigint);
      create table spin_history(id bigint primary key);
      create table payment_logs(id bigint generated always as identity, payment_intent_id text unique, user_id uuid, spins integer, amount integer);
      create table spin_requests(request_id uuid);
      create table prize_gift_cards(id bigint, win_id bigint references wins(id));
      create table wheel_outcomes(id bigint, probability integer, active boolean);
      create function public.sold_spin_count() returns bigint language sql as 'select coalesce(sum(spins),0)::bigint from payment_logs';
      insert into profiles values ('11111111-1111-1111-1111-111111111111',9,10,now());
      insert into prizes values (1,4,5);
      insert into wins values (1,1);
      insert into spin_history values (1);
      insert into payment_logs(payment_intent_id,user_id,spins,amount) values ('old','11111111-1111-1111-1111-111111111111',10,18000);
      insert into spin_requests values ('22222222-2222-2222-2222-222222222222');
      insert into prize_gift_cards values (1,1),(2,null);
      insert into wheel_outcomes values (1,25,true);`);
    await db.exec(fs.readFileSync('supabase/reset-campaign-20261025.sql', 'utf8'));
    const scalar = async sql => (await db.query(sql)).rows[0].value;
    assert.equal(await scalar('select public.sold_spin_count() as value'), 0);
    assert.equal(await scalar('select remaining_spins as value from profiles'), 0);
    assert.equal(await scalar('select quantity as value from prizes'), 5);
    assert.equal(await scalar('select count(*)::integer as value from wins'), 0);
    assert.equal(await scalar('select count(*)::integer as value from spin_requests'), 0);
    assert.equal(await scalar('select count(*)::integer as value from prize_gift_cards'), 1);
    assert.equal(await scalar('select count(*)::integer as value from campaign_reset_20261025.payment_logs'), 1);
    assert.equal(await scalar("select public.credit_completed_payment('old','11111111-1111-1111-1111-111111111111',10,18000) as value"), false);
    assert.equal(await scalar('select remaining_spins as value from profiles'), 0);
    assert.equal(await scalar("select public.credit_completed_payment('new','11111111-1111-1111-1111-111111111111',1,1800) as value"), true);
    assert.equal(await scalar('select public.sold_spin_count() as value'), 1);
    await assert.rejects(db.exec(fs.readFileSync('supabase/reset-campaign-20261025.sql', 'utf8')), /already exists/);
    await db.exec('rollback');
    assert.equal(await scalar('select public.sold_spin_count() as value'), 1);
  } finally { await db.close(); }
});
