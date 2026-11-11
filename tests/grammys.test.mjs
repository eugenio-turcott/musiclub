import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import nodemailer from 'nodemailer';
import {GRAMMY_EVENT,GRAMMY_FIELDS,GRAMMY_CATEGORIES,GRAMMY_FEATURED,grammyVotingOpen,grammyReminderPhase} from '../src/data/grammys2027.mjs';
import genres from '../src/utils/genreCatalog.cjs';
import icons from '../src/utils/interfaceArtwork.cjs';
import {normalizeGrammyNominee,readyGrammyCategories} from '../src/utils/grammyBallot.mjs';
import {grammyEmail,sendGrammyEmail,processGrammyReminders} from '../src/services/grammyMail.mjs';

test('Grammy 2027 has the supplied 100 categories, six general awards, five new awards and valid artwork',()=>{
 assert.equal(GRAMMY_CATEGORIES.length,100);assert.equal(new Set(GRAMMY_CATEGORIES.map(c=>c.id)).size,100);assert.equal(GRAMMY_FIELDS.length,12);
 assert.equal(GRAMMY_FEATURED.length,11);assert.equal(GRAMMY_FEATURED.slice(0,6).every(c=>c.field==='general'),true);assert.equal(GRAMMY_CATEGORIES.filter(c=>c.isNew).length,5);
 assert.equal(new Set(GRAMMY_FEATURED.slice(0,6).map(c=>c.icon)).size,6);
 for(const c of GRAMMY_CATEGORIES){assert.ok(GRAMMY_FIELDS.some(f=>f.id===c.field));assert.ok(icons.ICON_BODIES[c.icon],c.icon);if(c.genre)assert.ok(genres.genreKey(c.genre),c.genre);}
});
test('predictions and announcements respect the official date and published nominees rather than a countdown alone',()=>{
 const open={status:'open'},date=Date.parse(GRAMMY_EVENT.nomineeListAt);
 assert.equal(grammyVotingOpen(open,Date.parse(GRAMMY_EVENT.nominationsAt)-1),false);assert.equal(grammyVotingOpen(open,date),true);assert.equal(grammyVotingOpen({status:'preparing'},date),false);assert.equal(grammyVotingOpen(open,Date.parse(GRAMMY_EVENT.closesAt)),false);
 assert.equal(grammyReminderPhase(open,Date.parse(GRAMMY_EVENT.reminderAt)-1),null);assert.equal(grammyReminderPhase(open,Date.parse(GRAMMY_EVENT.reminderAt)),'reminder');assert.equal(grammyReminderPhase({status:'preparing'},date),null);assert.equal(grammyReminderPhase(open,date),'nominations');
});
test('nominee imports reject unknown categories, invalid IDs and unsafe platform links',()=>{
 const sample={categoryId:'album-of-the-year',title:' A release ',artist:'An artist',spotifyUrl:'https://open.spotify.com/album/example'};
 assert.equal(normalizeGrammyNominee(sample).title,'A release');
 for(const invalid of [{...sample,categoryId:'invented'},{...sample,spotifyUrl:'javascript:alert(1)'},{...sample,spotifyUrl:'https://spotify.com.evil.test/album/example'},{...sample,albumId:'invalid'}])assert.throws(()=>normalizeGrammyNominee(invalid));
 assert.equal(readyGrammyCategories(GRAMMY_CATEGORIES.flatMap(c=>[{category_id:c.id},{category_id:c.id}])),100);
});
test('Grammy SQL protects subscribers and ballots, gates dates and rejects cross-category picks',async()=>{
 const db=new PGlite(),a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002',n1='10000000-0000-4000-8000-000000000001',n2='10000000-0000-4000-8000-000000000002';
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;grant usage on schema public,auth to anon,authenticated,service_role;create table auth.users(id uuid primary key);insert into auth.users values('${a}'),('${b}');create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql as $$select jsonb_build_object('email',current_setting('test.email',true))$$;create table albums(id uuid primary key);create table musiclub_notification_deliveries(delivery_key text primary key,status text);`);
  await db.exec(await readFile(new URL('../supabase/migrations/20261111_v120_grammys.sql',import.meta.url),'utf8'));
  assert.equal((await db.query('select count(*)::int n from grammy_categories')).rows[0].n,100);
  await db.exec(`insert into grammy_nominees(id,event_id,category_id,title) values('${n1}','grammys-2027','album-of-the-year','Release'),('${n2}','grammys-2027','song-of-the-year','Song');set role anon;`);
  assert.equal((await db.query('select count(*)::int n from grammy_nominees')).rows[0].n,0);await assert.rejects(db.query('select * from grammy_subscriptions'),/permission denied/);
  await db.exec(`reset role;set test.uid='${a}';set test.email='alice@example.test';set role authenticated;`);
  await db.query('select musiclub_grammy_subscribe(true)');await db.query('select musiclub_grammy_subscribe(true)');assert.equal((await db.query('select * from grammy_subscriptions')).rows.length,1);
  await assert.rejects(db.query('select musiclub_grammy_predict($1,$2)',['album-of-the-year',n1]),/no están abiertas/);
  await assert.rejects(db.query('update grammy_subscriptions set email=$1',['other@example.test']),/permission denied/);
  await db.exec(`reset role;update grammy_events set status='open',published_at=now(),nominations_at=now()-interval '1 day',closes_at=now()+interval '1 day';set role authenticated;`);
  await assert.rejects(db.query('select musiclub_grammy_predict($1,$2)',['song-of-the-year',n1]),/no pertenece/);
  await db.query('select musiclub_grammy_predict($1,$2)',['album-of-the-year',n1]);await db.query('select musiclub_grammy_predict($1,$2)',['album-of-the-year',n1]);assert.equal((await db.query('select * from grammy_predictions')).rows.length,1);
  await db.exec(`reset role;set test.uid='${b}';set test.email='bob@example.test';set role authenticated;`);assert.equal((await db.query('select * from grammy_predictions')).rows.length,0);assert.equal((await db.query('select * from grammy_subscriptions')).rows.length,0);await assert.rejects(db.query("select * from musiclub_pending_grammy_notices('nominations')"),/permission denied/);
  await db.exec(`reset role;set test.uid='${a}';set role authenticated;`);await db.query('select musiclub_grammy_subscribe(false)');await db.exec('reset role;set role service_role;');assert.equal((await db.query("select * from musiclub_pending_grammy_notices('nominations')")).rows.length,0);
  await db.exec('reset role;set role authenticated;');await db.query('select musiclub_grammy_subscribe(true)');await db.exec(`reset role;insert into musiclub_notification_deliveries values('grammys:2027:nominations:${a}','failed');set role service_role;`);assert.equal((await db.query("select * from musiclub_pending_grammy_notices('nominations')")).rows.length,0);
  await db.exec("reset role;update grammy_events set closes_at=now()-interval '1 second';set role authenticated;");await assert.rejects(db.query('select musiclub_grammy_predict($1,$2)',['album-of-the-year',n1]),/no están abiertas/);
 }finally{await db.close();}
});
test('reminder batches do nothing early and reserve deliveries once without automatic retries',async()=>{
 let calls=0,sends=0;const claims=new Set(),updates=[];
 const db={from:table=>({select:()=>({eq:()=>({single:async()=>({data:{status:'open'}})})}),update:patch=>({eq:()=>({eq:async()=>{updates.push(patch);return {};}})})}),rpc:async(name,args)=>{calls++;if(name==='musiclub_pending_grammy_notices')return {data:[{user_id:'alice',email:'alice@example.test'}]};if(name==='musiclub_claim_notification'){if(claims.has(args.p_key))return {data:false};claims.add(args.p_key);return {data:true};}return {};}};
 await processGrammyReminders(db,{now:Date.parse(GRAMMY_EVENT.reminderAt)-1});assert.equal(calls,0);
 const options={now:Date.parse(GRAMMY_EVENT.nomineeListAt),send:async()=>{sends++;return {success:true};}};
 assert.equal((await processGrammyReminders(db,options)).sent,1);assert.equal((await processGrammyReminders(db,options)).sent,0);assert.equal(sends,1);assert.equal(updates.length,1);
});
test('Grammy notices have a real SMTP acceptance, private single recipients and cancellation instructions',async()=>{
 const original=nodemailer.createTransport,env=Object.fromEntries(['SMTP_HOST','SMTP_USER','SMTP_PASS'].map(k=>[k,process.env[k]]));let message,accepted=true;
 Object.assign(process.env,{SMTP_HOST:'smtp.invalid',SMTP_USER:'fixture',SMTP_PASS:'fixture'});nodemailer.createTransport=()=>({sendMail:async options=>{message=options;return {messageId:'fixture',accepted:accepted?['a@example.test']:[],rejected:[]};}});
 try{assert.equal((await sendGrammyEmail('a@example.test','nominations')).success,true);assert.equal(message.to,'a@example.test');assert.ok(!message.cc&&!message.bcc);assert.match(message.text,/cancelarlo/);assert.match(grammyEmail('reminder').text,/16 de noviembre/);accepted=false;await assert.rejects(sendGrammyEmail('a@example.test','reminder'),/no aceptó/);}finally{nodemailer.createTransport=original;for(const [key,value] of Object.entries(env))if(value===undefined)delete process.env[key];else process.env[key]=value;}
});
