import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {withNotificationDates,guestNotificationDates,notificationIds,readNotificationDates,saveNotificationDates} from '../src/utils/notificationTimestamps.mjs';
import {dateDeliveredNotifications} from '../src/services/notificationTimestamps.mjs';
import {recordNotificationReceipts} from '../src/services/notificationReceiptStore.mjs';
const old='2020-01-01T00:00:00Z',sent='2026-11-27T18:00:00Z';
const items=[{id:'continue-review:album',createdAt:old,dateFormatted:old,timestamp:Date.parse(old)},{id:'upcoming_release',release_date:old}];
const storage=()=>{const data=new Map();return {getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};};

test('notification dates use delivery receipts, never release, subscription or source review dates',()=>{
 const output=withNotificationDates(items,{'continue-review:album':sent});
 assert.equal(output[0].dateFormatted,sent);assert.equal(output[0].timestamp,Date.parse(sent));
 assert.equal(output[1].dateFormatted,null);assert.equal(output[1].timestamp,0);
 assert.equal(withNotificationDates(items,{'continue-review:album':'invalid'})[0].dateFormatted,null);
});
test('refreshing preserves guest delivery times and local account caches stay separate',()=>{
 const first=guestNotificationDates(items,{},sent),again=guestNotificationDates(items,first,'2027-01-01T00:00:00Z');
 assert.deepEqual(first,again);
 const local=storage();saveNotificationDates(local,'one',first);assert.deepEqual(readNotificationDates(local,'one'),first);assert.deepEqual(readNotificationDates(local,'two'),{});
 assert.deepEqual(notificationIds([...items,items[0],{id:'unknown'},{id:null}]),items.map(i=>i.id));
});
test('account notifications use the same server date on a new device and retain it during an outage',async()=>{
 const local=storage(),calls=[];
 const request=async(url,options)=>{calls.push(JSON.parse(options.body));return {ok:true,json:async()=>({receipts:items.map(i=>({notification_id:i.id,sent_at:sent}))})};};
 const options={owner:'one',userId:'user-one',storage:local,request};
 const first=await dateDeliveredNotifications(items,options);
 assert.equal(first[0].dateFormatted,sent);assert.equal(calls[0].userId,'user-one');assert.deepEqual(Object.keys(calls[0]),['ids','userId']);
 const anotherDevice=await dateDeliveredNotifications(items,{...options,storage:storage()});assert.deepEqual(anotherDevice,first);
 const offline=await dateDeliveredNotifications(items,{...options,request:async()=>{throw Error('offline')}});assert.deepEqual(offline,first);
 const unknown=await dateDeliveredNotifications(items,{...options,owner:'two',request:async()=>({ok:false})});assert.equal(unknown[0].dateFormatted,null);
});
test('server recording ignores duplicates and never accepts a client timestamp or another owner',async()=>{
 const calls=[];
 const db={from(table){return {
  async upsert(rows,options){calls.push({table,rows,options});return {};},
  select(){return {eq(){return {in:async(field,ids)=>({data:ids.map(notification_id=>({notification_id,sent_at:sent}))})};}};},
 };}};
 const result=await recordNotificationReceipts(db,'user-one',['continue-review:album']);
 assert.deepEqual(calls[0].rows,[{user_id:'user-one',notification_id:'continue-review:album'}]);assert.equal(calls[0].options.ignoreDuplicates,true);assert.equal(result[0].sent_at,sent);
 assert.deepEqual(await recordNotificationReceipts(db,'user-one',[]),[]);assert.equal(calls.length,1);
});
test('database receipts are immutable, idempotent and restricted to their owner',async()=>{
 const db=new PGlite();const one='00000000-0000-4000-8000-000000000001',two='00000000-0000-4000-8000-000000000002';
 try{
  await db.exec("create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;");
  await db.query('insert into auth.users values ($1),($2)',[one,two]);
  await db.exec(await readFile(new URL('../supabase/migrations/20261127151416_notification_sent_timestamps.sql',import.meta.url),'utf8'));
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[one]);await db.exec('set role authenticated');
  await db.query('insert into public.musiclub_inbox_receipts(user_id,notification_id) values ($1,$2) on conflict do nothing',[one,'continue-review:album']);
  const before=(await db.query('select sent_at from public.musiclub_inbox_receipts')).rows[0].sent_at;
  await db.query('insert into public.musiclub_inbox_receipts(user_id,notification_id) values ($1,$2) on conflict do nothing',[one,'continue-review:album']);
  assert.deepEqual((await db.query('select sent_at from public.musiclub_inbox_receipts')).rows.map(r=>r.sent_at),[before]);
  await assert.rejects(db.query('insert into public.musiclub_inbox_receipts(user_id,notification_id,sent_at) values ($1,$2,$3)',[one,'review-forged',old]),/permission denied/);
  await assert.rejects(db.query("update public.musiclub_inbox_receipts set sent_at=now()"),/permission denied/);
  await assert.rejects(db.query('insert into public.musiclub_inbox_receipts(user_id,notification_id) values ($1,$2)',[two,'review-other']),/row-level security/);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[two]);assert.equal((await db.query('select * from public.musiclub_inbox_receipts')).rows.length,0);
 }finally{await db.close();}
});
