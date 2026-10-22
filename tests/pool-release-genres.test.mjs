import test from 'node:test';
import assert from 'node:assert/strict';
import { enrichPoolReleaseGenres } from '../src/services/poolReleaseGenres.mjs';
const item={albumName:'Starboy',artistName:'The Weeknd',genres:[]};
test('capsules use known genres without another lookup and automatically recover missing official genres',async()=>{
 let calls=0;
 const options={searchDeezer:async()=>{calls++;return {albums:[{deezer_id:'one',name:'Starboy',artist:'The Weeknd'}]};},deezerDetails:async()=>({name:'Starboy',artist:'The Weeknd',genres:['Pop'],external_urls:{deezer:'https://www.deezer.com/album/1'}})};
 assert.deepEqual((await enrichPoolReleaseGenres({...item,genres:['Rock']},options)).genres,['Rock']);assert.equal(calls,0);
 const result=await enrichPoolReleaseGenres(item,options);assert.deepEqual(result.genres,['Pop']);assert.equal(calls,1);assert.equal(result.otherLink,'https://www.deezer.com/album/1');
});
test('unrelated releases never supply capsule genres and missing metadata retains the manual fallback',async()=>{
 let details=0;
 const result=await enrichPoolReleaseGenres(item,{searchDeezer:async()=>({albums:[{name:'Starboy',artist:'Someone Else'}]}),deezerDetails:async()=>{details++;},searchMusicBrainz:async()=>[],musicBrainzDetails:async()=>({genres:['Jazz']})});
 assert.deepEqual(result.genres,[]);assert.equal(details,0);
});
