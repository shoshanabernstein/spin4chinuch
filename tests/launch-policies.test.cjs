/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require(process.env.PGLITE_TEST_MODULE || '@electric-sql/pglite');
test('launch policies block role escalation, forged wins, inventory edits and cross-user reads', async () => {
 const db = new PGlite();
 const me='11111111-1111-4111-8111-111111111111';
 const other='22222222-2222-4222-8222-222222222222';
 const admin='33333333-3333-4333-8333-333333333333';
 try {
  await db.exec(`
   create role anon; create role authenticated; create role service_role bypassrls;
   create schema auth; grant usage on schema auth to anon,authenticated;
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create table profiles(id uuid primary key, role text, remaining_spins integer);
   create table prizes(id bigint primary key, active boolean, quantity integer);
   create table wins(id bigint primary key, user_id uuid);
   create table wheel_outcomes(id bigint primary key, active boolean, probability integer);
   insert into profiles values('${me}','user',1),('${other}','user',2),('${admin}','admin',0);
   insert into prizes values(1,true,5),(2,false,5);
   insert into wins values(1,'${me}'),(2,'${other}');
   insert into wheel_outcomes values(1,true,10);
   create function is_admin() returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from profiles where id=auth.uid() and role='admin')$$;
   grant all on profiles,prizes,wins,wheel_outcomes to anon,authenticated,service_role;
   create policy "users can update profiles" on profiles for update to authenticated using(true) with check(true);
   create policy "users can view profiles" on profiles for select to authenticated using(true);
   create policy "update prizes" on prizes for update to authenticated using(true) with check(true);
   create policy "users can insert wins" on wins for insert to authenticated with check(true);
  `);
  const sql=fs.readFileSync('supabase/fix-launch-policies.sql','utf8');
  await db.exec(sql);
  await db.exec(sql); // safe to rerun
  const rows=async(q)=>(await db.query(q)).rows;
  await db.exec(`set role authenticated; set request.jwt.claim.sub='${me}'`);
  assert.equal((await rows('select * from profiles')).length,1);
  assert.equal((await rows('select * from wins')).length,1);
  for(const q of [`update profiles set role='admin' where id='${me}'`, `update profiles set remaining_spins=999 where id='${me}'`, `insert into profiles values('44444444-4444-4444-8444-444444444444','admin',99)`]) await assert.rejects(db.exec(q),/permission denied/);
  assert.equal((await rows('update prizes set quantity=99 returning id')).length,0);
  assert.equal((await rows('delete from prizes returning id')).length,0);
  await assert.rejects(db.exec(`insert into wins values(3,'${me}')`),/row-level security/);
  assert.equal((await rows('select * from wheel_outcomes')).length,0);
  await db.exec(`set request.jwt.claim.sub='${admin}'`);
  assert.equal((await rows('select * from profiles')).length,3);
  assert.equal((await rows('update prizes set quantity=6 where id=1 returning id')).length,1);
  assert.equal((await rows('update wheel_outcomes set probability=11 returning id')).length,1);
  assert.equal((await rows('update wins set user_id=user_id where id=1 returning id')).length,1);
  await db.exec("reset role; set role anon; set request.jwt.claim.sub=''");
  assert.equal((await rows('select * from prizes')).length,1);
  for(const table of ['profiles','wins','wheel_outcomes']) await assert.rejects(db.exec(`select * from ${table}`),/permission denied/);
  await db.exec('reset role; set role service_role');
  assert.equal((await rows(`update profiles set remaining_spins=3 where id='${me}' returning id`)).length,1);
 } finally { await db.close(); }
});
