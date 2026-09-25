// src/services/albumEnrichmentService.js
import { supabase } from './supabaseClient.js';
import { searchAlbum, getAlbumDetails } from './spotifyApi.js';
import { searchDeezerAlbums, getDeezerAlbumDetails } from './deezerApi.js';
import { normalizeReleaseType } from './musicBrainzService.js';
import { normalizeCanonicalGenres } from '../utils/genreNormalizer.js';

const USER_AGENT = 'Musiclub/1.0 ( https://www.musiclub.org ; contact@musiclub.org )';
const MUSICBRAINZ_API_BASE = 'https://musicbrainz.org/ws/2';

/**
 * Consulta la API de MusicBrainz para obtener metadatos canónicos:
 * Release Group, Release oficial, Código de barras (barcode), País (country),
 * Sello discográfico (label), Tracks con MBIDs y enlaces directos a plataformas (relaciones).
 */
export async function fetchMusicBrainzDetails(artistName, albumName) {
  try {
    const cleanArt = (artistName || '').replace(/\([^)]*\)/g, '').replace(/[“”"']/g, '').trim();
    const cleanAlb = (albumName || '').replace(/\([^)]*\)/g, '').replace(/[“”"']/g, '').trim();
    if (!cleanAlb) return null;

    // 1. Buscar Release Group
    const q = cleanArt
      ? `artist:"${cleanArt}" AND releasegroup:"${cleanAlb}"`
      : `releasegroup:"${cleanAlb}"`;

    const rgSearchUrl = `${MUSICBRAINZ_API_BASE}/release-group?query=${encodeURIComponent(q)}&limit=3&fmt=json`;
    const rgRes = await fetch(rgSearchUrl, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined,
    });

    if (!rgRes.ok) return null;
    const rgJson = await rgRes.json();
    const rgs = rgJson['release-groups'] || [];
    if (rgs.length === 0) return null;

    const rg = rgs[0];
    const mbid = rg.id;

    // 2. Obtener Releases y Relaciones del Release Group
    const rgDetailsUrl = `${MUSICBRAINZ_API_BASE}/release-group/${mbid}?inc=artists+releases+genres+ratings+url-rels&fmt=json`;
    const detailsRes = await fetch(rgDetailsUrl, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined,
    });

    if (!detailsRes.ok) {
      return {
        mbid,
        primaryType: rg['primary-type'] || 'Album',
        tags: rg.tags?.map((t) => t.name) || [],
      };
    }

    const rgData = await detailsRes.json();
    const releases = rgData.releases || [];

    // Priorizar releases oficiales, con código de barras y pistas
    const sortedReleases = [...releases].sort((a, b) => {
      const aOfficial = (a.status || '').toLowerCase() === 'official' ? 3 : 0;
      const bOfficial = (b.status || '').toLowerCase() === 'official' ? 3 : 0;
      const aBc = a.barcode ? 2 : 0;
      const bBc = b.barcode ? 2 : 0;
      return (bOfficial + bBc) - (aOfficial + aBc);
    });

    const topRel = sortedReleases[0];
    let barcode = topRel?.barcode || null;
    let country = topRel?.country || null;
    let releaseDate = topRel?.date || rgData['first-release-date'] || null;
    let label = null;
    let mbTracks = [];
    const relations = [...(rgData.relations || [])];

    // 3. Consultar la Release detallada
    if (topRel?.id) {
      try {
        const relDetailsUrl = `${MUSICBRAINZ_API_BASE}/release/${topRel.id}?inc=recordings+artist-credits+media+labels+url-rels+discids&fmt=json`;
        const relRes = await fetch(relDetailsUrl, {
          headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
          signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined,
        });

        if (relRes.ok) {
          const relData = await relRes.json();
          if (relData.barcode) barcode = relData.barcode;
          if (relData.country) country = relData.country;
          if (relData.date) releaseDate = relData.date;
          if (Array.isArray(relData.relations)) {
            relations.push(...relData.relations);
          }

          const labelList = (relData['label-info'] || [])
            .map((li) => li.label?.name)
            .filter(Boolean);
          if (labelList.length > 0) label = labelList[0];

          const mediaList = relData.media || [];
          let overallIdx = 1;
          mediaList.forEach((media) => {
            (media.tracks || []).forEach((t) => {
              mbTracks.push({
                id: t.id || t.recording?.id || `mb_${overallIdx}`,
                name: t.title || t.recording?.title || `Pista ${overallIdx}`,
                disc_number: media.position || 1,
                duration_ms: t.length || t.recording?.length || null,
                track_number: t.position || overallIdx,
              });
              overallIdx++;
            });
          });
        }
      } catch (relErr) {
        // Fallback silencioso
      }
    }

    // Extraer enlaces directos de relaciones de MusicBrainz
    let youtubeRel = null;
    let spotifyRel = null;
    let deezerRel = null;
    let appleRel = null;

    relations.forEach((rel) => {
      const u = rel.url?.resource || '';
      if ((u.includes('youtube.com/watch') || u.includes('youtu.be/')) && !youtubeRel) {
        youtubeRel = u;
      } else if (u.includes('open.spotify.com/album/') && !spotifyRel) {
        spotifyRel = u;
      } else if (u.includes('deezer.com/album/') && !deezerRel) {
        deezerRel = u;
      } else if ((u.includes('music.apple.com') || u.includes('itunes.apple.com')) && !appleRel) {
        appleRel = u;
      }
    });

    return {
      mbid,
      primaryType: rg['primary-type'] || 'Album',
      tags: rg.tags?.map((t) => t.name) || [],
      barcode,
      country: country || 'XW',
      label,
      releaseDate,
      tracks: mbTracks,
      relations: {
        youtube: youtubeRel,
        spotify: spotifyRel,
        deezer: deezerRel,
        appleMusic: appleRel,
      },
    };
  } catch (err) {
    console.warn(`[MusicBrainz] Error consultando "${albumName}":`, err.message);
    return null;
  }
}

