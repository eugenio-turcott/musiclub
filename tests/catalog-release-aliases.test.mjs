import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import identity from '../src/utils/catalogReleaseIdentity.cjs';
import editions from '../src/utils/releaseEditions.cjs';
import lookup from '../src/utils/publicReleaseLookup.cjs';

process.env.NEXT_PUBLIC_SUPABASE_URL='http://127.0.0.1:54329';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='aliases_test_only_not_a_credential';
const {supabaseService,buildAlbumWithFullStats}=await import('../src/services/supabaseClient.js');
const {findAlbumInDatabase,enrichAndInsertAlbum}=await import('../src/services/albumEnrichmentService.js');
const tracks=['Opening Theme','City Lights','Final Escape'].map((name,i)=>({id:`rc-${i}`,name,track_number:i+1,duration_ms:180000+i*1000}));
const canonical={id:'canonical',album_name:'Original Soundtrack',artist_name:'Various Artists',release_type:'ALBUM',total_tracks:3,tracks};
const incoming={...canonical,id:'source',artist_name:'Game Soundtrack',tracks:tracks.map((t,i)=>({...t,id:`dz-${i}`,name:i===1?`${t.name} (feat. Guest)`:t.name,duration_ms:t.duration_ms-500}))};
function database(rows){return {from(table){assert.equal(table,'albums');const filters=[];const query={select(){return this;},eq(key,value){filters.push(row=>row[key]===value);return this;},ilike(key,value){const needle=value.replace(/^%|%$/g,'').toLowerCase();filters.push(row=>String(row[key]||'').toLowerCase().includes(needle));return this;},limit(){return this;},single(){return Promise.resolve({data:rows.filter(row=>filters.every(fn=>fn(row)))[0]||null,error:null});},maybeSingle(){return this.single();},then(resolve,reject){return Promise.resolve({data:rows.filter(row=>filters.every(fn=>fn(row))),error:null}).then(resolve,reject);},insert(){assert.fail('An existing compilation must never be inserted again');}};return query;}};}

test('different compilation credits require the same complete recording, not just a shared title',()=>{
 assert.equal(identity.sameCompilationEdition(canonical,incoming),true);
 for(const change of [
  {album_name:'Original Soundtrack (Deluxe)'},{release_type:'EP'},{total_tracks:4},
  {tracks:[...incoming.tracks].reverse()},
  {tracks:incoming.tracks.map(t=>({...t,duration_ms:t.duration_ms+10000}))},
  {tracks:incoming.tracks.map(t=>({...t,name:t.name+' (Live)'}))},
 ]) assert.equal(identity.sameCompilationEdition(canonical,{...incoming,...change}),false,JSON.stringify(change));
 assert.equal(identity.sameCompilationEdition({...canonical,artist_name:'Band A'},{...incoming,artist_name:'Band B'}),false);
 const placeholders=tracks.map((t,i)=>({...t,name:`Track ${i+1}`}));
 assert.equal(identity.sameCompilationEdition({...canonical,tracks:placeholders},{...incoming,tracks:placeholders}),false);
 assert.equal(identity.sameCompilationEdition({...canonical,barcode:'000123'},{...incoming,barcode:'123',tracks:[]}),true);
});

test('explicit aliases group into one release, preserve reviews and resolve the old credit URL',async()=>{
 const alias={...incoming,canonical_album_id:canonical.id};
 const unrelated={...incoming,id:'unrelated',artist_name:'Another Band'};
 const grouped=editions.groupReleaseEditions([alias,canonical,unrelated]);
 assert.equal(grouped.length,2);const release=grouped.find(r=>r.id===canonical.id);
 assert.deepEqual(new Set(release.artist_aliases),new Set(['Various Artists','Game Soundtrack']));
 assert.deepEqual(new Set(release.edition_member_ids),new Set([alias.id,canonical.id]));
 const detail=buildAlbumWithFullStats(release,[{id:'alias-review',album_id:alias.id,rating_general:8},{id:'canonical-review',album_id:canonical.id,rating_general:9}]);
 assert.equal(detail.review_count,2);assert.deepEqual(detail.artist_aliases,release.artist_aliases);
 const found=await lookup.resolvePublicRelease('game-soundtrack-original-soundtrack',[...grouped,alias,canonical]);
 assert.equal(found.album.id,alias.id);
 assert.equal(grouped.find(r=>r.edition_member_ids.includes(found.album.id)).id,canonical.id);
});

test('manual imports and the scheduled importer return the canonical row across source credits',async()=>{
 const alias={...incoming,canonical_album_id:canonical.id},db=database([canonical,alias]);
 assert.equal((await findAlbumInDatabase(incoming.album_name,incoming.artist_name,null,incoming,db)).id,canonical.id);
 const third={...incoming,artist_name:'Different Source Credit'};
 assert.equal((await findAlbumInDatabase(third.album_name,third.artist_name,null,third,db)).id,canonical.id);
 assert.equal((await enrichAndInsertAlbum(third,db)).album.id,canonical.id);
 const before=globalThis.fetch;
 try{
  globalThis.fetch=async(input,options)=>{
   assert.equal(options?.method||'GET','GET','No duplicate insert');
   const url=new URL(input),query=db.from('albums');
   for(const [key,value] of url.searchParams){if(value.startsWith('eq.'))query.eq(key,value.slice(3));if(value.startsWith('ilike.'))query.ilike(key,value.slice(6));}
   const result=await query;
   return new Response(JSON.stringify(new Headers(options?.headers).get('accept')?.includes('object')?result.data[0]||null:result.data),{headers:{'Content-Type':'application/json'}});
  };
  assert.equal((await supabaseService.findAlbum(alias.album_name,alias.artist_name,null,alias)).id,canonical.id);
  assert.equal((await supabaseService.createAlbum({...third,skipMusicBrainzEnrichment:true})).id,canonical.id);
 }finally{globalThis.fetch=before;}
});

test('alias migration only allows administrators to consolidate releases and rejects cycles',async()=>{
 const db=new PGlite();
 try{
  await db.exec("create role anon;create role authenticated;create table public.albums(id uuid primary key,album_name text);create function public.musiclub_is_admin() returns boolean language sql as 'select false';grant usage on schema public to authenticated;grant select,insert,update on public.albums to authenticated;");
  await db.exec(await readFile('supabase/migrations/20261123172033_catalog_release_aliases.sql','utf8'));
  const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
  await db.query('insert into albums(id,album_name) values($1,$3),($2,$3)',[a,b,'Soundtrack']);
  await db.exec('set role authenticated');
  await db.query('update albums set album_name=$1 where id=$2',['Updated',b]);
  await assert.rejects(db.query('update albums set canonical_album_id=$1 where id=$2',[a,b]),/Only administrators/);
  await assert.rejects(db.query('insert into albums(id,canonical_album_id) values($1,$2)',['00000000-0000-4000-8000-000000000003',a]),/Only administrators/);
  await db.exec('reset role');
  await db.query('update albums set canonical_album_id=$1 where id=$2',[a,b]);
  await assert.rejects(db.query('update albums set canonical_album_id=$1 where id=$2',[b,a]),/directly to a canonical/);
  assert.equal((await db.query('select count(*)::int n from albums')).rows[0].n,2);
 }finally{await db.close();}
});
