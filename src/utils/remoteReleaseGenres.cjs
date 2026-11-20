const { normalizeGenres } = require('./genreCatalog.cjs');
const { titleKey } = require('./musicBrainzIdentity.cjs');
const { artistCreditKey, slugify } = require('./releaseIdentity.cjs');

// Credit separators differ between providers; the complete names must still match.
const sameTitle = (a,b) => Boolean(a && b && titleKey(a) === titleKey(b));
const barcodeKey = value => /^\d{8,14}$/.test(String(value || '').trim()) ? String(value).trim().replace(/^0+/, '') : null;

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

function sameTracklist(selected, candidate) {
  const tracks=selected?.tracks,other=candidate?.tracks;
  if(!Array.isArray(tracks)||!Array.isArray(other)||!tracks.length||tracks.length!==other.length)return false;
  // A truncated preview cannot prove that two regional editions are equivalent.
  for(const album of [selected,candidate]){
    const total=Number(album.totalTracks||album.total_tracks||album.tracks.length);
    if(total!==album.tracks.length)return false;
  }
  return tracks.every((track,index)=>{
    const counterpart=other[index],name=slugify(track.name||track.title,true);
    if(!name||name!==slugify(counterpart.name||counterpart.title,true))return false;
    const duration=Number(track.duration_ms),otherDuration=Number(counterpart.duration_ms);
    return !(duration>0&&otherDuration>0)||Math.abs(duration-otherDuration)<=2500;
  });
}

// Some Spotify embed responses omit genres. Look up only this exact edition;
// a standard, live or similarly named release must never supply its metadata.
async function resolveGenres(artist, title, sources, provider, edition = {}) {
  for (const source of sources) {
    const genres = normalizeGenres(source);
    if (genres.length) return genres;
  }
  const barcode = barcodeKey(edition.barcode || edition.upc);
  const matchesEdition = album => sameTitle(title, album?.name || album?.album_name) &&
    (barcode ? barcodeKey(album?.barcode || album?.upc) === barcode ||
      (sameRelease(artist,title,album)&&sameTracklist(edition,album)) : sameRelease(artist, title, album));
  // UPC/EAN padding differs between platforms. The exact edition code also
  // survives classical composer/performer credits being reordered or translated.
  if (barcode) try {
    const album = await provider.details('upc:' + barcode.padStart(12, '0'));
    if (matchesEdition(album)) {
      const genres = normalizeGenres(album.genres);
      if (genres.length) return genres;
    }
  } catch (_) { /* A missing UPC lookup may still be found in exact search results. */ }
  try {
    const result = await provider.search(`${artist} ${title}`, 15);
    // Search summaries may list only the first artist. Validate the exact title
    // now, then require all main credits from the full edition before using genres.
    const candidates = (result?.albums || []).filter(album => sameTitle(title,album.name || album.album_name));
    candidates.sort((a,b) => Number(sameRelease(artist,title,b)) - Number(sameRelease(artist,title,a)));
    for (const candidate of candidates.slice(0, 3)) {
      try {
        const album = await provider.details(candidate.id);
        if (!matchesEdition(album)) continue;
        const genres = normalizeGenres(album.genres);
        if (genres.length) return genres;
      } catch (_) { /* A failed candidate must not hide another exact edition. */ }
    }
  } catch (_) { /* Keep the required-genre validation; never invent a classification. */ }
  return [];
}
module.exports = { sameRelease, sameTitle, resolveGenres, mainArtists, barcodeKey, sameTracklist };
