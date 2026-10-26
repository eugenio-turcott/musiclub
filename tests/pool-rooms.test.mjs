import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { poolDatabase } from './helpers/pool-database.mjs';
import { legacyPoolNotificationScope } from '../src/server/poolNotificationScope.js';

const alice='00000000-0000-4000-8000-000000000001', bob='00000000-0000-4000-8000-000000000002', carol='00000000-0000-4000-8000-000000000003';
test('room privacy, invitations, ownership and independent Pool lifecycles are enforced by PostgreSQL',async()=>{
 const db=await poolDatabase();
 try {
  const as=async id=>db.exec(`reset role; set test.user_id='${id}';set role authenticated;`);
  const room=async(name,visibility)=> (await db.query('select musiclub_create_pool_room($1,$2,$3) as id',[name,'Our music',visibility])).rows[0].id;
  const season=async id=>(await db.query('select id from seasons where room_id=$1 and is_active',[id])).rows[0].id;
  await as(alice);const privateRoom=await room('Private','private'),privateSeason=await season(privateRoom);
  assert.equal((await db.query('select count(*)::int as n from pool_rooms')).rows[0].n,2);
  const token=(await db.query('select musiclub_invite_pool_room($1) as token',[privateRoom])).rows[0].token;
  await db.query("select musiclub_pool_action($1,'proposals',null,true)",[privateSeason]);
  const submit=async(s,name)=>(await db.query('select musiclub_nominate_pool_release($1,null,$2::jsonb,$3) as result',[s,JSON.stringify({albumName:name,artistName:'Artist',genres:['Pop'],releaseDate:'2025-01-01'}),'A private note'])).rows[0].result;
  const first=await submit(privateSeason,'Private pick');
  assert.equal((await db.query('select reviews_enabled from albums where id=$1',[first.albumId])).rows[0].reviews_enabled,true);
  assert.equal((await db.query('select nominated_by_email from public_pool_entries')).rows[0].nominated_by_email,null);
  await as(bob);
  assert.equal((await db.query('select id from pool_rooms where id=$1',[privateRoom])).rows.length,0);
  assert.equal((await db.query('select id from seasons where room_id=$1',[privateRoom])).rows.length,0);
  assert.equal((await db.query('select id from public_pool_entries')).rows.length,0);
  assert.equal((await db.query('select id from pool_entries')).rows.length,0);
  await assert.rejects(submit(privateSeason,'Intrusion'),/Únete/);
  await assert.rejects(db.query('select musiclub_join_pool_room($1)',[privateRoom]),/invitación/);
  await assert.rejects(db.query('select musiclub_invite_pool_room($1)',[privateRoom]),/administra/);
  const publicRoom=await room('Public','public'),publicSeason=await season(publicRoom);
  await db.query("select musiclub_pool_action($1,'proposals',null,true)",[publicSeason]);
  await db.query('select musiclub_redeem_pool_invite($1)',[token]);
  assert.equal((await db.query('select id from public_pool_entries')).rows.length,1);
  await assert.rejects(db.query("select musiclub_pool_action($1,'winner',$2)",[privateSeason,first.albumId]),/administra/);
  await assert.rejects(db.query('select musiclub_edit_pool_release($1,$2,$3)',[privateSeason,first.entryId,first.albumId]),/propia cápsula/);
  await as(alice);await db.query('select musiclub_join_pool_room($1)',[publicRoom]);
  const second=await submit(publicSeason,'Public pick');
  await db.query("select musiclub_pool_action($1,'winner',$2)",[privateSeason,first.albumId]);
  await as(bob);await db.query("select musiclub_pool_action($1,'winner',$2)",[publicSeason,second.albumId]);
  assert.equal((await db.query("select count(*)::int as n from public_pool_entries where status='GANADOR'")).rows[0].n,2);
  await db.query("select musiclub_pool_action($1,'graduate',$2)",[publicSeason,second.albumId]);
  assert.equal((await db.query('select status from public_pool_entries where id=$1',[first.entryId])).rows[0].status,'GANADOR');
  assert.equal((await db.query('select reviews_enabled from albums where id=$1',[second.albumId])).rows[0].reviews_enabled,true);
  await db.query("insert into seasons(id,room_id,season_number,name,is_active,is_open) values('next',$1,2,'Next',false,false)",[publicRoom]);
  await db.query("select musiclub_activate_season('next')");
  assert.equal((await db.query('select is_active from seasons where id=$1',[privateSeason])).rows[0].is_active,true);
  await as(alice);
  await assert.rejects(db.query('update seasons set room_id=$1 where id=$2',[publicRoom,privateSeason]),/trasladar/);
  await db.query('select musiclub_invite_pool_room($1,true)',[privateRoom]);
  await as(carol);await assert.rejects(db.query('select musiclub_redeem_pool_invite($1)',[token]),/venció|revocada/);
  await db.exec("set test.admin='on'");
  assert.equal((await db.query('select id from pool_rooms where id=$1',[privateRoom])).rows.length,0);
  await assert.rejects(db.query("select musiclub_pool_action($1,'graduate',$2)",[privateSeason,first.albumId]),/administra/);
  await db.query("update pool_entries set status='GRADUADO' where id=$1",[first.entryId]);
  await db.exec("set test.admin='off'");
  await db.query('select musiclub_join_pool_room($1)',[publicRoom]);
  await assert.rejects(db.query("select musiclub_nominate_pool_release_internal($1,null,'{}','')",[privateSeason]),/permission denied/);
  await as(bob);await db.query('select musiclub_leave_pool_room($1)',[privateRoom]);
  assert.equal((await db.query('select id from public_pool_entries where id=$1',[first.entryId])).rows.length,0);
  await db.exec("reset role;set test.user_id='';set role anon;");
  assert.equal((await db.query('select id from pool_rooms where id=$1',[privateRoom])).rows.length,0);
  assert.equal((await db.query('select id from public_pool_entries where id=$1',[first.entryId])).rows.length,0);
  await assert.rejects(db.query('select musiclub_create_pool_room($1,$2,$3)',['No auth','','public']),/permission denied/);
  await db.exec('reset role');await db.exec(await readFile(new URL('../supabase/migrations/20261026_v935_pool_rooms.sql',import.meta.url),'utf8')); // Safe deployment retry.
 } finally {await db.close();}
});

test('a general notification cannot broadcast activity from another or private room',async()=>{
 let entryReads=0;
 const db={from:table=>({select(){return this;},eq(){return this;},async maybeSingle(){if(table==='pool_entries')entryReads++;return {data:table==='seasons'?{id:'private',room_id:'private-room'}:{id:'entry'}};}})};
 assert.equal(await legacyPoolNotificationScope(db,'private','album','GANADOR'),null);
 assert.equal(entryReads,0);
 assert.equal(await legacyPoolNotificationScope(db,null,'album','GANADOR'),null);
});
