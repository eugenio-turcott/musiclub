import test from 'node:test';
import assert from 'node:assert/strict';
import editions from '../src/utils/releaseEditions.cjs';
import {getTrackDisplayName,getSortedTrackRatings,getReleaseUrl} from '../src/utils/ratingUtils.js';

process.env.NEXT_PUBLIC_SUPABASE_URL='http://127.0.0.1:54329';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='edition_test_only_not_a_credential';
const {buildAlbumWithFullStats}=await import('../src/services/supabaseClient.js');

const tracks=(prefix,count)=>Array.from({length:count},(_,i)=>({id:`${prefix}-${i+1}`,name:`Canción ${i+1}`,track_number:i+1}));
const standard={id:'motomami',album_name:'MOTOMAMI',artist_name:'ROSALÍA',release_type:'ALBUM',total_tracks:16,tracks:tracks('standard',16)};
const plus={...standard,id:'motomami-plus',album_name:'MOTOMAMI +',total_tracks:24,tracks:tracks('plus',24)};
plus.tracks[22]={id:'3CBaIz3eftJCf9GHycFanL',name:'CHIRI',track_number:23};
const plusReview={id:'plus-review',album_id:plus.id,rating_general:9,track_ratings:Object.fromEntries([...plus.tracks].reverse().map(track=>[track.id,10])),favorite_track:'3CBaIz3eftJCf9GHycFanL'};

test('MOTOMAMI + stays a separate 24-track release with its own URL and reviews',()=>{
 const before=JSON.stringify({standard,plus,plusReview});
 const grouped=editions.groupReleaseEditions([plus,standard]);
 assert.equal(grouped.length,2);
 const release=grouped.find(a=>a.id===plus.id);
 assert.equal(release.album_name,'MOTOMAMI +');assert.equal(release.tracks.length,24);
 assert.deepEqual(release.edition_member_ids,[plus.id]);
 assert.equal(getReleaseUrl(release),'/albumes/rosalia-motomami-plus');
 const detail=buildAlbumWithFullStats(release,[plusReview]);
 const ratings=getSortedTrackRatings(plusReview.track_ratings,detail.tracks,plusReview.favorite_track);
 assert.equal(ratings.length,24);assert.ok(ratings.every(r=>r.index>=0));
 assert.deepEqual(ratings.map(r=>r.key),plus.tracks.map(t=>t.id));
 assert.equal(getTrackDisplayName(plusReview.favorite_track,detail.tracks),'CHIRI');
 assert.equal(detail.best_track.name,'CHIRI');assert.equal(detail.track_stats.length,24);
 assert.ok(detail.track_stats.every(track=>track.rating_count===1&&track.avg_rating===10));
 assert.equal(JSON.stringify({standard,plus,plusReview}),before);
});

test('Selena anniversary reviews never use the original 12-track edition',()=>{
 const original={id:'selena-original',album_name:'Amor Prohibido',artist_name:'Selena',tracks:tracks('original',12),total_tracks:12};
 const remaster={...original,id:'selena-remaster',album_name:'Amor Prohibido (Remasterizado 2024/30th Anniversary)',tracks:tracks('remaster',10),total_tracks:10};
 remaster.tracks[4]={id:'6JtbSDuIoyacf88MYAKtME',name:'El Chico Del Apartamento 512 - Remasterizado 2024/30th Anniversary',track_number:5};
 const reviews=[1,2,3].map(i=>({id:`review-${i}`,album_id:remaster.id,rating_general:8,favorite_track:remaster.tracks[4].id,track_ratings:Object.fromEntries(remaster.tracks.map(t=>[t.id,8]))}));
 const release=editions.groupReleaseEditions([original,remaster]).find(a=>a.id===remaster.id);
 assert.deepEqual(release.edition_member_ids,[remaster.id]);
 const detail=buildAlbumWithFullStats(release,reviews);
 assert.equal(detail.review_count,3);assert.equal(detail.tracks.length,10);assert.equal(detail.track_stats.length,10);
 assert.ok(detail.track_stats.every(track=>track.rating_count===3&&track.avg_rating===8));
 assert.match(detail.best_track.name,/El Chico Del Apartamento 512/);
 assert.ok(reviews.every(review=>getSortedTrackRatings(review.track_ratings,detail.tracks).every(r=>r.index>=0)));
});

test('plus, anniversary, remaster, bonus and expanded editions retain their identity',()=>{
 const titles=['Blue','Blue +','Blue (Deluxe)','Blue (2019 Remaster)','Blue - 2024 Remastered','Blue (30th Anniversary)','Blue (Expanded Edition)','Blue (Bonus Tracks)','Blue (Deluxe Edition / Remastered 2023)'];
 const grouped=editions.groupReleaseEditions(titles.map((album_name,i)=>({id:i,album_name,artist_name:'Artist'})));
 assert.equal(grouped.length,titles.length);
 assert.equal(editions.editionTitle('MOTOMAMI+').name,'MOTOMAMI +');
 assert.equal(editions.editionTitle('Blue (Deluxe Edition)').name,'Blue (Deluxe)');
 assert.equal(editions.editionTitle('Blue (Deluxe Edition / Remastered 2023)').name,'Blue (Deluxe Edition / Remastered 2023)');
});

test('clean and explicit variants still share one release without absorbing a plus edition',()=>{
 const rows=editions.groupReleaseEditions(['Blue','Blue (Clean)','Blue (Explicit)','Blue +'].map((album_name,i)=>({id:String(i),album_name,artist_name:'Artist'})));
 assert.equal(rows.length,2);assert.deepEqual(rows[0].edition_member_ids,['0','1','2']);
});
