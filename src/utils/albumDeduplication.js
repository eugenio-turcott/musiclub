// src/utils/albumDeduplication.js

/**
 * Normaliza títulos de álbumes removiendo ediciones, aniversarios, remasters,
 * contenido entre paréntesis/corchetes, caracteres especiales, acentos, años y subtítulos.
 */
export function normalizeAlbumTitle(rawTitle = '') {
  if (!rawTitle) return '';
  let str = String(rawTitle).toLowerCase().trim();

  // 1. Quitar acentos y diacríticos: "Edición" -> "edicion", "Canción" -> "cancion"
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 2. Quitar contenido entre paréntesis, corchetes y llaves: "(2019 Remaster)", "[Deluxe]", "{Bonus}"
  str = str.replace(/\([^)]*\)/g, ' ');
  str = str.replace(/\[[^\]]*\]/g, ' ');
  str = str.replace(/\{[^}]*\}/g, ' ');

  // 3. Subtítulos después de dos puntos, guiones, barras o pipes si mencionan versiones/ediciones o si la parte anterior ya es un título completo
  const separatorMatch = str.match(/[:\-–—|/~]/);
  if (separatorMatch && separatorMatch.index > 0) {
    const beforeSep = str.substring(0, separatorMatch.index).trim();
    const afterSep = str.substring(separatorMatch.index + 1).trim();

    if (
      /(edicion|edition|anniversary|aniversario|remaster|remastered|remasterizado|remasterizada|deluxe|version|vol|volume|volumen|expanded|special|reissue|re-issue|live|session|sessions|original|soundtrack|en vivo|disco|disc|bonus|explicit|mono|stereo|box set|anios|anos|40th|50th|25th|30th|20th|10th|\b(19|20)\d{2}\b)/i.test(
        afterSep
      ) ||
      beforeSep.length >= 4
    ) {
      str = beforeSep;
    }
  }

  // 4. Quitar palabras clave de edición sueltas en cualquier posición
  const editionKeywords = [
    'remastered', 'remaster', 'remasterizado', 'remasterizada', 're-master',
    'deluxe edition', 'deluxe version', 'super deluxe', 'deluxe',
    'special edition', 'special version', 'expanded edition', 'expanded',
    'anniversary edition', 'anniversary remaster', 'anniversary',
    'aniversario', 'edicion aniversario', 'edicion especial', 'edicion', 'edition',
    'bonus track version', 'bonus tracks', 'bonus track', 'bonus version',
    'explicit version', 'explicit', 'clean version', 'clean',
    'reissue', 're-issue', 'version internacional', 'international version',
    'original soundtrack', 'soundtrack', 'original motion picture',
    'en vivo', 'live at', 'live from', 'live in', 'live session', 'live',
    'stereo version', 'stereo', 'mono version', 'mono',
    'digital remaster', 'digital version',
    'box set', 'boxset', 'unreleased', 'alternate take', 'alternate mix',
    'disk 1', 'disk 2', 'disc 1', 'disc 2', 'vol 1', 'vol 2', 'volumen 1', 'volumen 2',
    'volume 1', 'volume 2', 'pt 1', 'pt 2', 'part 1', 'part 2',
  ];

  for (const kw of editionKeywords) {
    const reg = new RegExp(`\\b${kw.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\$&')}\\b`, 'gi');
    str = str.replace(reg, ' ');
  }

  // 5. Quitar números ordinales como 40º, 40°, 40a, 40th, 50th, etc.
  str = str.replace(/\b\d+(º|°|a|th|nd|rd|st)\b/gi, ' ');

  // 6. Quitar años sueltos de 4 dígitos (ej. 1979, 1997, 2019, 2024)
  str = str.replace(/\b(19|20)\d{2}\b/g, ' ');

  // 7. Quitar caracteres que no sean letras o números
  str = str.replace(/[^a-z0-9\s]/g, ' ');

  // 8. Normalizar espacios y recortar
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Normaliza nombres de artista
 */
export function normalizeArtistName(rawArtist = '') {
  if (!rawArtist) return '';
  let str = String(rawArtist).toLowerCase().trim();
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  str = str.replace(/[^a-z0-9\s]/g, ' ');
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Extrae tokens significativos ignorando palabras vacías comunes
 */
function getSignificantTokens(str = '') {
  const stopwords = new Set([
    'the', 'a', 'an', 'la', 'el', 'los', 'las', 'de', 'del', 'y', 'and', 'en', 'in', 'of', 'for', 'to', 'with', 'con', 'un', 'una', 'unos', 'unas'
  ]);
  return str
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !stopwords.has(w));
}

