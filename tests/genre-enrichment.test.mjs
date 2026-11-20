import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import catalog from '../src/utils/genreCatalog.cjs';
import apple from '../src/utils/appleMusicGenres.cjs';
import mapping from '../src/data/appleMusicGenreMap.json' with {type:'json'};
import {normalizeDeezerGenres} from '../src/utils/deezerGenres.cjs';
import {processGenreEnrichment,genreRetryDelay} from '../src/services/genreEnrichment.mjs';

test('every official Apple category and all 27 Deezer musical categories have registered mappings',()=>{
 assert.equal(Object.keys(mapping.categories).length,525);
 for(const [id,category] of Object.entries(mapping.categories)){
  assert.ok(category.genres.length,category.name);
  assert.deepEqual(apple.normalizeAppleGenres({primaryGenreId:id,primaryGenreName:'localized label'}),category.genres);
  assert.ok(apple.normalizeAppleGenres({primaryGenreName:category.name}).length,category.name);
  for(const name of category.genres)assert.ok(catalog.genreKey(name),name);
 }
 const ids=[132,116,122,152,113,165,85,186,106,466,144,129,84,67,65,98,173,464,169,2,16,153,75,71,81,95,197];
 for(const id of ids)assert.ok(normalizeDeezerGenres({genre_id:id,genres:{data:[{id,name:'unknown localized label'}]}}).length,String(id));
 assert.deepEqual(normalizeDeezerGenres({genre_id:0}),[]);
 assert.deepEqual(apple.normalizeAppleGenres({primaryGenreId:'34',primaryGenreName:'unknown genre'}),[]);
 assert.deepEqual(apple.normalizeAppleGenres({primaryGenreName:'Singer/Songwriter'}),['Cantautor']);
});

test('database accepts pending genres while rejecting invented labels and retaining existing catalog data',async()=>{
 const db=new PGlite();
 try{
  await db.exec('create table musiclub_genre_registry(id text primary key,name text not null unique);create table albums(id uuid primary key,genres text[] not null,album_name text);');
  await db.query("insert into musiclub_genre_registry values('rock','Rock')");
  await db.exec(await readFile('supabase/migrations/20261120191220_nonblocking_release_genres.sql','utf8'));
  await db.exec('alter table albums add constraint musiclub_release_genres_valid check(musiclub_release_genres_are_valid(genres));');
  await db.query("insert into albums(id,album_name,genres) values('00000000-0000-4000-8000-000000000001','Pending','{}'),('00000000-0000-4000-8000-000000000002','Existing','{Rock}')");
  const pending=(await db.query("select * from albums where genres='{}'")).rows;
  assert.equal(pending.length,1);assert.equal(pending[0].genre_retry_count,0);assert.ok(pending[0].genre_retry_at);
  await assert.rejects(db.query("update albums set genres='{ImaginaryGenre}' where album_name='Pending'"));
  await assert.rejects(db.query("update albums set genres=array[null] where album_name='Pending'"));
  await db.query("update albums set genres='{Rock}' where album_name='Pending'");
  assert.equal((await db.query("select count(*)::int n from albums where genres='{}'")).rows[0].n,0);
  assert.equal((await db.query('select count(*)::int n from albums')).rows[0].n,2);
 }finally{await db.close();}
});

function fixture(){
 const now=Date.parse('2026-11-20T20:00:00Z');
 const rows=[{id:'album',artist_name:'Artist',album_name:'Album',genres:[],tracks:[{name:'Song'}],genre_retry_count:0,genre_retry_at:new Date(now-1000).toISOString()}];
 const db={from(){const filters=[];let patch,limit=Infinity;const q={select(){return q},eq(key,value){filters.push(r=>value==='{}'?Array.isArray(r[key])&&!r[key].length:r[key]===value);return q},lte(key,value){filters.push(r=>r[key]<=value);return q},order(){return q},limit(value){limit=value;return q},update(value){patch=value;return q},then(resolve,reject){try{const found=rows.filter(r=>filters.every(f=>f(r))).slice(0,limit);if(patch)found.forEach(r=>Object.assign(r,patch));return Promise.resolve({data:structuredClone(found)}).then(resolve,reject)}catch(e){return Promise.reject(e).then(resolve,reject)}}};return q}};
 return {db,rows,now};
}
test('automatic completion changes genres only, and unavailable sources keep the release in the admin queue',async()=>{
 const f=fixture(),original=structuredClone(f.rows[0]);
 const unavailable=await processGenreEnrichment(f.db,{resolve:async()=>{throw Error('offline')},now:()=>f.now});
 assert.equal(unavailable.pending,1);assert.deepEqual(f.rows[0].genres,[]);assert.equal(f.rows[0].genre_retry_count,1);
 assert.equal(Date.parse(f.rows[0].genre_retry_at),f.now+15*60000);assert.deepEqual(f.rows[0].tracks,original.tracks);
 const completed=await processGenreEnrichment(f.db,{resolve:async()=>['Rock'],now:()=>f.now+16*60000});
 assert.equal(completed.resolved,1);assert.deepEqual(f.rows[0].genres,['Rock']);assert.deepEqual(f.rows[0].tracks,original.tracks);
 assert.equal(genreRetryDelay(999),24*60*60000);
});
test('concurrent workers and an administrator edit cannot overwrite each other',async()=>{
 const f=fixture();let calls=0;
 const resolve=async()=>{calls++;return ['Rock']};
 await Promise.all([processGenreEnrichment(f.db,{resolve,now:()=>f.now}),processGenreEnrichment(f.db,{resolve,now:()=>f.now})]);assert.equal(calls,1);
 const edited=fixture();await processGenreEnrichment(edited.db,{now:()=>edited.now,resolve:async()=>{edited.rows[0].genres=['Jazz'];return ['Rock']}});
 assert.deepEqual(edited.rows[0].genres,['Jazz']);
});
