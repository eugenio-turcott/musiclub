import test from 'node:test';
import assert from 'node:assert/strict';
import {compactCatalogTransport,restoreCatalogTransport} from '../src/utils/publicCatalogTransport.mjs';
import {buildLandingSnapshot} from '../src/server/landingSnapshot.mjs';
import {getWeightedReviewScore,getEmotionFromReview} from '../src/utils/ratingUtils.js';

const album={id:'original',album_name:'Release',artist_name:'Artista',image_url:'/cover.jpg',release_type:'ALBUM',release_year:2026,edition_member_ids:['original','clean'],genres:['Pop'],review_count:3,final_rating:8.7,tracks:Array.from({length:30},(_,i)=>({id:`track-${i}`,name:`Canción ${i}`,track_number:i+1,duration_ms:240000}))};
const reviews=Array.from({length:3},(_,i)=>({id:`review-${i}`,album_id:i===2?'clean':album.id,reviewer_name:`Member ${i}`,created_at:`2026-11-0${i+1}`,rating_general:9,rating_produccion:5,track_ratings:{'track-0':10,'track-1':8},favorite_track:'track-1',albums:{id:i===2?'clean':album.id,album_name:album.album_name,artist_name:album.artist_name,image_url:album.image_url,release_type:album.release_type,release_year:album.release_year,tracks:album.tracks}}));
const catalog={albums:[album],reviews,stats:{total_reviews:3}};

test('compact transport reconstructs edition relations, track names and scores without duplicating tracklists on the wire',()=>{
 const before=JSON.stringify(catalog),compact=compactCatalogTransport(catalog);
 assert.ok(JSON.stringify(compact).length<before.length*.6);
 assert.ok(compact.reviews.every(r=>!r.albums));
 assert.deepEqual(restoreCatalogTransport(JSON.parse(JSON.stringify(compact))),catalog);
 assert.equal(restoreCatalogTransport(catalog),catalog);assert.equal(JSON.stringify(catalog),before);
});

test('landing keeps the full discovery catalogue and exact review scores without sending duplicate review tracklists',()=>{
 const unreviewed={...album,id:'unreviewed',edition_member_ids:['unreviewed'],review_count:0};
 const data=buildLandingSnapshot({...catalog,albums:[album,unreviewed]});
 assert.equal(data.initialDemoAlbums.length,2);assert.ok(data.initialDemoAlbums.some(a=>a.id==='unreviewed'));
 assert.deepEqual(data.initialAlbums.find(a=>a.id===album.id).tracks,album.tracks);
 assert.equal(data.initialReviews[0].albums.tracks,undefined);assert.equal(data.initialReviews[0].favTrackTitle,'Canción 1');
 assert.ok(data.initialDemoReviews.every(r=>r.track_ratings===undefined));
 for(const r of data.initialDemoReviews){const original=reviews.find(item=>item.id===r.id);assert.equal(r.demo_score,getWeightedReviewScore(original));assert.equal(r.emotion,getEmotionFromReview(original).id);assert.equal(r.favTrackTitle,'Canción 1');}
});
