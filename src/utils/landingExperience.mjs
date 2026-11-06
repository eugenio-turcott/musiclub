// A compact view of existing public records. Visual demonstrations never write data.
export function landingSelection(albums = [], reviews = []) {
  const result = [], seen = new Set();
  const add = (album, review) => {
    if (!album || !(album.album_name || album.album) || !(album.image_url || album.imagen) || seen.has(album.id)) return;
    seen.add(album.id);
    result.push({ album, review: review || null });
  };
  for (const review of reviews) add(albums.find(a => a.id === review.album_id || a.edition_member_ids?.includes(review.album_id)) || review.matchedAlbum || review.albums, review);
  for (const album of albums) add(album, reviews.find(r => r.album_id === album.id));
  return result.slice(0, 6);
}

export function displayRelease(album = {}) {
  return { title: album.album_name || album.album || '', artist: album.artist_name || album.artista || '', image: album.image_url || album.imagen || '', genres: album.genres || [] };
}
