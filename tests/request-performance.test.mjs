import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequestCache} from '../src/services/requestCache.mjs';
import {createInteractionLoader} from '../src/services/batchedReviewInteractions.mjs';
import {choosePoolWinner} from '../src/utils/poolDraw.mjs';

test('shared reads collapse concurrent loads, expire, and isolate accounts',async()=>{
  let time=1000,calls=0;
  const cache=createRequestCache({ttl:60,now:()=>time});
  const load=async()=>++calls;
  assert.deepEqual(await Promise.all([cache.read('alice:room',load),cache.read('alice:room',load)]),[1,1]);
  assert.equal(await cache.read('alice:room',load),1);
  assert.equal(await cache.read('bob:room',load),2);
  time+=61;assert.equal(await cache.read('alice:room',load),3);
});
test('invalidating a pending read prevents stale data refilling the cache',async()=>{
  const cache=createRequestCache();let finish;
  const old=cache.read('key',()=>new Promise(resolve=>{finish=resolve;}));
  await Promise.resolve();cache.invalidate('key');
  assert.equal(await cache.read('key',async()=> 'new'),'new');
  finish('old');await old;assert.equal(cache.peek('key'),'new');
  cache.clear();assert.equal(cache.peek('key'),undefined);
});
test('failed requests can be retried without retaining an error snapshot',async()=>{
  const cache=createRequestCache();await assert.rejects(cache.read('x',async()=>{throw new Error('offline');}));
  assert.equal(await cache.read('x',async()=> 'back'),'back');
});
test('twenty mounted reviews share one interaction batch and refresh only the changed review',async()=>{
  const requests=[];
  const read=createInteractionLoader(async ids=>{requests.push(ids);return {comments:ids.map(id=>({id:`c-${id}`,review_id:id})),reactions:[]};});
  const rows=await Promise.all(Array.from({length:20},(_,i)=>read(`r${i}`)));
  assert.equal(requests.length,1);assert.equal(requests[0].length,20);
  assert.equal(rows[3].comments.length,1);assert.equal(rows[3].comments[0].review_id,'r3');
  await read('r3');assert.equal(requests.length,1);
  await read('r3',true);assert.deepEqual(requests[1],['r3']);
});
test('a forced interaction refresh cannot strand an older pending caller',async()=>{
  const read=createInteractionLoader(async ids=>({comments:[],reactions:ids.map(id=>({review_id:id}))}));
  const results=await Promise.all([read('same'),read('same',true)]);
  assert.equal(results.length,2);assert.equal(results[0].reactions.length,1);
});
test('one Pool draw uses one random sample, preserves modest age weighting and handles one candidate',()=>{
  const old={id:'old',created_at:'2026-01-01'},recent={id:'new',created_at:'2026-02-01'};
  let samples=0;
  assert.equal(choosePoolWinner([old,recent],()=>{samples++;return .55;}),old);
  assert.equal(samples,1);assert.equal(choosePoolWinner([old,recent],()=>.99),recent);
  assert.equal(choosePoolWinner([recent],()=>.5),recent);assert.equal(choosePoolWinner([]),null);
});
import {readRelatedRows} from '../src/server/readRelatedRows.mjs';
test('targeted public reads paginate beyond 1000 reviews and bound ID filters',async()=>{
 const requests=[];
 const db={from(table){return {select(fields){return {in(column,ids){return {order(){return {async range(from,to){requests.push({table,column,ids,from,to});return {data:from===0?Array.from({length:1000},(_,id)=>({id})):Array.from({length:3},(_,id)=>({id:1000+id}))};}};}};}};}};}};
 const rows=await readRelatedRows(db,'public_reviews','id,album_id','album_id',Array.from({length:101},(_,i)=>String(i)));
 assert.equal(rows.length,2006);assert.equal(requests.length,4);assert.equal(requests[0].ids.length,100);assert.equal(requests[2].ids.length,1);
 assert.ok(requests.every(r=>r.table==='public_reviews'&&r.to-r.from===999));
});
