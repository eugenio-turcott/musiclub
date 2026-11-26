import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {isSingleTrackRelease,singleTrackScore} from '../src/utils/releaseScoring.cjs';
import {reviewAssessment} from '../src/utils/reviewAssessment.js';
import {getWeightedReviewScore} from '../src/utils/ratingUtils.js';
import {reviewContinuations} from '../src/utils/reviewContinuations.mjs';
import {discoverReviewContinuations} from '../src/services/reviewContinuationDiscovery.mjs';
const song={id:'recording-a',id_aliases:['old-id'],name:'The Song',duration_ms:180000};
const single={id:'single-test',album_name:'The Song',artist_name:'Artist',release_type:'SENCILLO',tracks:[song],total_tracks:1,release_date:'2025-01-01'};
test('one track in any format uses its own score and clears every criterion',()=>{
 for(const release_type of ['ALBUM','EP','SENCILLO','REMIX']){
  const release={...single,release_type},result=reviewAssessment({general:10,produccion:5},{'old-id':7},release);
  assert.equal(result.ratingGeneral,7);assert.equal(result.ratingProduccion,null);assert.equal(result.ratingReplay,null);
  assert.equal(getWeightedReviewScore({albums:release,track_ratings:{'recording-a':7},rating_general:10,rating_produccion:5}),7);
 }
 assert.equal(singleTrackScore(single,{'1':6}),6);
 assert.equal(isSingleTrackRelease({...single,total_tracks:12}),false,'one preview must not change album scoring');
 assert.equal(isSingleTrackRelease({...single,tracks:[song,{...song,id:'b'}]}),false);
 assert.throws(()=>reviewAssessment({}, {'recording-a':0},single),/Califica la canción/);
 assert.throws(()=>reviewAssessment({}, {},single),/Califica la canción/);
});
test('an album invites only actual one-track releases with the same recording, not multi-track singles or remixes',()=>{
 const album={...single,id:'album-test',album_name:'The Album',release_type:'ALBUM',total_tracks:6,tracks:[song,...Array.from({length:5},(_,i)=>({...song,id:'other-'+i,name:'Other '+i}))]};
 const review={album_id:album.id,track_ratings:{[song.id]:8},created_at:'2026-11-26'};
 const multi={...single,id:'multi',total_tracks:2,tracks:[song,{...song,id:'b',name:'Another Song'}]},remix={...single,id:'remix',tracks:[{...song,id:'remix-id',name:'The Song (Remix)'}]};
 const result=reviewContinuations([album,single,multi,remix],[review]);
 assert.deepEqual(result.map(r=>r.albumId),[single.id]);assert.equal(result[0].trackRatings[song.id],8);
 assert.deepEqual(reviewContinuations([album,single],[review,{album_id:single.id,created_at:'2026-11-26'}]),[]);
});
test('single discovery imports an external one-track release only after matching the rated album recording',async()=>{
 const source={...single,id:'discover-album-1235',album_name:'The Album',release_type:'ALBUM',total_tracks:2,tracks:[song,{...song,id:'b',name:'Second Song'}]};
 const external={id:'ext-single',name:'The Song',artist:'Artist',release_type:'SENCILLO',totalTracks:1,tracks:[{...song,id:'external-id'}],releaseDate:'2025-01-01',image:'https://example.test/cover.jpg',genres:['Pop']};
 const writes=[],db={from:()=>({select:()=>({eq:()=>({eq:()=>({limit:async()=>({data:[]})})})}),insert:payload=>{writes.push(payload);return {select:()=>({single:async()=>({data:payload})})};}})};
 const reviews=[{album_id:source.id,track_ratings:{[song.id]:8},created_at:'2026-11-26'}];
 const result=await discoverReviewContinuations(db,[source],reviews,{searchApple:async query=>({albums:query.includes(song.name)?[external]:[]}),appleDetails:async()=>external,searchDeezer:async()=>({albums:[]})});
 assert.equal(result.length,1);assert.equal(writes[0].total_tracks,1);assert.equal(writes[0].release_type,'SENCILLO');
 assert.equal(writes[0].rating_general,undefined,'discovering a work must never submit a review');
});
test('discovery continues through later tracks and one reviewer cannot suppress another reviewer',async()=>{
 const tracks=Array.from({length:3},(_,i)=>({...song,id:'rotation-'+i,id_aliases:[],name:'Rotation '+i}));
 const source={...single,id:'rotation-album',album_name:'Rotation Album',release_type:'ALBUM',total_tracks:3,tracks};
 const external=tracks.map((t,i)=>({id:'rotation-ext-'+i,name:t.name,artist:'Artist',release_type:'SENCILLO',totalTracks:1,tracks:[{...t,id:'external-'+i}],releaseDate:'2025-01-01',image:'https://example.test/cover.jpg'}));
 const db={from:()=>({select:()=>({eq:()=>({eq:()=>({limit:async()=>({data:[]})})})}),insert:payload=>({select:()=>({single:async()=>({data:payload})})})})};
 const options={singleSearchLimit:1,searchApple:async query=>({albums:external.filter(r=>query.endsWith(r.name))}),appleDetails:async id=>external.find(r=>r.id===id),searchDeezer:async()=>({albums:[]})};
 const first={id:'review-one',album_id:source.id,track_ratings:{[tracks[0].id]:7,[tracks[1].id]:8}},second={id:'review-two',album_id:source.id,track_ratings:{[tracks[2].id]:9}},now=Date.now();
 assert.deepEqual((await discoverReviewContinuations(db,[source],[first],{...options,now})).map(r=>r.album_name),['Rotation 0']);
 assert.deepEqual((await discoverReviewContinuations(db,[source],[first],{...options,now:now+31000})).map(r=>r.album_name),['Rotation 1']);
 assert.deepEqual((await discoverReviewContinuations(db,[source],[second],{...options,now:now+32000})).map(r=>r.album_name),['Rotation 2']);
});
test('the database enforces the same score for inserts, edits and legacy criterion payloads without affecting multi-track releases',async()=>{
 const db=new PGlite();try{
  await db.exec('create role anon;create role authenticated;create table public.albums(id text primary key,tracks jsonb,total_tracks integer);create table public.reviews(id int primary key,album_id text,track_ratings jsonb,rating_general int,rating_produccion int,rating_composicion int,rating_letras int,rating_originalidad int,rating_cohesion int,rating_replay int);');
  await db.query('insert into albums values ($1,$2,$3)',['legacy-before',JSON.stringify([song]),1]);
  await db.query('insert into reviews(id,album_id,track_ratings,rating_general,rating_produccion) values (99,$1,$2,10,5)',['legacy-before',JSON.stringify({[song.id]:6})]);
  await db.exec(await readFile(new URL('../supabase/migrations/20261126211011_single_track_reviews.sql',import.meta.url),'utf8'));
  const legacy=(await db.query('select rating_general,rating_produccion from reviews where id=99')).rows[0];assert.deepEqual(legacy,{rating_general:6,rating_produccion:null});
  await db.query('insert into albums values ($1,$2,$3),($4,$5,$6)',['one',JSON.stringify([song]),1,'many',JSON.stringify([song,{...song,id:'b'}]),2]);
  await db.query('insert into reviews(id,album_id,track_ratings,rating_general,rating_produccion) values (1,$1,$2,10,5)',['one',JSON.stringify({'old-id':7})]);
  let row=(await db.query('select * from reviews where id=1')).rows[0];assert.equal(row.rating_general,7);assert.equal(row.rating_produccion,null);assert.deepEqual(row.track_ratings,{[song.id]:7});
  await db.query('update reviews set track_ratings=$1,rating_general=10,rating_replay=5 where id=1',[JSON.stringify({[song.id]:9})]);
  row=(await db.query('select * from reviews where id=1')).rows[0];assert.equal(row.rating_general,9);assert.equal(row.rating_replay,null);
  await db.query("insert into reviews(id,album_id,track_ratings,rating_general,rating_produccion) values (2,'many','{}',8,4)");
  assert.equal((await db.query('select rating_produccion from reviews where id=2')).rows[0].rating_produccion,4);
  await assert.rejects(db.query('update reviews set track_ratings=$1 where id=1',[JSON.stringify({[song.id]:0})]),/entre 1 y 10/);
 }finally{await db.close();}
});
