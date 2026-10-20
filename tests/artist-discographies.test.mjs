import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { mergeOfficialReleases, collectOfficialArtist, selectOfficialArtist } from '../src/services/officialArtistCatalog.mjs';
import { refreshStoredArtist, readStoredArtist, loadStoredArtist } from '../src/services/artistDiscographyStore.mjs';
const release=(name,provider='DEEZER',id=name,extra={})=>({name,release_type:'ALBUM',totalTracks:10,releaseYear:2025,sources:[{provider,id,url:'https://example.test/album/'+id}],...extra});
test('official union preserves deluxe, live, explicit and plus editions and their provider links',()=>{
 const rows=mergeOfficialReleases([release('Blue')],[release('Blue','SPOTIFY','2'),release('Blue (Deluxe)'),release('Blue +'),release('Blue Live'),release('Blue','APPLE','3',{explicit:true}),release('Blue','APPLE','4',{explicit:false})]);
 assert.equal(rows.length,5);assert.equal(rows[0].sources.length,3);
 assert.equal(rows.filter(r=>r.name==='Blue').length,2);
});
test('official lookup follows provider pagination and rejects ambiguous artist identities',async()=>{
 const seen=[];
 const fetcher=async url=>{seen.push(url);let data;
 if(url.includes('/search/artist'))data={data:[{id:1,name:'Artist'}]};
 else if(url.includes('index=1'))data={data:[{id:11,title:'Second',record_type:'album'}]};
 else if(url.includes('/artist/1/albums?'))data={data:[{id:10,title:'First',record_type:'album'}],next:'https://api.deezer.com/artist/1/albums?index=1'};
 else if(url.includes('itunes.apple.com/search'))data={results:[{artistId:2,artistName:'Artist'},{artistId:3,artistName:'Artist'}]};
 else throw new Error('Unexpected request');
 return {ok:true,json:async()=>data};};
 const profile=await collectOfficialArtist('Artist',{fetcher,env:{}});
 assert.equal(profile.discography.length,2);assert.equal(profile.providers.APPLE.status,'unavailable');
 assert.equal(profile.providers.DEEZER.status,'ok');assert.ok(seen.some(url=>url.includes('index=1')));
});
test('database reads never call providers and failed refreshes retain the last good profile',async()=>{
 const previous={profile:{discography:[release('Blue')]},providers:{DEEZER:{artistId:'1'}}};let patch,collectCalls=0;
 const db={rpc:async()=>({data:true}),from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:previous})})}),update:value=>{patch=value;return {eq:async()=>({})};}})};
 assert.equal(await readStoredArtist(db,'artist'),previous);
 await refreshStoredArtist(db,'artist','Artist',{collect:async()=>{collectCalls++;throw new Error('offline');}});
 assert.equal(collectCalls,1);assert.equal(patch.profile,undefined);assert.equal(previous.profile.discography[0].name,'Blue');
});
test('the database lease prevents concurrent provider refreshes',async()=>{
 let calls=0;
 assert.deepEqual(await refreshStoredArtist({rpc:async()=>({data:false})},'artist','Artist',{collect:async()=>calls++}),{skipped:true});
 assert.equal(calls,0);
});
test('artist storage grants public reading but restricts writing and refresh claims to the server',async()=>{
 const db=new PGlite();
 try {
 await db.exec('create role anon; create role authenticated; create role service_role;');
 await db.exec(await readFile(new URL('../supabase/migrations/20261020_artist_discographies.sql',import.meta.url),'utf8'));
 assert.equal((await db.query("select musiclub_claim_artist_refresh('artist','Artist') as claimed")).rows[0].claimed,true);
 assert.equal((await db.query("select musiclub_claim_artist_refresh('artist','Artist') as claimed")).rows[0].claimed,false);
 await db.exec('set role anon');assert.equal((await db.query('select name from artist_discographies')).rows[0].name,'Artist');
 await assert.rejects(db.exec("insert into artist_discographies(slug,name) values('other','Other')"),/permission denied/);
 await assert.rejects(db.query("select musiclub_claim_artist_refresh('other','Other')"),/permission denied/);
 } finally {await db.close();}
});

test('a refreshed provider record updates metadata without creating a second copy',()=>{
 const rows=mergeOfficialReleases([release('Blue','DEEZER','1',{totalTracks:null})],[release('Blue','DEEZER','1',{totalTracks:12})]);
 assert.equal(rows.length,1);assert.equal(rows[0].totalTracks,12);
});


