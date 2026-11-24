import test from 'node:test';
import assert from 'node:assert/strict';
import tracklists from '../src/utils/releaseTracks.cjs';
import {getSortedTrackRatings,splitArtists} from '../src/utils/ratingUtils.js';

test('released placeholder lists are flagged while future and verified real numbered titles are allowed',()=>{
  assert.deepEqual(tracklists.tracklistIssues({release_date:'2020-01-01',tracks:[{name:'Track 1'}],total_tracks:1},'2026-10-28'),['placeholder']);
  assert.deepEqual(tracklists.tracklistIssues({release_date:'2027-01-01',tracks:[],total_tracks:11},'2026-10-28'),[]);
  assert.equal(tracklists.isPlaceholderTrack({name:'Track 10',name_verified:true}),false);
});
test('provider matching preserves plus editions, deluxe, demos and artist-requested titles',()=>{
  assert.equal(tracklists.sameReleaseTitle('MOTOMAMI','MOTOMAMI +'),false);
  assert.equal(tracklists.sameReleaseTitle('LUX','LUX (Complete Works)'),false);
  assert.equal(tracklists.sameReleaseTitle('Fallen (Deluxe Edition / Remastered 2023)','Fallen'),false);
  assert.equal(tracklists.sameReleaseTitle('Dookie (30th Anniversary 4-Track Demos)','Dookie'),false);
  assert.equal(tracklists.sameReleaseTitle('THIS IS FOR (Deluxe Edition)','THIS IS FOR (Deluxe)'),true);
  assert.equal(tracklists.sameReleaseTitle('BREAK EVEN - EP','Break Even'),true);
  assert.equal(tracklists.sameArtistCredit(['Anderson .Paak','Cordae'],'Anderson .Paak & Cordae'),true);
  assert.equal(tracklists.sameArtistCredit('Geraldine Rodriguez','Selena'),false);
  assert.equal(tracklists.sameArtistCredit([{name:'ROSALÍA'}],'ROSALIA'),true);
});

test('a longer secondary edition cannot overwrite a complete released digital album',()=>{
 const standard={album_name:'LUX',release_date:'2025-11-07',release_type:'ALBUM',total_tracks:15,tracks:Array.from({length:15},(_,i)=>({id:String(i),name:`Real song ${i}`}))};
 const physical={album_name:'LUX',release_type:'ALBUM',total_tracks:18};
 assert.equal(tracklists.shouldRefreshTracklist(standard,physical,'2026-11-24'),false);
 assert.equal(tracklists.shouldRefreshTracklist({...standard,tracks:standard.tracks.slice(0,10)},physical,'2026-11-24'),true);
 assert.equal(tracklists.shouldRefreshTracklist({...standard,tracks:[],total_tracks:0},physical,'2026-11-24'),true);
 assert.equal(tracklists.shouldRefreshTracklist({...standard,release_type:'SENCILLO',tracks:standard.tracks.slice(0,1),total_tracks:1},physical,'2026-11-24'),true);
 assert.equal(tracklists.shouldRefreshTracklist({...standard,release_date:'2027-01-01'},physical,'2026-11-24'),true);
});

