import releaseEditions from './releaseEditions.cjs';

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