/**
 * Consulta la API de Deezer para obtener:
 * Enlace directo al álbum (deezer.com/album/...), UPC (barcode fallback),
 * Label (sello fallback), portada HD y tracklist de respaldo.
 */
export async function fetchDeezerDetails(artistName, albumName) {
  try {
    const cleanArt = (artistName || '').replace(/\([^)]*\)/g, '').trim();
    const cleanAlb = (albumName || '').replace(/\([^)]*\)/g, '').trim();
    const q = cleanArt ? `artist:"${cleanArt}" album:"${cleanAlb}"` : cleanAlb;

    const searchRes = await searchDeezerAlbums(q, 3);
    const albums = searchRes?.albums || [];
    if (albums.length === 0) return null;

    const candidate = albums[0];
    const cleanId = String(candidate.deezer_id || candidate.id).replace('deezer_', '');
    const details = await getDeezerAlbumDetails(cleanId);
    if (!details) return candidate;

    return {
      deezer_id: cleanId,
      deezer_url: details.external_urls?.deezer || `https://www.deezer.com/album/${cleanId}`,
      image_url: details.image || candidate.image,
      barcode: details.barcode || null,
      label: details.label || null,
      release_date: details.releaseDate || null,
      release_year: details.releaseYear || null,
      genres: details.genres || [],
      tracks: (details.tracks || []).map((t, idx) => ({
        id: t.id || `dz_${idx + 1}`,
        name: t.name,
        disc_number: 1,
        duration_ms: t.duration_ms || null,
        track_number: t.track_number || idx + 1,
      })),
    };
  } catch (err) {
    console.warn(`[Deezer] Error consultando "${albumName}":`, err.message);
    return null;
  }
}

/**
 * Consulta la API pública de Record Club para obtener las pistas anunciadas u oficiales.
 * https://api.record.club/releases/${rcId}/tracks
 */
