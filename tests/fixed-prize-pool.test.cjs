/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require(process.env.PGLITE_TEST_MODULE || '@electric-sql/pglite');
const user = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const install = fs.readFileSync('supabase/fixed-prize-pool.sql', 'utf8');

async function fixture() {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid,bucket_id text); alter table storage.objects enable row level security;
    create table profiles(id uuid primary key,email text,remaining_spins integer,updated_at timestamptz);
    create table prizes(id bigint primary key,name text,active boolean,quantity integer,retail_value numeric,sponsor_name text,delivery_type text,delivery_instructions text,image_url text);
    create table wheel_outcomes(id bigint primary key,active boolean,probability numeric check(probability>0),type text,prize_id bigint,label text);
    create table wins(id bigint generated always as identity primary key,user_id uuid,user_email text,prize text,prize_id bigint references prizes(id),outcome_id bigint,retail_value numeric,sponsor_name text,delivery_type text,delivery_instructions text,status text);
    create table spin_history(user_id uuid,outcome_id bigint,won boolean);
    create function perform_spin(uuid) returns jsonb language sql as 'select null::jsonb';
    insert into profiles values('${user}','test@example.invalid',1100,now()),('${other}','other@example.invalid',1,now());
    grant select,update on profiles to service_role;
    insert into prizes values(1,'Ulta',true,2,10,null,null,null,null),(2,'New prize',true,1,100,null,null,null,null),(3,'Inactive',false,99,1,null,null,null,null),(4,'Empty',true,0,1,null,null,null,null);
    insert into wheel_outcomes values(1,true,25,'prize',1,'Old label'),(2,true,999,'prize',2,'Prize'),(3,true,1,'loss',null,'Try Again'),(4,true,10,'loss',null,'Spin Again'),(5,true,1,'prize',3,'Inactive'),(6,true,1,'prize',4,'Empty');`);
  await db.exec(fs.readFileSync('supabase/migrations/20261011_prize_gift_cards.sql','utf8'));
  await db.exec(fs.readFileSync('supabase/idempotent-spins.sql','utf8'));
  return db;
}

test('1100 draws consume exactly the live stock and loss count; replay and permissions are safe', async () => {
  const db = await fixture();
  try {
    // Change stock after defining outcomes: installation must use new stock, not old weights.
    await db.exec('update prizes set quantity=3 where id=1');
    await db.exec(install);
    assert.deepEqual((await db.query('select initial_count from campaign_pool.entries order by outcome_id')).rows.map(r=>r.initial_count),[3,1,1096]);
    assert.equal((await db.query('select label from wheel_outcomes where id=1')).rows[0].label,'Ulta');
    await assert.rejects(db.exec("update wheel_outcomes set probability=2 where id=1"),/locked/);
    await assert.rejects(db.exec("update wheel_outcomes set prize_id=2 where id=1"),/locked/);
    await assert.rejects(db.exec("update prizes set quantity=4 where id=1"),/locked/);
    await assert.rejects(db.exec("update prizes set active=false where id=1"),/locked/);
    await assert.rejects(db.exec("update prizes set active=true where id=3"),/adjustment/);
    await db.exec("update prizes set name='Updated Ulta' where id=1");
    for(const role of ['anon','authenticated','service_role']) {
      await db.exec('set role '+role);
      await assert.rejects(db.exec('select * from campaign_pool.entries'),/permission denied/);
      if(role!=='service_role') {
        await assert.rejects(db.exec(`select perform_spin('${user}')`),/permission denied/);
        await assert.rejects(db.exec('select fixed_pool_status()'),/permission denied/);
      }
      await db.exec('reset role');
    }
    const request='33333333-3333-4333-8333-333333333333';
    await db.exec('set role service_role');
    const spin=async key=>(await db.query('select perform_spin_once($1,$2,false) as result',[user,key])).rows[0].result;
    const first=await spin(request);
    assert.equal(first.replayed,false);
    assert.equal((await spin(request)).replayed,true);
    assert.equal((await db.query('select fixed_pool_status() as s')).rows[0].s.remaining,1099);
    await db.exec('reset role; begin');
    await db.query('select perform_spin_once($1,$2,false)',[user,other]);
    await db.exec('rollback');
    await db.exec('reset role');
    assert.equal((await db.query('select remaining from campaign_pool.state')).rows[0].remaining,1099);
    // PostgreSQL runs the whole campaign locally; no production spins or emails.
    await db.exec(`do $$ begin for i in 1..1099 loop
      perform public.perform_spin_once('${user}',gen_random_uuid(),false);
    end loop; end $$;`);
    assert.equal((await db.query('select count(*)::integer n from wins')).rows[0].n,4);
    assert.equal((await db.query('select count(*)::integer n from spin_history where not won')).rows[0].n,1096);
    assert.equal((await db.query('select sum(remaining)::integer n from campaign_pool.entries')).rows[0].n,0);
    assert.equal((await db.query('select sum(quantity)::integer n from prizes where id in (1,2)')).rows[0].n,0);
    assert.equal((await db.query('select count(*)::integer n from spin_requests')).rows[0].n,1100);
    assert.equal((await spin(request)).replayed,true,'a replay works even after pool exhaustion');
    await assert.rejects(db.exec(`select perform_spin('${other}')`),/No eligible pool results/);
    assert.equal((await db.query(`select remaining_spins from profiles where id='${other}'`)).rows[0].remaining_spins,1);
    assert.equal((await db.query('select count(*)::integer n from spin_history')).rows[0].n,1100);
  } finally { await db.close(); }
});

test('gift-card reservations and failed writes roll back pool consumption with the win', async () => {
  const db=await fixture();
  try {
    // An all-winning pool makes the gift-card path deterministic.
    await db.exec('update prizes set quantity=1099 where id=1');
    await db.exec(install);
    await db.exec(`insert into prize_gift_cards(prize_id,filename,storage_path,sha256)
      select case when i=1100 then 2 else 1 end,i||'.pdf',i||'.pdf',i::text from generate_series(1,1100) i;`);
    await db.exec(`create function fail_history() returns trigger language plpgsql as $$ begin raise exception 'Simulated history failure'; end $$;
      create trigger fail_history before insert on spin_history for each row execute function fail_history();`);
    await assert.rejects(db.exec(`select perform_spin_once('${user}',gen_random_uuid(),true)`),/Simulated history failure/);
    assert.equal((await db.query('select remaining from campaign_pool.state')).rows[0].remaining,1100);
    assert.equal((await db.query('select count(*)::integer n from wins')).rows[0].n,0);
    assert.equal((await db.query('select count(*)::integer n from prize_gift_cards where win_id is not null')).rows[0].n,0);
    await db.exec('drop trigger fail_history on spin_history');
    const request='33333333-3333-4333-8333-333333333333';
    const result=(await db.query('select perform_spin_once($1,$2,true) as r',[user,request])).rows[0].r;
    assert.equal(result.won,true);
    assert.ok(result.winId);
    assert.equal((await db.query('select win_id from prize_gift_cards where win_id is not null')).rows[0].win_id,result.winId);
    assert.equal((await db.query('select remaining from campaign_pool.state')).rows[0].remaining,1099);
    assert.equal((await db.query('select perform_spin_once($1,$2,false) as r',[user,request])).rows[0].r.winId,result.winId);
    await assert.rejects(db.exec(install),/before the first used spin/);
    await db.exec('rollback');
  } finally { await db.close(); }
});

test('installation rejects oversized stock and ambiguous prize outcomes without partial changes',async()=>{
  const db=await fixture();
  try {
    await db.exec('update prizes set quantity=1100 where id=1');
    await assert.rejects(db.exec(install),/exceeds/);
    await db.exec('rollback; update prizes set quantity=2 where id=1');
    await db.exec("insert into wheel_outcomes values(7,true,1,'prize',1,'Duplicate')");
    await assert.rejects(db.exec(install),/exactly one prize outcome/);
    await db.exec('rollback');
    assert.equal((await db.query("select to_regnamespace('campaign_pool') as n")).rows[0].n,null);
  }finally{await db.close();}
});
