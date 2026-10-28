import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { loadPoolData } from '../src/services/poolData.mjs';
import presentation from '../src/utils/poolPresentation.cjs';
import { POOL_THEMES } from '../src/data/poolThemes.js';

function serviceFixture({ entries = [], albums = [], profiles = [], rpc = async () => ({ data: false, error: null }), from } = {}) {
  const filters = [];
  const data = {seasons:[{id:'old',room_id:'00000000-0000-4000-8000-000000000000',is_active:false},{id:'current',room_id:'00000000-0000-4000-8000-000000000000',is_active:true,is_open:false}],public_pool_entries:entries,albums,public_profiles:profiles,public_reviews:[]};
  const supabase = { rpc, from: from || (table => {
    let rows=data[table] || [];
    return {select(){return this;},eq(field,value){filters.push([field,value]);rows=rows.filter(row=>row[field]===undefined || row[field]===value);return this;},
      in(field,values){rows=rows.filter(row=>values.includes(row[field]));return this;},order(){return this;},range(a,b){rows=rows.slice(a,b+1);return this;},
      then(resolve,reject){return Promise.resolve({data:rows,error:null}).then(resolve,reject);}};
  }) };
  const source = fs.readFileSync(new URL('../src/services/poolService.js', import.meta.url), 'utf8').replace(/^import .*;\r?$/gm, '').replace(/export const /g, 'const ').replace('export default poolService;', 'poolService;');
  const stored = new Map();
  const localStorage = { getItem: key => stored.get(key) || null, setItem: (key,value) => stored.set(key,value) };
  const service = vm.runInNewContext(source, { localStorage, supabase, loadPoolData, buildAlbumWithFullStats: album => album, console, Date, window: undefined });
  service.getSeasons = async () => [{ id: 'old', is_active: false }, { id: 'current', is_active: true, is_open: false }];
  return { service, filters, stored };
}

test('an empty current Pool never falls back to unrelated catalog releases', async () => {
  const { service, filters } = serviceFixture({ albums: [{ id:'unrelated', status:'ACTIVO', album_name:'Other' }] });
  const result = await service.getPoolData();
  assert.equal(result.season.id, 'current');
  assert.equal(result.active.length, 0);
  assert.equal(result.history.length, 0);
  assert.equal(result.winner, null);
  assert.deepEqual(filters, [['room_id','00000000-0000-4000-8000-000000000000'],['season_id','current']]);
});

test('the room review flag is independent of the current visitor review access', async () => {
  const { service } = serviceFixture({ albums: [{id:'album',album_name:'Album',reviews_enabled:true}], entries: [{id:'entry',album_id:'album',status:'GANADOR',reviews_enabled:true}], rpc: async () => ({ data:false,error:null }) });
  const result = await service.getPoolData();
  assert.equal(result.winner.reviews_enabled, true);
});

test('a rejected nomination reports the closure instead of inserting an orphaned album', async () => {
  let calls = [];
  const { service } = serviceFixture({ rpc: async (name, args) => { calls.push([name,args]); return { error:{message:'Pool cerrado'} }; } });
  await assert.rejects(service.nominateAlbumToPool({seasonId:'current',albumData:{albumName:'Example'},user:{id:'member'},note:'For this Pool'}), /Pool cerrado/);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'musiclub_nominate_pool_release');
  assert.equal(calls[0][1].p_season_id, 'current');
});

test('manual controls use the active Pool and never report success after a database rejection', async () => {
  const calls = [];
  const { service } = serviceFixture({ rpc: async (name,args) => { calls.push([name,args]); return { error:{message:'Solo administrador'} }; } });
  await assert.rejects(service.setPoolOpenStatus(true), /Solo administrador/);
  assert.equal(calls[0][1].p_season_id, 'current');
  assert.equal(calls[0][1].p_action, 'proposals');
  await assert.rejects(service.toggleWinnerReviews('album', false, 'current'), /Solo administrador/);
  assert.equal(calls[1][1].p_enabled, false);
});

test('the club receives ten distinct Pool ideas with a rule and a group game', () => {
  assert.equal(POOL_THEMES.length, 10);
  assert.equal(new Set(POOL_THEMES.map(theme=>theme.id)).size, 10);
  assert.ok(POOL_THEMES.every(theme=>theme.rule && theme.game));
});


