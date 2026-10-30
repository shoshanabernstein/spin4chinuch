/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require(process.env.PGLITE_TEST_MODULE || '@electric-sql/pglite');
const user='11111111-1111-4111-8111-111111111111';
const other='22222222-2222-4222-8222-222222222222';
const id=()=>crypto.randomUUID();
async function fixture(oldRequest) {
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create table profiles(id uuid primary key,email text,remaining_spins integer,total_spins integer,updated_at timestamptz);
 create table prizes(id bigint primary key,name text,active boolean,quantity integer,retail_value numeric,sponsor_name text,delivery_type text,delivery_instructions text);
 create table wheel_outcomes(id bigserial primary key,active boolean,probability numeric check(probability>0),type text,prize_id bigint,label text);
 create table wins(id bigint generated always as identity primary key,user_id uuid,user_email text,prize text,prize_id bigint,outcome_id bigint,retail_value numeric,sponsor_name text,delivery_type text,delivery_instructions text,status text);
 create table spin_history(user_id uuid,outcome_id bigint,won boolean);
 create table payment_logs(payment_intent_id text primary key,user_id uuid,spins integer check(spins>0),amount integer constraint payment_logs_amount_positive check(amount>0));
 create function perform_spin(uuid) returns jsonb language sql as 'select null::jsonb';
 create function perform_spin_with_gift_cards(p_user_id uuid) returns jsonb language sql as 'select perform_spin(p_user_id)';
 create function credit_completed_payment(p_payment_intent_id text,p_user_id uuid,p_spins integer,p_amount integer) returns boolean language plpgsql security definer as $$ begin
 if p_payment_intent_id='archived' then return false; end if;
 if p_amount<=0 then raise exception 'Invalid payment';end if;
 lock table payment_logs in exclusive mode;
 insert into payment_logs values(p_payment_intent_id,p_user_id,p_spins,p_amount) on conflict do nothing;
 if not found then return false;end if;
 update profiles set remaining_spins=remaining_spins+p_spins,total_spins=total_spins+p_spins where id=p_user_id;
 return true;end $$;
 insert into profiles values('${user}','test@example.invalid',1100,1100,now()),('${other}','other@example.invalid',0,0,now());
 insert into prizes values(1,'Prize',true,3,10,null,null,null);
 insert into wheel_outcomes(active,probability,type,prize_id,label) values(true,1,'prize',1,'Prize'),(true,1,'loss',null,'Try Again');
 grant select,update on profiles to service_role;`);
 await db.exec(fs.readFileSync('supabase/idempotent-spins.sql','utf8'));
 await db.exec(fs.readFileSync('supabase/fixed-prize-pool.sql','utf8'));
 if (oldRequest) await scalar(db,'select perform_spin_once($1,$2,false)',[user,oldRequest]);
 await db.exec(fs.readFileSync('supabase/discount-slice.sql','utf8'));
 return db;
}
async function scalar(db,sql,args=[]) {return Object.values((await db.query(sql,args)).rows[0])[0];}
const quote=(db,who,qty=1,pkg='individual',key=id())=>scalar(db,'select create_discount_quote($1,$2,$3,$4)',[key,who,qty,pkg]);
const complete=(db,q,who=user,payment=q.amount===0?'free_'+q.id:'pi_'+q.id)=>scalar(db,'select complete_discount_checkout($1,$2,$3,$4)',[q.id,who,payment,q.amount]);

test('installation preserves already-used spins and replaying an older result adds no discount',async()=>{
 const request=id();const db=await fixture(request);try{
  assert.equal(await scalar(db,'select remaining from campaign_pool.state'),1099);
  assert.equal(await scalar(db,'select count(*)::integer from spin_history'),1);
  await scalar(db,'select perform_spin_once($1,$2,false)',[user,request]);
  assert.equal(await scalar(db,'select count(*)::integer from spin_history'),1);
  assert.equal(await scalar(db,'select discount_balance_cents from profiles where id=$1',[user]),0);
 }finally{await db.close();}
});

test('discount slice preserves pool prizes, never creates wins, and replays without awarding twice',async()=>{
 const db=await fixture();try{
  await db.exec('select setseed(0.42)');
  const key=id();const result=await scalar(db,'select perform_spin_once($1,$2,false)',[user,key]);
  const balance=await scalar(db,'select discount_balance_cents from profiles where id=$1',[user]);
  const replay=await scalar(db,'select perform_spin_once($1,$2,false)',[user,key]);
  assert.equal(replay.discountAwardCents,result.discountAwardCents);
  assert.equal(await scalar(db,'select discount_balance_cents from profiles where id=$1',[user]),balance);
  await db.exec(`do $$ begin for i in 1..1099 loop perform perform_spin_once('${user}',gen_random_uuid(),false);end loop;end $$;`);
  assert.equal(await scalar(db,'select count(*)::integer from wins'),3);
  assert.equal(await scalar(db,'select sum(remaining)::integer from campaign_pool.entries'),0);
  const awards=await scalar(db,'select count(*)::integer from campaign_discounts.awards');
  assert.ok(awards>600&&awards<850);
  assert.equal(await scalar(db,'select sum(amount)::integer from campaign_discounts.awards'),await scalar(db,'select discount_balance_cents from profiles where id=$1',[user]));
  assert.equal(await scalar(db,"select count(*)::integer from spin_history h join wheel_outcomes o on h.outcome_id=o.id where o.label='?' and h.won"),0);
  assert.equal(await scalar(db,"select count(*)::integer from spin_history h join wheel_outcomes o on h.outcome_id=o.id where o.label='?'"),awards);
  const counts=(await db.query('select amount,count(*)::integer n from campaign_discounts.awards group by amount order by amount')).rows;
  assert.equal(counts.length,4);assert.ok(counts[0].n>counts[1].n&&counts[1].n>counts[2].n&&counts[2].n>counts[3].n);
 }finally{await db.close();}
});

test('free orders deduct once, carry remaining credit, and cannot be replayed for another account',async()=>{
 const db=await fixture();try{
  await db.exec(`update profiles set discount_balance_cents=2500,remaining_spins=0,total_spins=0 where id='${user}'`);
  const q=await quote(db,user);assert.equal(q.amount,0);assert.equal(q.discount,1800);
  await complete(db,q);await complete(db,q);
  assert.equal(await scalar(db,'select remaining_spins from profiles where id=$1',[user]),1);
  assert.equal(await scalar(db,'select discount_balance_cents from profiles where id=$1',[user]),700);
  assert.equal(await scalar(db,'select count(*)::integer from payment_logs'),1);
  await assert.rejects(complete(db,q,other));
  assert.equal(await scalar(db,'select get_discount_quote($1,$2)',[q.id,other]),null);
  const receipt=await scalar(db,'select free_discount_email($1,$2,$3)',[q.id,user,'buyer@example.invalid']);
  assert.ok(receipt.email_started_at);
  await scalar(db,'select free_discount_email($1,$2,$3,$4)',[q.id,user,'buyer@example.invalid','receipt']);
  assert.equal((await scalar(db,'select free_discount_email($1,$2,$3)',[q.id,user,'changed@example.invalid'])).email_id,'receipt');
  assert.equal(await scalar(db,"select credit_completed_payment('archived',$1,1,1800)",[user]),false);
 }finally{await db.close();}
});

test('overlapping discounted quotes cannot spend the same credit twice or exceed campaign inventory',async()=>{
 const db=await fixture();try{
  await db.exec(`update profiles set discount_balance_cents=800 where id='${user}'`);
  const a=await quote(db,user),b=await quote(db,user);
  assert.equal(a.amount,1000);await complete(db,a);
  await assert.rejects(complete(db,b),/Discount balance changed/);
  assert.equal(await scalar(db,'select count(*)::integer from payment_logs'),1);
  await db.exec(`delete from payment_logs;insert into payment_logs values('historical','${user}',1100,1);update profiles set discount_balance_cents=10000 where id='${user}'`);
  const capped=await quote(db,user,3,'three-spins');
  await assert.rejects(complete(db,capped),/1100 spin limit/);
  assert.equal(await scalar(db,'select discount_balance_cents from profiles where id=$1',[user]),10000);
  for(const role of ['anon','authenticated','service_role']){
   await db.exec('set role '+role);await assert.rejects(db.exec('select * from campaign_discounts.quotes'),/permission denied/);
   if(role!=='service_role')await assert.rejects(db.query('select discount_balance($1)',[user]),/permission denied/);
   await db.exec('reset role');
  }
 }finally{await db.close();}
});
