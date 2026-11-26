import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import {buildPersonalAnnual,buildClubAnnual,buildReleaseAnnual,annualActivityStats,reviewsInYear} from '../src/utils/annualRecap.mjs';
import {readPersonalAnnual} from '../src/server/annualRecap.mjs';
import {ANNUAL_SELECTION,ANNUAL_SOURCES} from '../src/server/annual2026Selection.mjs';
import {ANNUAL_ART} from '../src/data/annual2026Art.mjs';
import {annualGenreGroups,annualReleaseDateLabel,annualPersonalRankingCopy} from '../src/utils/annualPresentation.mjs';
import artwork from '../src/utils/interfaceArtwork.cjs';
import {ANNUAL_ICON_SURFACES,contrastRatio,contrastingInk} from '../src/utils/annualIconContrast.mjs';
const now=Date.parse('2026-11-18T12:00:00Z');
test('twenty square cubist editions share the same palette and plane density, with lightweight previews',async()=>{
  assert.equal(ANNUAL_ART.length,20);assert.equal(new Set(ANNUAL_ART.map(r=>r.id)).size,20);
  for(const art of ANNUAL_ART){
    const release=ANNUAL_SELECTION.find(r=>r.id===art.id);assert.ok(release);assert.equal(art.title,release.title);assert.equal(art.artist,release.artist);
    const svg=await fs.readFile(new URL(`../public/annual/2026/cubist-grammys/${art.assetId}.svg`,import.meta.url),'utf8');
    assert.match(svg,/data-main-planes="1600"/);assert.match(svg,/data-inks="128"/);assert.doesNotMatch(svg,/<image|<polygon/);assert.equal((svg.match(/fill-rule="evenodd"/g)||[]).length,1600);
    const quadrilaterals=[...svg.matchAll(/data-cubist-quad="true" d="([^"]+)"/g)];
    assert.ok(quadrilaterals.length>=400,'Every release has a visible layer of square and rectangular planes');
    assert.ok(quadrilaterals.every(([,d])=>(d.match(/[ML]/g)||[]).length===4),'Supporting planes have four corners, rather than triangles');
    const areas=quadrilaterals.map(([,d])=>{const v=d.match(/[-\d.]+/g).map(Number),p=Array.from({length:4},(_,i)=>[v[i*2],v[i*2+1]]);return Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%4];return s+a[0]*b[1]-b[0]*a[1];},0))/2;});
    assert.ok(Math.max(...areas)/Math.min(...areas)>12,'Large and small cuts must coexist instead of forming a uniform grid');
    assert.match(svg,/data-cubist-overlap="true"/,'The composition includes overlapping paper planes');
    for(const [source,size] of [[art.src,640],[art.detailSrc,1200],[art.download,1200]]){
      const file=fileURLToPath(new URL(`../public${source}`,import.meta.url));
      const meta=await sharp(file).metadata();assert.equal(meta.width,size);assert.equal(meta.height,size);
      if(source===art.src)assert.ok((await fs.stat(file)).size<150000,'The moving opening uses lightweight previews');
    }
  }
});

