import {getSortedTrackRatings,getReviewFavoriteTrack} from './ratingUtils.js';
import {publicData} from './publicData.js';
import {REVIEW_CRITERIA} from './reviewCriteria.mjs';
export function buildTourExamples({albums=[],reviews=[],stats={}},extra={}){
 const usable=albums.filter(a=>a.image_url&&Array.isArray(a.tracks)&&a.tracks.length&&a.album_name&&a.artist_name);
 const complete=reviews.filter(r=>REVIEW_CRITERIA.every(([key])=>Number(r[key])>0)&&Object.keys(r.track_ratings||{}).length>0);
 const candidates=[...complete.filter(r=>r.comment?.trim()),...complete,...reviews];
 const selected=[];
 for(const review of candidates){const album=usable.find(a=>a.id===review.album_id||a.edition_member_ids?.includes(review.album_id));if(album&&!selected.some(a=>a.id===album.id)){selected.push(album);if(selected.length===3)break;}}
 for(const album of usable){if(selected.length>=3)break;if(!selected.some(a=>a.id===album.id))selected.push(album);}
 const records=selected.map(a=>({id:a.id,album:a.album_name,album_name:a.album_name,artista:a.artist_name,artist_name:a.artist_name,imagen:a.image_url,image_url:a.image_url,genres:a.genres||[],tracks:a.tracks,created_at:a.created_at,final_rating:a.final_rating,release_date:a.release_date}));
 const review=candidates.find(r=>r.album_id===records[0]?.id||selected[0]?.edition_member_ids?.includes(r.album_id))||null;
 const tracks=records[0]?.tracks||[],favorite=getReviewFavoriteTrack(review);
 const rated=review?getSortedTrackRatings(review.track_ratings||{},tracks,favorite):[];
 const favoriteIndex=favorite==null?-1:getSortedTrackRatings({[favorite]:1},tracks,favorite)[0]?.index;
 const trackRows=tracks.map((track,index)=>{
  const row=rated.find(r=>r.index===index);
  return {key:row?.key||String(track?.id??track?.spotify_id??track?.uri??index+1),name:typeof track==='string'?track:track?.name||track?.track_name||track?.title,index,score:row?.score??null,isFavorite:index===favoriteIndex};
 }).filter(row=>row.name);
 const person=review?{name:review.reviewer_name,avatar_url:review.reviewer_avatar||null,review_count:reviews.filter(r=>r.reviewer_name===review.reviewer_name).length}:null;
 const upcoming=albums.filter(a=>a.release_date&&String(a.release_date).slice(0,10)>new Date().toISOString().slice(0,10)).sort((a,b)=>String(a.release_date).localeCompare(String(b.release_date)))[0];
 return publicData({records,review,trackRows,person,stats:{total_reviews:stats.total_reviews,total_users:stats.total_users,total_albums:stats.total_albums},upcoming:upcoming?{id:upcoming.id,album:upcoming.album_name,artista:upcoming.artist_name,imagen:upcoming.image_url,release_date:upcoming.release_date}:null,rooms:extra.rooms||[],seasons:extra.seasons||[],playlists:extra.playlists||[]});
}
