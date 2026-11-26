import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {buildAnnualVoices,buildAnnualYearbook,annualClubGenres,annualPrimaryGenre} from '../src/utils/annualYearbook.mjs';
import sharp from 'sharp';
import snapshot from '../src/server/annual2026Global.json' with {type:'json'};
const now=Date.parse('2026-11-19T18:00:00Z');
const album=(id,title)=>({id,album_name:title,artist_name:'Artista',genres:['Pop'],release_year:2026,release_type:'ALBUM',release_date:'2026-03-02',tracks:[{id:'track-'+id,name:'Canción '+id}]});
const review=(id,person,release,extra={})=>({id,album_id:release,reviewer_name:person,created_at:'2026-06-02T12:00:00Z',rating_general:8,comment:'Una opinión real.',...extra});

test('every author receives a different release when a complete matching exists, even if greedy selection would fail',()=>{
 const albums=[album('a','A'),album('b','B'),album('c','C')],reviews=[review('1','Alicia','a'),review('2','Alicia','b'),review('3','Bruno','a'),review('4','Cecilia','b'),review('5','Cecilia','c')];
 const voices=buildAnnualVoices({albums,reviews},{now});assert.equal(voices.contributorCount,3);assert.equal(voices.releaseCount,3);assert.equal(new Set(voices.cards.map(r=>r.id)).size,3);assert.deepEqual(voices.cards.flatMap(r=>r.reviews.map(p=>p.name)).sort(),['Alicia','Bruno','Cecilia']);
});

test('genre selections come from club activity, use one principal genre and never repeat a release',()=>{
 const albums=[{...album('a','A'),genres:['Contemporary R&b','Pop']},{...album('b','B'),genres:['R&b','Pop']},{...album('c','C'),genres:['Pop','R&B']},{...album('d','D'),genres:['Pop']},{...album('unused','No reviews'),genres:['Rock']}];
 const reviews=[review('1','Ana','a'),review('2','Bruno','a'),review('3','Ana','b'),review('4','Ana','c'),review('5','Ana','d')];
 const groups=annualClubGenres({albums,reviews},[],{now});assert.equal(annualPrimaryGenre(['R&b']),'R&B');assert.equal(annualPrimaryGenre(['Contemporary R&b']),'Contemporary R&B');assert.deepEqual(groups.map(g=>g.name),['R&B','Pop']);
 const ids=groups.flatMap(g=>g.releases.map(r=>r.id));assert.equal(new Set(ids).size,4);assert.equal(ids.length,4);assert.deepEqual(groups[0].releases.map(r=>r.id),['a','b']);assert.ok(groups.every(g=>g.releases.length>=2));
});