test('first artist discovery reads the database, saves verified metadata, then rereads the database',async()=>{
 const events=[];let saved=null;
 const db={from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>{events.push('db');return {data:saved};}})})})};
 const profile={source:'OFFICIAL',discography:[release('Blue')]};
 const actual=await loadStoredArtist(db,'artist',{canDiscover:true,refresh:async()=>{events.push('save');saved={profile};}});
 assert.equal(actual,profile);assert.deepEqual(events,['db','save','db']);
});
test('an existing artist returns database data immediately and schedules an overdue update',async()=>{
 const profile={discography:[release('Blue')]};let scheduled,called=false;
 const db={from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{profile,refresh_after:'2000-01-01'}})})})})};
 assert.equal(await loadStoredArtist(db,'artist',{canDiscover:true,refresh:async()=>{called=true;},schedule:task=>scheduled=task}),profile);
 assert.equal(called,false);await scheduled();assert.equal(called,true);
});
test('failed discovery never returns unpersisted upstream data and local releases do not wait',async()=>{
 const db={from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null})})})})};let scheduled;
 assert.equal(await loadStoredArtist(db,'artist',{canDiscover:true,refresh:async()=>({discography:[release('Not saved')]})}),null);
 assert.equal(await loadStoredArtist(db,'artist',{hasLocal:true,canDiscover:true,refresh:async()=>{},schedule:task=>scheduled=task}),null);
 assert.equal(typeof scheduled,'function');
});


test('namesakes are resolved by an existing release, never by order or popularity',async()=>{
 const candidates=[{id:'other',name:'Tinashe'},{id:'official',name:'Tinashe'},{id:'accent',name:'Tinashé'}];
 const catalogs={other:[{title:'Other Music'}],official:[{title:'QUANTUM BABY'}],accent:[{title:'Another Song'}]};
 const result=await selectOfficialArtist(candidates,{idOf:a=>a.id,knownReleases:['QUANTUM BABY'],catalog:async a=>catalogs[a.id]});
 assert.equal(result.artist.id,'official');assert.equal(result.items[0].title,'QUANTUM BABY');
 await assert.rejects(selectOfficialArtist(candidates,{idOf:a=>a.id,knownReleases:[],catalog:async a=>catalogs[a.id]}),/ambiguous/);
});
test('ambiguous release evidence remains unresolved and verified IDs are reused',async()=>{
 const candidates=[{id:'a'},{id:'b'}];let requests=[];
 await assert.rejects(selectOfficialArtist(candidates,{idOf:a=>a.id,knownReleases:['Blue'],catalog:async()=>[{name:'Blue'}]}),/ambiguous/);
 const result=await selectOfficialArtist(candidates,{knownId:'b',idOf:a=>a.id,catalog:async a=>{requests.push(a.id);return [];}});
 assert.equal(result.artist.id,'b');assert.deepEqual(requests,['b']);
});


test('more than six namesakes are checked with bounded concurrency instead of being discarded',async()=>{
 const candidates=Array.from({length:12},(_,id)=>({id:String(id),name:'BIBI'}));let active=0,max=0;
 const result=await selectOfficialArtist(candidates,{idOf:a=>a.id,knownReleases:['EVE: ROMANCE'],catalog:async a=>{
 active++;max=Math.max(max,active);await new Promise(resolve=>setTimeout(resolve,2));active--;
 return [{title:a.id==='9'?'EVE: ROMANCE':'Unrelated '+a.id}];}});
 assert.equal(result.artist.id,'9');assert.ok(max<=3);
});
test('an exact official album link resolves BIBI without reading unrelated namesake catalogues',async()=>{
 const requests=[];
 const fetcher=async url=>{requests.push(url);let data;
 if(url.includes('/search/artist'))data={data:Array.from({length:12},(_,id)=>({id:String(id),name:'BIBI'}))};
 else if(url.includes('/album/99'))data={id:99,title:'EVE: ROMANCE',artist:{id:'9',name:'BIBI'},nb_tracks:14};
 else if(url.includes('/artist/9/albums'))data={data:[{id:99,title:'EVE: ROMANCE',record_type:'album'}]};
 else throw new Error('Provider unavailable or unrelated artist');
 return {ok:true,json:async()=>data};};
 const result=await collectOfficialArtist('BIBI',{env:{},fetcher,knownReleases:[{album_name:'EVE: ROMANCE',other_link:'https://www.deezer.com/album/99'}]});
 assert.equal(result.providers.DEEZER.artistId,'9');assert.equal(result.success,true);
 assert.equal(requests.filter(url=>/\/artist\/\d+\/albums/.test(url)).length,1);
});
test('an unrelated album URL cannot override the artist identity',async()=>{
 const fetcher=async url=>{let data;
 if(url.includes('/search/artist'))data={data:[{id:'1',name:'BIBI'},{id:'2',name:'BIBI'}]};
 else if(url.includes('/album/99'))data={title:'OTHER',artist:{id:'1',name:'BIBI'}};
 else if(url.includes('/albums'))data={data:[]};
 else throw new Error('Provider unavailable');
 return {ok:true,json:async()=>data};};
 const result=await collectOfficialArtist('BIBI',{env:{},fetcher,knownReleases:[{album_name:'EVE: ROMANCE',other_link:'https://www.deezer.com/album/99'}]});
 assert.equal(result.providers.DEEZER.status,'unavailable');assert.equal(result.success,false);
});
