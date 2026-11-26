import releaseEditions from './releaseEditions.cjs';
import {splitArtists,slugifyArtist} from './ratingUtils.js';

const artistKeys=credit=>splitArtists(credit).map(artist=>slugifyArtist(artist.name)).filter(Boolean);

// Only catalog identities qualify; a matching title alone can belong to another artist.
export function grammyReviewSummary(reviews) {
 return {
  albumIds:[...new Set(reviews.map(row=>row.album_id).filter(Boolean))],
  releaseKeys:[...new Set(reviews.filter(row=>row.albums?.album_name&&row.albums?.artist_name).map(row=>releaseEditions.editionKey(row.albums)))],
  artistKeys:[...new Set(reviews.flatMap(row=>artistKeys(row.albums?.artist_name)))]
 };
}
export function grammyNomineeReviewed(nominee,category,reviews={}) {
 // A person's identity comes from their nomination, never an attached cover album.
 if(category.kind==='person')return Boolean(nominee.title&&(reviews.artistKeys||[]).includes(slugifyArtist(nominee.title)));
 const album=nominee.albums;
 return Boolean((nominee.album_id&&(reviews.albumIds||[]).includes(nominee.album_id)) || (album?.id&&(reviews.albumIds||[]).includes(album.id)) || (album?.album_name&&album?.artist_name&&(reviews.releaseKeys||[]).includes(releaseEditions.editionKey(album))));
}
export function grammyListeningFallback(nominee,category) {
 if(category.kind==='person')return null;
 return nominee.album_id?`/albumes/${encodeURIComponent(nominee.album_id)}`:`/catalogo?q=${encodeURIComponent(nominee.title||'')}`;
}

// Count each release and artist once. Person nominations contribute only to
// artists; an older reviewed work also qualifies an artist as explored.
export function grammyListeningProgress(nominees=[],categories=[],reviews={}){
 const kinds=new Map(categories.map(c=>[c.id,c])),releases=new Map(),artists=new Set(),heard=new Set();
 for(const n of nominees){
  const category=kinds.get(n.category_id);if(!category)continue;
  if(category.kind==='person'){
   const artist=slugifyArtist(n.title);if(artist){artists.add(artist);if(grammyNomineeReviewed(n,category,reviews))heard.add(artist);}
   continue;
  }
  const album=n.albums,key=album?.album_name&&album?.artist_name?releaseEditions.editionKey(album):n.album_id||releaseEditions.editionKey({name:n.title,artist:n.artist,release_type:category.kind==='song'?'SENCILLO':'ALBUM'});
  const credits=artistKeys(album?.artist_name||n.artist||'');
  const reviewed=grammyNomineeReviewed(n,category,reviews);
  releases.set(key,Boolean(releases.get(key)||reviewed));
  for(const artist of credits){artists.add(artist);if(reviewed||(reviews.artistKeys||[]).includes(artist))heard.add(artist);}
 }
 return {totalReleases:releases.size,reviewedReleases:[...releases.values()].filter(Boolean).length,totalArtists:artists.size,reviewedArtists:heard.size};
}
