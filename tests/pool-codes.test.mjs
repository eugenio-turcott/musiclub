import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {poolDatabase} from './helpers/pool-database.mjs';
import {poolUrl,validPoolCode} from '../src/utils/poolRoutes.mjs';

const migration=await readFile(new URL('../supabase/migrations/20261104_v107_pool_codes_and_mail_retry.sql',import.meta.url),'utf8');
async function setup() {
  const db=await poolDatabase();
  await db.exec("create role service_role;create table musiclub_notification_deliveries(delivery_key text primary key,owner_id uuid,status text,created_at timestamptz default now(),completed_at timestamptz);");
  await db.exec(migration);return db;
}
const alice='00000000-0000-4000-8000-000000000001',bob='00000000-0000-4000-8000-000000000002';
test('Pool codes are stable, independent per season, owner generated, and do not bypass private-room RLS',async()=>{
  const db=await setup();
  try {
    const as=id=>db.exec(`reset role;set test.user_id='${id}';set role authenticated;`);
    await as(alice);
    const room=(await db.query("select musiclub_create_pool_room('Private','','private') as id")).rows[0].id;
    const season=(await db.query('select id from seasons where room_id=$1',[room])).rows[0].id;
    const first=(await db.query('select musiclub_generate_pool_code($1) as code',[season])).rows[0].code;
    assert.match(first,/^[A-Z0-9]{12}$/);
    assert.equal((await db.query('select musiclub_generate_pool_code($1) as code',[season])).rows[0].code,first);
    await db.query("insert into seasons(id,room_id,season_number,name,is_active,is_open) values('past',$1,2,'Past',false,false)",[room]);
    const second=(await db.query("select musiclub_generate_pool_code('past') as code")).rows[0].code;
    assert.match(second,/^[A-Z0-9]{12}$/);assert.notEqual(second,first);
    await as(bob);
    assert.equal((await db.query('select id from seasons where public_code=$1',[first])).rows.length,0);
    await assert.rejects(db.query('select musiclub_generate_pool_code($1)',[season]),/administra/);
    await db.exec("reset role;set test.user_id='';set role anon;");
    await assert.rejects(db.query('select musiclub_generate_pool_code($1)',[season]),/permission denied/);
    assert.equal((await db.query('select id from seasons where public_code=$1',[first])).rows.length,0);
    await db.exec('reset role');await db.exec(migration);
    assert.equal((await db.query('select public_code from seasons where id=$1',[season])).rows[0].public_code,first);
  } finally {await db.close();}
});
test('explicit mail recovery only claims failed Pool notices once and preserves their failure timestamp',async()=>{
  const db=await setup();
  try {
    await db.exec("insert into musiclub_notification_deliveries(delivery_key,status,completed_at) values('pool-winner:failed','failed','2026-11-04'),('pool-winner:sent','sent',now()),('pool-winner:processing','processing',null);");
    await db.exec(`set test.user_id='${alice}';set role authenticated;`);
    await assert.rejects(db.query("select musiclub_claim_notification_retry('pool-winner:failed')"),/administración/);
    await db.exec("set test.admin='on'");
    assert.equal((await db.query("select musiclub_claim_notification_retry('pool-winner:failed') as ok")).rows[0].ok,true);
    assert.equal((await db.query("select musiclub_claim_notification_retry('pool-winner:failed') as ok")).rows[0].ok,false);
    for(const key of ['sent','processing'])assert.equal((await db.query('select musiclub_claim_notification_retry($1) as ok',[`pool-winner:${key}`])).rows[0].ok,false);
    await assert.rejects(db.query("select musiclub_claim_notification_retry('recommendation:private')"),/no permitido/);
    await db.exec('reset role');
    const row=(await db.query("select * from musiclub_notification_deliveries where delivery_key='pool-winner:failed'")).rows[0];
    assert.equal(row.retry_count,1);assert.equal(row.owner_id,alice);assert.ok(row.last_failed_at);assert.equal(row.completed_at,null);
  } finally {await db.close();}
});
test('canonical links use twelve-character codes while legacy links remain routable',()=>{
  assert.equal(poolUrl('room',{id:'past',public_code:'AB12CD34EF56'}),'/pool/AB12CD34EF56');
  assert.equal(poolUrl('room',{id:'past'}),'/pool?sala=room&temporada=past');
  assert.equal(validPoolCode('ab12cd34ef56'),false);assert.equal(validPoolCode('AB12CD34EF56'),true);
});
