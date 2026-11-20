import test from 'node:test';
import assert from 'node:assert/strict';
import {getDeezerAlbumDetails} from '../src/services/deezerApi.js';

const songs = Array.from({length:34}, (_, i) => ({id:1000+i,title:`Song ${i+1}`,duration:180}));
const album = {id:1119883012,title:'Grand Theft Auto VI: The Album',artist:{name:'Grand Theft Auto VI'},nb_tracks:34,record_type:'album',upc:'075679556431',genres:{data:[{name:'Películas/Juegos'},{name:'Scores de Películas'}]},tracks:{data:songs.slice(0,25)}};

test('album details retrieve every track when the embedded first page omits its next link', async t => {
  const urls=[];
  t.mock.method(globalThis,'fetch',async url => {
    urls.push(url);
    return {ok:true,json:async()=>urls.length===1?album:{data:songs.slice(25),total:34}};
  });
  const result=await getDeezerAlbumDetails('deezer_1119883012');
  assert.deepEqual(urls,['https://api.deezer.com/album/1119883012','https://api.deezer.com/album/1119883012/tracks?index=25&limit=100']);
  assert.equal(result.totalTracks,34);
  assert.deepEqual(result.tracks.map(track=>track.id),songs.map(track=>`dz_track_${track.id}`));
  assert.deepEqual(result.tracks.map(track=>track.track_number),Array.from({length:34},(_,i)=>i+1));
  assert.equal(result.barcode,'075679556431');
});

test('complete album details do not make an unnecessary second request', async t => {
  const mock=t.mock.method(globalThis,'fetch',async()=>({ok:true,json:async()=>({...album,nb_tracks:25})}));
  assert.equal((await getDeezerAlbumDetails(album.id)).tracks.length,25);
  assert.equal(mock.mock.callCount(),1);
});

test('UPC recovery paginates using the exact album ID returned by the provider', async t => {
  const urls=[];
  t.mock.method(globalThis,'fetch',async url=>{
    urls.push(url);
    return {ok:true,json:async()=>urls.length===1?album:{data:songs.slice(25),total:34}};
  });
  assert.equal((await getDeezerAlbumDetails('upc:075679556431')).tracks.length,34);
  assert.deepEqual(urls,['https://api.deezer.com/album/upc:075679556431','https://api.deezer.com/album/1119883012/tracks?index=25&limit=100']);
});

for (const failure of ['empty page','provider error']) test(`incomplete album tracks are not accepted after ${failure}`,async t=>{
  let calls=0;
  t.mock.method(console,'warn',()=>{});
  t.mock.method(globalThis,'fetch',async()=>({ok:true,json:async()=>++calls===1?album:failure==='empty page'?{data:[]}:{error:{message:'Unavailable'}}}));
  assert.equal(await getDeezerAlbumDetails(album.id),null);
  assert.equal(calls,2);
});
