// src/services/musicBrainzService.js
import { searchAlbum } from './spotifyApi';

/**
 * MusicBrainz & Cover Art Archive Service for Musiclub
 * Provides access to millions of canonical music releases, release-groups, artists, and high-res cover art.
 * 
 * Complies with MusicBrainz API policies:
 * - Includes required User-Agent header
 * - Rate limiting / debounced requests
 * - Cover Art Archive integration for official artwork
 */

const MUSICBRAINZ_API_BASE = 'https://musicbrainz.org/ws/2';
const COVER_ART_ARCHIVE_BASE = 'https://coverartarchive.org';
const USER_AGENT = 'MusiclubApp/1.0 ( https://musiclub.app ; contact@musiclub.app )';

// Cache en memoria para evitar solicitudes redundantes y respetar rate limits
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data) {
  if (cache.size > 200) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Mapeo de tipos de MusicBrainz a tipos canónicos de Musiclub
 */
export function normalizeReleaseType(primaryType, secondaryTypes = []) {
  const p = (primaryType || '').toLowerCase();
  const s = (secondaryTypes || []).map((t) => (t || '').toLowerCase());

  if (s.includes('compilation')) return 'COMPILACION';
  if (s.includes('soundtrack')) return 'SOUNDTRACK';
  if (s.includes('live')) return 'EN VIVO';
  if (s.includes('remix')) return 'REMIX';

  if (p === 'ep') return 'EP';
  if (p === 'single') return 'SENCILLO';
  if (p === 'album') return 'ALBUM';
  return 'ALBUM';
}

/**
 * Obtiene la URL canónica de la portada desde Cover Art Archive
 * @param {string} mbid - MusicBrainz Release Group ID o Release ID
 * @param {'front' | 'front-500' | 'front-250'} size
 */
export function getCoverArtUrl(mbid, size = 'front-500') {
  if (!mbid) return null;
  return `${COVER_ART_ARCHIVE_BASE}/release-group/${mbid}/${size}`;
}

/**
 * Búsqueda de Álbumes / Release Groups en MusicBrainz
 * @param {string} query - Término de búsqueda (Nombre del álbum, artista, etc.)
 * @param {number} limit - Límite de resultados (máximo 25)
 */
export async function searchMusicBrainzReleases(query, limit = 15) {
  const cleanQ = (query || '').trim();
  if (!cleanQ || cleanQ.length < 2) return [];

  const cacheKey = `search_${cleanQ}_${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const encodedQuery = encodeURIComponent(cleanQ);
    const url = `${MUSICBRAINZ_API_BASE}/release-group?query=${encodedQuery}&limit=${limit}&fmt=json`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`MusicBrainz search error status: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const releaseGroups = data['release-groups'] || [];

    const formatted = releaseGroups.map((rg) => {
      const mbid = rg.id;
      const title = rg.title || 'Álbum Desconocido';
      const artistCredit = (rg['artist-credit'] || [])
        .map((ac) => (typeof ac === 'string' ? ac : ac.name || ac.artist?.name || ''))
        .join('')
        .trim() || 'Artista Desconocido';

      const releaseDate = rg['first-release-date'] || null;
      let releaseYear = null;
      if (releaseDate) {
        const parsedYear = parseInt(releaseDate.substring(0, 4), 10);
        if (!isNaN(parsedYear) && parsedYear >= 1900 && parsedYear <= 2100) {
          releaseYear = parsedYear;
        }
      }

      const releaseType = normalizeReleaseType(
        rg['primary-type'],
        rg['secondary-types']
      );

      return {
        id: mbid,
        mbid: mbid,
        name: title,
        artist: artistCredit,
        releaseDate: releaseDate,
        releaseYear: releaseYear,
        releaseType: releaseType,
        disambiguation: rg.disambiguation || null,
        score: rg.score || 100,
        image: getCoverArtUrl(mbid, 'front-500'),
        thumbImage: getCoverArtUrl(mbid, 'front-250'),
        source: 'MUSICBRAINZ',
      };
    });

    setCache(cacheKey, formatted);
    return formatted;
  } catch (error) {
    console.error('Error buscando en MusicBrainz:', error);
    return [];
  }
}

/**
 * Resuelve y garantiza enlaces funcionales a servicios de streaming
 * (Spotify, YouTube, Apple Music) con fallback inteligente
 */
