import tracklists from './releaseTracks.cjs';
import {splitArtists} from './ratingUtils.js';
import identity from './releaseIdentity.cjs';
const fold=tracklists.providerTitleKey;
const extended=album=>/\b(deluxe|expanded|extended|complete works|bonus|anniversary|aniversario)\b/i.test(album.album_name||'');
const family=album=>fold((album.album_name||'').replace(/\s*[([][^()[\]]*(?:deluxe|expanded|extended|complete works|bonus|anniversary|aniversario)[^()[\]]*[)\]]/gi,'').replace(/\s*(?:[-–:]\s*)?\b(?:deluxe|expanded|extended|complete works)\b.*$/i,''));
const creditCache=new WeakMap();
const credits=album=>{if(!creditCache.has(album))creditCache.set(album,new Set(splitArtists(album.artist_name||'').map(a=>fold(a.name))));return creditCache.get(album);};
const relatedArtist=(a,b)=>[...credits(a)].some(name=>credits(b).has(name));
const ids=t=>[t.id,...(t.id_aliases||[])].filter(Boolean).map(String);
export function sameRecording(a,b){
 if(a.isrc&&b.isrc)return String(a.isrc).toUpperCase()===String(b.isrc).toUpperCase();
 if(ids(a).some(id=>ids(b).includes(id)))return true;
 return !tracklists.isPlaceholderTrack(a)&&!tracklists.isPlaceholderTrack(b)&&fold(a.name||a.track_name)===fold(b.name||b.track_name)&&Number(a.duration_ms)>0&&Number(b.duration_ms)>0&&Math.abs(Number(a.duration_ms)-Number(b.duration_ms))<=2500;
}
function ratedTracks(album,review){
 const values=review.track_ratings||{};
 return (album.tracks||[]).flatMap((track,index)=>{
  const key=[...ids(track),track.name,track.track_name,String(index+1)].find(key=>key!=null&&Object.hasOwn(values,key));
  const raw=values[key],score=raw===null||raw===undefined||raw===''?NaN:Number(raw);
  return Number.isFinite(score)&&score>=0&&score<=10?[{track,score}]:[];
 });
}
export function reviewContinuations(albums=[],reviews=[],{today=new Date().toISOString().slice(0,10),targetId}={}){
 const byId=new Map(albums.flatMap(a=>(a.edition_member_ids||[a.id]).map(id=>[id,a])));
 const reviewed=new Set(reviews.map(r=>byId.get(r.album_id)?.id||r.album_id));
 const sources=reviews.toSorted((a,b)=>String(b.created_at).localeCompare(String(a.created_at))).flatMap(review=>{
  const album=byId.get(review.album_id);if(!album)return [];
  const rated=ratedTracks(album,review),single=/^(SINGLE|SENCILLO)$/.test(album.release_type);
  return rated.length>=(single?1:5)?[{album,review,rated,single}]:[];
 });
 const candidates=[];
 for(const target of albums){
  if(reviewed.has(target.id)||target.reviews_enabled===false||String(target.release_date||'').slice(0,10)>today||!/^(ALBUM|EP)$/.test(target.release_type||'ALBUM'))continue;
  const ratings={},evidence=[];
  for(const source of sources){
   if(!relatedArtist(source.album,target))continue;
   const used=new Set(),matches=[];
   for(const [index,track] of (target.tracks||[]).entries()){
    const available=source.rated.map((r,i)=>({r,i})).filter(({r,i})=>!used.has(i)&&sameRecording(r.track,track));
    // Ambiguous repeated recordings cannot be assigned an arbitrary score.
    if(available.length!==1)continue;
    const {r,i}=available[0];used.add(i);matches.push({key:track.id||track.name||String(index+1),score:r.score});
   }
   if(matches.length<(source.single?1:5))continue;
   for(const match of matches)if(!Object.hasOwn(ratings,match.key))ratings[match.key]=match.score;
   evidence.push({album:source.album,review:source.review});
  }
  if(!evidence.length)continue;
  const isExtended=extended(target);
  if(isExtended&&albums.some(a=>!extended(a)&&a.id!==target.id&&family(a)===family(target)&&relatedArtist(a,target)&&!reviewed.has(a.id)&&/^(ALBUM)$/.test(a.release_type)))continue;
  candidates.push({target,ratings,matchedTracks:Object.keys(ratings).length,source:evidence[0].album,createdAt:evidence[0].review.created_at,priority:isExtended?2:target.release_type==='ALBUM'?0:1,family:family(target)});
 }
 const chosen=new Map();
 for(const c of candidates.sort((a,b)=>a.priority-b.priority||b.matchedTracks-a.matchedTracks||String(b.createdAt).localeCompare(String(a.createdAt)))){
  const key=identity.slugify(c.target.artist_name)+'|'+c.family;
  if(!chosen.has(key))chosen.set(key,c);
 }
 return [...chosen.values()].filter(c=>!targetId||c.target.id===targetId).slice(0,targetId?1:12).map(c=>({
  id:`continue-review:${c.target.id}`,albumId:c.target.id,title:c.target.album_name,artist:c.target.artist_name,image:c.target.image_url,
  link:identity.releasePath(c.target),matchedTracks:c.matchedTracks,totalTracks:c.target.tracks.length,sourceTitle:c.source.album_name,
  trackRatings:c.ratings,createdAt:c.createdAt,
 }));
}
