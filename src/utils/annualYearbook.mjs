import {buildReleaseAnnual,reviewsInYear} from './annualRecap.mjs';
import {getWeightedReviewScore,getReviewFavoriteTrack,getTrackDisplayName,splitArtists,getReleaseUrl} from './ratingUtils.js';
import editions from './releaseEditions.cjs';
import genreCatalog from './genreCatalog.cjs';
import {genreFamily} from './genreFamilies.cjs';
const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export const annualReleaseIdentity=r=>`${fold(r.title||r.album_name)}|${splitArtists(r.artist||r.artist_name||'').map(a=>a.slug).sort().join('|')}`;
const search=r=>`/catalogo?${new URLSearchParams({q:`${r.title} ${r.artist}`,tab:'releases'})}`;
export const annualPrimaryGenre=raw=>(genreCatalog.normalizeGenres(raw||[])[0]||'Música').replace(/\br&b\b/gi,'R&B');
export function annualClubGenres(catalog,globalReleases,{now=Date.now()}={}){
 const globalByIdentity=new Map(globalReleases.map(r=>[annualReleaseIdentity(r),r])),groups=new Map(),seen=new Set();
 const rows=reviewsInYear(catalog.reviews||[],2026,now),albumIds=new Set(rows.map(r=>r.album_id));
 const names={rock:'Rock',indie:'Indie',pop:'Pop',hiphop:'Hip-Hop',rnb:'R&B',soul:'Soul',metal:'Metal',punk:'Punk',electronic:'Electrónica',dance:'Dance',latin:'Latino',reggaeton:'Urbano',regional:'Regional Mexicano',classical:'Clásica',jazz:'Jazz',blues:'Blues',folk:'Folk',country:'Country',reggae:'Reggae',ambient:'Ambient',kpop:'K-Pop',jpop:'J-Pop'};
 for(const album of catalog.albums||[]){
  if(!(album.edition_member_ids||[album.id]).some(id=>albumIds.has(id)))continue;
  const key=editions.editionKey(album);if(seen.has(key))continue;seen.add(key);
  const genre=annualPrimaryGenre(album.genres);if(genre==='Música')continue;
  const family=genreFamily(genre),name=names[family]||genre,stats=buildReleaseAnnual(catalog,album,{now}),global=globalByIdentity.get(annualReleaseIdentity(album));
  const release={id:album.id,catalogId:album.id,catalogPath:getReleaseUrl(album),scope:'club',title:album.album_name,artist:album.artist_name,cover:album.image_url,genre,genres:genreCatalog.normalizeGenres(album.genres),release_type:album.release_type,stats,global:global?.global||null};
  if(!groups.has(name))groups.set(name,[]);groups.get(name).push(release);
 }
 return [...groups].filter(([,releases])=>releases.length>=2).map(([name,releases])=>({name,reviewCount:releases.reduce((n,r)=>n+r.stats.reviewCount,0),releases:releases.sort((a,b)=>b.stats.reviewCount-a.stats.reviewCount||(b.stats.meanScore||0)-(a.stats.meanScore||0)||a.title.localeCompare(b.title)).slice(0,8)})).sort((a,b)=>b.reviewCount-a.reviewCount||a.name.localeCompare(b.name)).slice(0,10);
}
export function buildAnnualVoices(catalog,{now=Date.now()}={}){
 const albums=catalog.albums||[],byId=new Map(albums.flatMap(a=>(a.edition_member_ids||[a.id]).map(id=>[id,a]))),people=new Map();
 for(const review of reviewsInYear(catalog.reviews||[],2026,now)){
  const album=byId.get(review.album_id)||review.albums;if(!album?.album_name)continue;
  const person=String(review.reviewer_name||'Miembro de Musiclub').trim(),personKey=person.normalize('NFC').toLocaleLowerCase('es'),key=editions.editionKey(album);
  if(!people.has(personKey))people.set(personKey,{name:person,candidates:new Map()});
  const candidate=people.get(personKey).candidates.get(key),priority=Math.min(600,review.comment?.trim().length||0);
  if(!candidate||priority>candidate.priority||priority===candidate.priority&&review.created_at>candidate.review.created_at)people.get(personKey).candidates.set(key,{review,album,priority});
 }
 const authors=[...people.keys()].sort((a,b)=>people.get(a).candidates.size-people.get(b).candidates.size||a.localeCompare(b));
 const owner=new Map(),chosen=new Map();
 const assign=(person,seen)=>{const candidates=[...people.get(person).candidates].sort((a,b)=>b[1].priority-a[1].priority||a[0].localeCompare(b[0]));for(const [key] of candidates){if(seen.has(key))continue;seen.add(key);const previous=owner.get(key);if(!previous||assign(previous,seen)){owner.set(key,person);chosen.set(person,key);return true;}}return false;};
 for(const person of authors)assign(person,new Set());
 // When unique releases cannot cover every author, preserve every voice inside
 // its already-used release card rather than silently dropping a person.
 for(const person of authors)if(!chosen.has(person))chosen.set(person,[...people.get(person).candidates.keys()].sort()[0]);
 const cards=new Map();
 for(const person of [...people.keys()].sort()){
  const key=chosen.get(person),{review,album}=people.get(person).candidates.get(key);
  if(!cards.has(key))cards.set(key,{id:album.id,title:album.album_name,artist:album.artist_name,image:album.image_url||null,genres:album.genres||[],release_type:album.release_type||'ALBUM',reviews:[]});
  const favorite=getReviewFavoriteTrack(review),favoriteName=favorite&&getTrackDisplayName(favorite,album.tracks||[]);
  cards.get(key).reviews.push({id:review.id,name:people.get(person).name,avatar:review.reviewer_avatar||null,comment:review.comment?.trim()||'',score:getWeightedReviewScore(review),date:review.created_at,favorite:favoriteName&&!/^[A-Za-z0-9]{22}$/.test(favoriteName)?favoriteName:null});
 }
 return {contributorCount:people.size,releaseCount:cards.size,cards:[...cards.values()]};
}
export function buildAnnualYearbook(catalog,snapshot,{now=Date.now()}={}){
 const available=Boolean(catalog);catalog=catalog||{albums:[],reviews:[]};
 const albums=catalog.albums||[],byIdentity=new Map(albums.map(a=>[annualReleaseIdentity(a),a])),rows=reviewsInYear(catalog.reviews||[],2026,now);
 const globalReleases=snapshot.releases.map(r=>{const album=albums.find(a=>(a.edition_member_ids||[a.id]).includes(r.catalogId))||byIdentity.get(annualReleaseIdentity(r)),{sourceUrl,imageSource,...display}=r;return {...display,cover:r.image||album?.image_url||null,genre:annualPrimaryGenre(r.genres?.length?r.genres:album?.genres),year:Number(r.releaseDate?.slice(0,4))||2026,catalogId:album?.id||r.catalogId||null,release_type:album?.release_type||r.release_type||(r.type==='ep'?'EP':r.type==='single'?'SENCILLO':'ALBUM'),catalogPath:album?getReleaseUrl(album):r.catalogPath||search(r),stats:available?buildReleaseAnnual(catalog,album,{now}):null};});
 const globalById=new Map(globalReleases.map(r=>[r.id,r])),globalByIdentity=new Map(globalReleases.map(r=>[annualReleaseIdentity(r),r]));
 const getGroup=key=>(snapshot.groups[key]||[]).map(id=>globalById.get(id)).filter(r=>r&&r.available!==false).map((r,i)=>({...r,rank:i+1}));
 const publicGroups=new Map();for(const review of rows){const album=albums.find(a=>(a.edition_member_ids||[a.id]).includes(review.album_id))||review.albums;if(!album||Number(album.release_year)!==2026)continue;const key=editions.editionKey(album);if(!publicGroups.has(key))publicGroups.set(key,album);}
 const clubRanking=[...publicGroups.values()].map(album=>{const stats=buildReleaseAnnual(catalog,album,{now}),global=globalByIdentity.get(annualReleaseIdentity(album));return {id:album.id,title:album.album_name,artist:album.artist_name,cover:album.image_url,releaseDate:album.release_date,year:album.release_year,genre:annualPrimaryGenre(album.genres),release_type:album.release_type||'ALBUM',stats,global:global?.global||null,catalogId:album.id};}).filter(r=>r.stats.meanScore!==null).sort((a,b)=>b.stats.meanScore-a.stats.meanScore||b.stats.reviewCount-a.stats.reviewCount||a.title.localeCompare(b.title)).slice(0,20).map((r,i)=>({...r,rank:i+1}));
 const popular=getGroup('popular').filter(r=>r.type==='lp'&&r.releaseDate&&r.releaseDate<=new Date(now).toISOString().slice(0,10));
 const monthly=Array.from({length:12},(_,i)=>{const candidates=popular.filter(r=>Number(r.releaseDate?.slice(5,7))===i+1).sort((a,b)=>(b.global.user?.count||0)-(a.global.user?.count||0));return {month:i+1,release:candidates[0]||null};});
 const genres=annualClubGenres(catalog,globalReleases,{now});
 return {asOf:snapshot.asOf,source:snapshot.source,clubAvailable:available,clubRanking,albums:getGroup('albums'),eps:getGroup('eps'),singles:getGroup('singles'),monthly,voices:buildAnnualVoices(catalog,{now}),lists:[{id:'comunidad',title:'Favoritos de la comunidad global',icon:'users',releases:getGroup('albums').slice(0,6)},{id:'critica',title:'Destacados de la crítica',icon:'review',releases:getGroup('critics').slice(0,6)}],genres,categories:[['live','En vivo','mic'],['soundtracks','Bandas sonoras','film'],['compilations','Recopilaciones','archive']].map(([id,title,icon])=>({id,title,icon,releases:getGroup(id)})),upcoming:getGroup('upcoming')};
}
