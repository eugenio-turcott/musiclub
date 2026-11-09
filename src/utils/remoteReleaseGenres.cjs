const { normalizeGenres } = require('./genreCatalog.cjs');
const { titleKey } = require('./musicBrainzIdentity.cjs');
const { artistCreditKey } = require('./releaseIdentity.cjs');

// Credit separators differ between providers; the complete names must still match.
const sameTitle = (a,b) => Boolean(a && b && titleKey(a) === titleKey(b));

function mainArtists(album) {
  const contributors = album?.contributors || album?.rawDeezerAlbum?.contributors || [];
  const main = contributors.filter(a => !a.role || a.role === 'Main').map(a => a.name).filter(Boolean);
  if (main.length) return main;
  if (album?.artists?.length) return album.artists.map(a => typeof a === 'string' ? a : a.name).filter(Boolean);
  return [album?.artist || album?.artist_name].filter(Boolean);
}

function sameRelease(artist, title, album) {
  if (!artist || !title || !album) return false;
  const credited = mainArtists(album).join(', ');
  return Boolean(credited && sameTitle(title,album.name || album.album_name) && artistCreditKey(artist) === artistCreditKey(credited));
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
    // Search summaries may list only the first artist. Validate the exact title
    // now, then require all main credits from the full edition before using genres.
    const candidates = (result?.albums || []).filter(album => sameTitle(title,album.name || album.album_name));
    candidates.sort((a,b) => Number(sameRelease(artist,title,b)) - Number(sameRelease(artist,title,a)));
    for (const candidate of candidates.slice(0, 3)) {
      try {
        const album = await provider.details(candidate.id);
        if (!sameRelease(artist, title, album)) continue;
        const genres = normalizeGenres(album.genres);
        if (genres.length) return genres;
      } catch (_) { /* A failed candidate must not hide another exact edition. */ }
    }
  } catch (_) { /* Keep the required-genre validation; never invent a classification. */ }
  return [];
}
module.exports = { sameRelease, sameTitle, resolveGenres, mainArtists };
