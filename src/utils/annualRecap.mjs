import {getWeightedReviewScore,getTrackDisplayName,getReviewFavoriteTrack,splitArtists} from './ratingUtils.js';
import {XP_CONFIG} from './xpConfig.mjs';
import genreCatalog from './genreCatalog.cjs';
import editions from './releaseEditions.cjs';

export const ANNUAL_YEAR=2026;
const dayFormat=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'});
export const annualDay=value=>{const date=new Date(value);return Number.isFinite(date.getTime())?dayFormat.format(date):null;};
export function reviewsInYear(reviews,year=ANNUAL_YEAR,now=Date.now()){
  return reviews.filter(r=>{const day=annualDay(r.created_at);return day?.startsWith(`${year}-`)&&Date.parse(r.created_at)<=now;});
}
const mean=values=>values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length*100)/100:null;
function albumFor(review,byId){return byId.get(review.album_id)||review.albums||{};}
function releaseKey(album,id){return album.album_name&&album.artist_name?editions.editionKey(album):String(id);}
function latestPerRelease(reviews,byId){
  const seen=new Set();return [...reviews].sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))||String(a.id).localeCompare(String(b.id))).filter(r=>{const key=releaseKey(albumFor(r,byId),r.album_id);if(seen.has(key))return false;seen.add(key);return true;});
}
const validTracks=review=>Object.entries(review.track_ratings||{}).filter(([,v])=>v!==null&&v!==''&&Number.isFinite(Number(v))&&Number(v)>=1&&Number(v)<=10);
function streak(days){let best=0,run=0,last=null;for(const day of [...days].sort()){const current=Date.parse(`${day}T00:00:00Z`);run=last!==null&&current-last===86400000?run+1:1;best=Math.max(best,run);last=current;}return best;}
export function buildPersonalAnnual(reviews,albums=[],{year=ANNUAL_YEAR,now=Date.now(),name='Tu año',avatar=null}={}){
  const byId=new Map(albums.flatMap(a=>(a.edition_member_ids||[a.id]).map(id=>[id,a])));
  const all=reviewsInYear(reviews,year,now),rows=latestPerRelease(all,byId);
  const genres=new Map(),artists=new Map(),artistNames=new Map(),days=new Set(),months=Array.from({length:12},(_,month)=>({month:month+1,count:0}));
  const scores=[],favorites=[];let tracks=0,comments=0;
  for(const r of rows){
    const a=albumFor(r,byId),score=getWeightedReviewScore(r);if(score!==null)scores.push(score);
    const day=annualDay(r.created_at);days.add(day);months[Number(day.slice(5,7))-1].count++;
    if(r.comment?.trim())comments++;
    tracks+=validTracks(r).length;
    for(const artist of splitArtists(a.artist_name||'')){if(!artistNames.has(artist.slug))artistNames.set(artist.slug,artist.name);const name=artistNames.get(artist.slug);artists.set(name,(artists.get(name)||0)+1);}
    for(const genre of genreCatalog.normalizeGenres(a.genres||[]))genres.set(genre,(genres.get(genre)||0)+1);
    const favorite=getReviewFavoriteTrack(r,a.tracks||[]);
    if(favorite){const track=getTrackDisplayName(favorite,a.tracks||[]),knownName=(a.tracks||[]).some(t=>(typeof t==='string'?t:t.name)===favorite);if(track&&(track!==favorite||knownName)&&!/^[A-Za-z0-9]{22}$/.test(track))favorites.push({title:track,release:a.album_name,artist:a.artist_name,image:a.image_url});}
  }
  const top=rows.map(r=>{const a=albumFor(r,byId);return {id:a.id||r.album_id,title:a.album_name||'Release',artist:a.artist_name||'',image:a.image_url||null,score:getWeightedReviewScore(r),genres:a.genres||[],release_type:a.release_type||'ALBUM'};}).filter(r=>r.score!==null).sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title)).slice(0,10);
  const ranked=map=>[...map].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
  return {year,name,avatar,asOf:new Date(now).toISOString(),reviewCount:rows.length,artistCount:artists.size,trackCount:tracks,commentCount:comments,meanScore:mean(scores),activeDays:days.size,longestStreak:streak(days),activityXP:rows.length*XP_CONFIG.REVIEW_BASE+comments*XP_CONFIG.REVIEW_COMMENT_BONUS+tracks*XP_CONFIG.TRACK_RATED,genres:ranked(genres).slice(0,6),artists:ranked(artists).slice(0,5),months,topReleases:top,favorites:favorites.slice(0,5)};
}
export function buildClubAnnual(catalog,{year=ANNUAL_YEAR,now=Date.now(),minimumReviews=1}={}){
  const rows=reviewsInYear(catalog.reviews||[],year,now),albums=catalog.albums||[],byId=new Map(albums.flatMap(a=>(a.edition_member_ids||[a.id]).map(id=>[id,a]))),groups=new Map(),members=new Set();
  for(const r of rows){const a=albumFor(r,byId),key=releaseKey(a,r.album_id);if(!groups.has(key))groups.set(key,{album:a,reviews:[]});groups.get(key).reviews.push(r);members.add(r.reviewer_name||r.id);}
  const top=[...groups.values()].filter(({album,reviews})=>Number(album.release_year)===year&&reviews.length>=minimumReviews).map(({album,reviews})=>({id:album.id,title:album.album_name,artist:album.artist_name,image:album.image_url,genres:album.genres||[],reviewCount:reviews.length,score:mean(reviews.map(getWeightedReviewScore).filter(v=>v!==null)),release_type:album.release_type||'ALBUM'})).filter(a=>a.score!==null).sort((a,b)=>b.score-a.score||b.reviewCount-a.reviewCount||a.title.localeCompare(b.title));
  return {reviewCount:rows.length,releaseCount:groups.size,memberCount:members.size,minimumReviews,topReleases:top.slice(0,16),topAlbums:top.filter(r=>String(r.release_type).toUpperCase()==='ALBUM').slice(0,16)};
}
