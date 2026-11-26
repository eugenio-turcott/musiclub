import test from 'node:test';
import assert from 'node:assert/strict';
import {compatibleDiscographyRelease,attachClubReleases} from '../src/utils/discographyIdentity.mjs';
import {discoverReviewContinuations} from '../src/services/reviewContinuationDiscovery.mjs';
import {grammyListeningProgress} from '../src/utils/grammyListening.mjs';
import academy from '../src/server/annual2026Academy.json' with {type:'json'};
import {ANNUAL_ART} from '../src/data/annual2026Art.mjs';
import {fetchSpotifyEmbedAlbum} from '../src/services/spotifyApi.js';
import {mergeOfficialReleases} from '../src/services/officialArtistCatalog.mjs';

test('Spotify artwork wins over a secondary explicit flag within the same edition',()=>{
 const r={name:'Release',artists:['Artist'],release_type:'ALBUM',totalTracks:12};
 const [album]=mergeOfficialReleases([],[{...r,id:'apple',image:'apple-cover',explicit:true,sources:[{provider:'APPLE',id:'apple'}]},{...r,id:'spotify',image:'spotify-cover',explicit:false,sources:[{provider:'SPOTIFY',id:'spotify'}]}]);
 assert.equal(album.image,'spotify-cover');assert.equal(album.sources.length,2);
});

test('Spotify dates wrapped in isoString retain the correct album instead of failing into a fallback',async()=>{
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async()=>({ok:true,text:async()=>'<script id="__NEXT_DATA__">'+JSON.stringify({props:{pageProps:{state:{data:{entity:{name:'The Life of a Showgirl',subtitle:'Taylor Swift',releaseDate:{isoString:'2025-10-03T04:00:00Z'},trackList:[{id:'1',title:'The Fate of Ophelia',duration:220000}]}}}}}})+'</script>'});
  const album=await fetchSpotifyEmbedAlbum('1234567890123456789012');assert.equal(album.name,'The Life of a Showgirl');assert.equal(album.releaseDate,'2025-10-03');assert.equal(album.releaseYear,2025);
 }finally{globalThis.fetch=original;}
});

