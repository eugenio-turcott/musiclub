import test from 'node:test';
import assert from 'node:assert/strict';
import {mutateGrammyAdmin,readGrammyAdmin,searchGrammyReleases} from '../src/server/grammyAdmin.mjs';
import {GRAMMY_CATEGORIES,grammyVotingOpen} from '../src/data/grammys2027.mjs';
import {grammyNomineeInput,normalizeGrammyNominee,mergeGrammyCategories} from '../src/utils/grammyBallot.mjs';
import {readFile} from 'node:fs/promises';
import swc from 'next/dist/build/swc/index.js';

const nomineeId='10000000-0000-4000-8000-000000000001',albumId='20000000-0000-4000-8000-000000000001';
function fixture({published=true}={}){
 const tables={grammy_events:[{id:'grammys-2027',status:published?'open':'preparing',published_at:published?'2026-11-16T14:00:00Z':null,nominations_at:'2026-11-16T12:45:00Z',closes_at:'2027-02-07T20:00:00Z',source_url:'https://www.grammy.com/'}],grammy_categories:GRAMMY_CATEGORIES.map(c=>({id:c.id,name:c.name,field_id:c.field})),grammy_nominees:[{id:nomineeId,event_id:'grammys-2027',category_id:'album-of-the-year',title:'Original title',artist:'Artist',album_id:albumId}],albums:[{id:albumId,album_name:'Original title',artist_name:'Artist'}],grammy_results:[]};
 const votes=[{nominee_id:nomineeId}],writes=[];
 const db={from(table){
  let action='read',payload,filters=[],one=false,head=false,pattern;
  const q={select(_columns,options){head=options?.head;return q;},eq(key,value){filters.push(row=>row[key]===value);return q;},single(){one=true;return q;},maybeSingle(){one=true;return q;},limit(){return q;},order(){return q;},ilike(key,value){pattern=value;filters.push(row=>row[key]?.toLowerCase().includes(value.replace(/^%|%$/g,'').toLowerCase()));return q;},update(value){action='update';payload=value;return q;},insert(value){action='insert';payload=value;return q;},upsert(value){action='upsert';payload=value;return q;},delete(){action='delete';return q;},then(resolve,reject){
   try{
    let rows=tables[table].filter(row=>filters.every(filter=>filter(row)));
    if(action==='delete'&&rows.some(r=>votes.some(v=>v.nominee_id===r.id)))return Promise.resolve({error:{code:'23503'}}).then(resolve,reject);
    if(action==='update')rows.forEach(row=>Object.assign(row,payload));
    if(action==='delete')tables[table]=tables[table].filter(row=>!rows.includes(row));
    if(action==='insert'){tables[table].push({...payload});rows=[payload];}
    if(action==='upsert')for(const row of payload){const prior=tables[table].find(r=>r.id===row.id);if(prior)Object.assign(prior,row);else tables[table].push({...row});}
    if(action!=='read')writes.push({table,action,payload,ids:rows.map(r=>r.id)});
    return Promise.resolve({data:head?null:one?rows[0]||null:structuredClone(rows),count:rows.length,error:null,pattern}).then(resolve,reject);
   }catch(error){return Promise.reject(error).then(resolve,reject);}
  }};return q;
 }};return {db,tables,votes,writes};
}
test('editing title, artwork, links and catalog association keeps the UUID and existing prediction',async()=>{
 const {db,tables,votes}=fixture();
 const input={...grammyNomineeInput(tables.grammy_nominees[0]),title:'Corrected title',imageUrl:'https://cdn.example.test/correct.jpg',spotifyUrl:'https://open.spotify.com/track/correct',albumId:''};
 await mutateGrammyAdmin(db,{action:'save-nominee',nominee:input});
 const row=tables.grammy_nominees[0];assert.equal(row.id,nomineeId);assert.equal(row.title,'Corrected title');assert.equal(row.image_url,input.imageUrl);assert.equal(row.spotify_url,input.spotifyUrl);assert.equal(row.album_id,null);assert.equal(votes[0].nominee_id,row.id);assert.equal(tables.grammy_nominees.length,1);
});
test('server rejects invalid platform URLs, nonexistent catalog IDs and changing a published category before writing',async()=>{
 const {db,tables,writes}=fixture(),input=grammyNomineeInput(tables.grammy_nominees[0]);
 for(const patch of [{spotifyUrl:'https://spotify.com.evil.test/a'},{imageUrl:'https://secret:password@cdn.example.test/a'},{albumId:'20000000-0000-4000-8000-000000000099'},{categoryId:'song-of-the-year'}])await assert.rejects(mutateGrammyAdmin(db,{action:'save-nominee',nominee:{...input,...patch}}));
 assert.deepEqual(writes,[]);assert.equal(tables.grammy_nominees[0].title,'Original title');
});
test('deleting a nominee with a prediction is rejected by the database and leaves the list intact',async()=>{
 const {db,tables}=fixture();tables.grammy_nominees.push(...[2,3].map(n=>({...tables.grammy_nominees[0],id:`10000000-0000-4000-8000-00000000000${n}`})));
 await assert.rejects(mutateGrammyAdmin(db,{action:'delete-nominee',nomineeId}),e=>e.status===409);
 assert.equal(tables.grammy_nominees.length,3);
});
test('published ballots cannot be replaced by a bulk reimport and missing IDs cannot upsert a renamed copy',async()=>{
 const {db,tables,writes}=fixture();
 await assert.rejects(mutateGrammyAdmin(db,{action:'import',nominees:[{categoryId:'album-of-the-year',title:'A renamed copy',artist:'Artist'}]}),e=>e.status===409);
 await assert.rejects(mutateGrammyAdmin(db,{action:'save-nominee',nominee:{id:'10000000-0000-4000-8000-000000000099',categoryId:'album-of-the-year',title:'New title'}}),e=>e.status===404);
 assert.equal(tables.grammy_nominees.length,1);assert.deepEqual(writes,[]);
});
test('draft creation and export round trip every editable field',async()=>{
 const {db,tables}=fixture({published:false});
 const input={categoryId:'song-of-the-year',title:'New nominee',artist:'Credits',imageUrl:'https://images.example.test/a.jpg',albumId,spotifyUrl:'https://open.spotify.com/track/1',appleMusicUrl:'https://music.apple.com/song/1',youtubeUrl:'https://youtu.be/example',deezerUrl:'https://www.deezer.com/track/1'};
 const result=await mutateGrammyAdmin(db,{action:'save-nominee',nominee:input});assert.match(result.id,/^[0-9a-f-]{36}$/);assert.notEqual(result.id,nomineeId);
 const row=tables.grammy_nominees.find(r=>r.id===result.id);assert.deepEqual(normalizeGrammyNominee(grammyNomineeInput(row)),normalizeGrammyNominee(input));
});
test('category labels and event configuration are read from the database, with chronological and official-source validation',async()=>{
 const {db,tables}=fixture();
 await mutateGrammyAdmin(db,{action:'save-category',category:{id:'album-of-the-year',name:'Nombre corregido'}});
 const state=await readGrammyAdmin(db);assert.equal(mergeGrammyCategories(state.categories).find(c=>c.id==='album-of-the-year').name,'Nombre corregido');
 await assert.rejects(mutateGrammyAdmin(db,{action:'save-event',event:{source:'https://www.grammy.com/',nominationsAt:'2027-03-01',closesAt:'2027-02-01'}}));
 await assert.rejects(mutateGrammyAdmin(db,{action:'save-event',event:{source:'https://www.grammy.com.evil.test/',nominationsAt:'2026-11-16',closesAt:'2027-02-01'}}));
 await mutateGrammyAdmin(db,{action:'save-event',event:{source:'https://www.grammy.com/awards/',nominationsAt:'2026-11-16T12:45:00Z',closesAt:'2027-01-01T00:00:00Z'}});
 assert.equal(grammyVotingOpen(tables.grammy_events[0],Date.parse('2027-01-02')),false);
 tables.grammy_results.push({event_id:'grammys-2027',category_id:'album-of-the-year'});
 await assert.rejects(mutateGrammyAdmin(db,{action:'save-event',event:{source:'https://www.grammy.com/',nominationsAt:'2026-11-16',closesAt:'2028-02-01'}}),e=>e.status===409);
});
test('release lookup is bounded to titles and empty queries do not read the catalog',async()=>{
 const {db}=fixture();assert.deepEqual(await searchGrammyReleases(db,''),[]);assert.equal((await searchGrammyReleases(db,'Original'))[0].id,albumId);await assert.rejects(searchGrammyReleases(db,'a'.repeat(121)));
});

