import test from 'node:test';
import assert from 'node:assert/strict';
import cards from '../src/utils/catalogCards.cjs';
import genres from '../src/utils/genreCatalog.cjs';
import sources from '../src/utils/genreArtworkSources.cjs';
import visuals from '../src/utils/genreVisuals.cjs';
import badges from '../src/utils/genreBadge.cjs';

test('collection cards retain filters, links and scores without shipping tracks, reviews or private data',()=>{
 const album={id:'release',album_name:'Title',artist_name:'Artist',image_url:'cover.jpg',genres:['Pop'],release_type:'ALBUM',release_year:2026,final_rating:9.04,review_count:2,total_tracks:17,
  tracks:Array.from({length:17},(_,i)=>({name:`Track ${i}`,duration:12345})),reviews:[{comment:'Private payload',reviewer_email:'do-not-send@example.test'}],reviewer_email:'private',added_by_email:'private',best_track:{name:'Top',avg_rating:9.5,reviews:[1,2,3]},criteria_averages:{general:9}};
 const result=cards.catalogCard(album);
 assert.equal(result.total_tracks,17);assert.equal(result.review_count,2);assert.equal(result.final_rating,9.04);
 assert.deepEqual(result.best_track,{name:'Top',avg_rating:9.5});assert.deepEqual(result.genres,['Pop']);
 assert.equal(result.album_name,'Title');assert.equal(result.artist_name,'Artist');assert.equal(result.release_year,2026);
 for(const key of ['tracks','reviews','reviewer_email','added_by_email','criteria_averages'])assert.equal(Object.hasOwn(result,key),false);
 assert.ok(JSON.stringify(result).length<JSON.stringify(album).length/2);
});

test('lightweight artwork URLs preserve every registered genre design and selected vinyl pressing',()=>{
 for(const genre of genres.GENRES) {
  const before=visuals.genreRevealArtwork(genre.id),after=sources.genreArtworkSources(genre.id);
  assert.deepEqual(after,{id:before.id,disc:before.disc,center:before.center});
 }
 for(const edition of [0,5,'cereza-electrica']) {
  const before=visuals.genreRevealArtwork('Pop',edition),after=sources.genreArtworkSources('Pop',edition);
  assert.deepEqual(after,{id:before.id,disc:before.disc,center:before.center});
 }
});

test('small genre badges embed their original disc and motif without nested network resources',()=>{
 const svg=badges.genreBadgeSvg('pop');
 assert.match(svg,/viewBox="0 0 320 320"/);assert.match(svg,/x="82" y="82" width="156" height="156"/);
 assert.doesNotMatch(svg,/<image|<script|href=|foreignObject/);
 assert.match(svg,/viewBox="0 0 100 100"/);
});
