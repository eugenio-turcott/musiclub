import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {GRAMMY_CATEGORIES} from '../src/data/grammys2027.mjs';
import {GRAMMY_BADGES,grammyGamification,grammyRewardFor} from '../src/utils/grammyRewards.mjs';
import {calculateUserGamification} from '../src/utils/badgeSystem.js';
import {badgeIcon} from '../src/utils/badgeIcons.mjs';
import artwork from '../src/utils/interfaceArtwork.cjs';

test('Grammy awards use 100/200/500 XP and golden badges never add a second bonus',()=>{
 const rates=GRAMMY_CATEGORIES.map(grammyRewardFor);assert.equal(rates.filter(x=>x===100).length,89);assert.equal(rates.filter(x=>x===200).length,5);assert.equal(rates.filter(x=>x===500).length,6);
 const progress={correct_count:100,normal_correct:89,new_correct:5,general_correct:6};const earned=grammyGamification(progress);assert.equal(earned.xp,12900);assert.equal(earned.badges.length,4);
 const base=calculateUserGamification({reviews:[]}),winner=calculateUserGamification({reviews:[],grammy_progress:progress});assert.equal(winner.totalXp-base.totalXp,12900);assert.equal(winner.badgesXp,base.badgesXp);assert.equal(winner.grammyXp,12900);
 assert.equal(grammyGamification({correct_count:1,normal_correct:1}).badges.length,1);assert.equal(grammyGamification({}).badges.length,0);
 assert.equal(new Set(GRAMMY_BADGES.map(b=>badgeIcon(b))).size,4);for(const badge of GRAMMY_BADGES){assert.match(badge.color,/amber/);assert.ok(artwork.ICON_BODIES[badgeIcon(badge)].includes(artwork.ICON_BODIES.gramophone));}
});

test('settlement verifies winners, awards only correct forecasts once, and keeps forecasts and award rows private',async()=>{
 const db=new PGlite(),a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
 const cats=['best-rock-album','best-latin-song','album-of-the-year'];const ids=cats.map((c,i)=>[`10000000-0000-4000-8000-00000000000${i+1}`,`20000000-0000-4000-8000-00000000000${i+1}`]);
 const winners=cats.map((categoryId,i)=>({categoryId,nomineeId:ids[i][0]})),source='https://www.grammy.com/awards/69th-annual-grammy-awards-2027/';
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;grant usage on schema public,auth to anon,authenticated,service_role;create table auth.users(id uuid primary key);insert into auth.users values('${a}'),('${b}');create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql as $$select jsonb_build_object('email','fixture@example.test')$$;create table albums(id uuid primary key);create table musiclub_notification_deliveries(delivery_key text primary key,status text);`);
  await db.exec(await readFile(new URL('../supabase/migrations/20261111_v120_grammys.sql',import.meta.url),'utf8'));await db.exec(await readFile(new URL('../supabase/migrations/20261111_v1201_grammy_rewards.sql',import.meta.url),'utf8'));
  const sqlRates=(await db.query('select reward_xp,count(*)::int n from grammy_categories group by reward_xp order by reward_xp')).rows;assert.deepEqual(sqlRates,[{reward_xp:100,n:89},{reward_xp:200,n:5},{reward_xp:500,n:6}]);
  for(let i=0;i<cats.length;i++)for(const id of ids[i])await db.query('insert into grammy_nominees(id,event_id,category_id,title) values($1,$2,$3,$4)',[id,'grammys-2027',cats[i],'Fixture']);
  await db.exec("update grammy_events set status='open',published_at=now(),nominations_at=now()-interval '1 day',closes_at=now()+interval '1 day';");
  for(const user of [a,b]){await db.exec(`reset role;set test.uid='${user}';set role authenticated;`);for(let i=0;i<cats.length;i++)await db.query('select musiclub_grammy_predict($1,$2)',[cats[i],ids[i][user===b&&i===0?1:0]]);}
  await assert.rejects(db.query('select musiclub_settle_grammy_results($1,$2)',[JSON.stringify(winners),source]),/permission denied/);
  await db.exec("reset role;update grammy_events set closes_at=now()-interval '1 second';set role service_role;");
  await assert.rejects(db.query('select musiclub_settle_grammy_results($1,$2)',[JSON.stringify(winners),source]),/Espera/);
  // Advance only this isolated function's clock after asserting the real ceremony gate.
  await db.exec('reset role;');
  const definition=(await db.query("select pg_get_functiondef('public.musiclub_settle_grammy_results(jsonb,text)'::regprocedure) definition")).rows[0].definition;
  await db.exec(definition.replace(/\bnow\(\)/g,"'2027-02-09 12:00:00+00'::timestamptz"));await db.exec('set role service_role;');
  await assert.rejects(db.query('select musiclub_settle_grammy_results($1,$2)',[JSON.stringify(winners),'https://www.grammy.com.evil.test/']),/fuente oficial/);
  await assert.rejects(db.query('select musiclub_settle_grammy_results($1,$2)',[JSON.stringify([winners[0],{categoryId:cats[1],nomineeId:ids[0][0]}]),source]),/no corresponde/);
  assert.equal((await db.query('select count(*)::int n from grammy_results')).rows[0].n,0);
  assert.equal((await db.query('select musiclub_settle_grammy_results($1,$2) n',[JSON.stringify(winners),source])).rows[0].n,5);
  assert.equal((await db.query('select musiclub_settle_grammy_results($1,$2) n',[JSON.stringify(winners),source])).rows[0].n,0);
  const aggregate=(await db.query('select * from public_grammy_progress where user_id=$1',[a])).rows[0];assert.equal(aggregate.total_xp,800);assert.equal(aggregate.correct_count,3);assert.equal(aggregate.general_correct,1);assert.equal(aggregate.new_correct,1);
  await assert.rejects(db.query('select musiclub_settle_grammy_results($1,$2)',[JSON.stringify([{categoryId:cats[0],nomineeId:ids[0][1]}]),source]),/ya tiene un ganador/);
  await db.exec(`reset role;set test.uid='${b}';set role authenticated;`);assert.equal((await db.query('select count(*)::int n from grammy_awards')).rows[0].n,2);assert.equal((await db.query('select count(*)::int n from grammy_predictions')).rows[0].n,3);
  await assert.rejects(db.query('update grammy_awards set xp=500'),/permission denied/);await db.exec('reset role;set role anon;');await assert.rejects(db.query('select * from grammy_awards'),/permission denied/);
  const publicRows=(await db.query('select * from public_grammy_progress')).rows;assert.equal(publicRows.length,2);assert.ok(!Object.keys(publicRows[0]).some(key=>/email|nominee|subscription/.test(key)));
 }finally{await db.close();}
});