test('every displayed global release has a real catalog destination, recognized genres and source-size artwork',async()=>{
 for(const release of snapshot.releases.filter(r=>r.available!==false)){
  assert.match(release.catalogId,/^[0-9a-f-]{36}$/);assert.match(release.catalogPath,/^\/(albumes|eps|sencillos|compilaciones|remixes)\//);assert.ok(release.genres.length);assert.ok(release.imageWidth>=(snapshot.groups.albums.includes(release.id)?600:500));
  const metadata=await sharp(new URL('../public'+release.image,import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')).metadata();assert.equal(metadata.width,release.imageWidth);
 }
 const result=buildAnnualYearbook(null,snapshot,{now});assert.ok(result.upcoming.every(r=>r.available!==false&&r.catalogId));
});
test('shared-only releases group all voices without duplicating the release or inventing comments',()=>{
 const a={...album('a','A'),edition_member_ids:['a','a-clean']},reviews=[review('1','Alicia','a'),review('2','Bruno','a-clean',{comment:''}),review('3','Alicia','a',{comment:'Esta es mi opinión completa.'}),review('4','Futuro','a',{created_at:'2026-12-01'}),review('5','Pasado','a',{created_at:'2025-12-01'})];
 const result=buildAnnualVoices({albums:[a],reviews},{now});assert.equal(result.contributorCount,2);assert.equal(result.releaseCount,1);assert.equal(result.cards[0].reviews.length,1);assert.ok(result.cards[0].reviews.every(r=>r.comment.trim()));assert.equal(result.cards[0].reviews.some(r=>r.name==='Bruno'),false);assert.equal(JSON.stringify(result).includes('reviewer_email'),false);
});
test('the club ranks by its own annual score while global notes and scales remain separate',()=>{
 const albums=[album('a','Más alto'),album('b','Más bajo')],reviews=[review('a','Uno','a',{rating_general:9}),review('b','Dos','b',{rating_general:7})];
 const global={asOf:'2026-11-19',source:'AOTY',groups:{albums:['g2','g1'],popular:['g1','g2'],eps:[],singles:[],critics:[],live:[],soundtracks:[],compilations:[],upcoming:[]},releases:[{id:'g1',title:'Más alto',artist:'Artista',genres:['Pop'],type:'lp',releaseDate:'2026-03-02',global:{user:{score:60,count:500,countDisplay:'500'}},sourceUrl:'private-provenance',imageSource:'internal-source'},{id:'g2',title:'Más bajo',artist:'Artista',genres:['Pop'],type:'lp',releaseDate:'2026-05-02',global:{user:{score:90,count:900,countDisplay:'900'}}}]};
 const result=buildAnnualYearbook({albums,reviews},global,{now});assert.deepEqual(result.clubRanking.map(r=>r.id),['a','b']);assert.equal(result.clubRanking[0].stats.meanScore,9);assert.equal(result.clubRanking[0].global.user.score,60);assert.equal(result.albums[0].global.user.score,90);assert.equal(result.albums[0].stats.meanScore,7);assert.equal(result.monthly[2].release.id,'g1');assert.equal(JSON.stringify(result).includes('private-provenance'),false);assert.equal(JSON.stringify(result).includes('internal-source'),false);
 assert.equal(buildAnnualYearbook(null,global,{now}).albums[0].stats,null);
});
test('global sections retain the reference sequence, their observed source and real metadata',async()=>{
 for(const key of ['albums','eps','singles','popular','critics','live','soundtracks','compilations','upcoming'])assert.ok(snapshot.groups[key]?.length,`${key} needs verified releases`);
 assert.equal(snapshot.source,'AOTY');assert.equal(snapshot.asOf,'2026-11-19');assert.equal(new Set(snapshot.releases.map(r=>r.id)).size,snapshot.releases.length);
 for(const r of snapshot.releases){assert.match(r.sourceUrl,/^https:\/\/www\.albumoftheyear\.org\/album\/\d+/);assert.ok(r.title&&r.artist);assert.match(r.releaseDate,/^202[67]-\d{2}-\d{2}$/);if(r.image)await fs.access(new URL('../public'+r.image,import.meta.url));for(const rating of Object.values(r.global)){assert.ok(rating.score>=0&&rating.score<=100);assert.ok(rating.count>=0);}}
 const view=await fs.readFile(new URL('../src/components/AnnualWorld.jsx',import.meta.url),'utf8');const ids=['id="panorama"','id="eps"','id="sencillos"','id="meses"','<Reviews voices=','id="listas"','id="generos"','id="categorias"','id="proximo-2027"'];assert.ok(ids.every((id,i)=>!i||view.indexOf(id)>view.indexOf(ids[i-1])));
});
test('the main club ranking excludes singles, EPs, compilations and albums from other years',()=>{
 const albums=[album('album','Álbum de 2026'),{...album('single','Sencillo'),release_type:'SENCILLO'},{...album('ep','EP'),release_type:'EP'},{...album('compilation','Recopilación'),release_type:'COMPILACION'},{...album('old','Otro año'),release_year:2025}];
 const reviews=albums.map(a=>review(a.id,'Persona',a.id,{rating_general:a.id==='album'?8:10}));
 const result=buildAnnualYearbook({albums,reviews},snapshot,{now});assert.deepEqual(result.clubRanking.map(r=>r.id),['album']);assert.equal(result.clubRanking[0].rank,1);assert.equal(result.clubRanking[0].stats.reviewCount,1);
 assert.equal(result.voices.contributorCount,1,'Other release types remain part of club activity');
});