/**
 * Verifica si un álbum candidato ya existe en el catálogo de álbumes
 * (catálogo general, pool activo, ganadores, individuales o inactivos).
 */
export function isAlbumAlreadyInCatalog(candidate, catalogAlbums = []) {
  if (!candidate || !catalogAlbums || catalogAlbums.length === 0) return false;

  const candidateId = candidate.id || candidate.spotify_id || '';
  const candidateTitle = candidate.name || candidate.album_name || candidate.album || candidate.title || '';
  const candidateArtists = candidate.artists || [candidate.artist_name || candidate.artista || candidate.artist || ''];
  const candidateSpotifyLink = candidate.external_urls?.spotify || candidate.spotify_link || candidate.spotifyLink || '';

  const normCandTitle = normalizeAlbumTitle(candidateTitle);
  const compactCandTitle = normCandTitle.replace(/\s+/g, '');
  const candTokens = getSignificantTokens(normCandTitle);

  const normCandArtists = (Array.isArray(candidateArtists) ? candidateArtists : [candidateArtists])
    .map((a) => normalizeArtistName(typeof a === 'string' ? a : a?.name || ''))
    .filter(Boolean);

  for (const cat of catalogAlbums) {
    if (!cat) continue;

    const catId = cat.id || cat.spotify_id || '';
    const catTitle = cat.album_name || cat.album || cat.name || cat.title || '';
    const catArtist = cat.artist_name || cat.artista || cat.artist || '';
    const catSpotifyLink = cat.spotify_link || cat.spotifyLink || '';

    // 1. Coincidencia exacta por ID de Spotify o URL de Spotify
    if (candidateId && catId && String(candidateId) === String(catId)) {
      return true;
    }
    if (
      candidateSpotifyLink &&
      catSpotifyLink &&
      candidateSpotifyLink.toLowerCase().trim() === catSpotifyLink.toLowerCase().trim()
    ) {
      return true;
    }

    const normCatTitle = normalizeAlbumTitle(catTitle);
    const compactCatTitle = normCatTitle.replace(/\s+/g, '');
    const normCatArtist = normalizeArtistName(catArtist);
    const catTokens = getSignificantTokens(normCatTitle);

    // 2. Título normalizado idéntico o compacto idéntico
    if (
      normCandTitle &&
      normCatTitle &&
      (normCandTitle === normCatTitle || compactCandTitle === compactCatTitle)
    ) {
      return true;
    }

    // 3. Uno de los títulos empieza con el otro o está completamente contenido
    if (
      normCandTitle.length >= 4 &&
      normCatTitle.length >= 4 &&
      (normCandTitle.startsWith(normCatTitle) ||
        normCatTitle.startsWith(normCandTitle) ||
        compactCandTitle.startsWith(compactCatTitle) ||
        compactCatTitle.startsWith(compactCandTitle) ||
        normCandTitle.includes(normCatTitle) ||
        normCatTitle.includes(normCandTitle))
    ) {
      return true;
    }

    // 4. Coincidencia de tokens significativos
    if (candTokens.length >= 2 && catTokens.length >= 2) {
      const allCatInCand = catTokens.every((t) => candTokens.includes(t));
      const allCandInCat = candTokens.every((t) => catTokens.includes(t));
      if (allCatInCand || allCandInCat) {
        return true;
      }
    }

    // 5. Coincidencia de artista + alta correlación de título
    const artistMatches =
      !normCatArtist ||
      normCandArtists.some(
        (candA) =>
          candA.includes(normCatArtist) ||
          normCatArtist.includes(candA) ||
          candA.replace(/\s+/g, '') === normCatArtist.replace(/\s+/g, '')
      );

    if (artistMatches && normCandTitle.length >= 3 && normCatTitle.length >= 3) {
      if (
        candTokens.length > 0 &&
        catTokens.length > 0 &&
        candTokens.filter((t) => catTokens.includes(t)).length >= Math.min(candTokens.length, catTokens.length) * 0.6
      ) {
        return true;
      }
    }
  }

  return false;
}
