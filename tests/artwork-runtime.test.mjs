import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {decodePalette,imagePalette,ensureArtworkPalette} from '../src/server/artworkPalette.mjs';
import {artistPlatformConcordance} from '../src/services/artistPlatformConcordance.mjs';
import {platformFromReleaseURL,commonDiscography} from '../src/utils/verifiedDiscography.mjs';

test('runtime palette reads JPEG, indexed PNG and transparent PNG in the Worker-compatible decoder',async()=>{
 for(const format of ['jpeg','png']){
  const buffer=await sharp({create:{width:31,height:29,channels:4,background:'#eb3648'}})[format](format==='png'?{palette:true,colours:4}:{quality:90}).toBuffer();
  const colors=decodePalette(buffer);assert.equal(colors.length,1);assert.match(colors[0],/^#[a-f0-9]{6}$/);
  if(format==='png')assert.deepEqual(colors,['#eb3648']);
 }
 const transparent=await sharp({create:{width:20,height:20,channels:4,background:'#0000'}}).png().toBuffer();
 assert.deepEqual(decodePalette(transparent),[]);
 assert.throws(()=>decodePalette(new Uint8Array([1,2,3])));
});

test('image generation rejects private hosts and redirects before issuing another request',async()=>{
 let reads=0;
 const fetcher=async()=>{reads++;return new Response(null,{status:302,headers:{location:'https://127.0.0.1/private'}});};
 await assert.rejects(imagePalette('http://i.scdn.co/image/foo',{fetcher}));assert.equal(reads,0);
 await assert.rejects(imagePalette('https://i.scdn.co/image/foo',{fetcher}));assert.equal(reads,1);
 const bytes=await sharp({create:{width:8,height:8,channels:3,background:'#3285d1'}}).png().toBuffer();
 assert.deepEqual(await imagePalette('https://i.scdn.co/image/foo',{fetcher:async()=>new Response(bytes)}),['#3285d1']);
});

function database(row,{changed=false}={}){
 const writes=[];
 return {writes,from(table){return {select(){return {eq(){return {maybeSingle:async()=>({data:row})}}}},update(patch){const filters=[];const query={eq(k,v){filters.push([k,v]);return query;},async select(){writes.push({table,patch,filters});return {data:changed?[]:[{id:row.id}]};}};return query;}};}};
}
test('new release and artist palettes are saved once with an image URL guard and reused on the next visit',async()=>{
 for(const entity of ['album','artist']){
  const row={id:entity,slug:entity,image_url:'https://i.scdn.co/image/first',dominant_colors:[]};const db=database(row);let reads=0;
  const extract=async()=>{reads++;await new Promise(resolve=>setTimeout(resolve,5));return ['#3285d1'];};
  const results=await Promise.all([ensureArtworkPalette(db,entity,entity,{extract}),ensureArtworkPalette(db,entity,entity,{extract})]);
  assert.equal(reads,1);assert.equal(db.writes.length,1);assert.equal(results[0].changed,true);
  assert.ok(db.writes[0].filters.some(([key,value])=>key===(entity==='artist'?'profile->artist->>image':'image_url')&&value===row.image_url));
  Object.assign(row,db.writes[0].patch);assert.deepEqual((await ensureArtworkPalette(db,entity,entity,{extract})).colors,['#3285d1']);assert.equal(reads,1);
 }
 const db=database({id:'changed',image_url:'https://i.scdn.co/image/changed'},{changed:true});
 await assert.rejects(ensureArtworkPalette(db,'album','changed',{extract:async()=>['#3285d1']}),/changed during analysis/);
});

test('all six services contribute release evidence without accepting artist or search links',()=>{
 assert.equal(platformFromReleaseURL('https://tidal.com/browse/album/123').provider,'TIDAL');
 assert.equal(platformFromReleaseURL('https://music.youtube.com/playlist?list=OLAK5uy_abc-123').provider,'YOUTUBE_MUSIC');
 for(const url of ['https://tidal.com/search?q=album','https://music.youtube.com/channel/123','https://open.spotify.com/artist/0000000000000000000000'])assert.equal(platformFromReleaseURL(url),null);
 const others=['APPLE','DEEZER','YOUTUBE_MUSIC','MUSICBRAINZ','TIDAL'].map(provider=>({provider,id:'x'}));
 const rows=commonDiscography([{id:'other',sources:others},{id:'spotify',sources:[{provider:'SPOTIFY',id:'x'}]}]);
 assert.deepEqual(rows.map(r=>[r.id,r.relevance]),[['spotify',70],['other',30]]);
});

test('MusicBrainz contrast collects real YouTube Music and Tidal release relationships and rejects namesakes',async()=>{
 const id='00000000-0000-4000-8000-000000000001';
 const releases=[{id:'blue',name:'Blue',releaseYear:2026,sources:[{provider:'APPLE',id:'1'}]}];
 const fetcher=async url=>({ok:true,json:async()=>url.includes('artist?')?{artists:[{id,name:'Artist'}]}:{'release-group-count':1,'release-groups':[{id,title:'Blue','first-release-date':'2026-01-01','artist-credit':[{artist:{id}}],relations:[{url:{resource:'https://tidal.com/browse/album/123'}},{url:{resource:'https://music.youtube.com/playlist?list=OLAK5uy_abc'}},{url:{resource:'https://open.spotify.com/search/Blue'}}]}]}});
 const result=await artistPlatformConcordance('Artist',releases,{fetcher,intervalMs:0});
 assert.deepEqual(result.releases[0].sources.map(s=>s.provider),['APPLE','MUSICBRAINZ','TIDAL','YOUTUBE_MUSIC']);
 assert.equal(result.providers.TIDAL.status,'linked');
 await assert.rejects(artistPlatformConcordance('Namesake',releases,{fetcher,intervalMs:0}),/identity ambiguous/);
});
