import identity from '../utils/releaseIdentity.cjs';
import {splitArtists} from '../utils/ratingUtils.js';
import {reviewContinuations,ratedReleaseTracks} from '../utils/reviewContinuations.mjs';
import {isSingleTrackRelease} from '../utils/releaseScoring.cjs';
import {searchAppleReleases,getAppleReleaseDetails} from './appleMusicCatalog.mjs';
import {searchDeezerAlbums,getDeezerAlbumDetails} from './deezerApi.js';
import {createHash} from 'node:crypto';
import {compatibleDiscographyRelease} from '../utils/discographyIdentity.mjs';
const pending=new Map(),cooldown=new Map();
const singleOffsets=new Map();
const discoveryKey=(album,review)=>identity.slugify(album.artist_name)+'|'+album.id+'|'+(review.id||createHash('sha256').update(JSON.stringify(review.track_ratings||{})).digest('hex'));
const baseTitle=value=>String(value||'').replace(/\s*[(\[][^)\]]*(?:deluxe|expanded|extended|complete works|bonus)[^)\]]*[)\]]/ig,'').replace(/\s*(?:[-–:]\s*)?\b(?:deluxe|expanded|extended)\b.*$/i,'').trim();
const artistKey=r=>new Set(splitArtists(r.artist_name||r.artist||r.artists?.join(', ')||'').map(a=>identity.slugify(a.name)));
function related(a,b){const names=artistKey(a);return [...artistKey(b)].some(n=>names.has(n));}
function asAlbum(r,provider){return {id:`external:${provider}:${r.id}`,album_name:r.name.replace(/ - (Single|EP)$/i,''),artist_name:r.contributors?.filter(a=>!a.role||a.role==='Main').map(a=>a.name).join(' & ')||r.artist||r.artists?.join(' & '),release_type:r.release_type||'ALBUM',release_date:r.releaseDate,release_year:Number(r.releaseDate?.slice(0,4))||null,image_url:r.image,tracks:r.tracks,total_tracks:r.totalTracks,genres:r.genres||[],apple_music_link:r.external_urls?.itunes||null,other_link:r.external_urls?.deezer||null,spotify_link:r.external_urls?.spotify?.includes('/album/')?r.external_urls.spotify:null,reviews_enabled:true};}
function discoveryId(album){
 const h=createHash('sha256').update(['musiclub-continuation',identity.slugify(album.artist_name),identity.slugify(album.album_name,true),album.release_type,album.total_tracks].join('|')).digest('hex');
 return `${h.slice(0,8)}-${h.slice(8,12)}-8${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;
}

// Discover outside the local catalogue, but import only after the complete
// edition proves the shared recordings, including repeated-track multiplicity.
export async function discoverReviewContinuations(db,albums,reviews,{searchApple=searchAppleReleases,appleDetails=getAppleReleaseDetails,searchDeezer=searchDeezerAlbums,deezerDetails=getDeezerAlbumDetails,now=Date.now(),limit=3,singleSearchLimit=3}={}){
 const byId=new Map(albums.flatMap(a=>(a.edition_member_ids||[a.id]).map(id=>[id,a]))),added=[];
 const eligible=reviews.toSorted((a,b)=>String(b.created_at).localeCompare(String(a.created_at))).filter(r=>{
  const a=byId.get(r.album_id);return a&&!(cooldown.get(discoveryKey(a,r))>now)&&ratedReleaseTracks(a,r).length>0;
 });
 for(const review of eligible.slice(0,limit)){
  const source=byId.get(review.album_id),key=discoveryKey(source,review);
  if(cooldown.get(key)>now)continue;
  if(pending.has(key)){added.push(...await pending.get(key));continue;}
  const task=(async()=>{
   const imported=[],candidates=[];let available=false;
   // The standard edition is searched first; singles also search the artist's
   // album catalogue so the target need not share the single's title.
   const query=source.artist_name+' '+(isSingleTrackRelease(source)?'':baseTitle(source.album_name));
   for(const [provider,search,details] of [['APPLE',searchApple,appleDetails],['DEEZER',searchDeezer,deezerDetails]]){
    try{
     const found=await search(query.trim(),15);available=true;
     for(const summary of (found.albums||[]).filter(r=>related(source,r)&&!/(remix|karaoke|instrumental|tribute)/i.test(r.name)).sort((a,b)=>Number(/deluxe|expanded|bonus/i.test(a.name))-Number(/deluxe|expanded|bonus/i.test(b.name))).slice(0,6)){
      const full=await details(summary.id);if(!full?.tracks?.length||full.tracks.length!==Number(full.totalTracks)||!related(source,full))continue;
      const album=asAlbum(full,provider);if(!/^(ALBUM|EP)$/.test(album.release_type)||!album.image_url||!album.release_date||album.release_date>new Date(now).toISOString().slice(0,10))continue;
      if(albums.some(local=>compatibleDiscographyRelease(local,album)))continue;
      // Source-only probe verifies the minimum before anything is written.
      if(reviewContinuations([source,album],[review]).some(r=>r.albumId===album.id)){candidates.push(album);if(!/deluxe|expanded|extended|bonus/i.test(album.album_name))break;}
     }
    }catch{ /* A provider outage does not prevent the next independent source. */ }
    if(candidates.length)break;
   }
   // Reverse direction: a rated album recording can also have its own one-track
   // release outside Musiclub. Rotate bounded batches instead of losing later tracks.
   const rated=isSingleTrackRelease(source)?[]:ratedReleaseTracks(source,review);
   const offset=(singleOffsets.get(key)||0)%Math.max(1,rated.length),batch=rated.slice(offset,offset+singleSearchLimit);
   let next=0;
   await Promise.all(Array.from({length:Math.min(3,batch.length)},async()=>{while(next<batch.length){
    const {track}=batch[next++],query=source.artist_name+' '+(track.name||track.track_name||'');let foundSingle=false;
    for(const [provider,search,details] of [['APPLE',searchApple,appleDetails],['DEEZER',searchDeezer,deezerDetails]]){
     try{
      const found=await search(query,8);available=true;
      for(const summary of (found.albums||[]).filter(r=>related(source,r)&&Number(r.totalTracks)===1).slice(0,3)){
       const full=await details(summary.id);if(!full||!related(source,full)||Number(full.totalTracks)!==1||full.tracks?.length!==1)continue;
       const album=asAlbum(full,provider);
       if(!album.image_url||!album.release_date||albums.some(a=>compatibleDiscographyRelease(a,album)))continue;
       if(reviewContinuations([source,album],[review],{today:new Date(now).toISOString().slice(0,10)}).some(r=>r.albumId===album.id)){candidates.push(album);foundSingle=true;}
      }
     }catch{ /* A verified recording from the next provider can still qualify. */ }
     if(foundSingle)break;
    }
   }}));
   const hasMore=offset+batch.length<rated.length;
   if(singleOffsets.size>500)singleOffsets.clear();singleOffsets.set(key,hasMore?offset+batch.length:0);
   for(const invitation of reviewContinuations([...albums,...added,...candidates],reviews)){
    const candidate=candidates.find(a=>a.id===invitation.albumId);if(!candidate)continue;
    const existing=await db.from('albums').select('*').eq('album_name',candidate.album_name).eq('artist_name',candidate.artist_name).limit(1);
    if(existing.error)continue;if(existing.data?.length){imported.push(existing.data[0]);continue;}
    const {id,...data}=candidate,payload={...data,id:discoveryId(candidate)};
    let saved=await db.from('albums').insert(payload).select('*').single();
    if(saved.error?.code==='23505')saved=await db.from('albums').select('*').eq('id',payload.id).maybeSingle();
    if(!saved.error&&saved.data)imported.push(saved.data);
   }
   if(cooldown.size>500)cooldown.clear();cooldown.set(key,now+(hasMore?30000:available?15*60000:60000));return imported;
  })();
  pending.set(key,task);
  try{added.push(...await task);}finally{pending.delete(key);}
 }
 return added;
}
