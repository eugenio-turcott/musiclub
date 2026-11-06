// Randomness is supplied after hydration, once per visit. Only reviewed releases
// enter the demonstrations, and alternate editions retain the complete metadata.
export function landingSelection(albums = [], reviews = [], {limit = 10, random} = {}) {
  const byId = new Map(albums.flatMap(album => (album.edition_member_ids || [album.id]).map(id => [id, album])));
  const grouped = new Map();
  for (const review of reviews) {
    const album = byId.get(review.album_id) || review.matchedAlbum || review.albums;
    if (!album?.id || !(album.album_name || album.album) || !(album.image_url || album.imagen)) continue;
    if (!grouped.has(album.id)) grouped.set(album.id, {album, review, reviews: []});
    grouped.get(album.id).reviews.push(review);
  }
  const result = [...grouped.values()];
  if (random) {
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.min(i, Math.floor(random() * (i + 1)));
      [result[i], result[j]] = [result[j], result[i]];
    }
    for (const entry of result) entry.review = entry.reviews[Math.min(entry.reviews.length - 1, Math.floor(random() * entry.reviews.length))];
  }
  return result.slice(0, Math.max(0, Math.min(10, limit)));
}

export function seededRandom(seed) {
  let value = seed >>> 0;
  return () => { value += 0x6D2B79F5; let n = value; n = Math.imul(n ^ n >>> 15, n | 1); n ^= n + Math.imul(n ^ n >>> 7, n | 61); return ((n ^ n >>> 14) >>> 0) / 4294967296; };
}

export function displayRelease(album = {}) {
  return { title: album.album_name || album.album || '', artist: album.artist_name || album.artista || '', image: album.image_url || album.imagen || '', genres: album.genres || [] };
}
