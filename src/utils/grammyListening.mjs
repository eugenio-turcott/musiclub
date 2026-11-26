import releaseEditions from './releaseEditions.cjs';
import {splitArtists,slugifyArtist} from './ratingUtils.js';

// Only catalog identities qualify; a matching title alone can belong to another artist.
export function grammyReviewSummary(reviews) {
 return {
  albumIds:[...new Set(reviews.map(row=>row.album_id).filter(Boolean))],
  releaseKeys:[...new Set(reviews.filter(row=>row.albums?.album_name&&row.albums?.artist_name).map(row=>releaseEditions.editionKey(row.albums)))]
 };
}
export function grammyNomineeReviewed(nominee,category,reviews={}) {
 if(category.kind==='person')return false;
 const album=nominee.albums;
 return Boolean((nominee.album_id&&(reviews.albumIds||[]).includes(nominee.album_id)) || (album?.id&&(reviews.albumIds||[]).includes(album.id)) || (album?.album_name&&album?.artist_name&&(reviews.releaseKeys||[]).includes(releaseEditions.editionKey(album))));
}
export function grammyListeningFallback(nominee,category) {
 if(category.kind==='person')return null;
 return nominee.album_id?`/albumes/${encodeURIComponent(nominee.album_id)}`:`/catalogo?q=${encodeURIComponent(nominee.title||'')}`;
}

// A release nominated in several categories counts once; person categories do
// not pretend a songwriter's portrait is an album someone has listened to.
export function grammyListeningProgress(nominees=[],categories=[],reviews={}){
 const kinds=new Map(categories.map(c=>[c.id,c])),releases=new Map(),artists=new Set(),heard=new Set();
 for(const n of nominees){
  const category=kinds.get(n.category_id);if(!category||category.kind==='person')continue;
  const album=n.albums,key=album?.album_name&&album?.artist_name?releaseEditions.editionKey(album):n.album_id||releaseEditions.editionKey({name:n.title,artist:n.artist,release_type:category.kind==='song'?'SENCILLO':'ALBUM'});
  const credits=splitArtists(album?.artist_name||n.artist||'').map(a=>slugifyArtist(a.name)).filter(Boolean);
  const reviewed=grammyNomineeReviewed(n,category,reviews);
  releases.set(key,Boolean(releases.get(key)||reviewed));
  for(const artist of credits){artists.add(artist);if(reviewed)heard.add(artist);}
 }
 return {totalReleases:releases.size,reviewedReleases:[...releases.values()].filter(Boolean).length,totalArtists:artists.size,reviewedArtists:heard.size};
}
