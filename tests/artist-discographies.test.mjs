import editions from '../src/utils/releaseEditions.cjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { mergeOfficialReleases, collectOfficialArtist, selectOfficialArtist, repairOfficialMetadata } from '../src/services/officialArtistCatalog.mjs';
import { refreshStoredArtist, readStoredArtist, loadStoredArtist } from '../src/services/artistDiscographyStore.mjs';
const release=(name,provider='DEEZER',id=name,extra={})=>({name,release_type:'ALBUM',totalTracks:10,releaseYear:2025,sources:[{provider,id,url:'https://example.test/album/'+id}],...extra});
test('official union keeps deluxe and distinct live works while grouping listening variants and provider links',()=>{
 const rows=mergeOfficialReleases([release('Blue')],[release('Blue','SPOTIFY','2'),release('Blue (Deluxe)'),release('Blue +'),release('Blue Live'),release('Blue','APPLE','3',{explicit:true}),release('Blue','APPLE','4',{explicit:false})]);
 assert.equal(rows.length,3);assert.equal(rows[0].sources.length,5);
 assert.equal(rows.filter(r=>r.name==='Blue').length,1);
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
 assert.equal(profile.providers.DEEZER.status,'partial');assert.ok(seen.some(url=>url.includes('index=1')));
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


test('metadata from an incomplete refresh never erases known tracks, dates or artwork',()=>{
 const [row]=mergeOfficialReleases([release('Blue','DEEZER','1',{image:'cover',releaseDate:'2025-01-02'})],[release('Blue','DEEZER','1',{totalTracks:null,image:'',releaseDate:''})]);
 assert.equal(row.totalTracks,10);assert.equal(row.image,'cover');assert.equal(row.releaseDate,'2025-01-02');
});
test('missing counts merge across platforms only when the edition is unambiguous',()=>{
 const rows=mergeOfficialReleases([release('Blue','DEEZER','1',{totalTracks:null})],[release('Blue - Single','APPLE','2',{release_type:'ALBUM'})]);
 assert.equal(rows.length,1);assert.equal(rows[0].sources.length,2);assert.equal(rows[0].totalTracks,10);
 const variants=mergeOfficialReleases([release('Blue','APPLE','1',{explicit:true}),release('Blue','APPLE','2',{explicit:false})],[release('Blue','DEEZER','3',{totalTracks:null,explicit:null})]);
 assert.equal(variants.length,1);assert.equal(variants[0].sources.length,3);
});
test('metadata repair verifies the provider ID and preserves data when a provider fails',async()=>{
 const profile={discography:[release('Blue','DEEZER','1',{totalTracks:null,image:''}),release('Red','DEEZER','2',{totalTracks:null,image:'known-cover'})]};
 const result=await repairOfficialMetadata(profile,{fetcher:async url=>({ok:true,json:async()=>url.endsWith('/1')?{id:1,nb_tracks:12,cover_xl:'new-cover',genres:{data:[{name:'Rock'}]}}:{id:999,nb_tracks:50}})});
 assert.equal(result.repaired,1);assert.equal(result.unavailable,1);
 assert.equal(result.profile.discography[0].totalTracks,12);assert.deepEqual(result.profile.discography[0].genres,['Rock']);
 assert.equal(result.profile.discography[1].totalTracks,null);assert.equal(result.profile.discography[1].image,'known-cover');
});


test('verified provider IDs bypass name search on subsequent refreshes',async()=>{
 const seen=[];
 const fetcher=async url=>{seen.push(url);let data;
 if(url==='https://api.deezer.com/artist/9')data={id:9,name:'Artist Renamed'};
 else if(url.includes('/artist/9/albums'))data={data:[{id:99,title:'Blue',record_type:'album'}]};
 else if(url.endsWith('/album/99'))data={id:99,title:'Blue',nb_tracks:10,cover_xl:'cover',genres:{data:[{name:'Rock'}]}};
 else throw Error('Unavailable');
 return {ok:true,json:async()=>data};};
 const result=await collectOfficialArtist('Artist',{fetcher,env:{},knownIds:{deezer:'9'}});
 assert.equal(result.success,true);assert.equal(result.providers.DEEZER.artistId,'9');assert.deepEqual(result.discography[0].genres,['Rock']);
 assert.equal(seen.some(url=>url.includes('deezer.com/search')),false);
});
test('distinct barcodes are retained inside a single displayed release',()=>{
 assert.equal(mergeOfficialReleases([release('Blue','DEEZER','1',{barcode:'111'})],[release('Blue','APPLE','2',{barcode:'222'})]).length,1);
});


test('metadata repair retries a provider quota response without losing the release',async()=>{
 let calls=0;const profile={discography:[release('Blue','DEEZER','1',{totalTracks:null,image:'cover'})]};
 const result=await repairOfficialMetadata(profile,{requestIntervalMs:0,fetcher:async()=>({ok:true,json:async()=>++calls===1?{error:{code:4}}:{id:1,nb_tracks:12}})});
 assert.equal(calls,2);assert.equal(result.repaired,1);assert.equal(result.profile.discography[0].totalTracks,12);
});


test('an official single with several tracks is not reclassified as an EP by its count',async()=>{
 const fetcher=async url=>({ok:true,json:async()=>url.endsWith('/artist/9')?{id:9,name:'Artist'}:url.includes('/artist/9/albums')?{data:[{id:99,title:'Blue',record_type:'single'}]}:url.endsWith('/album/99')?{id:99,title:'Blue',record_type:'single',nb_tracks:4,cover_xl:'cover'}:{results:[]}});
 const result=await collectOfficialArtist('Artist',{fetcher,env:{},knownIds:{deezer:'9'}});
 assert.equal(result.discography[0].release_type,'SENCILLO');
});


test('regional, clean and explicit editions share one card, with deluxe separate and all source variants retained',()=>{
 const rows=mergeOfficialReleases([], [release('Vie','DEEZER','1',{explicit:true,totalTracks:15}),release('Vie','APPLE','2',{explicit:false,totalTracks:15}),release('Vie (Paris Edition)','APPLE','3',{totalTracks:20}),release('Vie (Deluxe Edition)','APPLE','4',{totalTracks:22})]);
 assert.deepEqual(rows.map(row=>row.name).sort(),['Vie','Vie (Deluxe)']);
 const standard=rows.find(row=>row.name==='Vie');assert.equal(standard.totalTracks,15);assert.equal(standard.explicit,true);assert.equal(standard.sources.length,3);assert.equal(standard.editionVariants.length,3);
 const next=mergeOfficialReleases(rows,[release('Vie','APPLE','2',{explicit:false,totalTracks:15})]);
 assert.equal(next.length,2);assert.equal(next.find(row=>row.name==='Vie').sources.length,3);
});


test('club display groups original row IDs for reviews while separating artists and deluxe',()=>{
 const rows=editions.groupReleaseEditions([{id:'base',album_name:'Vie',artist_name:'Doja Cat',release_type:'ALBUM'}, {id:'regional',album_name:'Vie (Paris Edition)',artist_name:'Doja Cat',release_type:'ALBUM'}, {id:'clean',album_name:'Vie (Clean)',artist_name:'Doja Cat',release_type:'ALBUM'}, {id:'deluxe',album_name:'Vie (Deluxe)',artist_name:'Doja Cat',release_type:'ALBUM'}, {id:'other',album_name:'Vie',artist_name:'Other Artist',release_type:'ALBUM'}]);
 assert.equal(rows.length,3);assert.deepEqual(rows[0].edition_member_ids,['base','regional','clean']);assert.equal(rows[0].album_name,'Vie');
});
