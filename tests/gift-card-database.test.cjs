/* eslint-disable @typescript-eslint/no-require-imports -- Node's CommonJS test runner. */
// Run with PGLITE_TEST_MODULE pointing to an isolated @electric-sql/pglite install.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require(process.env.PGLITE_TEST_MODULE || '@electric-sql/pglite');

test('gift card reservation, permissions, fulfillment, retries and rollback', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create schema storage;
      create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
      create table storage.objects(id text, bucket_id text);
      alter table storage.objects enable row level security;
      grant usage on schema storage to authenticated;
      grant all on storage.objects to authenticated;
      create policy broad_existing_storage_policy on storage.objects for all to authenticated using (true) with check (true);
      create table profiles(id uuid primary key, email text, remaining_spins integer, updated_at timestamptz);
      create table prizes(id bigint primary key, name text, active boolean, quantity integer, retail_value numeric, sponsor_name text, delivery_type text, delivery_instructions text, image_url text);
      create table wheel_outcomes(id bigint primary key, active boolean, probability numeric, type text, prize_id bigint, label text);
      create table wins(id bigint generated always as identity primary key, user_id uuid, user_email text, prize text, prize_id bigint references prizes(id), outcome_id bigint, retail_value numeric, sponsor_name text, delivery_type text, delivery_instructions text, status text);
      create table spin_history(user_id uuid, outcome_id bigint, won boolean);
    `);
    await db.exec(fs.readFileSync('supabase/migrations/20260825_spin_again.sql', 'utf8'));
    await db.exec(fs.readFileSync('supabase/migrations/20261011_prize_gift_cards.sql', 'utf8'));
    await db.exec(fs.readFileSync('supabase/idempotent-spins.sql', 'utf8'));
    const uid = '11111111-1111-1111-1111-111111111111';
    await db.exec(`insert into profiles values ('${uid}', 'test@example.invalid', 20, now());
      insert into prizes values (1,'Prize A',true,10,5,null,null,null,null),(2,'Prize B',true,10,5,null,null,null,null);
      insert into wheel_outcomes values (1,true,1,'prize',1,'Prize A');
      insert into prize_gift_cards(prize_id,filename,storage_path,sha256) values (1,'a.pdf','a.pdf','hash-a'),(1,'b.pdf','b.pdf','hash-b'),(2,'c.pdf','c.pdf','hash-c');`);
    async function scalar(sql) { return (await db.query(sql)).rows[0].value; }
    async function spin(enabled = true) { return scalar(`select public.${enabled ? 'perform_spin_with_gift_cards' : 'perform_spin'}('${uid}') as value`); }
    await spin(false);
    assert.equal(await scalar('select count(*)::int as value from prize_gift_cards where win_id is not null'), 0, 'disabled feature does not reserve');
    const replayKey = '44444444-4444-4444-8444-444444444444';
    const replaySql = `select perform_spin_once('${uid}','${replayKey}',true) as value`;
    const first = await scalar(replaySql);
    const stockBeforeReplay = await scalar('select quantity as value from prizes where id=1');
    const historyBeforeReplay = await scalar('select count(*)::int as value from spin_history');
    const replay = await scalar(replaySql);
    assert.equal(replay.replayed, true);
    assert.equal(replay.winId, first.winId);
    assert.equal(await scalar('select quantity as value from prizes where id=1'), stockBeforeReplay);
    assert.equal(await scalar('select count(*)::int as value from spin_history'), historyBeforeReplay);
    const second = await spin();
    const third = await spin();
    assert.notEqual(first.winId, second.winId);
    assert.equal(await scalar(`select count(*)::int as value from prize_gift_cards where win_id in (${first.winId},${second.winId})`), 2);
    assert.equal(await scalar(`select count(*)::int as value from prize_gift_cards where win_id = ${third.winId}`), 0, 'exhausted cards use standard email');
    assert.equal(await scalar('select count(*)::int as value from prize_gift_cards where prize_id=2 and win_id is null'), 1, 'cannot allocate other prize card');
    await assert.rejects(db.exec("insert into prize_gift_cards(prize_id,filename,storage_path,sha256) values(1,'copy.pdf','copy.pdf','hash-a')"), /unique/);
    assert.equal(await scalar(`with removed as (delete from prize_gift_cards where win_id=${first.winId} and win_id is null returning id) select count(*)::int as value from removed`), 0);
    const claim = await scalar(`select claim_gift_card_email(${first.winId}) as value`);
    assert.equal(claim.recipient, 'test@example.invalid');
    assert.equal(await scalar(`select claim_gift_card_email(${first.winId}) as value`), null, 'lease blocks duplicate worker');
    assert.equal(await scalar(`select status as value from wins where id=${first.winId}`), 'Pending');
    await assert.rejects(db.exec(`select finish_gift_card_email(${first.winId},'00000000-0000-0000-0000-000000000000','email-1')`), /lease changed/);
    await db.exec(`select finish_gift_card_email(${first.winId},'${claim.lease_token}','email-1')`);
    assert.equal(await scalar(`select status as value from wins where id=${first.winId}`), 'Fulfilled');
    assert.equal(await scalar(`select claim_gift_card_email(${first.winId}) as value`), null);
    const pending = await scalar(`select claim_gift_card_email(${second.winId}) as value`);
    await db.exec(`update prize_gift_cards set lease_until=null where win_id=${second.winId}`);
    const retry = await scalar(`select claim_gift_card_email(${second.winId}) as value`);
    assert.equal(retry.id, pending.id, 'retry always uses same PDF');
    assert.notEqual(retry.lease_token, pending.lease_token);
    await db.exec(`update prize_gift_cards set lease_until=null,first_attempt_at=now()-interval '24 hours' where win_id=${second.winId}`);
    await assert.rejects(db.exec(`select claim_gift_card_email(${second.winId})`), /manual review/);
    await db.exec(`update wins set status='Cancelled' where id=${second.winId}`);
    assert.equal(await scalar(`select claim_gift_card_email(${second.winId}) as value`), null);
    assert.equal(await scalar(`select count(*)::int as value from prize_gift_cards where win_id=${second.winId}`), 1, 'cancelled card never recycled');
    await db.exec("insert into prize_gift_cards(prize_id,filename,storage_path,sha256) values(1,'d.pdf','d.pdf','hash-d')");
    const before = await scalar('select quantity as value from prizes where id=1');
    await db.exec('begin');
    await spin();
    await db.exec('rollback');
    assert.equal(await scalar('select quantity as value from prizes where id=1'), before);
    assert.equal(await scalar("select win_id as value from prize_gift_cards where sha256='hash-d'"), null, 'rollback releases reservation');
    assert.equal(await scalar("select public as value from storage.buckets where id='prize-gift-cards'"), false);
    await db.exec("insert into storage.objects values ('private.pdf','prize-gift-cards'),('public.jpg','other-bucket')");
    await db.exec('set role authenticated');
    assert.equal(await scalar('select count(*)::int as value from storage.objects'), 1, 'private bucket blocked even with broad existing policy');
    await assert.rejects(db.exec("insert into storage.objects values ('forbidden.pdf','prize-gift-cards')"), /row-level security/);
    await assert.rejects(db.exec('select * from prize_gift_cards'), /permission denied/);
    await assert.rejects(db.exec(`select perform_spin_with_gift_cards('${uid}')`), /permission denied/);
    await db.exec('reset role');
  } finally { await db.close(); }
});
