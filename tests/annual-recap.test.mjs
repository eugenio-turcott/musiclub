import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {buildPersonalAnnual,buildClubAnnual,reviewsInYear} from '../src/utils/annualRecap.mjs';
import {readPersonalAnnual} from '../src/server/annualRecap.mjs';
import {ANNUAL_SELECTION,ANNUAL_SOURCES} from '../src/server/annual2026Selection.mjs';
import {ANNUAL_ART} from '../src/data/annual2026Art.mjs';
const now=Date.parse('2026-11-18T12:00:00Z');
test('all nine illustrations are square originals tied to actual releases in the annual selection',async()=>{
  assert.equal(ANNUAL_ART.length,9);assert.equal(new Set(ANNUAL_ART.map(r=>r.id)).size,9);
  for(const art of ANNUAL_ART){
    const release=ANNUAL_SELECTION.find(r=>r.id===art.id);assert.ok(release);assert.equal(art.title,release.title);assert.equal(art.artist,release.artist);
    const svg=await fs.readFile(new URL(`../public${art.src}`,import.meta.url),'utf8');
    const [,width,height]=svg.match(/width="(\d+)" height="(\d+)"/);assert.equal(Number(width),Number(height));assert.ok(Number(width)>0);
    const bounds=svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);assert.equal(bounds[2],bounds[3]);
  }
});
const album={id:'a',album_name:'Uno',artist_name:'Artista Uno & Artista Dos',genres:['Pop','Rock'],release_year:2026,tracks:[{id:'t',name:'Canción real'}]};
const review=(id,day,extra={})=>({id,album_id:'a',reviewer_name:'Persona '+id,created_at:day,rating_general:8,track_ratings:{t:9},comment:'Una reseña.',...extra});
test('annual boundaries use Mexico City time and never include future reviews',()=>{
  const rows=['2026-01-01T05:59:59Z','2026-01-01T06:00:00Z','2026-11-19T00:00:00Z','2027-01-01T05:59:59Z','2027-01-01T06:00:00Z'].map((created_at,id)=>({id,created_at}));
  assert.deepEqual(reviewsInYear(rows,2026,now).map(r=>r.id),[1]);
  assert.deepEqual(reviewsInYear(rows,2026,Date.parse('2027-01-02')).map(r=>r.id),[1,2,3]);
});
test('personal statistics deduplicate releases, resolve real tracks, split credits and use five XP per track',()=>{
  const rows=[review('old','2026-01-05T12:00:00Z'),review('new','2026-01-06T12:00:00Z',{favorite_track:'t'}),review('b','2026-01-07T12:00:00Z',{album_id:'b',comment:'',track_ratings:{x:8,y:0,z:null}})];
  const r=buildPersonalAnnual(rows,[album,{...album,id:'b',album_name:'Dos',release_year:2000}],{now,name:'Miembro'});
  assert.equal(r.reviewCount,2);assert.equal(r.trackCount,2);assert.equal(r.artistCount,2);assert.equal(r.activityXP,135);assert.equal(r.commentCount,1);assert.equal(r.longestStreak,2);assert.equal(r.activeDays,2);assert.equal(r.months[0].count,2);assert.equal(r.favorites[0].title,'Canción real');assert.equal(r.artists[0].name,'Artista Dos');assert.equal(r.genres[0].count,2);
  assert.equal(r.topReleases.length,2);assert.equal(r.year,2026);assert.equal('minutesListened' in r,false);
});
test('club rankings require eligible 2026 releases and the minimum annual review count',()=>{
  const old={...album,id:'old',album_name:'Viejo',release_year:2020};
  const r=buildClubAnnual({albums:[album,old],reviews:[review('1','2026-03-01'),review('2','2026-03-02'),review('3','2026-03-02',{album_id:'old',rating_general:10}),review('4','2025-12-01')]},{now});
  assert.equal(r.reviewCount,3);assert.equal(r.topReleases.length,1);assert.equal(r.topReleases[0].title,'Uno');assert.equal(r.topReleases[0].reviewCount,2);
});
test('empty personal histories remain empty rather than inventing activity or scores',()=>{
  const r=buildPersonalAnnual([],[],{now});assert.equal(r.reviewCount,0);assert.equal(r.meanScore,null);assert.equal(r.activityXP,0);assert.deepEqual(r.topReleases,[]);assert.equal(r.longestStreak,0);
});
test('the initial external selection has sixteen unique releases with traceable, differentiated sources',()=>{
  assert.equal(ANNUAL_SELECTION.length,16);assert.equal(new Set(ANNUAL_SELECTION.map(r=>r.id)).size,16);
  for(const r of ANNUAL_SELECTION){assert.equal(r.year,2026);assert.ok(r.refs.length>=2);assert.ok(r.refs.every(id=>ANNUAL_SOURCES.some(s=>s.id===id)));assert.equal('score' in r,false);assert.equal('art' in r,false);}
  assert.ok(ANNUAL_SOURCES.some(s=>s.id==='billboard'&&s.mirror));assert.ok(ANNUAL_SOURCES.some(s=>s.type==='community'));assert.ok(ANNUAL_SOURCES.some(s=>s.type==='nomination'));
});
test('the private read paginates and constrains every query to the verified session, without exposing account fields',async()=>{
  const calls=[];const db={from(table){let range=[0,499];const q={select(fields){calls.push({table,fields});return q;},eq(key,value){calls.push({key,value});return q;},gte(){return q;},lt(){return q;},order(){return q;},range(a,b){range=[a,b];calls.push({range});return q;},maybeSingle(){return q;},then(resolve){if(table==='profiles')return Promise.resolve({data:{name:'Miembro'},error:null}).then(resolve);return Promise.resolve({data:range[0]===0?Array.from({length:500},(_,id)=>({...review(String(id),'2026-03-01'),albums:album})):[],error:null}).then(resolve);}};return q;}};
  const result=await readPersonalAnnual(db,{id:'viewer',email:'viewer@example.test'},{now});
  assert.deepEqual(calls.filter(c=>c.key==='reviewer_email'),[{key:'reviewer_email',value:'viewer@example.test'},{key:'reviewer_email',value:'viewer@example.test'}]);assert.deepEqual(calls.filter(c=>c.range).map(c=>c.range),[[0,499],[500,999]]);assert.ok(calls.some(c=>c.key==='id'&&c.value==='viewer'));assert.equal(JSON.stringify(result).includes('viewer@example.test'),false);
});
test('the public route cannot serialize the editorial collection and the API requires server-side administrator authorization',async()=>{
  const route=await fs.readFile(new URL('../src/app/api/annual/2026/route.js',import.meta.url),'utf8');
  const page=await fs.readFile(new URL('../src/app/2026/page.jsx',import.meta.url),'utf8');
  const view=await fs.readFile(new URL('../src/views/AnnualPage.jsx',import.meta.url),'utf8');
  assert.match(route,/authorize\(request,\{admin:true\}\)/);assert.match(route,/private, no-store/);assert.doesNotMatch(page,/ANNUAL_SELECTION|annual2026Selection/);assert.doesNotMatch(view,/annual2026Selection|annual2026Covers/);assert.match(view,/data\?\.viewerId===auth\.user\?\.id/);
});