test('the archived U artwork retains its defining outline at every resolution',async()=>{
  const art={assetId:'underscores-u',src:'/annual/2026/cubist-collage/underscores-u.webp',detailSrc:'/annual/2026/cubist-collage/underscores-u-detail.webp',download:'/annual/2026/cubist-collage/underscores-u.png'};
  const svg=await fs.readFile(new URL(`../public/annual/2026/cubist-collage/${art.assetId}.svg`,import.meta.url),'utf8');
  assert.ok(svg.indexOf('data-cover-detail="underscores-u"')>svg.lastIndexOf('data-cubist-overlap="true"'),'The thin identity contour must not be obscured by the colour planes');
  for(const file of [art.src,art.detailSrc,art.download]){
    const {data,info}=await sharp(fileURLToPath(new URL(`../public${file}`,import.meta.url))).removeAlpha().raw().toBuffer({resolveWithObject:true});
    let dark=0;
    for(let y=Math.floor(info.height*.36);y<info.height*.55;y++)for(let x=Math.floor(info.width*.415);x<info.width*.58;x++){
      const i=(y*info.width+x)*info.channels;
      if(data[i]<125&&data[i+1]<125&&data[i+2]<125)dark++;
    }
    assert.ok(dark>info.width*.3,`The U outline remains visible in ${file}`);
  }
});
test('annual icon inks retain contrast on every pastel, dark panel and share-button background',()=>{
  for(const backgrounds of Object.values(ANNUAL_ICON_SURFACES))for(const [name,color] of Object.entries(artwork.ICON_COLORS)){
    const ink=contrastingInk(color,backgrounds);assert.match(ink,/^#[0-9a-f]{6}$/i);
    for(const bg of backgrounds)assert.ok(contrastRatio(ink,bg)>=3.5,`${name} must remain readable on ${bg}`);
  }
});
test('releases are grouped by canonical genre and ordered by release date within each group',()=>{
  const input=[{id:'later',title:'B',genre:'Pop',releaseDate:'2026-06-02'},{id:'other',title:'Rock',genre:'Rock',releaseDate:'2026-01-01'},{id:'earlier',title:'A',genre:'Pop',releaseDate:'2026-02-10'}];
  const groups=annualGenreGroups(input);assert.equal(groups.length,2);assert.deepEqual(groups[0].releases.map(r=>r.id),['earlier','later']);assert.equal(input[0].id,'later');
  assert.match(annualReleaseDateLabel(input[0]),/2.*jun.*2026/);assert.equal(annualReleaseDateLabel({year:2026}),'2026');
});
const album={id:'a',album_name:'Uno',artist_name:'Artista Uno & Artista Dos',genres:['Pop','Rock'],release_year:2026,release_type:'ALBUM',tracks:[{id:'t',name:'Canción real'}]};
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
test('club highlights accept one review and provide an album-only selection without excluding EPs from overall stats',()=>{
  const albums=[{...album,release_type:'ALBUM'},{...album,id:'ep',album_name:'EP',release_type:'EP'}],reviews=[review('1','2026-03-01'),review('2','2026-03-02',{album_id:'ep',rating_general:10})];
  const r=buildClubAnnual({albums,reviews},{now});assert.equal(r.minimumReviews,1);assert.equal(r.topReleases.length,2);assert.equal(r.topAlbums.length,1);assert.equal(r.topAlbums[0].reviewCount,1);assert.equal(r.releaseCount,2);
  assert.equal(buildClubAnnual({albums,reviews},{now,minimumReviews:2}).topReleases.length,0);
});
test('empty personal histories remain empty rather than inventing activity or scores',()=>{
  const r=buildPersonalAnnual([],[],{now});assert.equal(r.reviewCount,0);assert.equal(r.meanScore,null);assert.equal(r.activityXP,0);assert.deepEqual(r.topReleases,[]);assert.equal(r.longestStreak,0);
});
test('the personal album ranking uses only current-year albums and the latest own review per edition',()=>{
  const albums=[{...album,edition_member_ids:['a','a-clean']},{...album,id:'b',album_name:'Dos',release_year:null,release_date:'2026-06-01'},...['EP','SENCILLO','COMPILACION'].map(type=>({...album,id:type,album_name:type,release_type:type})),{...album,id:'old',album_name:'Antes',release_year:2025},{...album,id:'unknown',album_name:'Desconocido',release_type:null}];
  const rows=[review('first','2026-03-01',{rating_general:10}),review('latest','2026-04-01',{album_id:'a-clean',rating_general:7,track_ratings:{t:8},favorite_track:'t'}),review('b','2026-03-01',{album_id:'b',rating_general:9,track_ratings:{}}),...['EP','SENCILLO','COMPILACION','old','unknown'].map(id=>review(id,'2026-03-01',{album_id:id,rating_general:10})),review('previous','2025-11-01',{album_id:'b',rating_general:10}),review('future','2026-12-01',{album_id:'b',rating_general:10})];
  const result=buildPersonalAnnual(rows,albums,{now,name:'Ana'});
  assert.equal(result.albumRanking.total,2);assert.deepEqual(result.albumRanking.releases.map(r=>[r.id,r.rank,r.stats.meanScore]),[['b',1,9],['a',2,7.7]]);
  assert.equal(result.albumRanking.releases[1].stats.favoriteTrack.name,'Canción real');assert.equal(result.albumRanking.releases[1].stats.trackRatingCount,1);assert.equal(result.albumRanking.releases[1].stats.trackCount,1);
  assert.ok(result.reviewCount>result.albumRanking.total,'Older albums and EPs still count in the broader personal summary');
  assert.deepEqual(buildPersonalAnnual([],albums,{now}).albumRanking,{total:0,releases:[]});
});
test('personal album rankings retain the full eligible count and show at most the top 20 in score order',()=>{
  const albums=Array.from({length:25},(_,i)=>({...album,id:'a'+i,album_name:'Álbum '+String(i).padStart(2,'0')}));
  const rows=albums.map((a,i)=>review(a.id,'2026-03-01',{album_id:a.id,rating_general:5+i/5,track_ratings:{}}));
  const ranking=buildPersonalAnnual(rows,albums,{now}).albumRanking;
  assert.equal(ranking.total,25);assert.equal(ranking.releases.length,20);assert.equal(ranking.releases[0].id,'a24');assert.equal(ranking.releases.at(-1).id,'a5');assert.deepEqual(ranking.releases.map(r=>r.rank),Array.from({length:20},(_,i)=>i+1));
});
test('personal ranking copy adapts to no albums, one, a few, a larger list and the top-20 limit',()=>{
  assert.match(annualPersonalRankingCopy(0,'Ana').message,/Ana, todavía no has reseñado álbumes de 2026/);
  assert.match(annualPersonalRankingCopy(1,'Ana').title,/único álbum/);
  assert.match(annualPersonalRankingCopy(3,'Ana').message,/3 álbumes.*Poquitos/);
  assert.match(annualPersonalRankingCopy(10).title,/top 10/);
  assert.match(annualPersonalRankingCopy(20).message,/20 opiniones/);
  assert.match(annualPersonalRankingCopy(25,'Ana').message,/25 álbumes.*20 que mejor calificaste/);
});
test('the external selection has twenty unique releases with traceable, differentiated sources',()=>{
  assert.equal(ANNUAL_SELECTION.length,20);assert.equal(new Set(ANNUAL_SELECTION.map(r=>r.id)).size,20);
  assert.equal(ANNUAL_SELECTION.filter(r=>r.nomination.startsWith('Álbum del año')).length,6);
  for(const r of ANNUAL_SELECTION){assert.equal(r.year,2026);assert.ok(r.nomination);assert.ok(r.refs.includes('grammy'));assert.ok(r.refs.every(id=>ANNUAL_SOURCES.some(s=>s.id===id)));assert.equal('score' in r,false);assert.equal('art' in r,false);}
  assert.ok(ANNUAL_SOURCES.some(s=>s.id==='billboard'&&s.mirror));assert.ok(ANNUAL_SOURCES.some(s=>s.type==='community'));assert.ok(ANNUAL_SOURCES.some(s=>s.type==='nomination'));
});
test('the private read paginates and constrains every query to the verified session, without exposing account fields',async()=>{
  const calls=[];const db={from(table){let range=[0,499];const q={select(fields){calls.push({table,fields});return q;},eq(key,value){calls.push({key,value});return q;},gte(){return q;},lt(){return q;},order(){return q;},range(a,b){range=[a,b];calls.push({range});return q;},maybeSingle(){return q;},then(resolve){if(table==='profiles')return Promise.resolve({data:{name:'Miembro'},error:null}).then(resolve);return Promise.resolve({data:range[0]===0?Array.from({length:500},(_,id)=>({...review(String(id),'2026-03-01'),albums:album})):[],error:null}).then(resolve);}};return q;}};
  const result=await readPersonalAnnual(db,{id:'viewer',email:'viewer@example.test'},{now});
  assert.deepEqual(calls.filter(c=>c.key==='reviewer_email'),[{key:'reviewer_email',value:'viewer@example.test'},{key:'reviewer_email',value:'viewer@example.test'}]);assert.deepEqual(calls.filter(c=>c.range).map(c=>c.range),[[0,499],[500,999]]);assert.ok(calls.some(c=>c.key==='id'&&c.value==='viewer'));assert.equal(JSON.stringify(result).includes('viewer@example.test'),false);assert.equal(result.albumRanking.total,1);assert.ok(calls.filter(c=>c.table==='reviews').every(c=>c.fields.includes('release_year,release_date')));
});
test('the public route cannot serialize the editorial collection and the API requires server-side administrator authorization',async()=>{
  const route=await fs.readFile(new URL('../src/app/api/annual/2026/route.js',import.meta.url),'utf8');
  const page=await fs.readFile(new URL('../src/app/2026/page.jsx',import.meta.url),'utf8');
  const view=await fs.readFile(new URL('../src/views/AnnualPage.jsx',import.meta.url),'utf8');
  assert.match(route,/annualAccess\(request,\{authorize,publicDb:annualPublicDb\}\)/);assert.match(route,/auth\.user\?readPersonalAnnual\(auth.db,auth.user\)/);assert.match(route,/private, no-store/);assert.doesNotMatch(page,/ANNUAL_SELECTION|annual2026Selection/);assert.doesNotMatch(view,/annual2026Selection|annual2026Covers/);assert.match(view,/data.viewerId===\(auth.user\?\.id\|\|null\)/);
});


test('expanded activity stats count valid votes, words, distribution, dates and XP without inventing empty values',()=>{
  const rows=[review('1','2026-03-01T12:00:00Z',{rating_general:10,comment:'Muy buen disco',track_ratings:{t:10,x:null,y:0,z:11},favorite_track:'t'}),review('2','2026-03-02T12:00:00Z',{rating_general:8,comment:'',track_ratings:{t:8},favorite_track:'t'})];
  const stats=annualActivityStats(rows,[album]);assert.equal(stats.trackCount,2);assert.equal(stats.trackMean,9);assert.equal(stats.meanScore,9);assert.equal(stats.medianScore,9);assert.equal(stats.perfectCount,1);assert.equal(stats.genreCount,2);assert.equal(stats.genres[0].count,1);assert.equal(stats.commentCount,1);assert.equal(stats.wordCount,3);assert.equal(stats.activeDays,2);assert.equal(stats.longestStreak,2);assert.deepEqual(stats.peakMonth,{month:3,count:2});assert.equal(stats.firstDay,'2026-03-01');assert.equal(stats.lastDay,'2026-03-02');assert.equal(stats.scoreDistribution.reduce((n,b)=>n+b.count,0),2);assert.deepEqual(stats.xpBreakdown,{reviews:100,comments:25,tracks:10});assert.deepEqual(stats.favoriteTracks,[{name:'Canción real',count:2}]);
  const empty=annualActivityStats([]);assert.equal(empty.meanScore,null);assert.equal(empty.trackMean,null);assert.equal(empty.medianScore,null);assert.equal(empty.peakMonth,null);
});

test('release statistics only include its editions and reviews inside the annual cutoff',()=>{
  const grouped={...album,edition_member_ids:['a','clean']};
  const result=buildReleaseAnnual({reviews:[review('1','2026-03-01',{track_ratings:{t:9},favorite_track:'t'}),review('2','2026-04-01',{album_id:'clean'}),review('3','2025-04-01'),review('4','2026-04-01',{album_id:'other'}),review('5','2026-12-01')]},grouped,{now});
  assert.equal(result.reviewCount,2);assert.equal(result.trackCount,1);assert.equal(result.trackRatingCount,2);assert.equal(result.meanScore,8.7);assert.equal(result.memberCount,2);assert.deepEqual(result.favoriteTrack,{name:'Canción real',count:1});assert.equal(buildReleaseAnnual({reviews:[]},null).meanScore,null);
});

test('a release counts its tracklist once regardless of how many people rate it',()=>{
  const tracks=Array.from({length:12},(_,i)=>({id:'track-'+i,name:'Canción '+i}));
  const reviews=Array.from({length:3},(_,i)=>review(String(i),'2026-03-01',{track_ratings:Object.fromEntries(tracks.map(t=>[t.id,9]))}));
  const result=buildReleaseAnnual({reviews},{...album,tracks},{now});
  assert.equal(result.reviewCount,3);assert.equal(result.trackCount,12);assert.equal(result.trackRatingCount,36);
  assert.equal(buildReleaseAnnual({reviews:reviews.slice(0,1)},{...album,tracks},{now}).trackCount,12);
  assert.equal(buildReleaseAnnual({reviews:[]},{...album,tracks:[],total_tracks:12},{now}).trackCount,12);
  assert.equal(buildReleaseAnnual({reviews:[]},{...album,tracks:tracks.slice(0,2),total_tracks:'12'},{now}).trackCount,12);
  assert.equal(buildReleaseAnnual({reviews:[]},{...album,tracks,total_tracks:-1},{now}).trackCount,12);
  assert.equal(buildReleaseAnnual({reviews},{...album,tracks:[]},{now}).trackCount,null);
});