test('both administrative HTTP methods reject unauthorized callers before accessing private data',async()=>{
 const source=await readFile(new URL('../src/app/api/grammys/admin/route.js',import.meta.url),'utf8');
 await swc.loadBindings();
 const compiled=await swc.transform(source,{filename:'route.js',jsc:{parser:{syntax:'ecmascript'}},module:{type:'commonjs'}});
 let allowed=false,dbReads=0,invalidations=[];
 const {db}=fixture({published:false});
 const guards=[];
 const imports={
  'next/server':{NextResponse:{json:Response.json.bind(Response)}},
  'next/cache':{revalidateTag:(...args)=>invalidations.push(args)},
  '../../../../server/authorize':{authorize:async(_request,options)=>{guards.push(options);return allowed?{user:{id:'admin'}}:{error:Response.json({error:'Acceso no permitido'},{status:403})};}},
  '../../../../server/grammys':{grammyDb:()=>{dbReads++;return db;}},
  '../../../../server/grammyAdmin.mjs':{readGrammyAdmin,searchGrammyReleases,mutateGrammyAdmin},
 };
 const module={exports:{}};
 new Function('require','module','exports',compiled.code)(name=>{assert.ok(imports[name],name);return imports[name];},module,module.exports);
 const request=body=>new Request('https://musiclub.example/api/grammys/admin',body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});
 assert.equal((await module.exports.GET(request())).status,403);assert.equal((await module.exports.POST(request({action:'close'}))).status,403);assert.equal(dbReads,0);assert.deepEqual(invalidations,[]);assert.deepEqual(guards,[{admin:true},{admin:true}]);
 allowed=true;const response=await module.exports.GET(request());assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.equal((await response.json()).nominees[0].id,nomineeId);
 const saved=await module.exports.POST(request({action:'save-nominee',nominee:{id:nomineeId,categoryId:'album-of-the-year',title:'Saved via HTTP'}}));assert.equal(saved.status,200);assert.deepEqual(invalidations,[['grammys-2027',{expire:0}]]);
 const failed=await module.exports.POST(request({action:'save-nominee',nominee:{categoryId:'no-category',title:'Invalid'}}));assert.equal(failed.status,400);assert.equal(invalidations.length,1);
});

