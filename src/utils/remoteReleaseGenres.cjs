const { releaseGroupMatches } = require('./musicBrainzIdentity.cjs');
const { normalizeGenres } = require('./genreCatalog.cjs');

function sameRelease(artist, title, album) {
  if (!album) return false;
  const credited = album.artist || album.artist_name || (album.artists || []).map(a => typeof a === 'string' ? a : a.name).join(', ');
  return releaseGroupMatches(artist, title, { title: album.name || album.album_name,
    'artist-credit': [{ name: credited }] });
}

// Some Spotify embed responses omit genres. Look up only this exact edition;
// a standard, live or similarly named release must never supply its metadata.
async function resolveGenres(artist, title, sources, provider) {
  for (const source of sources) {
    const genres = normalizeGenres(source);
    if (genres.length) return genres;
  }
  try {
    const result = await provider.search(`${artist} ${title}`, 15);
    for (const candidate of (result?.albums || []).filter(album => sameRelease(artist, title, album)).slice(0, 3)) {
      const album = await provider.details(candidate.id);
      if (!sameRelease(artist, title, album)) continue;
      const genres = normalizeGenres(album.genres);
      if (genres.length) return genres;
    }
  } catch (_) { /* Keep the required-genre validation; never invent a classification. */ }
  return [];
}
module.exports = { sameRelease, resolveGenres };
