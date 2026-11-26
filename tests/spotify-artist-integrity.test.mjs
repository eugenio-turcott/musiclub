import test from 'node:test';
import assert from 'node:assert/strict';
import editions from '../src/utils/releaseEditions.cjs';
import {mergeOfficialReleases,collectOfficialArtist} from '../src/services/officialArtistCatalog.mjs';
import {attachClubReleases} from '../src/utils/discographyIdentity.mjs';
import {spotifyPublicArtist,spotifyPublicAlbum} from '../src/services/spotifyPublicCatalog.mjs';
import {createSpotifyBackoff} from '../src/utils/spotifyBackoff.cjs';
const artistId='a'.repeat(22),albumId='b'.repeat(22),singleId='c'.repeat(22),featuredId='d'.repeat(22);
const html=entity=>`<script id="initialState" type="text/plain">${Buffer.from(JSON.stringify({entities:{items:entity}})).toString('base64')}</script>`;
const source=id=>({provider:'SPOTIFY',id,url:`https://open.spotify.com/album/${id}`});
function fetcher(url){
 if(url==='https://open.spotify.com/artist/'+artistId){
  const artist={uri:'spotify:artist:'+artistId,profile:{name:'Tinashe'},discography:{
   albums:{items:[{releases:{items:[{uri:'spotify:album:'+albumId}]}}]},
   singles:{items:[singleId,featuredId].map(id=>({releases:{items:[{uri:'spotify:album:'+id}]}}))}
  }};
  return Promise.resolve({ok:true,text:async()=>html({['spotify:artist:'+artistId]:artist})});
 }
 const id=url.match(/open\.spotify\.com\/album\/(\w+)$/)?.[1];
 if(id){
  const count=id===albumId?8:1;
  const album={uri:'spotify:album:'+id,name:id===albumId?'Quantum Baby':id===singleId?'Melatonin':'Featured Song',
   type:id===albumId?'ALBUM':'SINGLE',date:{year:2026,month:9,day:1},
   artists:{items:[{uri:'spotify:artist:'+(id===featuredId?'e'.repeat(22):artistId),profile:{name:id===featuredId?'Another Artist':'Tinashe'}}]},
   coverArt:{sources:[{url:'https://i.scdn.co/small',width:64},{url:'https://i.scdn.co/full',width:640}]},
   tracksV2:{totalCount:count,items:Array.from({length:count},(_,i)=>({track:{id:id+'-'+i,name:'Track '+i,duration:{totalMilliseconds:180000},trackNumber:i+1,discNumber:1}}))}
  };
  return Promise.resolve({ok:true,text:async()=>html({['spotify:album:'+id]:album})});
 }
 return Promise.resolve({ok:false,status:400,json:async()=>({error:'invalid_client'})});
}
test('external artist arrays and Musiclub credits share an edition identity without merging different artists',()=>{
 const external={id:'spotify',name:'Quantum Baby',artists:['Tinashe'],release_type:'ALBUM',totalTracks:8,sources:[source(albumId)]};
 const club={id:'club',album_name:'QUANTUM BABY',artist_name:'Tinashe',release_type:'ALBUM',total_tracks:8,spotify_link:'https://open.spotify.com/album/'+singleId};
 const result=editions.groupReleaseEditions(attachClubReleases([external],[club]));
 assert.equal(result.length,1);assert.equal(result[0].clubAlbumId,'club');
 assert.equal(result[0].spotify_link,'https://open.spotify.com/album/'+albumId);
 assert.equal(editions.groupReleaseEditions([external,{...external,id:'other',artists:['Someone Else']}]).length,2);
});
test('an artist catalogue groups provider credit differences and prefers the exact Spotify edition and count',()=>{
 const spotify={id:albumId,name:'Quantum Baby',artists:['Tinashe'],release_type:'ALBUM',totalTracks:8,image:'spotify',sources:[source(albumId)]};
 const alternate={id:'apple',name:'QUANTUM BABY',artists:['Tinashe'],release_type:'ALBUM',totalTracks:10,image:'apple',sources:[{provider:'APPLE',id:'apple'}]};
 const rows=mergeOfficialReleases([alternate],[spotify],{artistName:'Tinashe'});assert.equal(rows.length,1);assert.equal(rows[0].totalTracks,8);assert.equal(rows[0].image,'spotify');
 const featured={...spotify,id:featuredId,name:'Featured Song',artists:['Disco Lines'],release_type:'SENCILLO',sources:[source(featuredId)]};
 assert.equal(mergeOfficialReleases([],[featured,{...featured,id:'deezer',artists:['Tinashe'],sources:[{provider:'DEEZER',id:'9'}]}],{artistName:'Tinashe'}).length,1);
});
test('public Spotify metadata verifies dates, full artwork, tracks and featured listings without pretending API completeness',async()=>{
 const album=await spotifyPublicAlbum(albumId,{fetcher});assert.equal(album.totalTracks,8);assert.equal(album.tracks.length,8);assert.equal(album.image,'https://i.scdn.co/full');assert.equal(album.releaseDate,'2026-09-01');
 const result=await spotifyPublicArtist('Tinashe',{artistId,fetcher});assert.equal(result.complete,false);assert.equal(result.releases.length,3);assert.ok(result.releases.some(r=>r.id===featuredId));
 await assert.rejects(spotifyPublicArtist('Someone Else',{artistId,fetcher}),/identity mismatch/);
 await assert.rejects(spotifyPublicAlbum('https://wrong.test',{fetcher}),/Invalid Spotify/);
});
test('failed Spotify application authorization uses the independently verified public artist catalogue',async()=>{
 const profile=await collectOfficialArtist('Tinashe',{knownIds:{spotify:artistId},env:{SPOTIFY_CLIENT_ID:'invalid',SPOTIFY_CLIENT_SECRET:'invalid'},fetcher});
 assert.equal(profile.success,true);assert.equal(profile.providers.SPOTIFY.status,'partial');assert.equal(profile.providers.SPOTIFY.artistId,artistId);assert.equal(profile.discography.length,3);
});
test('Spotify Retry-After stops additional API calls until the deadline while public pages stay available',async()=>{
 let now=100000,calls=0;
 const request=createSpotifyBackoff({now:()=>now,deadline:()=>''});
 const fetcher=async()=>{calls++;return new Response('{}',{status:429,headers:{'Retry-After':'120'}});};
 await request('https://api.spotify.com/v1/search',{},fetcher);
 const waiting=await request('https://api.spotify.com/v1/artists/'+artistId,{},fetcher);assert.equal(calls,1);assert.equal(waiting.headers.get('retry-after'),'120');
 await request('https://open.spotify.com/artist/'+artistId,{},fetcher);assert.equal(calls,2,'public pages use a separate endpoint');
 now+=121000;await request('https://api.spotify.com/v1/search',{},fetcher);assert.equal(calls,3);
 const persisted=createSpotifyBackoff({now:()=>now,deadline:()=>new Date(now+60000).toISOString()});
 assert.equal((await persisted('https://api.spotify.com/v1/search',{},fetcher)).status,429);assert.equal(calls,3);
});
