import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGenreRecommendations } from '../src/utils/genreRecommendations.mjs';
const listened = Array.from({length:10}, (_,index)=>({id:`heard${index}`,genres:[index<7?'Rock':'Jazz']}));
const ratings = listened.map((album,index)=>({album_id:album.id,rating_general:index<7?9:3,created_at:'2026-01-01'}));
const candidates = [
  {id:'rock',genres:['Rock'],review_count:5,base_rating:8},
  {id:'jazz',genres:['Jazz'],review_count:5,base_rating:8},
  {id:'hiphop',genres:['Hip Hop'],review_count:10,base_rating:9},
  {id:'single-perfect',genres:['Jazz'],review_count:1,base_rating:10},
  {id:'unreviewed',genres:['Rock'],review_count:0,base_rating:null},
  {id:'future',genres:['Rock'],review_count:50,base_rating:10,release_date:'2099-01-01'},
];
test('community recommendations work anonymously and until exactly ten distinct rated releases',()=>{
  for (const n of [0,1,9]) {
    const result=buildGenreRecommendations([...listened,...candidates],ratings.slice(0,n),{authenticated:true});
    assert.equal(result.personalized,false);
    assert.equal(result.ratedCount,n);
    assert.ok(result.recommendations.length);
    assert.ok(result.recommendations.every(album=>album.review_count>0));
    assert.ok(!result.recommendations.some(album=>album.id==='future'));
  }
  const anonymous=buildGenreRecommendations(candidates,ratings,{authenticated:false});
  assert.equal(anonymous.ratedCount,0);
  assert.equal(anonymous.personalized,false);
  assert.equal(anonymous.mostReviewed[0].id,'hiphop');
  assert.ok(anonymous.acclaimed.findIndex(a=>a.id==='hiphop')<anonymous.acclaimed.findIndex(a=>a.id==='single-perfect'));
});
test('ten releases personalize by canonical genres and actual ratings, excluding already rated releases',()=>{
  const result=buildGenreRecommendations([...listened,...candidates],ratings,{authenticated:true});
  assert.equal(result.personalized,true);
  assert.equal(result.ratedCount,10);
  assert.equal(result.genreProfile[0].name,'Rock');
  assert.equal(result.genreProfile[0].count,7);
  assert.equal(result.genreProfile[0].average,9);
  assert.ok(result.recommendations.findIndex(a=>a.id==='rock')<result.recommendations.findIndex(a=>a.id==='jazz'));
  assert.ok(result.recommendations.find(a=>a.id==='rock').recommendationReason.includes('Rock'));
  assert.ok(result.recommendations.every(a=>!a.id.startsWith('heard')));
});
test('duplicates, invalid reviews and stale edits never inflate the threshold or the genre analysis',()=>{
  const duplicate=[...ratings.slice(0,9),{...ratings[0],rating_general:2,created_at:'2026-01-02'},ratings[0],{album_id:'invalid',rating_general:null},{album_id:'not-a-score',rating_general:'bad'}];
  const result=buildGenreRecommendations([...listened,...candidates],duplicate,{authenticated:true});
  assert.equal(result.personalized,false);
  assert.equal(result.ratedCount,9);
  assert.equal(result.genreProfile.find(g=>g.id==='rock').count,7);
  assert.equal(result.genreProfile.find(g=>g.id==='rock').average,8);
});
test('a history without usable genre metadata falls back to the community without inventing preferences',()=>{
  const result=buildGenreRecommendations(candidates,ratings,{authenticated:true});
  assert.equal(result.ratedCount,10);
  assert.equal(result.personalized,false);
  assert.deepEqual(result.genreProfile,[]);
});
