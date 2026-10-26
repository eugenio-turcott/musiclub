import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { poolDatabase } from './helpers/pool-database.mjs';

test('review timing is manual, room-specific, private, versioned and enforced on actual review writes',async()=>{
 const db=await poolDatabase();
 const alice='00000000-0000-4000-8000-000000000001',bob='00000000-0000-4000-8000-000000000002',outsider='00000000-0000-4000-8000-000000000003';
 try {
  await db.exec(await readFile(new URL('../supabase/migrations/20261026_v936_pool_review_schedule.sql',import.meta.url),'utf8'));
  await db.exec(`create table reviews(id uuid primary key default gen_random_uuid(),album_id uuid,user_id uuid,body text); alter table reviews enable row level security;
   grant select,insert,update on reviews to authenticated;
   create policy own_review on reviews for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
   create policy review_gate on reviews as restrictive for all to authenticated using(musiclub_can_review_album(album_id)) with check(musiclub_can_review_album(album_id));`);
  const as=async id=>db.exec(`reset role;set test.user_id='${id}';set role authenticated;`);
  const context=async album=>(await db.query('select musiclub_review_context($1) as ctx',[album])).rows[0].ctx;
  const ack=async(album,ctx)=>db.query('select musiclub_confirm_pool_review($1,$2::jsonb)',[album,JSON.stringify(ctx.pools.filter(p=>p.blocked).map(p=>({entry_id:p.entry_id,version:p.version})))]);
  const write=async(album,id)=>db.query('insert into reviews(album_id,user_id,body) values($1,$2,$3)',[album,id,'My review']);
  await as(alice);
  const room=(await db.query("select musiclub_create_pool_room('Secret room','','private') as id")).rows[0].id;
  const season=(await db.query('select id from seasons where room_id=$1',[room])).rows[0].id;
  await db.query("select musiclub_pool_action($1,'proposals',null,true)",[season]);
  const {albumId:album,entryId:entry}=(await db.query('select musiclub_nominate_pool_release($1,null,$2::jsonb) as result',[season,JSON.stringify({albumName:'Pick',artistName:'Artist',releaseDate:'2025-01-01',genres:['Pop']})])).rows[0].result;
  let ctx=await context(album);
  assert.equal(ctx.allowed,false); assert.equal(ctx.requires_confirmation,true);assert.equal(ctx.pools[0].status,'ACTIVO');
  await assert.rejects(write(album,alice),/row-level security/);
  await ack(album,ctx); await write(album,alice);
  assert.equal((await context(album)).requires_confirmation,true); // Every deliberate new opening still shows the warning.
  const token=(await db.query('select musiclub_invite_pool_room($1) as token',[room])).rows[0].token;
  await as(bob);await db.query('select musiclub_redeem_pool_invite($1)',[token]);
  assert.equal((await context(album)).allowed,false); // Alice's confirmation never grants Bob access.
  await assert.rejects(write(album,bob),/row-level security/);
  await assert.rejects(db.query('select musiclub_schedule_pool_reviews($1,$2,$3)',[season,album,'2026-11-01']),/administra/);
  await as(alice);
  await db.query("select musiclub_pool_action($1,'winner',$2)",[season,album]);
  assert.equal((await db.query('select reviews_enabled from public_pool_entries where id=$1',[entry])).rows[0].reviews_enabled,false);
  ctx=await context(album);assert.equal(ctx.allowed,false);assert.equal(ctx.pools[0].status,'GANADOR');
  await db.query('select musiclub_schedule_pool_reviews($1,$2,$3)',[season,album,'2025-01-01']);
  assert.equal((await context(album)).allowed,false); // A past scheduled date cannot open the Pool automatically.
  await assert.rejects(ack(album,ctx),/cambió/);
  ctx=await context(album);assert.equal(ctx.pools[0].review_scheduled_for,'2025-01-01');await ack(album,ctx);
  assert.equal((await context(album)).allowed,true);
  await db.query('select musiclub_schedule_pool_reviews($1,$2,$3)',[season,album,'2026-11-02']);
  await assert.rejects(write(album,alice),/row-level security/); // Rescheduling invalidates old consent.
  await db.query("select musiclub_pool_action($1,'reviews',$2,true)",[season,album]);
  assert.equal((await context(album)).requires_confirmation,false);await write(album,alice);
  await db.query("select musiclub_pool_action($1,'reviews',$2,false)",[season,album]);
  assert.equal((await context(album)).allowed,false);
  await as(outsider);
  ctx=await context(album);assert.deepEqual(ctx.pools,[]);assert.equal(ctx.allowed,true);await write(album,outsider);
  await assert.rejects(db.query('select * from musiclub_my_review_pools($1)',[album]),/permission denied/);
  await assert.rejects(db.query('insert into pool_review_confirmations(user_id,entry_id,policy_version) values($1,$2,1)',[outsider,entry]),/permission denied/);
  await as(alice);await db.query("select musiclub_pool_action($1,'graduate',$2)",[season,album]);
  assert.equal((await context(album)).requires_confirmation,false);assert.equal((await context(album)).allowed,true);
  await db.exec('reset role');
  assert.equal((await db.query('select count(*)::int as n from reviews')).rows[0].n,3); // No old reviews removed.
  await db.query('update albums set reviews_enabled=false where id=$1',[album]);
  await as(alice);assert.equal((await context(album)).catalog_allowed,false);
  await assert.rejects(ack(album,await context(album)),/no admite/); // Consent cannot bypass catalog moderation.
 } finally {await db.close();}
});
