import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {GRAMMY_EVENT,GRAMMY_EMAIL_PLAN,grammyReminderPhase} from '../src/data/grammys2027.mjs';
import {deliverGrammyNotice,processGrammyConfirmations,processGrammyReminders,grammyMailStatus} from '../src/services/grammyMail.mjs';
const before=Date.parse('2026-11-12T18:00:00Z'),start=Date.parse('2026-11-16T01:00:00Z');
function fixture({completionError=false}={}){
 const rows=new Map([['alice',{email:'alice@example.test',enabled:true}],['bob',{email:'bob@example.test',enabled:false}]]),ledger=new Map();let calls=0;
 const db={from:table=>{let patch=null;const filter={};const q={select:()=>q,update:p=>(patch=p,q),eq:(key,value)=>(filter[key]=value,q),like:()=>q,maybeSingle:async()=>({data:rows.get(filter.user_id)}),then:resolve=>{
  if(patch){Object.assign(rows.get(filter.user_id),patch);return Promise.resolve(resolve({}));}
  return Promise.resolve(resolve({data:table==='grammy_subscriptions'?[...rows].filter(([,r])=>r.enabled).map(([user_id,r])=>({user_id,...r})):[...ledger].map(([delivery_key,status])=>({delivery_key,status}))}));
 }};return q;},rpc:async(name,args)=>{calls++;
  if(name==='musiclub_pending_grammy_notices')return {data:[...rows].map(([user_id,r])=>({user_id,...r}))};
  if(name==='musiclub_claim_notification'){if(ledger.has(args.p_key))return {data:false};ledger.set(args.p_key,'processing');return {data:true};}
  if(completionError&&args.p_sent)return {error:{message:'fixture'}};
  ledger.set(args.p_key,args.p_sent?'sent':'failed');return {};
 }};return {db,rows,ledger,calls:()=>calls};
}
test('approved schedule is exactly Sunday 19:00 CDMX, ends at midnight and has no nomination-day notice',async()=>{
 assert.equal(GRAMMY_EVENT.reminderAt,'2026-11-16T01:00:00Z');assert.equal(GRAMMY_EMAIL_PLAN.timeZone,'America/Mexico_City');assert.deepEqual(GRAMMY_EMAIL_PLAN.phases,['confirmation','reminder']);
 const fmt=new Intl.DateTimeFormat('en-CA',{timeZone:GRAMMY_EMAIL_PLAN.timeZone,weekday:'long',hour:'numeric',hour12:false});assert.match(fmt.format(start),/Sunday.*19|19.*Sunday/);
 const {db,calls}=fixture();for(const now of [start-1,Date.parse(GRAMMY_EVENT.reminderUntil),Date.parse(GRAMMY_EVENT.nomineeListAt)])assert.equal((await processGrammyReminders(db,{now})).sent,0);assert.equal(calls(),0);assert.equal(grammyReminderPhase(null,start),'reminder');
});
test('confirmation and reminder each send once, cancelled subscribers are rechecked, and status reveals only totals',async()=>{
 const {db,rows}=fixture();let sent=[];const send=async(to,phase)=>(sent.push({to,phase}),{success:true});
 assert.equal((await processGrammyConfirmations(db,{now:before,send})).sent,1);assert.equal((await processGrammyConfirmations(db,{now:before,send})).sent,0);assert.equal(sent.length,1);
 rows.get('alice').enabled=false;assert.equal((await processGrammyReminders(db,{now:start,send})).sent,0);rows.get('alice').enabled=true;assert.equal((await processGrammyReminders(db,{now:start,send})).sent,1);assert.equal((await processGrammyReminders(db,{now:start,send})).sent,0);
 assert.deepEqual(sent.map(s=>s.phase),['confirmation','reminder']);assert.deepEqual(await grammyMailStatus(db),{subscribers:1,confirmed:1,pending:0,reviewRequired:0,remindersSent:1});
});
test('uncertain SMTP is never retried, and accepted mail with failed persistence is retained for review',async()=>{
 for(const completionError of [false,true]){const {db,ledger}=fixture({completionError});let attempts=0;const send=async()=>{attempts++;if(!completionError)throw new Error('SMTP uncertain');return {success:true};};
  await assert.rejects(deliverGrammyNotice(db,'alice','confirmation',{now:before,send}));assert.equal((await deliverGrammyNotice(db,'alice','confirmation',{now:before,send})).reason,'already_claimed');assert.equal(attempts,1);assert.equal(ledger.values().next().value,completionError?'processing':'failed');assert.equal((await grammyMailStatus(db)).reviewRequired,1);
 }
 const {db,rows}=fixture();rows.set('carol',{email:'carol@example.test',enabled:true});let attempts=0;const result=await processGrammyConfirmations(db,{now:before,send:async()=>{attempts++;throw new Error('offline');}});assert.equal(attempts,1);assert.equal(result.failed,1);assert.equal((await grammyMailStatus(db)).pending,1);
});
test('SQL enforces private opt-ins, send phases, cancellation, claim exclusion and the Sunday deadline',async()=>{
 const db=new PGlite(),a='00000000-0000-4000-8000-000000000001';
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;grant usage on schema public,auth to anon,authenticated,service_role;create table auth.users(id uuid primary key);insert into auth.users values('${a}');create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql as $$select jsonb_build_object('email','fixture@example.test')$$;create table albums(id uuid primary key);create table musiclub_notification_deliveries(delivery_key text primary key,status text);`);
  await db.exec(await readFile(new URL('../supabase/migrations/20261111_v120_grammys.sql',import.meta.url),'utf8'));await db.exec(await readFile(new URL('../supabase/migrations/20261112_v1204_grammy_two_notices.sql',import.meta.url),'utf8'));
  const functions={};for(const signature of ['musiclub_grammy_subscribe(boolean)','musiclub_pending_grammy_notices(text)'])functions[signature]=(await db.query(`select pg_get_functiondef('public.${signature}'::regprocedure) definition`)).rows[0].definition;
  async function clock(date){await db.exec('reset role;');for(const def of Object.values(functions))await db.exec(def.replace(/\bnow\(\)/g,`'${date}'::timestamptz`));}
  await clock('2026-11-12 18:00:00+00');await db.exec(`set test.uid='${a}';set role authenticated;`);await db.query('select musiclub_grammy_subscribe(true)');await assert.rejects(db.query("select * from musiclub_pending_grammy_notices('confirmation')"),/permission denied/);
  await db.exec('reset role;set role service_role;');assert.equal((await db.query("select * from musiclub_pending_grammy_notices('confirmation')")).rows.length,1);assert.equal((await db.query("select * from musiclub_pending_grammy_notices('reminder')")).rows.length,0);
  await db.exec(`reset role;insert into musiclub_notification_deliveries values('grammys:2027:confirmation:${a}','failed');set role service_role;`);assert.equal((await db.query("select * from musiclub_pending_grammy_notices('confirmation')")).rows.length,0);
  await clock('2026-11-16 01:00:00+00');await db.exec('set role authenticated;');await assert.rejects(db.query('select musiclub_grammy_subscribe(true)'),/ha cerrado/);await db.exec('reset role;set role service_role;');assert.equal((await db.query("select * from musiclub_pending_grammy_notices('reminder')")).rows.length,1);
  await db.exec('reset role;set role authenticated;');await db.query('select musiclub_grammy_subscribe(false)');await db.exec('reset role;set role service_role;');assert.equal((await db.query("select * from musiclub_pending_grammy_notices('reminder')")).rows.length,0);
  await clock('2026-11-16 06:00:00+00');await db.exec('update grammy_subscriptions set enabled=true;set role service_role;');for(const phase of ['confirmation','reminder','nominations'])assert.equal((await db.query('select * from musiclub_pending_grammy_notices($1)',[phase])).rows.length,0);
 }finally{await db.close();}
});