export async function fetchRecordClubTracks(rcId) {
  if (!rcId) return [];
  try {
    const cleanId = String(rcId).replace(/^rc_/, '').trim();
    // En el navegador, usar la ruta interna para no violar CORS hacia api.record.club
    const url = typeof window !== 'undefined'
      ? `/api/record-club/tracks?id=${encodeURIComponent(cleanId)}`
      : `https://api.record.club/releases/${cleanId}/tracks`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined,
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) return [];
    return json.data.map((t, idx) => ({
      id: t.id || `rc_${idx + 1}`,
      name: t.name,
      track_name: t.name,
      disc_number: t.mediumPosition || 1,
      duration_ms: t.length || null,
      track_number: parseInt(t.number, 10) || t.position || idx + 1,
    }));
  } catch (err) {
    console.warn(`[RecordClub] Error consultando tracks de "${rcId}":`, err.message);
    return [];
  }
}

/**
 * Consulta la API de Spotify para obtener:
 * Portada oficial en máxima resolución (images[0]), tracklist oficial con duraciones,
 * enlace directo a Spotify, sello y géneros.
 */
export async function fetchSpotifyDetails(artistName, albumName, spotifyId = null) {
  try {
    if (spotifyId) {
      const details = await getAlbumDetails(spotifyId);
      if (details?.success && details.album) {
        return formatSpotifyAlbum(details.album);
      }
    }

    const cleanArt = (artistName || '').replace(/\([^)]*\)/g, '').trim();
    const cleanAlb = (albumName || '').replace(/\([^)]*\)/g, '').trim();
    const query = cleanArt ? `${cleanAlb} artist:${cleanArt}` : cleanAlb;

    const searchRes = await searchAlbum(query);
    if (searchRes?.success && searchRes.albums?.length > 0) {
      // Priorizar lanzamientos tipo 'album' y con mayor número de tracks sobre sencillos
      const best = [...searchRes.albums].sort((a, b) => {
        const aIsAlb = (a.album_type === 'album' || a.release_type === 'ALBUM') ? 2 : (a.album_type === 'ep' ? 1 : 0);
        const bIsAlb = (b.album_type === 'album' || b.release_type === 'ALBUM') ? 2 : (b.album_type === 'ep' ? 1 : 0);
        if (bIsAlb !== aIsAlb) return bIsAlb - aIsAlb;
        return (b.totalTracks || b.total_tracks || 0) - (a.totalTracks || a.total_tracks || 0);
      })[0];

      const details = await getAlbumDetails(best.id);
      if (details?.success && details.album) {
        return formatSpotifyAlbum(details.album);
      }
    }
    return null;
  } catch (err) {
    console.warn(`[Spotify] Error consultando "${albumName}":`, err.message);
    return null;
  }
}

function formatSpotifyAlbum(album) {
  const tracks = (album.tracks || []).map((t, idx) => ({
    id: t.id || `sp_${idx + 1}`,
    name: t.name,
    disc_number: t.disc_number || 1,
    duration_ms: t.duration_ms || null,
    track_number: t.track_number || idx + 1,
  }));

  return {
    id: album.id,
    image_url: album.image || null,
    spotify_url: album.external_urls?.spotify || `https://open.spotify.com/album/${album.id}`,
    release_date: album.releaseDate || null,
    release_year: album.releaseYear || null,
    release_type: album.release_type || 'ALBUM',
    label: album.label || null,
    genres: album.genres || [],
    total_tracks: album.totalTracks || tracks.length,
    tracks,
  };
}

/**
 * Normaliza y construye el payload exacto de 21 columnas para la tabla "albums":
 * id, album_name, artist_name, image_url, spotify_link, youtube_link, apple_music_link,
 * other_link, created_at, tracks, spotify_verified, reviews_enabled, release_date,
 * release_year, mbid, release_type, genres, label, country, barcode, total_tracks.
 */
