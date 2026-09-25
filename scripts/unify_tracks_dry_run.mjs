// scripts/unify_tracks_dry_run.mjs
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { getAlbumDetails, searchTracks } from '../src/services/spotifyApi.js';
import fs from 'fs';

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.REACT_APP_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

function normalizeStr(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’"“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('--- INICIANDO AUDITORÍA Y SIMULACIÓN (DRY RUN) DE UNIFICACIÓN DE TRACK IDs ---\n');

  // 1. Fetch all albums
  let allAlbums = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('albums')
      .select('id, album_name, artist_name, tracks, spotify_link, spotify_verified, mbid')
      .range(from, from + 999);
    if (error) {
      console.error('Error fetching albums:', error);
      return;
    }
    allAlbums = allAlbums.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }

  // 2. Fetch all reviews
  let allReviews = [];
  from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, album_id, reviewer_name, track_ratings, favorite_track')
      .range(from, from + 999);
    if (error) {
      console.error('Error fetching reviews:', error);
      return;
    }
    allReviews = allReviews.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }

  console.log(`Álbumes totales en BD: ${allAlbums.length}`);
  console.log(`Reseñas totales en BD: ${allReviews.length}\n`);

  const albumMap = new Map();
  allAlbums.forEach((a) => albumMap.set(a.id, a));

  // 3. Determinar qué álbumes necesitan actualizar sus tracks con Spotify
  // Un álbum necesita actualización si:
  // - Tiene spotify_link
  // - Sus tracks tienen UUIDs (MusicBrainz), o no tienen IDs de Spotify (e.g. strings o deezer/itunes),
  //   O tiene reviews con Spotify IDs que no coinciden con sus tracks actuales.
  const albumsToUpdate = [];
  const albumNewTracksMap = new Map(); // albumId -> newTracks array

  for (const alb of allAlbums) {
    const tracks = Array.isArray(alb.tracks) ? alb.tracks : [];
    const hasUuid = tracks.some((t) => t && t.id && /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(t.id));
    const hasSpotifyId = tracks.some((t) => t && (t.id || t.spotify_id) && /^[a-zA-Z0-9]{22}$/.test(t.id || t.spotify_id));
    const hasNoId = !hasUuid && !hasSpotifyId;

    // Check if any review has Spotify IDs for this album
    const albRevs = allReviews.filter((r) => r.album_id === alb.id);
    const revHasSpotifyIds = albRevs.some((r) =>
      r.track_ratings && Object.keys(r.track_ratings).some((k) => /^[a-zA-Z0-9]{22}$/.test(k))
    );

    const spMatch = (alb.spotify_link || '').match(/album\/([a-zA-Z0-9]+)/);
    const spId = spMatch ? spMatch[1] : null;

    if (spId && (hasUuid || hasNoId || (revHasSpotifyIds && !hasSpotifyId))) {
      albumsToUpdate.push({ album: alb, spotifyId: spId, reason: hasUuid ? 'has_uuids' : hasNoId ? 'no_ids' : 'rev_spotify_mismatch' });
    }
  }

  console.log(`Álbumes que requieren sincronización de tracks con Spotify: ${albumsToUpdate.length}`);

  // Fetch Spotify tracks for these albums
  let spFetchSuccess = 0;
  let spFetchFail = 0;

  for (let i = 0; i < albumsToUpdate.length; i++) {
    const { album, spotifyId, reason } = albumsToUpdate[i];
    try {
      const res = await getAlbumDetails(spotifyId);
      if (res.success && res.album?.tracks && res.album.tracks.length > 0) {
        let newTracks = res.album.tracks.map((t, idx) => ({
          id: t.id,
          name: t.name,
          duration_ms: t.duration_ms || 0,
          track_number: t.track_number || idx + 1,
        }));

        // Caso especial: Little Jesus - Disco de Oro
        // Los usuarios calificaron también 'Copa del Mundo' y 'Video Club Amores'
        if (album.id === '90c75a60-9a81-4879-864d-757c17a80755') {
          newTracks.push({
            id: '63pqKVbcr55rwQ8QZ0NyQJ',
            name: 'Copa del Mundo',
            duration_ms: 226160,
            track_number: newTracks.length + 1,
          });
          newTracks.push({
            id: '0KgiNELjv8XGVU7vnR2Mcm',
            name: 'Video Club Amores',
            duration_ms: 227000,
            track_number: newTracks.length + 1,
          });
        }

        albumNewTracksMap.set(album.id, newTracks);
        spFetchSuccess++;
      } else {
        console.warn(`[WARN] No se pudieron obtener tracks de Spotify para "${album.album_name}" (${spotifyId})`);
        spFetchFail++;
      }
    } catch (err) {
      console.warn(`[ERROR] Spotify error en "${album.album_name}": ${err.message}`);
      spFetchFail++;
    }
    await sleep(60); // rate limiting
  }

  console.log(`Tracks obtenidos de Spotify: ${spFetchSuccess} exitosos, ${spFetchFail} fallidos.\n`);

  // Caso especial: Little Jesus - Disco de Oro si ya tenía tracks de spotify
  if (!albumNewTracksMap.has('90c75a60-9a81-4879-864d-757c17a80755')) {
    const lj = albumMap.get('90c75a60-9a81-4879-864d-757c17a80755');
    if (lj && Array.isArray(lj.tracks)) {
      const existing = [...lj.tracks];
      if (!existing.some(t => t.name === 'Copa del Mundo')) {
        existing.push({
          id: '63pqKVbcr55rwQ8QZ0NyQJ',
          name: 'Copa del Mundo',
          duration_ms: 226160,
          track_number: existing.length + 1,
        });
      }
      if (!existing.some(t => t.name === 'Video Club Amores')) {
        existing.push({
          id: '0KgiNELjv8XGVU7vnR2Mcm',
          name: 'Video Club Amores',
          duration_ms: 227000,
          track_number: existing.length + 1,
        });
      }
      albumNewTracksMap.set(lj.id, existing);
    }
  }

  // 4. Ahora simular la unificación de TODAS las reviews
  // Para cada review:
  // - Obtener la lista de tracks canónicos de su álbum (si se actualizó con Spotify, o la que ya tiene)
  // - Para cada key en track_ratings:
  //     1) ¿Es ya un ID existente en canonicalTracks? -> Mantenerlo.
  //     2) ¿Es un nombre de pista? -> Buscar en canonicalTracks por nombre normalizado.
  //     3) ¿Es un UUID antiguo de MusicBrainz? -> Buscar en los tracks antiguos de MB por UUID, obtener el nombre, y luego buscar en canonicalTracks por nombre.
  //     4) ¿Es un Spotify ID que existía antes de MB? -> Ya estará en canonicalTracks de Spotify.
  // - Para favorite_track:
  //     Mismo mapeo a canonical track ID.

  const reviewUpdates = [];
  let totalKeysProcessed = 0;
  let totalKeysMatched = 0;
  let totalKeysUnmatched = 0;
  const unmatchedLog = [];

  for (const rev of allReviews) {
    if (!rev.track_ratings || typeof rev.track_ratings !== 'object' || Object.keys(rev.track_ratings).length === 0) {
      continue;
    }

    const alb = albumMap.get(rev.album_id);
    if (!alb) {
      console.warn(`[WARN] Review ${rev.id} pertenece a álbum inexistente ${rev.album_id}`);
      continue;
    }

    const canonicalTracks = albumNewTracksMap.get(alb.id) || (Array.isArray(alb.tracks) ? alb.tracks : []);
    const oldMbTracks = Array.isArray(alb.tracks) ? alb.tracks : [];

    // Mapas para búsqueda en canonicalTracks
    const idMap = new Map(); // id -> track
    const nameMap = new Map(); // normalizedName -> track
    const numberMap = new Map(); // track_number -> track

    canonicalTracks.forEach((t, idx) => {
      const tid = typeof t === 'object' ? String(t.id || t.spotify_id || '') : '';
      const tname = typeof t === 'object' ? (t.name || '') : String(t);
      const tnum = typeof t === 'object' ? (t.track_number || idx + 1) : idx + 1;

      if (tid) idMap.set(tid, t);
      if (tname) {
        nameMap.set(normalizeStr(tname), t);
      }
      numberMap.set(tnum, t);
    });

    // Mapa de tracks viejos para resolver UUIDs si alb tenía UUIDs
    const oldMbIdToTrack = new Map();
    oldMbTracks.forEach((t) => {
      if (typeof t === 'object' && t.id) {
        oldMbIdToTrack.set(String(t.id), t);
      }
    });

    const newTrackRatings = {};
    let revChanged = false;

    const resolveKeyToCanonicalId = (rawKey) => {
      const strKey = String(rawKey).trim();
      const normKey = normalizeStr(strKey);

      // 1. Direct ID match
      if (idMap.has(strKey)) {
        return strKey;
      }

      // 2. Match by exact normalized name
      if (nameMap.has(normKey)) {
        const t = nameMap.get(normKey);
        return typeof t === 'object' ? String(t.id || t.name) : t;
      }

      // 3. Match if rawKey was an old UUID (from MusicBrainz)
      if (oldMbIdToTrack.has(strKey)) {
        const oldTrack = oldMbIdToTrack.get(strKey);
        const oldName = typeof oldTrack === 'object' ? (oldTrack.name || '') : '';
        const oldNormName = normalizeStr(oldName);
        if (nameMap.has(oldNormName)) {
          const t = nameMap.get(oldNormName);
          return typeof t === 'object' ? String(t.id || t.name) : t;
        }
        // Try position match if name fails
        if (typeof oldTrack === 'object' && oldTrack.track_number && numberMap.has(oldTrack.track_number)) {
          const t = numberMap.get(oldTrack.track_number);
          return typeof t === 'object' ? String(t.id || t.name) : t;
        }
      }

      // 4. Loose / fuzzy name match
      for (const [tNorm, t] of nameMap.entries()) {
        if (tNorm.length > 2 && (tNorm.includes(normKey) || normKey.includes(tNorm))) {
          return typeof t === 'object' ? String(t.id || t.name) : t;
        }
        const base1 = tNorm.split(' - ')[0].trim();
        const base2 = normKey.split(' - ')[0].trim();
        if (base1.length > 3 && base1 === base2) {
          return typeof t === 'object' ? String(t.id || t.name) : t;
        }
      }

      // 5. Match by numeric index/position
      if (/^\d+$/.test(strKey)) {
        const num = parseInt(strKey, 10);
        if (numberMap.has(num)) {
          const t = numberMap.get(num);
          return typeof t === 'object' ? String(t.id || t.name) : t;
        }
      }

      return null;
    };

    for (const [k, v] of Object.entries(rev.track_ratings)) {
      totalKeysProcessed++;
      const resolvedId = resolveKeyToCanonicalId(k);
      if (resolvedId) {
        newTrackRatings[resolvedId] = v;
        totalKeysMatched++;
        if (resolvedId !== k) {
          revChanged = true;
        }
      } else {
        // Fallback: keep original key to avoid losing data
        newTrackRatings[k] = v;
        totalKeysUnmatched++;
        unmatchedLog.push({
          reviewId: rev.id,
          reviewer: rev.reviewer_name,
          album: alb.artist_name + ' - ' + alb.album_name,
          unmatchedKey: k,
        });
      }
    }

    // Resolve favorite_track
    let newFavoriteTrack = rev.favorite_track;
    if (rev.favorite_track) {
      const resolvedFav = resolveKeyToCanonicalId(rev.favorite_track);
      if (resolvedFav && resolvedFav !== rev.favorite_track) {
        newFavoriteTrack = resolvedFav;
        revChanged = true;
      }
    }

    if (revChanged) {
      reviewUpdates.push({
        reviewId: rev.id,
        reviewer: rev.reviewer_name,
        album: alb.artist_name + ' - ' + alb.album_name,
        track_ratings: newTrackRatings,
        favorite_track: newFavoriteTrack,
        prevFavoriteTrack: rev.favorite_track,
      });
    }
  }

  console.log('=============================================');
  console.log(`Total keys de track_ratings procesadas: ${totalKeysProcessed}`);
  console.log(`Total keys resueltas a Canonical Track ID: ${totalKeysMatched} (${((totalKeysMatched / totalKeysProcessed) * 100).toFixed(2)}%)`);
  console.log(`Total keys no resueltas: ${totalKeysUnmatched}`);
  console.log(`Reviews que serán actualizadas: ${reviewUpdates.length} de ${allReviews.filter(r => r.track_ratings && Object.keys(r.track_ratings).length > 0).length}`);

  if (unmatchedLog.length > 0) {
    console.log('\n--- DETALLE DE KEYS NO RESUELTAS ---');
    console.log(unmatchedLog);
  } else {
    console.log('\n🎉 ¡100.00% DE LAS KEYS DE TRACK RATINGS FUERON RESUELTAS PERFECTAMENTE!');
  }

  // Guardar simulación en archivo
  fs.writeFileSync(
    './scripts/dry_run_results.json',
    JSON.stringify(
      {
        albumsToUpdateCount: albumNewTracksMap.size,
        reviewUpdatesCount: reviewUpdates.length,
        totalKeysProcessed,
        totalKeysMatched,
        totalKeysUnmatched,
        sampleReviewUpdates: reviewUpdates.slice(0, 5),
      },
      null,
      2
    )
  );
  console.log('\nResultados detallados guardados en scripts/dry_run_results.json');
}

main().catch(console.error);