import {grammyReviewSummary,grammyNomineeReviewed,grammyListeningFallback} from '../src/utils/grammyListening.mjs';
import {readGrammyReviews} from '../src/server/grammyReviews.mjs';
test('review gold follows catalog identities and grouped editions, never just a title, artist nomination or prediction',()=>{
 const album={id:albumId,album_name:'Azul',artist_name:'Artist',release_type:'ALBUM'},category={kind:'album'};
 const reviews=grammyReviewSummary([{album_id:albumId,albums:album}]);
 assert.equal(grammyNomineeReviewed({album_id:albumId},category,reviews),true);
 assert.equal(grammyNomineeReviewed({albums:{...album,id:'clean',album_name:'Azul (Clean)'}},category,reviews),true);
 for(const albums of [{...album,id:'deluxe',album_name:'Azul (Deluxe)'},{...album,id:'other',artist_name:'Other Artist'}])assert.equal(grammyNomineeReviewed({albums},category,reviews),false);
 assert.equal(grammyNomineeReviewed({title:'Azul',artist:'Artist'},category,reviews),false);
 assert.equal(grammyNomineeReviewed({album_id:albumId},{kind:'person'},reviews),false);
 assert.equal(grammyNomineeReviewed({album_id:albumId},category,{}),false);
 assert.equal(grammyListeningFallback({title:'A & B / canción'},{kind:'song'}),'/catalogo?q=A%20%26%20B%20%2F%20canci%C3%B3n');
 assert.equal(grammyListeningFallback({album_id:albumId},category),`/albumes/${albumId}`);
 assert.equal(grammyListeningFallback({album_id:albumId},{kind:'person'}),null);
});
test('private review lookup restricts every page to the authenticated email, handles more than 1000 rows and propagates failure',async()=>{
 const calls=[],rows=Array.from({length:1001},(_,i)=>({album_id:`album-${i}`}));
 const db={from(table){assert.equal(table,'reviews');const q={select(columns){assert.equal(columns,'album_id,albums(id,album_name,artist_name,release_type)');return q;},eq(column,value){assert.equal(column,'reviewer_email');assert.equal(value,'own@example.test');return q;},order(column){assert.equal(column,'id');return q;},range(start,end){calls.push([start,end]);return Promise.resolve({data:rows.slice(start,end+1)});}};return q;}};
 const result=await readGrammyReviews(db,'own@example.test');assert.equal(result.albumIds.length,1001);assert.deepEqual(calls,[[0,499],[500,999],[1000,1499]]);
 assert.deepEqual(await readGrammyReviews(db,null),{albumIds:[],releaseKeys:[]});
 const broken={from(){const q={select:()=>q,eq:()=>q,order:()=>q,range:async()=>({error:true})};return q;}};
 await assert.rejects(readGrammyReviews(broken,'own@example.test'));
});
test('personal Grammy HTTP data is private and review ownership comes from the verified session',async()=>{
 const source=await readFile(new URL('../src/app/api/grammys/me/route.js',import.meta.url),'utf8');
 const compiled=await swc.transform(source,{filename:'route.js',jsc:{parser:{syntax:'ecmascript'}},module:{type:'commonjs'}});
 let allowed=false,reads=0,owner;
 const db={from(){reads++;const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:null}),then:resolve=>resolve({data:[]})};return q;}};
 const imports={'next/server':{NextResponse:{json:Response.json.bind(Response)}},'../../../../server/authorize':{authorize:async()=>allowed?{user:{id:'verified',email:'verified@example.test'},db}:{error:Response.json({}, {status:401})}},'../../../../data/grammys2027.mjs':{GRAMMY_EVENT:{id:'grammys-2027'},GRAMMY_CATEGORIES:[]},'../../../../server/grammys':{},'../../../../services/grammyMail.mjs':{},'../../../../server/grammyReviews.mjs':{readGrammyReviews:async(database,email)=>{assert.equal(database,db);owner=email;return {albumIds:[albumId],releaseKeys:[]};}}};
 const module={exports:{}};new Function('require','module','exports',compiled.code)(name=>{assert.ok(imports[name],name);return imports[name];},module,module.exports);
 const request=new Request('https://musiclub.test/api/grammys/me?email=someone-else@example.test');assert.equal((await module.exports.GET(request)).status,401);assert.equal(reads,0);
 allowed=true;const response=await module.exports.GET(request);assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.equal(owner,'verified@example.test');assert.deepEqual((await response.json()).reviews.albumIds,[albumId]);
});