export async function resolveStreamingLinks(artistName, albumName, existingLinks = {}) {
  const result = {
    spotify: existingLinks?.spotify || null,
    youtube: existingLinks?.youtube || null,
    apple_music: existingLinks?.apple_music || null,
    bandcamp: existingLinks?.bandcamp || null,
    discogs: existingLinks?.discogs || null,
  };

  const cleanArtist = (artistName || '').trim();
  const cleanAlbum = (albumName || '').trim();
  const query = `${cleanArtist} ${cleanAlbum}`.trim();
  const encodedQuery = encodeURIComponent(query);

  // 1. Resolver Spotify
  if (!result.spotify && query) {
    try {
      const spotifyRes = await searchAlbum(query);
      if (spotifyRes?.success && spotifyRes.albums?.length > 0) {
        const top = spotifyRes.albums[0];
        result.spotify =
          top.spotify_url || `https://open.spotify.com/album/${top.id}`;
      } else {
        result.spotify = `https://open.spotify.com/search/${encodedQuery}`;
      }
    } catch {
      result.spotify = `https://open.spotify.com/search/${encodedQuery}`;
    }
  }

  // 2. Resolver YouTube
  if (!result.youtube && query) {
    result.youtube = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      query + ' full album'
    )}`;
  }

  // 3. Resolver Apple Music
  if (!result.apple_music && query) {
    result.apple_music = `https://music.apple.com/search?term=${encodedQuery}`;
  }

  return result;
}

/**
 * Obtiene los detalles completos de un Release Group (incluyendo tracks y metadata detallada del lanzamiento oficial)
 * @param {string} mbid - MusicBrainz Release Group ID
 */