test('provider detail lookups must still match the requested edition after a search match',async t=>{
 process.env.NEXT_PUBLIC_SUPABASE_URL='http://127.0.0.1:54329';
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='edition_test_only_not_a_credential';
 const {fetchSpotifyDetails,fetchDeezerDetails}=await import('../src/services/albumEnrichmentService.js');
 const previousWindow=globalThis.window;
 const standard={id:'edition-id',name:'LUX',artists:[{name:'ROSALÍA'}],images:[{url:'https://example.test/original.jpg'}],genres:['Pop'],release_date:'2025-11-07',album_type:'album',total_tracks:15,tracks:{items:[]}};
 let detailTitle='LUX (Complete Works)';
 t.mock.method(globalThis,'fetch',async input=>{
  const url=new URL(String(input),'https://musiclub.org');
  if(url.pathname==='/api/spotify'){
   const path=url.searchParams.get('path');
   if(path.startsWith('/v1/search?'))return Response.json({albums:{items:[standard]}});
   if(path==='/v1/albums/edition-id')return Response.json({...standard,name:detailTitle});
  }
  if(url.hostname==='api.deezer.com'){
   if(url.pathname==='/search/album')return Response.json({data:[{id:1,title:'LUX',artist:{name:'ROSALÍA'},nb_tracks:15}]});
   if(url.pathname==='/album/1')return Response.json({id:1,title:detailTitle,artist:{name:'ROSALÍA'},nb_tracks:1,tracks:{data:[{id:10,title:'Reliquia',duration:230}]}});
  }
  assert.fail(`Unexpected provider request: ${url}`);
 });
 try{
  globalThis.window={};
  assert.equal(await fetchSpotifyDetails('ROSALÍA','LUX'),null);
  assert.equal(await fetchDeezerDetails('ROSALÍA','LUX'),null);
  assert.equal((await fetchSpotifyDetails('ROSALÍA','LUX (Complete Works)','edition-id')).name,'LUX (Complete Works)');
  detailTitle='LUX';
  assert.equal((await fetchSpotifyDetails('ROSALÍA','LUX')).name,'LUX');
  assert.equal((await fetchDeezerDetails('ROSALÍA','LUX')).tracks.length,1);
 }finally{
  if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;
 }
});
test('real titles replace provisional names without changing old rating IDs or downgrading known names',()=>{
  const old=[{id:'old-1',name:'Track 1',track_number:1},{id:'old-2',name:'Marianne',track_number:2}];
  const fresh=[{id:'rc-1',name:'Six Shot Morning',track_number:1},{id:'rc-2',name:'Marianne',track_number:2}];
  const merged=tracklists.mergeTracklist(old,tracklists.selectTracklist(old,fresh));
  assert.deepEqual(merged.map(t=>t.id),['old-1','old-2']);
  assert.equal(merged[0].name,'Six Shot Morning');assert.ok(merged[0].id_aliases.includes('rc-1'));
  assert.equal(tracklists.selectTracklist(merged,old),merged);
  assert.equal(tracklists.mergeTracklist(merged,old)[0].name,'Six Shot Morning');
  assert.equal(tracklists.mergeTracklist(merged,fresh.slice(0,1)).length,2);
  const provisional=[...old,{id:'old-3',name:'Track 3',track_number:3}];
  const partial=tracklists.mergeTracklist(provisional,fresh);
  assert.equal(partial.length,3);assert.equal(partial[2].id,'old-3');
  assert.deepEqual(tracklists.tracklistIssues({tracks:partial,total_tracks:3}),['placeholder']);
});
test('an added opening song cannot take the ID of an existing named song',()=>{
  const merged=tracklists.mergeTracklist([{id:'a',name:'A',track_number:1}],[{id:'intro',name:'Intro',track_number:1},{id:'other-a',name:'A',track_number:2}]);
  assert.deepEqual(merged.map(t=>t.id),['intro','a']);
});
test('review tracks sort by score, then tracklist order, with IDs, aliases, zero scores and favorite preserved',()=>{
  const tracks=[{id:'a',name:'First',id_aliases:['provider-a']},{id:'b',name:'Second'},{id:'c',name:'Third'}];
  const rows=getSortedTrackRatings({c:9,b:10,'provider-a':9,unknown:0,bad:null},tracks,'a');
  assert.deepEqual(rows.map(t=>t.name),['Second','First','Third','unknown']);
  assert.equal(rows[1].isFavorite,true);assert.equal(rows[0].isFavorite,false);assert.equal(rows[3].score,0);
  assert.deepEqual(getSortedTrackRatings({'2':9,'1':9},tracks).map(t=>t.name),['First','Second']);
});
test('collaborations have individual comma-ready credits while actual artist names retain their punctuation',()=>{
  assert.deepEqual(splitArtists('Anderson .Paak & Cordae').map(a=>a.name),['Anderson .Paak','Cordae']);
  assert.deepEqual(splitArtists('Tyler, The Creator & A$AP Rocky').map(a=>a.name),['Tyler, The Creator','A$AP Rocky']);
  assert.deepEqual(splitArtists('piri & tommy, piri, Tommy Villiers').map(a=>a.name),['piri & tommy','piri','Tommy Villiers']);
  assert.deepEqual(splitArtists('Earth, Wind & Fire').map(a=>a.name),['Earth, Wind & Fire']);
});