export function build21ColumnPayload({
  rawItem = {},
  spotifyData = null,
  mbData = null,
  deezerData = null,
  rcTracks = [],
}) {
  const cleanAlbum = rawItem.album_name || spotifyData?.name || deezerData?.name || 'Álbum Desconocido';
  const cleanArtist = rawItem.artist_name || spotifyData?.artist || deezerData?.artist || 'Artista Desconocido';
  const searchParam = encodeURIComponent(`${cleanArtist} ${cleanAlbum}`);

  // 1. Portada oficial en HD
  const finalImageUrl =
    spotifyData?.image_url ||
    deezerData?.image_url ||
    rawItem.image_url ||
    null;

  // 2. Tracklist oficial con duración y track_number
  // Prioridad: Tracks existentes (si ya tienen IDs de Spotify/reseñas) > Spotify > Deezer > MusicBrainz > Record Club
  let finalTracks = [];
  if (Array.isArray(rawItem.tracks) && rawItem.tracks.length > 0 && typeof rawItem.tracks[0] === 'object' && rawItem.tracks[0].id) {
    finalTracks = rawItem.tracks;
  } else if (spotifyData?.tracks && spotifyData.tracks.length > 0) {
    finalTracks = spotifyData.tracks;
  } else if (deezerData?.tracks && deezerData.tracks.length > 0) {
    finalTracks = deezerData.tracks;
  } else if (mbData?.tracks && mbData.tracks.length > 0) {
    finalTracks = mbData.tracks;
  } else if (Array.isArray(rcTracks) && rcTracks.length > 0) {
    finalTracks = rcTracks;
  } else if (Array.isArray(rawItem.tracks) && rawItem.tracks.length > 0) {
    finalTracks = rawItem.tracks;
  }

  // 3. Enlaces a las 4 plataformas de streaming
  const spotifyLink =
    mbData?.relations?.spotify ||
    spotifyData?.spotify_url ||
    rawItem.spotify_url ||
    rawItem.spotify_link ||
    null;

  const youtubeLink =
    mbData?.relations?.youtube ||
    `https://www.youtube.com/results?search_query=${searchParam}`;

  const appleMusicLink =
    mbData?.relations?.appleMusic ||
    `https://music.apple.com/search?term=${searchParam}`;

  const otherLink =
    mbData?.relations?.deezer ||
    deezerData?.deezer_url ||
    `https://www.deezer.com/search/${searchParam}`;

  // 4. Metadatos de lanzamiento
  const relDate =
    mbData?.releaseDate ||
    spotifyData?.release_date ||
    deezerData?.release_date ||
    rawItem.release_date ||
    null;

  let relYear = null;
  if (relDate) {
    const y = parseInt(String(relDate).substring(0, 4), 10);
    if (!isNaN(y) && y >= 1900 && y <= 2100) relYear = y;
  }
  if (!relYear) {
    relYear = spotifyData?.release_year || deezerData?.release_year || new Date().getFullYear();
  }

  // 5. Tipo de lanzamiento
  let releaseType = 'ALBUM';
  const mbType = (mbData?.primaryType || '').toLowerCase();
  const rawType = (rawItem.release_type || '').toUpperCase();
  if (
    rawType === 'SENCILLO' ||
    rawType === 'SINGLE' ||
    mbType === 'single' ||
    (finalTracks.length > 0 && finalTracks.length <= 2)
  ) {
    releaseType = 'SENCILLO';
  } else if (
    rawType === 'EP' ||
    mbType === 'ep' ||
    (finalTracks.length >= 3 && finalTracks.length <= 7)
  ) {
    releaseType = 'EP';
  } else if (mbType === 'compilation' || rawType === 'COMPILACION') {
    releaseType = 'COMPILACION';
  }

  // 6. Barcode, País, Discográfica
  const barcode = mbData?.barcode || deezerData?.barcode || null;
  const country = mbData?.country || 'XW';
  const label = mbData?.label || spotifyData?.label || deezerData?.label || null;

  // 7. Géneros (Canónicos y concisos, máximo 3)
  const candidateGenres = [
    ...(rawItem.genre_category ? [rawItem.genre_category] : []),
    ...(rawItem.genre ? [rawItem.genre] : []),
    ...(spotifyData?.genres || []),
    ...(deezerData?.genres || []),
    ...(mbData?.tags || []),
  ];
  const genres = normalizeCanonicalGenres(candidateGenres, 3);

  const totalTracks =
    finalTracks.length ||
    spotifyData?.total_tracks ||
    rawItem.total_tracks ||
    1;

  return {
    album_name: cleanAlbum,
    artist_name: cleanArtist,
    image_url: finalImageUrl,
    spotify_link: spotifyLink,
    youtube_link: youtubeLink,
    apple_music_link: appleMusicLink,
    other_link: otherLink,
    created_at: new Date().toISOString(),
    tracks: finalTracks,
    spotify_verified: !!spotifyLink,
    reviews_enabled: true,
    release_date: relDate,
    release_year: relYear,
    mbid: mbData?.mbid || null,
    release_type: releaseType,
    genres: genres,
    label: label,
    country: country,
    barcode: barcode,
    total_tracks: totalTracks,
  };
}

