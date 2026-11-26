import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import discs from '../src/utils/trackDiscs.cjs';
import {reviewContinuations,sameRecording} from '../src/utils/reviewContinuations.mjs';
import {commonDiscography,verifiedPlatforms,releaseRelevance,PLATFORM_WEIGHTS} from '../src/utils/verifiedDiscography.mjs';
import {extractArtworkPalette,permittedArtworkURL} from '../scripts/lib/artwork-palette.mjs';
const songs=Array.from({length:8},(_,i)=>({id:`song-${i}`,name:`Recording ${i}`,duration_ms:180000+i*1000,track_number:i+1}));
const album=(id,title,tracks=songs)=>({id,album_name:title,artist_name:'Example Artist',release_type:'ALBUM',release_date:'2026-01-01',tracks});
const review=(album_id,tracks=songs)=>({album_id,created_at:'2026-11-25T12:00:00Z',track_ratings:Object.fromEntries(tracks.map((t,i)=>[t.id,i===0?0:8]))});

test('disc boundaries preserve order and global indices, including providers that reset track numbers',()=>{
 const tracks=[...songs.slice(0,3),...songs.slice(3,6).map((t,i)=>({...t,track_number:i+1}))];
 const sections=discs.trackDiscSections(tracks);
 assert.deepEqual(sections.map(s=>[s.disc,s.tracks.length]),[[1,3],[2,3]]);
 assert.deepEqual(sections.flatMap(s=>s.tracks.map(t=>t.global_index)),[0,1,2,3,4,5]);
 assert.deepEqual(tracks.map(t=>t.disc_number),Array(6).fill(undefined));
 assert.deepEqual(discs.normalizeTrackDiscs([{...songs[0],disc_number:1},{...songs[1],disc_number:2,track_number:1}]).map(t=>t.disc_number),[1,2]);
});
test('five shared recordings invite a deluxe reviewer to the standard album without inventing criterion scores',()=>{
 const normal=album('normal','Release',songs.slice(0,5)),deluxe=album('deluxe','Release (Deluxe)');
 const [item]=reviewContinuations([normal,deluxe],[review('deluxe')]);
 assert.equal(item.albumId,'normal');assert.equal(item.matchedTracks,5);assert.equal(item.trackRatings['song-0'],0);assert.equal(item.rating_general,undefined);
 assert.deepEqual(reviewContinuations([normal,deluxe],[review('deluxe',songs.slice(0,4))]),[]);
});
test('a single is the exception and the standard album comes before its deluxe',()=>{
 const single={...album('single','Recording 0',songs.slice(0,1)),release_type:'SENCILLO'},normal=album('normal','Release'),deluxe=album('deluxe','Release (Deluxe)');
 assert.deepEqual(reviewContinuations([deluxe,normal,single],[review('single',single.tracks)]).map(x=>x.albumId),['normal']);
 assert.deepEqual(reviewContinuations([deluxe,normal,single],[review('single',single.tracks),review('normal')]).map(x=>x.albumId),['deluxe']);
});
test('only matching recordings and multiplicities count, not remixes or unrelated artists',()=>{
 assert.equal(sameRecording({name:'Song',duration_ms:180000},{name:'Song (Remix)',duration_ms:180000}),false);
 assert.equal(sameRecording({name:'Song',duration_ms:180000},{name:'Song',duration_ms:190000}),false);
 assert.equal(sameRecording({isrc:'xx123',name:'A'},{isrc:'XX123',name:'Another credit'}),true);
 const source=album('a','First'),other={...album('b','Other'),artist_name:'Someone Else'};
 assert.deepEqual(reviewContinuations([source,other],[review('a')]),[]);
 const single={...album('single','Song',[songs[0]]),release_type:'SENCILLO'};
 const item=reviewContinuations([single,album('b','Another',Array(6).fill(songs[0]))],[review('single',single.tracks)])[0];
 assert.equal(item.matchedTracks,1,'one rated occurrence cannot become six rated tracks');
});
test('already reviewed aliases, unreleased editions and disabled releases are not invitations',()=>{
 const source=album('a','First'),target={...album('b','Other'),edition_member_ids:['b','clean']};
 assert.deepEqual(reviewContinuations([source,target],[review('a'),review('clean')]),[]);
 assert.deepEqual(reviewContinuations([source,{...target,release_date:'2099-01-01'}],[review('a')]),[]);
 assert.deepEqual(reviewContinuations([source,{...target,reviews_enabled:false}],[review('a')]),[]);
});
test('discography ranks all available platform evidence with Spotify 70 and the rest 30',()=>{
 const single={id:'single',sources:[{provider:'APPLE',id:'1'},{provider:'APPLE',id:'2'}]},multiple={id:'multi',sources:[{provider:'APPLE',id:'1'},{provider:'DEEZER',id:'3'}]};
 assert.deepEqual(commonDiscography([single,multiple]).map(r=>r.id),['multi','single']);
 assert.equal(Object.values(PLATFORM_WEIGHTS).reduce((a,b)=>a+b,0),100);
 const spotify={id:'spotify',sources:[{provider:'SPOTIFY',id:'1'}]};
 assert.equal(releaseRelevance(spotify),70);
 assert.equal(releaseRelevance(single),6,'duplicate provider IDs do not add relevance');
 assert.deepEqual(commonDiscography([multiple,spotify]).map(r=>r.id),['spotify','multi']);
 assert.deepEqual(verifiedPlatforms({spotify_link:'https://open.spotify.com/search/artist',apple_music_link:'https://music.apple.com/search?term=album'}),[]);
 for(const provider of ['YOUTUBE_MUSIC','MUSICBRAINZ','TIDAL'])assert.equal(commonDiscography([{sources:[{provider,id:'x'},{provider:'APPLE',id:'1'}]}]).length,1);
});
test('artwork palettes contain up to five measured hex colors and reject non-image internal hosts',async()=>{
 const bytes=await sharp({create:{width:20,height:20,channels:3,background:'#ee3344'}}).png().toBuffer();
 const palette=await extractArtworkPalette(bytes);assert.deepEqual(palette,['#ee3344']);
 assert.equal(permittedArtworkURL('https://127.0.0.1/private'),null);assert.equal(permittedArtworkURL('file:///secret'),null);
 assert.ok(permittedArtworkURL('https://i.scdn.co/image/cover'));
});
