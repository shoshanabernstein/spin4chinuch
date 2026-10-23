/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require(process.env.PGLITE_TEST_MODULE || '@electric-sql/pglite');
test('spin request replay, user isolation, rollback, gift mode and permissions', async () => {
  const db = new PGlite();
  const user = '11111111-1111-4111-8111-111111111111';
  const other = '22222222-2222-4222-8222-222222222222';
  const request = '33333333-3333-4333-8333-333333333333';
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create table profiles(id uuid primary key, remaining_spins integer);
      insert into profiles values('${user}',1),('${other}',1);
      grant select,update on profiles to service_role;
      create function perform_spin(p_user_id uuid) returns jsonb language plpgsql set search_path = public as $$
      declare balance integer;
      begin
        update profiles set remaining_spins=remaining_spins-1 where id=p_user_id and remaining_spins>0 returning remaining_spins into balance;
        if not found then raise exception 'No spins remaining'; end if;
        return jsonb_build_object('remainingSpins',balance,'outcomeId',1);
      end $$;
      create function perform_spin_with_gift_cards(p_user_id uuid) returns jsonb language sql set search_path = public as $$
        select perform_spin(p_user_id) || '{"winId":42}'::jsonb;
      $$;
    `);
    await db.exec(fs.readFileSync('supabase/idempotent-spins.sql','utf8'));
    const spin = async (u=user,r=request,gift=false) => (await db.query(`select perform_spin_once('${u}','${r}',${gift}) as result`)).rows[0].result;
    await db.exec('set role service_role');
    const first = await spin();
    assert.equal(first.replayed,false);
    assert.equal(first.remainingSpins,0);
    const repeated = await spin(user,request,true);
    assert.equal(repeated.replayed,true);
    assert.equal(repeated.winId,undefined,'changing feature flag cannot change saved result');
    assert.equal(repeated.outcomeId,first.outcomeId);
    await assert.rejects(spin(user,other),/No spins/);
    assert.equal((await spin(other,request,true)).winId,42,'same key belongs to a different user');
    await db.exec('reset role');
    assert.equal((await db.query('select count(*)::int n from spin_requests')).rows[0].n,2,'failed spin did not leave a request');
    await db.exec(`update profiles set remaining_spins=1 where id='${user}'`);
    await db.exec('begin');
    await spin(user,other);
    await db.exec('rollback');
    assert.equal((await db.query(`select remaining_spins n from profiles where id='${user}'`)).rows[0].n,1);
    assert.equal((await spin(user,other)).replayed,false,'rollback removed saved result too');
    for (const role of ['anon','authenticated']) {
      await db.exec(`set role ${role}`);
      await assert.rejects(db.exec('select * from spin_requests'),/permission denied/);
      await assert.rejects(spin(),/permission denied/);
      await db.exec('reset role');
    }
  } finally { await db.close(); }
});