/**
 * Comprueba si un álbum ya se encuentra en la tabla "albums" de Supabase.
 * Devuelve el registro completo si existe, o null si no.
 */
export async function findAlbumInDatabase(albumName, artistName, mbid = null) {
  if (!albumName) return null;

  try {
    // 1. Si tenemos MBID, buscar por MBID (máxima precisión)
    if (mbid) {
      const { data: mbidMatch } = await supabase
        .from('albums')
        .select('*')
        .eq('mbid', mbid)
        .maybeSingle();

      if (mbidMatch) return mbidMatch;
    }

    // 2. Coincidencia exacta de nombre y artista
    const cleanAlbum = albumName.trim();
    const cleanArtist = (artistName || '').trim();

    let query = supabase.from('albums').select('*').ilike('album_name', cleanAlbum);
    if (cleanArtist) {
      query = query.ilike('artist_name', `%${cleanArtist}%`);
    }

    const { data: exactMatches } = await query.limit(5);
    if (exactMatches && exactMatches.length > 0) {
      return exactMatches[0];
    }

    // 3. Coincidencia sin signos de puntuación
    const { data: allAlbums } = await supabase
      .from('albums')
      .select('*')
      .ilike('album_name', `%${cleanAlbum.slice(0, 15)}%`)
      .limit(20);

    if (allAlbums && allAlbums.length > 0) {
      const normAlb = cleanAlbum.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normArt = cleanArtist.toLowerCase().replace(/[^a-z0-9]/g, '');

      const found = allAlbums.find((a) => {
        const aNormAlb = (a.album_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const aNormArt = (a.artist_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return aNormAlb === normAlb && (!normArt || aNormArt.includes(normArt) || normArt.includes(aNormArt));
      });

      if (found) return found;
    }

    return null;
  } catch (err) {
    console.warn('Error verificando existencia del álbum en BD:', err.message);
    return null;
  }
}

/**
 * Realiza el proceso completo de consulta a Spotify, MusicBrainz, Deezer y Record Club,
 * y agrega el lanzamiento a la tabla "albums" de forma COMPLETA con las 21 columnas.
 * Si el álbum ya existía pero era un SENCILLO y ahora se detecta como ÁLBUM o con más pistas,
 * actualiza el registro en la BD para mantenerlo 100% al día.
 */
export async function enrichAndInsertAlbum(releaseItem) {
  if (!releaseItem || !releaseItem.album_name) {
    return { success: false, error: 'Datos de lanzamiento inválidos' };
  }

  const artistName = releaseItem.artist_name || '';
  const albumName = releaseItem.album_name;

  // 1. COMPROBACIÓN PREVIA: Si ya está en "albums", comprobar si amerita actualización
  const existing = await findAlbumInDatabase(albumName, artistName, releaseItem.mbid);
  const existingTracksCount = existing
    ? (existing.total_tracks || (Array.isArray(existing.tracks) ? existing.tracks.length : 0))
    : 0;
  const isExistingSingle =
    existing &&
    ((existing.release_type || '').toUpperCase() === 'SENCILLO' || existingTracksCount <= 1);
  const incomingIsAlbum =
    (releaseItem.release_type || '').toUpperCase() === 'ALBUM' ||
    (releaseItem.total_tracks || 0) >= 3;

  const shouldUpgrade =
    existing &&
    ((isExistingSingle && incomingIsAlbum) ||
      ((releaseItem.total_tracks || 0) > existingTracksCount && (releaseItem.total_tracks || 0) >= 2) ||
      (!existing.tracks || existing.tracks.length === 0));

  if (existing && !shouldUpgrade) {
    return {
      success: true,
      album: existing,
      alreadyExists: true,
    };
  }

  // 2. Consultas a Spotify, MusicBrainz, Deezer y Record Club
  const [spotifyData, mbData, deezerData, rcTracksData] = await Promise.allSettled([
    fetchSpotifyDetails(artistName, albumName, releaseItem.spotify_id),
    fetchMusicBrainzDetails(artistName, albumName),
    fetchDeezerDetails(artistName, albumName),
    releaseItem.id ? fetchRecordClubTracks(releaseItem.id) : Promise.resolve([]),
  ]);

  const sp = spotifyData.status === 'fulfilled' ? spotifyData.value : null;
  const mb = mbData.status === 'fulfilled' ? mbData.value : null;
  const dz = deezerData.status === 'fulfilled' ? deezerData.value : null;
  const rcTracks = rcTracksData.status === 'fulfilled' ? rcTracksData.value : [];

  // 3. Construir payload con las 21 columnas canónicas
  const payload = build21ColumnPayload({
    rawItem: releaseItem,
    spotifyData: sp,
    mbData: mb,
    deezerData: dz,
    rcTracks,
  });

  // 4. Si ya existía y necesitaba actualización (graduación de single a álbum completo)
  if (existing) {
    const finalTracks = payload.tracks && payload.tracks.length > 0 ? payload.tracks : existing.tracks;
    const finalTotalTracks = payload.total_tracks || (finalTracks ? finalTracks.length : existing.total_tracks);
    const { data: updated, error: updateError } = await supabase
      .from('albums')
      .update({
        release_type: payload.release_type,
        total_tracks: finalTotalTracks,
        tracks: finalTracks,
        spotify_link: payload.spotify_link || existing.spotify_link,
        image_url: payload.image_url || existing.image_url,
        release_date: payload.release_date || existing.release_date,
        release_year: payload.release_year || existing.release_year,
        spotify_verified: true,
      })
      .eq('id', existing.id)
      .select('*')
      .single();

    if (updateError) {
      console.error(`Error actualizando "${payload.album_name}" en albums:`, updateError.message);
      return { success: false, error: updateError.message };
    }

    return {
      success: true,
      album: updated,
      wasUpdated: true,
    };
  }

  // 5. Doble comprobación antes de insertar (prevenir race condition)
  const doubleCheck = await findAlbumInDatabase(payload.album_name, payload.artist_name, payload.mbid);
  if (doubleCheck) {
    return {
      success: true,
      album: doubleCheck,
      alreadyExists: true,
    };
  }

  // 6. Inserción a la tabla "albums"
  const { data: inserted, error: insertError } = await supabase
    .from('albums')
    .insert([payload])
    .select('*')
    .single();

  if (insertError) {
    console.error(`Error insertando "${payload.album_name}" en albums:`, insertError.message);
    return { success: false, error: insertError.message };
  }

  return {
    success: true,
    album: inserted,
    newlyCreated: true,
  };
}
