import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { mergeOfficialReleases, collectOfficialArtist } from '../src/services/officialArtistCatalog.mjs';
import { refreshStoredArtist, readStoredArtist } from '../src/services/artistDiscographyStore.mjs';
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
