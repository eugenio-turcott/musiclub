import {test} from 'node:test';
import assert from 'node:assert/strict';
import {landingSelection,displayRelease,seededRandom} from '../src/utils/landingExperience.mjs';
import {packCatalogSnapshot,unpackCatalogSnapshot} from '../src/server/catalogSnapshot.mjs';

test('large public catalogues fit the data cache without losing tracks, Unicode or scores',()=>{
 const albums=Array.from({length:1200},(_,i)=>({id:`album-${i}`,album_name:`OSCURO ÉXTASIS ${i}`,artist_name:'Artista',tracks:Array.from({length:25},(_,n)=>({id:`${i}-${n}`,name:`Canción ${n}`,duration_ms:123456,track_number:n+1,artists:['Artista']})),final_rating:9.276,image_url:'/real.webp'}));
 const data={albums,reviews:[{id:'r',comment:'¡Música! 🎧',favorite_track:'0-2'}],stats:{top_score:null}};
 assert.ok(Buffer.byteLength(JSON.stringify(data))>2*1024*1024);
 const packed=packCatalogSnapshot(data);assert.ok(Buffer.byteLength(JSON.stringify(packed))<2*1024*1024);
 assert.deepEqual(unpackCatalogSnapshot(packed),data);
});

test('landing demonstrations prefer actual review relations, preserve release identity and deduplicate editions',()=>{
 const album={id:'a',album_name:'Disco real',artist_name:'Artista real',image_url:'/cover.webp',genres:['Jazz'],tracks:[{name:'Pista real'}],edition_member_ids:['a-clean']};
 const review={album_id:'a-clean',reviewer_name:'Miembro',rating_general:9,albums:{id:'a-clean',album_name:'Disco real',image_url:'/cover.webp'}};
 const selection=landingSelection([album,{id:'b',album:'Otro disco',artista:'Otra artista',imagen:'/other.webp'}],[review]);
 assert.equal(selection[0].album,album);assert.equal(selection[0].review,review);assert.equal(selection.length,1);
 assert.deepEqual(displayRelease({album:'Otro disco',artista:'Otra artista',imagen:'/other.webp'}),{title:'Otro disco',artist:'Otra artista',image:'/other.webp',genres:[]});
 const joined={...album,id:'joined'};assert.equal(landingSelection([], [{albums:joined}])[0].album,joined);
});

test('landing avoids invented records when public data is empty and bounds decorative content',()=>{
 assert.deepEqual(landingSelection([],[]),[]);
 assert.deepEqual(landingSelection([{id:'incomplete',album_name:'Sin portada'}],[]),[]);
 const albums=Array.from({length:20},(_,i)=>({id:String(i),album_name:`Disco ${i}`,image_url:'/cover.webp'}));
 assert.equal(landingSelection(albums,[]).length,0);
});

test('each visit samples ten distinct reviewed releases, including older records, without resampling on interactions',()=>{
 const albums=Array.from({length:35},(_,i)=>({id:String(i),album_name:`Release ${i}`,image_url:'/cover.webp'}));
 const reviews=albums.slice(0,30).map(a=>({id:'review-'+a.id,album_id:a.id}));
 const first=landingSelection(albums,reviews,{random:seededRandom(4356)}),same=landingSelection(albums,reviews,{random:seededRandom(4356)}),next=landingSelection(albums,reviews,{random:seededRandom(8697)});
 assert.equal(first.length,10);assert.equal(new Set(first.map(e=>e.album.id)).size,10);
 assert.ok(first.every(e=>e.review&&e.reviews.length>0));assert.ok(first.some(e=>Number(e.album.id)>15));
 assert.deepEqual(first,same);assert.notDeepEqual(first.map(e=>e.album.id),next.map(e=>e.album.id));
 assert.ok(!first.some(e=>Number(e.album.id)>=30));
});