test('discography attachment rejects a title match with the wrong edition, track count or artist',()=>{
 const r={name:'expectations',artists:['Olivia Rodrigo'],release_type:'SENCILLO',totalTracks:2,image:'right-cover',sources:[{provider:'SPOTIFY',id:'verified'}]};
 const wrong={id:'wrong',album_name:'expectations',artist_name:'Olivia Rodrigo & Chappell Roan',release_type:'ALBUM',total_tracks:14,image_url:'wrong-cover'};
 const rows=attachClubReleases([r],[wrong]);assert.equal(rows[0].image,'right-cover');assert.equal(rows[0].clubAlbumId,undefined);
 assert.equal(compatibleDiscographyRelease(r,{...wrong,release_type:'SENCILLO',total_tracks:2}),true);
 assert.equal(compatibleDiscographyRelease(r,{...wrong,artist_name:'Someone Else',release_type:'SENCILLO',total_tracks:2}),false);
 const matched=attachClubReleases([r],[{...wrong,release_type:'SENCILLO',total_tracks:2}])[0];assert.equal(matched.image,'right-cover');assert.equal(matched.totalTracks,2);
});
test('Grammy progress deduplicates releases and credits across categories and includes person nominations only as artists',()=>{
 const categories=[{id:'album',kind:'release'},{id:'again',kind:'release'},{id:'writer',kind:'person'}],album={id:'a',album_name:'A',artist_name:'One & Two',release_type:'ALBUM'};
 const nominees=[{category_id:'album',album_id:'a',albums:album},{category_id:'again',album_id:'a',albums:album},{category_id:'album',album_id:'b',albums:{...album,id:'b',album_name:'B',artist_name:'Three'}},{category_id:'writer',title:'Four',artist:'Four'}];
 assert.deepEqual(grammyListeningProgress(nominees,categories,{albumIds:['a']}),{totalReleases:2,reviewedReleases:1,totalArtists:4,reviewedArtists:2});
});
test('all twenty mural works are distinct albums from 2026, with their own catalogue route',()=>{
 assert.equal(ANNUAL_ART.length,20);assert.equal(new Set(academy.releases.map(a=>a.albumId)).size,20);
 for(const art of ANNUAL_ART){const r=academy.releases.find(r=>r.id===art.id);assert.equal(r.year,2026);assert.ok(r.date.startsWith('2026'));assert.equal(r.type,'ALBUM');assert.equal(r.title,art.title);assert.ok(r.category);assert.ok(art.catalogPath.startsWith('/albumes/'));}
 assert.equal(ANNUAL_ART.some(a=>/Taylor Swift|Olivia Dean|Geese/.test(a.artist)),false);
});
test('a reviewed LANA discovers and imports SOS outside Musiclub only after five recordings match',async()=>{
 const tracks=Array.from({length:7},(_,i)=>({id:'source-'+i,name:'Recording '+i,duration_ms:180000+i*1000}));
 const source={id:'lana-test',album_name:'SOS Deluxe: LANA',artist_name:'SZA',release_type:'ALBUM',tracks},review={album_id:source.id,created_at:'2026-11-26',track_ratings:Object.fromEntries(tracks.map(t=>[t.id,8]))};
 const external={id:'apple-sos',name:'SOS',artist:'SZA',release_type:'ALBUM',image:'https://example.test/sos.jpg',releaseDate:'2022-12-09',genres:['R&B'],totalTracks:5,tracks:tracks.slice(0,5).map((t,i)=>({...t,id:'target-'+i})),external_urls:{itunes:'https://music.apple.com/album/sos/123'}};
 const inserted=[],db={from:()=>({select:()=>({eq:()=>({eq:()=>({limit:async()=>({data:[]})})})}),insert:payload=>{inserted.push(payload);return {select:()=>({single:async()=>({data:{...payload,id:'sos'}})})};}})};
 const result=await discoverReviewContinuations(db,[source],[review],{searchApple:async()=>({albums:[external]}),appleDetails:async()=>external,searchDeezer:async()=>({albums:[]})});
 assert.equal(result[0].album_name,'SOS');assert.equal(inserted[0].tracks.length,5);assert.match(inserted[0].id,/^[a-f0-9-]{36}$/);assert.equal(inserted[0].rating_general,undefined);
});
test('unrelated catalogue results and insufficient shared tracks never create an import',async()=>{
 const source={id:'unrelated-test',album_name:'Album Deluxe',artist_name:'Artist',release_type:'ALBUM',tracks:Array.from({length:5},(_,i)=>({id:''+i,name:'Recording '+i,duration_ms:180000}))};
 let writes=0;const rows=await discoverReviewContinuations({from:()=>{writes++;throw Error('No writes expected');}},[source],[{album_id:source.id,track_ratings:{0:8,1:8,2:8,3:8,4:8}}],{searchApple:async()=>({albums:[{name:'Album',artist:'Unrelated',id:'bad'}]}),searchDeezer:async()=>({albums:[]})});assert.deepEqual(rows,[]);assert.equal(writes,0);
});

test('an already reviewed standard edition cannot prevent discovering its missing deluxe',async()=>{
 const tracks=Array.from({length:6},(_,i)=>({id:'normal-'+i,name:'Actual recording '+i,duration_ms:180000+i*1000}));
 const source={id:'normal-discovery',album_name:'Release',artist_name:'Another Artist',release_type:'ALBUM',tracks,total_tracks:6},review={album_id:source.id,track_ratings:Object.fromEntries(tracks.map(t=>[t.id,9]))};
 const normal={id:'standard',name:'Release',artist:'Another Artist',release_type:'ALBUM',image:'https://example.test/cover.jpg',releaseDate:'2025-01-01',totalTracks:6,tracks},deluxe={...normal,id:'deluxe',name:'Release (Deluxe)',totalTracks:7,tracks:[...tracks,{id:'extra',name:'Another recording',duration_ms:190000}]};
 const saved=[],db={from:()=>({select:()=>({eq:()=>({eq:()=>({limit:async()=>({data:[]})})})}),insert:payload=>{saved.push(payload);return {select:()=>({single:async()=>({data:payload})})};}})};
 const found=await discoverReviewContinuations(db,[source],[review],{searchApple:async()=>({albums:[normal,deluxe]}),appleDetails:async id=>id==='standard'?normal:deluxe,searchDeezer:async()=>({albums:[]})});
 assert.equal(found[0].album_name,'Release (Deluxe)');assert.equal(saved.length,1);
});