test('editing only a season emoji saves a NULL optional date and retains the start date',async()=>{
  const updates=[];
  const {service,stored}=serviceFixture({from:()=>({update(fields){updates.push({...fields});return {eq:async()=>({error:null})};}})});
  service.getSeasons=async()=>[{id:'current',name:'Pool',start_date:'2026-10-22',end_date:null,is_active:false}];
  await service.updateSeason('current',{name:'Pool 🖤',start_date:'2026-10-22',end_date:'',is_active:false});
  assert.deepEqual(updates[0],{name:'Pool 🖤',start_date:'2026-10-22',end_date:null});
  const saved=JSON.parse(stored.get('musiclub_seasons'))[0];
  assert.equal(saved.name,'Pool 🖤');
  assert.equal(saved.start_date,'2026-10-22');
  assert.equal(saved.end_date,null);
  await service.updateSeason('current',{appearance:{mode:'solid'}});
  assert.equal(Object.hasOwn(updates[1],'end_date'),false);
  assert.equal(Object.hasOwn(updates[1],'start_date'),false);
  await service.updateSeason('current',{start_date:'',end_date:'2026-11-01'});
  assert.equal(Object.hasOwn(updates[2],'start_date'),false);
  assert.equal(updates[2].end_date,'2026-11-01');
});


test('Pool names follow current public profiles by user ID instead of saved Google names', async () => {
 const {service}=serviceFixture({
  entries:[{id:'entry',album_id:'album',user_id:'member',nominated_by:'Old Google Name',status:'ACTIVO'}],
  albums:[{id:'album',album_name:'Album',artist_name:'Artist'}],profiles:[{id:'member',name:'Corpus',avatar_url:'avatar.png'}]
 });
 const result=await service.getPoolData();
 assert.equal(result.active[0].added_by,'Corpus');
 assert.equal(result.active[0].nominated_avatar,'avatar.png');
 assert.equal(result.active[0].nominated_user_id,'member');
});

test('editing sends the stable entry ID to the protected RPC and propagates errors', async () => {
 const calls=[];
 const {service}=serviceFixture({rpc:async(name,args)=>{calls.push([name,args]);return {error:{message:'Solo puedes editar tu propia cápsula'}};}});
 await assert.rejects(service.editPoolNomination({entryId:'entry',seasonId:'current',albumId:'replacement',note:'Changed'}),/propia cápsula/);
 assert.equal(calls[0][0],'musiclub_edit_pool_release');
 assert.equal(calls[0][1].p_entry_id,'entry');
 assert.equal(calls[0][1].p_album_id,'replacement');
 assert.equal(calls[0][1].p_season_id,'current');
});


test('a changed capsule remains visible when the catalog cache lacks its new release', async () => {
 const {service}=serviceFixture({entries:[{id:'entry',album_id:'new',user_id:'member',nominated_by:'Member',status:'ACTIVO'}],albums:[{id:'new',album_name:'New release',artist_name:'Artist'}]});
 const result=await service.getPoolData();
 assert.equal(result.active[0].id,'new'); assert.equal(result.active[0].pool_entry_id,'entry');
 assert.equal(result.active[0].album,'New release'); assert.equal(result.season.entry_count,1);
});


test('past Pools exclude future drafts and preserve their own room history', () => {
 const seasons=[{id:'past',season_number:1,is_active:false},{id:'current',season_number:2,is_active:true},{id:'draft',season_number:3,is_active:false}];
 assert.deepEqual(presentation.pastPools(seasons).map(pool=>pool.id),['past']);
 assert.equal(presentation.pastPools([{id:'closed',is_active:false,end_date:'2025-01-01'}]).length,1);
 assert.equal(presentation.pastPools([{id:'draft',is_active:false}]).length,0);
});

test('Pool reads stay scoped and paginate only reviews for its own releases',async()=>{
 const reads=[];
 const db={from(table){const query={table,filters:[],range:null};reads.push(query);return {
  select(){return this;},eq(column,value){query.filters.push([column,value]);return this;},in(column,values){query.filters.push([column,values]);return this;},order(){return this;},range(a,b){query.range=[a,b];return this;},
  then(resolve,reject){
   const data=table==='seasons'?[{id:'selected',room_id:'room',is_active:true}]:table==='public_pool_entries'?[{id:'entry',album_id:'only',status:'GRADUADO'}]:table==='albums'?[{id:'only',album_name:'One release'}]:table==='public_reviews'?Array.from({length:query.range[0]===0?1000:1},(_,i)=>({id:query.range[0]+i,album_id:'only',rating_general:8})):[];
   return Promise.resolve({data,error:null}).then(resolve,reject);
  }
 };}};
 let counted=0;
 const result=await loadPoolData(db,(album,reviews)=>{counted=reviews.length;return {...album,review_count:reviews.length};},'selected','room');
 assert.equal(counted,1001);assert.equal(result.history[0].review_count,1001);
 assert.deepEqual(reads.filter(query=>query.table==='albums').map(query=>query.filters),[[['id',['only']]]]);
 assert.deepEqual(reads.filter(query=>query.table==='public_reviews').map(query=>query.range),[[0,999],[1000,1999]]);
 assert.equal(reads.filter(query=>query.table==='seasons').length,1);
 assert.equal(reads.some(query=>query.table==='public_profiles'),false);
 await assert.rejects(loadPoolData(db,album=>album,'inaccessible','room'),/no tienes acceso/);
});
