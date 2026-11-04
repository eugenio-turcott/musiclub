import {test} from 'node:test';
import assert from 'node:assert/strict';
import {classifyReviews,groupTierItems,defaultTierSelection,toggleTierSelection,getTierFromScore} from '../src/utils/tierList.mjs';
import {ALL_BADGE_DESCRIPTORS,BADGE_ICONS,LEVEL_ICONS,badgeIcon} from '../src/utils/badgeIcons.mjs';
import artwork from '../src/utils/interfaceArtwork.cjs';
import {buildTourExamples} from '../src/utils/tourExamples.mjs';
import {ownsReview} from '../src/utils/shareOwnership.mjs';
test('share options require ownership and never fall back to a matching name when the account differs',()=>{
 const user={id:'mine',name:'Nombre',email:'mine@example.test'};
 assert.equal(ownsReview({user_id:'someone-else',reviewer_name:'Nombre'},user),false);
 assert.equal(ownsReview({reviewer_email:'other@example.test',reviewer_name:'Nombre'},user),false);
 assert.equal(ownsReview({user_id:'mine'},user),true);assert.equal(ownsReview({reviewer_email:user.email},user),true);assert.equal(ownsReview({reviewer_name:'Nombre'},null),false);
});
test('every badge and level has a distinct native drawing in the ranking and guides',()=>{
 const badges=ALL_BADGE_DESCRIPTORS.map(b=>badgeIcon(b));assert.equal(new Set(badges).size,ALL_BADGE_DESCRIPTORS.length);
 const bodies=[...Object.values(BADGE_ICONS),...Object.values(LEVEL_ICONS)].map(icon=>{assert.ok(artwork.ICON_BODIES[icon],icon);return artwork.ICON_BODIES[icon].replace(/\s+/g,'');});assert.equal(new Set(bodies).size,bodies.length);
 for(const b of ALL_BADGE_DESCRIPTORS)assert.equal(badgeIcon({title:b.name}),BADGE_ICONS[b.id]);
});
test('public member tier lists use nested release metadata and cannot exceed ten selected releases',()=>{
 const reviews=Array.from({length:14},(_,i)=>({id:'review-'+i,album_id:'album-'+i,rating_general:10,albums:{id:'album-'+i,album_name:'Release '+i,artist_name:'Artista real',image_url:'/cover-'+i+'.png'}}));
 const items=classifyReviews(reviews);assert.equal(items[0].artista,'Artista real');assert.ok(items.every(i=>i.album.startsWith('Release ')&&i.imagen.startsWith('/cover-')));
 const groups=groupTierItems(items),selected=defaultTierSelection(groups);assert.equal(selected.S.length,10);
 assert.equal(toggleTierSelection(selected,'S',items[12].reviewId),selected);
 const reduced=toggleTierSelection(selected,'S',selected.S[0]),changed=toggleTierSelection(reduced,'S',items[12].reviewId);assert.equal(changed.S.length,10);assert.ok(changed.S.includes(items[12].reviewId));
 assert.equal(getTierFromScore(9.49),'A');assert.equal(getTierFromScore(9.5),'S');
});
test('guide examples copy real public records and exclude private data',()=>{
 const album={id:'a',album_name:'Disco existente',artist_name:'Artista existente',image_url:'/real.png',tracks:[{id:'t',name:'Canción existente',track_number:1}],genres:['Rock']};
 const review={id:'r',album_id:'a',reviewer_name:'Miembro existente',reviewer_email:'private@example.test',rating_general:8,track_ratings:{t:9},comment:'Texto real'};
 const example=buildTourExamples({albums:[album],reviews:[review]});assert.equal(example.records[0].album,album.album_name);assert.equal(example.review.comment,review.comment);assert.equal(example.trackRows[0].name,'Canción existente');assert.equal(JSON.stringify(example).includes('private@example.test'),false);assert.equal(buildTourExamples({albums:[],reviews:[]}).records.length,0);
});