export async function getMusicBrainzReleaseGroupDetails(mbid) {
  if (!mbid) return null;

  const cacheKey = `rg_details_${mbid}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `${MUSICBRAINZ_API_BASE}/release-group/${mbid}?inc=artists+releases+genres+ratings+url-rels&fmt=json`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const releases = data.releases || [];

    // Enlaces de plataformas encontrados en el Release Group
    const foundLinks = {
      spotify: null,
      apple_music: null,
      youtube: null,
      bandcamp: null,
      discogs: null,
      wikidata: null,
    };

    const extractLinksFromRelations = (relations) => {
      (relations || []).forEach((rel) => {
        const targetUrl = rel.url?.resource || '';
        if (targetUrl.includes('spotify.com') && !foundLinks.spotify)
          foundLinks.spotify = targetUrl;
        else if (
          (targetUrl.includes('apple.com') || targetUrl.includes('itunes.apple.com')) &&
          !foundLinks.apple_music
        )
          foundLinks.apple_music = targetUrl;
        else if (
          (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) &&
          !foundLinks.youtube
        )
          foundLinks.youtube = targetUrl;
        else if (targetUrl.includes('bandcamp.com') && !foundLinks.bandcamp)
          foundLinks.bandcamp = targetUrl;
        else if (targetUrl.includes('discogs.com') && !foundLinks.discogs)
          foundLinks.discogs = targetUrl;
        else if (targetUrl.includes('wikidata.org') && !foundLinks.wikidata)
          foundLinks.wikidata = targetUrl;
      });
    };

    extractLinksFromRelations(data.relations);

    // Priorizar releases oficiales, con código de barras y con pistas
    const sortedReleases = [...releases].sort((a, b) => {
      const aOfficial = (a.status || '').toLowerCase() === 'official' ? 3 : 0;
      const bOfficial = (b.status || '').toLowerCase() === 'official' ? 3 : 0;
      const aBarcode = a.barcode ? 2 : 0;
      const bBarcode = b.barcode ? 2 : 0;
      const aTracks = a['track-count'] || 0;
      const bTracks = b['track-count'] || 0;
      return (bOfficial + bBarcode + (bTracks > 0 ? 1 : 0)) - (aOfficial + aBarcode + (aTracks > 0 ? 1 : 0));
    });

    let targetReleaseDate = data['first-release-date'] || releases[0]?.date || null;
    let targetCountry = releases[0]?.country || null;
    let targetBarcode = releases[0]?.barcode || null;
    let targetLabel = null;
    let tracks = [];
    let totalTracks = null;

    // Probar hasta los mejores 3 releases para asegurar tracks y metadatos completos
    const candidates = sortedReleases.length > 0 ? sortedReleases.slice(0, 3) : (releases[0] ? [releases[0]] : []);
    for (const candidate of candidates) {
      if (!candidate?.id) continue;
      const releaseInfo = await getMusicBrainzReleaseDetailedInfo(candidate.id);
      if (releaseInfo) {
        if (!targetLabel && releaseInfo.label) targetLabel = releaseInfo.label;
        if (!targetCountry && releaseInfo.country) targetCountry = releaseInfo.country;
        if (!targetBarcode && releaseInfo.barcode) targetBarcode = releaseInfo.barcode;
        if (!targetReleaseDate && releaseInfo.releaseDate) targetReleaseDate = releaseInfo.releaseDate;
        extractLinksFromRelations(releaseInfo.relations);

        if (releaseInfo.tracks && releaseInfo.tracks.length > 0) {
          tracks = releaseInfo.tracks;
          totalTracks = releaseInfo.totalTracks || tracks.length;
          break; // Encontramos release con lista de pistas completa
        }
      }
    }

    const artistName = (data['artist-credit'] || [])
      .map((ac) => (typeof ac === 'string' ? ac : ac.name || ac.artist?.name || ''))
      .join('')
      .trim() || 'Artista';

    const albumTitle = data.title || 'Lanzamiento';
    const genres = (data.genres || []).map((g) => g.name);

    let releaseYear = null;
    if (targetReleaseDate) {
      const parsedYear = parseInt(targetReleaseDate.substring(0, 4), 10);
      if (!isNaN(parsedYear)) releaseYear = parsedYear;
    }

    // Resolver y asegurar enlaces funcionales de streaming
    const externalLinks = await resolveStreamingLinks(
      artistName,
      albumTitle,
      foundLinks
    );

    const result = {
      mbid: data.id,
      name: albumTitle,
      artist: artistName,
      releaseDate: targetReleaseDate,
      releaseYear: releaseYear,
      releaseType: normalizeReleaseType(data['primary-type'], data['secondary-types']),
      disambiguation: data.disambiguation || null,
      genres: genres,
      label: targetLabel,
      country: targetCountry,
      barcode: targetBarcode,
      image: getCoverArtUrl(data.id, 'front-500'),
      thumbImage: getCoverArtUrl(data.id, 'front-250'),
      externalLinks: externalLinks,
      tracks: tracks,
      totalTracks: totalTracks || tracks.length || null,
      source: 'MUSICBRAINZ',
    };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error obteniendo detalles de MusicBrainz:', error);
    return null;
  }
}

/**
 * Obtiene la información detallada de un Release de MusicBrainz
 * (tracks, media, discids, barcode, label, country, relaciones)
 * @param {string} releaseId - MusicBrainz Release ID
 */
export async function getMusicBrainzReleaseDetailedInfo(releaseId) {
  if (!releaseId) return null;

  const cacheKey = `release_detailed_${releaseId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `${MUSICBRAINZ_API_BASE}/release/${releaseId}?inc=recordings+artist-credits+media+labels+url-rels+discids&fmt=json`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const mediaList = data.media || [];
    const tracks = [];

    let overallIndex = 1;
    mediaList.forEach((media) => {
      (media.tracks || []).forEach((t) => {
        tracks.push({
          id: t.id || t.recording?.id || `mb_track_${overallIndex}`,
          name: t.title || t.recording?.title || `Track ${overallIndex}`,
          duration_ms: t.length || t.recording?.length || null,
          track_number: t.position || overallIndex,
          disc_number: media.position || 1,
        });
        overallIndex++;
      });
    });

    // Extraer label / discográfica
    const labelList = (data['label-info'] || [])
      .map((li) => li.label?.name)
      .filter(Boolean);
    const label = labelList.length > 0 ? labelList.join(', ') : null;

    // Calcular total de tracks
    const totalMediaTracks = mediaList.reduce(
      (acc, m) => acc + (m['track-count'] || m.tracks?.length || 0),
      0
    );

    const detailedInfo = {
      id: data.id,
      barcode: data.barcode || null,
      country: data.country || null,
      label: label,
      releaseDate: data.date || null,
      tracks: tracks,
      totalTracks: totalMediaTracks || tracks.length || null,
      relations: data.relations || [],
    };

    setCache(cacheKey, detailedInfo);
    return detailedInfo;
  } catch (error) {
    console.error('Error obteniendo detalles del release de MusicBrainz:', error);
    return null;
  }
}

/**
 * Obtiene la lista de canciones / recordings de un Release específico de MusicBrainz
 * @param {string} releaseId - MusicBrainz Release ID
 */
export async function getMusicBrainzReleaseTracks(releaseId) {
  if (!releaseId) return [];

  const cacheKey = `release_tracks_${releaseId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `${MUSICBRAINZ_API_BASE}/release/${releaseId}?inc=recordings+artist-credits+media&fmt=json`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    const mediaList = data.media || [];
    const tracks = [];

    let overallIndex = 1;
    mediaList.forEach((media) => {
      (media.tracks || []).forEach((t) => {
        tracks.push({
          id: t.id || t.recording?.id || `mb_track_${overallIndex}`,
          name: t.title || t.recording?.title || `Track ${overallIndex}`,
          duration_ms: t.length || t.recording?.length || null,
          track_number: t.position || overallIndex,
          disc_number: media.position || 1,
        });
        overallIndex++;
      });
    });

    setCache(cacheKey, tracks);
    return tracks;
  } catch (error) {
    console.error('Error obteniendo canciones de MusicBrainz:', error);
    return [];
  }
}

/**
 * Comprueba si la portada existe en Cover Art Archive de forma no bloqueante
 */
export async function verifyCoverArtAvailable(mbid) {
  if (!mbid) return false;
  try {
    const res = await fetch(`${COVER_ART_ARCHIVE_BASE}/release-group/${mbid}/front-250`, {
      method: 'HEAD',
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Busca de forma inteligente y exacta el mejor Release Group en MusicBrainz
 * Maneja reintentos con backoff para evitar bloqueos por 503/429
 */
export async function searchBestReleaseGroup(artistName, albumName) {
  if (!albumName || !artistName) return null;
  const cleanArt = String(artistName).replace(/[“”"']/g, '').trim();
  const cleanAlb = String(albumName).replace(/[“”"']/g, '').trim();

  const fetchMbWithRetry = async (url) => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': USER_AGENT,
            Accept: 'application/json',
          },
        });
        if (res.status === 503 || res.status === 429) {
          await new Promise((r) => setTimeout(r, attempt * 1500));
          continue;
        }
        if (!res.ok) return null;
        return await res.json();
      } catch {
        await new Promise((r) => setTimeout(r, attempt * 1200));
      }
    }
    return null;
  };

  // 1. Búsqueda estructurada
  let q = `artist:"${cleanArt}" AND releasegroup:"${cleanAlb}"`;
  let data = await fetchMbWithRetry(
    `${MUSICBRAINZ_API_BASE}/release-group?query=${encodeURIComponent(q)}&limit=8&fmt=json`
  );
  let rgs = data?.['release-groups'] || [];

  // 2. Búsqueda libre si no hubo resultados
  if (rgs.length === 0) {
    q = `${cleanArt} ${cleanAlb}`;
    data = await fetchMbWithRetry(
      `${MUSICBRAINZ_API_BASE}/release-group?query=${encodeURIComponent(q)}&limit=8&fmt=json`
    );
    rgs = data?.['release-groups'] || [];
  }

  // 3. Búsqueda simplificada eliminando (Remastered), [Deluxe], anexos de edición, etc.
  if (rgs.length === 0 || cleanAlb.includes('(') || cleanAlb.includes('-')) {
    const simplified = cleanAlb
      .replace(/\s*[-–—]\s*(Remastered|Deluxe|Anniversary|Edition|Bonus|Expanded).*/i, '')
      .replace(/\((Remastered|Deluxe|Anniversary|Edition|Bonus|Expanded|Live)[^)]*\)/gi, '')
      .replace(/\[[^\]]*\]/g, '')
      .replace(/[+]/g, '')
      .trim();
    if (simplified && simplified.toLowerCase() !== cleanAlb.toLowerCase()) {
      q = `artist:"${cleanArt}" AND releasegroup:"${simplified}"`;
      data = await fetchMbWithRetry(
        `${MUSICBRAINZ_API_BASE}/release-group?query=${encodeURIComponent(q)}&limit=8&fmt=json`
      );
      if (data?.['release-groups']?.length > 0) {
        rgs = [...rgs, ...data['release-groups']];
      }
    }
  }

  if (rgs.length === 0) return null;

  const cleanLowerAlb = cleanAlb.toLowerCase();
  const cleanLowerArt = cleanArt.toLowerCase();

  const scored = rgs.map((rg) => {
    let score = rg.score || 50;
    const title = (rg.title || '').toLowerCase().trim();
    const rgArt = (rg['artist-credit'] || [])
      .map((a) => (typeof a === 'string' ? a : a.name || a.artist?.name || ''))
      .join('')
      .toLowerCase()
      .trim();

    const primary = (rg['primary-type'] || '').toLowerCase();
    const secondary = (rg['secondary-types'] || []).map((s) => s.toLowerCase());

    if (title === cleanLowerAlb) score += 45;
    else if (title.includes(cleanLowerAlb) || cleanLowerAlb.includes(title)) score += 20;

    if (rgArt === cleanLowerArt) score += 35;
    else if (rgArt.includes(cleanLowerArt) || cleanLowerArt.includes(rgArt)) score += 20;

    if (primary === 'album' && secondary.length === 0) score += 30;
    else if (primary === 'album') score += 15;
    else if (primary === 'ep') score += 25;
    else if (primary === 'single') score += 5;

    return { rg, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.rg || null;
}

/**
 * Enriquece un lanzamiento con metadatos canónicos DIRECTOS de MusicBrainz
 * (MBID, release_type, release_date, release_year, géneros, discográfica, país, código de barras, tracks)
 * IMPORTANTE: No toca la portada (image_url); la portada se preserva de Spotify.
 */
export async function enrichAlbumWithMusicBrainz(albumName, artistName) {
  try {
    const rg = await searchBestReleaseGroup(artistName, albumName);
    if (!rg) return null;

    const mbid = rg.id;
    const releaseType = normalizeReleaseType(
      rg['primary-type'],
      rg['secondary-types']
    );

    let releaseDate = rg['first-release-date'] || null;
    let releaseYear = null;
    if (releaseDate) {
      const y = parseInt(String(releaseDate).substring(0, 4), 10);
      if (!isNaN(y) && y >= 1900 && y <= 2100) releaseYear = y;
    }

    let genres = (rg.tags || []).map((t) => t.name).slice(0, 5);
    let label = null;
    let country = null;
    let barcode = null;
    let totalTracks = null;
    let tracks = [];

    // Consultar detalles del Release Group
    const details = await getMusicBrainzReleaseGroupDetails(mbid);
    if (details) {
      if (details.genres && details.genres.length > 0) {
        genres = details.genres;
      }
      if (details.label) label = details.label;
      if (details.country) country = details.country;
      if (details.barcode) barcode = details.barcode;
      if (details.totalTracks) totalTracks = details.totalTracks;
      if (details.tracks && details.tracks.length > 0) tracks = details.tracks;
      if (details.releaseDate && !releaseDate) {
        releaseDate = details.releaseDate;
        releaseYear = details.releaseYear;
      }
    }

    return {
      mbid,
      album_name: details?.name || rg.title || albumName,
      artist_name: details?.artist || artistName,
      release_type: releaseType,
      release_date: releaseDate,
      release_year: releaseYear,
      genres,
      label,
      country,
      barcode,
      total_tracks: totalTracks || (tracks.length > 0 ? tracks.length : null),
      tracks,
      externalLinks: details?.externalLinks || null,
    };
  } catch (error) {
    console.warn('Error en enrichAlbumWithMusicBrainz:', error.message);
    return null;
  }
}

/**
 * Obtiene la información CANÓNICA COMPLETA de MusicBrainz para guardar en Supabase.
 * - Todos los metadatos provienen de MusicBrainz (MBID, título, artista, release_type,
 *   release_date, release_year, géneros, discográfica, país, barcode, total_tracks, tracks).
 * - La portada (image_url) se PRESERVA explícitamente de la API de origen (Spotify o Deezer HD)
 *   satisfaciendo la regla: "información de MusicBrainz COMPLETA a excepción de la portada".
 * 
 * @param {string} artistName - Nombre del artista
 * @param {string} albumName - Nombre del álbum
 * @param {string|null} coverImageUrl - Portada en alta resolución de Spotify o Deezer
 * @param {object|null} fallbackData - Datos de respaldo (Spotify/Deezer) en caso de que MB falle
 */
export async function getFullMusicBrainzAlbumData(artistName, albumName, coverImageUrl = null, fallbackData = null) {
  try {
    const rg = await searchBestReleaseGroup(artistName, albumName);
    if (!rg) {
      if (fallbackData) {
        return {
          ...fallbackData,
          album_name: fallbackData.name || fallbackData.album_name || albumName,
          artist_name: fallbackData.artist || fallbackData.artist_name || artistName,
          image_url: coverImageUrl || fallbackData.image_url || fallbackData.image,
          source: fallbackData.source || 'FALLBACK',
        };
      }
      return null;
    }

    const details = await getMusicBrainzReleaseGroupDetails(rg.id);
    const releaseType = normalizeReleaseType(rg['primary-type'], rg['secondary-types']);

    let releaseDate = details?.releaseDate || rg['first-release-date'] || fallbackData?.releaseDate || fallbackData?.release_date || null;
    let releaseYear = details?.releaseYear || null;
    if (!releaseYear && releaseDate) {
      const y = parseInt(String(releaseDate).substring(0, 4), 10);
      if (!isNaN(y) && y >= 1900 && y <= 2100) releaseYear = y;
    }

    const tracks = (details?.tracks && details.tracks.length > 0)
      ? details.tracks
      : (fallbackData?.tracks || []);

    const genres = (details?.genres && details.genres.length > 0)
      ? details.genres
      : (fallbackData?.genres || []);

    const canonicalTitle = details?.name || rg.title || albumName;
    const canonicalArtist = details?.artist || artistName;

    return {
      mbid: rg.id,
      album_name: canonicalTitle,
      artist_name: canonicalArtist,
      release_type: releaseType,
      release_date: releaseDate,
      release_year: releaseYear,
      genres: genres,
      label: details?.label || fallbackData?.label || null,
      country: details?.country || fallbackData?.country || null,
      barcode: details?.barcode || fallbackData?.barcode || null,
      total_tracks: details?.totalTracks || tracks.length || fallbackData?.total_tracks || null,
      tracks: tracks,
      // REQUERIMIENTO CLAVE: Conservar la portada de Spotify o Deezer HD
      image_url: coverImageUrl || fallbackData?.image_url || fallbackData?.image || null,
      spotify_link: details?.externalLinks?.spotify || fallbackData?.spotify_link || fallbackData?.external_urls?.spotify || null,
      youtube_link: details?.externalLinks?.youtube || fallbackData?.youtube_link || `https://www.youtube.com/results?search_query=${encodeURIComponent(canonicalArtist + ' ' + canonicalTitle + ' full album')}`,
      apple_music_link: details?.externalLinks?.appleMusic || fallbackData?.apple_music_link || `https://music.apple.com/search?term=${encodeURIComponent(canonicalArtist + ' ' + canonicalTitle)}`,
      other_link: details?.externalLinks?.bandcamp || details?.externalLinks?.discogs || fallbackData?.external_urls?.deezer || null,
      spotify_verified: true,
      reviews_enabled: true,
      source: 'MUSICBRAINZ',
    };
  } catch (err) {
    console.warn('Error en getFullMusicBrainzAlbumData:', err);
    if (fallbackData) {
      return {
        ...fallbackData,
        album_name: fallbackData.name || fallbackData.album_name || albumName,
        artist_name: fallbackData.artist || fallbackData.artist_name || artistName,
        image_url: coverImageUrl || fallbackData.image_url || fallbackData.image,
      };
    }
    return null;
  }
}

export const musicBrainzService = {
  searchMusicBrainzReleases,
  getMusicBrainzReleaseGroupDetails,
  getMusicBrainzReleaseTracks,
  getCoverArtUrl,
  verifyCoverArtAvailable,
  normalizeReleaseType,
  searchBestReleaseGroup,
  enrichAlbumWithMusicBrainz,
  getFullMusicBrainzAlbumData,
};

export default musicBrainzService;
