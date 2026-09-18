import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
  RECORD_CLUB_FALLBACK_RELEASES,
  RECORD_CLUB_FALLBACK_UPCOMING,
} from '../src/services/recordClubData.js';
import { slugifyArtist, slugifyRelease } from '../src/utils/ratingUtils.js';

// Cargar variables de entorno siempre de forma absoluta desde la raíz del proyecto
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.REACT_APP_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// Argumentos CLI
const isForced = process.argv.includes('--force');
const delayArg = process.argv.find((a) => a.startsWith('--delay='));
const limitAddArg = process.argv.find((a) => a.startsWith('--limit-add='));

// Por defecto 60 segundos (1 minuto) de espera por álbum agregado para proteger contra rate-limits de Spotify
const ALBUM_DELAY_MS = delayArg ? parseInt(delayArg.split('=')[1], 10) : 60000;
const MAX_ALBUMS_TO_ADD = limitAddArg ? parseInt(limitAddArg.split('=')[1], 10) : Infinity;

const USER_AGENT = 'MusiclubApp/9.0 ( contact@musiclub.app ; https://musiclub.app )';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =========================================================================
// SPOTIFY TOKEN & CLIENTE
// =========================================================================
let spotifyToken = null;
let spotifyTokenExpiry = 0;

async function getSpotifyToken() {
  if (spotifyToken && Date.now() < spotifyTokenExpiry) {
    return spotifyToken;
  }
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    return null;
  }
  try {
    const creds = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    spotifyToken = data.access_token;
    spotifyTokenExpiry = Date.now() + (data.expires_in - 120) * 1000;
    return spotifyToken;
  } catch (err) {
    console.warn(`  ⚠️ Error al renovar token de Spotify: ${err.message}`);
    return null;
  }
}

// Buscar álbum en Spotify y obtener su información oficial con portadas HD y tracklist
async function fetchSpotifyAlbumDetails(artistName, albumName) {
  const token = await getSpotifyToken();
  if (!token) return null;

  try {
    const cleanArt = artistName.replace(/\([^)]*\)/g, '').replace(/[“”"']/g, '').trim();
    const cleanAlb = albumName.replace(/\([^)]*\)/g, '').replace(/[“”"']/g, '').trim();

    // 1. Búsqueda de álbum
    const query = `artist:${cleanArt} album:${cleanAlb}`;
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=3`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!searchRes.ok) return null;
    const searchJson = await searchRes.json();
    const items = searchJson.albums?.items || [];
    if (items.length === 0) return null;

    const matchedAlbum = items[0];

    // 2. Obtener detalles completos (tracklist oficial con duraciones)
    const detailUrl = `https://api.spotify.com/v1/albums/${matchedAlbum.id}`;
    const detailRes = await fetch(detailUrl, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!detailRes.ok) {
      // Fallback a los datos básicos del resultado de búsqueda
      return {
        id: matchedAlbum.id,
        name: matchedAlbum.name,
        image_url: matchedAlbum.images?.[0]?.url || null,
        spotify_url: matchedAlbum.external_urls?.spotify || null,
        release_date: matchedAlbum.release_date || null,
        total_tracks: matchedAlbum.total_tracks || null,
        tracks: [],
      };
    }

    const fullAlbum = await detailRes.json();
    const tracks = (fullAlbum.tracks?.items || []).map((t, idx) => ({
      id: t.id || `sp-${idx + 1}`,
      name: t.name,
      duration_ms: t.duration_ms || 0,
      track_number: t.track_number || idx + 1,
      disc_number: t.disc_number || 1,
    }));

    return {
      id: fullAlbum.id,
      name: fullAlbum.name,
      image_url: fullAlbum.images?.[0]?.url || null,
      spotify_url: fullAlbum.external_urls?.spotify || null,
      release_date: fullAlbum.release_date || null,
      total_tracks: fullAlbum.total_tracks || tracks.length,
      label: fullAlbum.label || null,
      genres: fullAlbum.genres || [],
      tracks,
    };
  } catch (err) {
    console.warn(`  ⚠️ Búsqueda en Spotify omitida para "${albumName}": ${err.message}`);
    return null;
  }
}

// Deezer fallback
async function fetchDeezerAlbumDetails(artistName, albumName) {
  try {
    const cleanArt = artistName.replace(/\([^)]*\)/g, '').trim();
    const cleanAlb = albumName.replace(/\([^)]*\)/g, '').trim();
    const q = encodeURIComponent(`artist:"${cleanArt}" album:"${cleanAlb}"`);
    const res = await fetch(`https://api.deezer.com/search/album?q=${q}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.data || json.data.length === 0) return null;

    const deezerAlbum = json.data[0];
    const albumRes = await fetch(`https://api.deezer.com/album/${deezerAlbum.id}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!albumRes.ok) return null;
    const fullDeezer = await albumRes.json();

    const tracks = (fullDeezer.tracks?.data || []).map((t, idx) => ({
      id: `dz-${t.id || idx + 1}`,
      name: t.title,
      duration_ms: (t.duration || 0) * 1000,
      track_number: t.track_position || idx + 1,
      disc_number: t.disk_number || 1,
    }));

    return {
      name: fullDeezer.title,
      image_url: fullDeezer.cover_xl || fullDeezer.cover_big || fullDeezer.cover_medium,
      deezer_url: fullDeezer.link,
      release_date: fullDeezer.release_date || null,
      total_tracks: fullDeezer.nb_tracks || tracks.length,
      label: fullDeezer.label || null,
      genres: fullDeezer.genres?.data?.map((g) => g.name) || [],
      tracks,
    };
  } catch {
    return null;
  }
}

// MusicBrainz fallback para MBID y metadata canónica
async function fetchMusicBrainzDetails(artistName, albumName) {
  try {
    const cleanArt = artistName.replace(/\([^)]*\)/g, '').replace(/[“”"']/g, '').trim();
    const cleanAlb = albumName.replace(/\([^)]*\)/g, '').replace(/[“”"']/g, '').trim();
    const q = `artist:"${cleanArt}" AND releasegroup:"${cleanAlb}"`;
    const url = `https://musicbrainz.org/ws/2/release-group?query=${encodeURIComponent(q)}&limit=1&fmt=json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rg = data['release-groups']?.[0];
    if (!rg) return null;

    return {
      mbid: rg.id || null,
      primaryType: rg['primary-type'] || 'Album',
      tags: rg.tags?.map((t) => t.name) || [],
    };
  } catch {
    return null;
  }
}

// Normalización de llaves para deduplicación estricta
function normalizeKey(artist, album) {
  const a = (artist || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const b = (album || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${a}:::${b}`;
}

// =========================================================================
// SYNC STATE
// =========================================================================
async function checkSyncState(syncType, todayDate) {
  try {
    const { data, error } = await supabase
      .from('record_club_sync_state')
      .select('*')
      .eq('sync_type', syncType)
      .maybeSingle();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

async function updateSyncState(syncType, todayDate, itemsCount, status = 'OK') {
  try {
    await supabase.from('record_club_sync_state').upsert(
      {
        sync_type: syncType,
        last_synced_at: new Date().toISOString(),
        last_synced_date: todayDate,
        items_count: itemsCount,
        status: status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'sync_type' }
    );
  } catch (err) {
    console.warn(`  ⚠️ No se pudo actualizar record_club_sync_state (${syncType}):`, err.message);
  }
}

// =========================================================================
// 1. CONSULTAS PARALELAS A LAS APIS EXTERNAS
// =========================================================================
async function fetchTrendingReleases() {
  console.log('📡 [1/3] Consultando https://api.record.club/releases?sortBy=popularity-week&limit=100 ...');
  const res = await fetch('https://api.record.club/releases?sortBy=popularity-week&limit=100', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success || !Array.isArray(json.data)) throw new Error('Respuesta inválida de releases');
  return json.data;
}

async function fetchUpcomingReleases() {
  console.log('📡 [2/3] Consultando https://api.record.club/releases?releaseDate=upcoming&sortBy=popularity&limit=50 ...');
  const res = await fetch('https://api.record.club/releases?releaseDate=upcoming&sortBy=popularity&limit=50', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success || !Array.isArray(json.data)) throw new Error('Respuesta inválida de upcoming');
  return json.data;
}

async function fetchPlatformStats() {
  console.log('📡 [3/3] Consultando https://api.record.club/stats ...');
  const res = await fetch('https://api.record.club/stats', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success || !json.data) throw new Error('Respuesta inválida de stats');
  return json.data;
}

// =========================================================================
// 2. PROCESAMIENTO Y ACTUALIZACIÓN DE ESTADÍSTICAS GLOBALES
// =========================================================================
async function processStats(statsData, todayDate) {
  console.log('\n--- 📊 ESTADÍSTICAS GLOBALES ---');
  if (!statsData) {
    console.log('⚠️ No se obtuvieron estadísticas en esta ejecución.');
    return;
  }

  console.log('  Artistas:', statsData.artists?.toLocaleString());
  console.log('  Lanzamientos:', statsData.releases?.toLocaleString());
  console.log('  Sellos:', statsData.labels?.toLocaleString());
  console.log('  Reseñas:', statsData.reviews?.toLocaleString());
  console.log('  Listas:', statsData.lists?.toLocaleString());
  console.log('  Usuarios:', statsData.users?.toLocaleString());

  try {
    const { error: statsErr } = await supabase.from('record_club_stats').upsert(
      {
        id: 'current_stats',
        artists: statsData.artists || 0,
        releases: statsData.releases || 0,
        labels: statsData.labels || 0,
        reviews: statsData.reviews || 0,
        lists: statsData.lists || 0,
        users: statsData.users || 0,
        raw_data: statsData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (statsErr) {
      if (statsErr.message.includes('schema cache') || statsErr.code === 'PGRST205') {
        console.warn('  ⚠️ Aviso: La tabla record_club_stats aún no existe en Supabase.');
        console.warn('     Ejecuta el script SQL supabase_create_record_club_stats.sql en el panel de Supabase.');
      } else {
        console.warn('  ⚠️ Error al guardar estadísticas en Supabase:', statsErr.message);
      }
    } else {
      console.log('  💾 Estadísticas globales guardadas exitosamente en record_club_stats.');
    }
  } catch (err) {
    console.warn('  ⚠️ Excepción al almacenar stats:', err.message);
  }

  await updateSyncState('global_stats', todayDate, statsData.releases || 1);
}

// =========================================================================
// 3. SINCRONIZACIÓN DE TENDENCIAS Y UPCOMING (Deduplicación & Upsert)
// =========================================================================
async function processTrending(apiReleases, todayDate) {
  console.log('\n--- 🔥 TENDENCIAS SEMANALES (100 Lanzamientos) ---');
  let itemsToSave = [];

  const fallbackMap = new Map();
  RECORD_CLUB_FALLBACK_RELEASES.forEach((r) => {
    fallbackMap.set(r.album_name.toLowerCase(), r);
    if (r.id) fallbackMap.set(r.id, r);
  });

  // Consultar álbumes existentes en Supabase para obtener el total_tracks real validado
  const albumTracksMap = new Map();
  try {
    const { data: dbAlbums } = await supabase
      .from('albums')
      .select('album_name, artist_name, total_tracks, tracks');
    if (dbAlbums && Array.isArray(dbAlbums)) {
      dbAlbums.forEach((a) => {
        const key = normalizeKey(a.artist_name, a.album_name);
        const count = a.total_tracks || (Array.isArray(a.tracks) ? a.tracks.length : null);
        if (count) albumTracksMap.set(key, count);
      });
    }
  } catch (err) {
    console.warn('  ⚠️ No se pudo pre-cargar catálogo de albums para track count:', err.message);
  }

  if (apiReleases && apiReleases.length > 0) {
    itemsToSave = apiReleases.map((r, index) => {
      const artist = r.artists?.map((a) => a.name).join(' & ') || 'Varios Artistas';
      const title = r.title;
      const matched = fallbackMap.get(title.toLowerCase()) || fallbackMap.get(r.id);
      const pop = r.popularityByWeek?.popularity || r.popularity?.popularity || (450 - index * 4);
      const pos = r.popularityByWeek?.position || index + 1;

      const normKey = normalizeKey(artist, title);
      const realTracksFromClub = albumTracksMap.get(normKey);

      const artworkUrl = r.artwork?.releaseVersionId
        ? `https://cdn.rcrd.club/releases/${r.id}/${r.artwork.releaseVersionId}.webp?v=${r.artwork.artworkVersionId || ''}&width=500`
        : matched?.image_url || `https://cdn.rcrd.club/releases/${r.id}.webp?width=500`;

      const relDate = r.releaseDate
        ? `${r.releaseDate.year}-${String((r.releaseDate.month ?? 0) + 1).padStart(2, '0')}-${String(r.releaseDate.day || 1).padStart(2, '0')}`
        : matched?.release_date || '2026-09-01';

      const isNew = r.id === '05golqe1nj9l1j23' || (r.releaseDate?.year === 2026 && r.releaseDate?.month >= 8);

      const realTracks =
        realTracksFromClub ||
        matched?.total_tracks ||
        (r.type === 2 ? 1 : r.type === 3 ? 5 : null);

      return {
        id: r.id || `rc_${index + 1}`,
        album_name: title,
        artist_name: artist,
        image_url: artworkUrl,
        release_date: relDate,
        release_type: r.type === 2 ? 'SENCILLO' : r.type === 3 ? 'EP' : 'ALBUM',
        total_tracks: realTracks,
        trending_rank: pos,
        popularity_raw: pop,
        popularity_this_week: `${pop.toLocaleString()} pts`,
        genre_category: matched?.genre_category || 'POP / ALTERNATIVE',
        badge:
          pos === 1
            ? '🔥 #1 Popularity This Week'
            : pos <= 3
              ? 'Top 3 Global'
              : isNew
                ? 'NEW'
                : 'Tendencia Semanal',
        hit_track: matched?.hit_track || title,
        record_club_url: `https://record.club${r.uri || ''}`,
        is_new: isNew,
        slug: slugifyRelease(artist, title),
        artist_slug: slugifyArtist(artist),
        updated_at: new Date().toISOString(),
      };
    });
  } else {
    itemsToSave = RECORD_CLUB_FALLBACK_RELEASES;
  }

  // Guardar en tabla record_club_releases
  console.log(`  💾 Almacenando ${itemsToSave.length} registros en [record_club_releases]...`);
  const chunkSize = 25;
  for (let i = 0; i < itemsToSave.length; i += chunkSize) {
    const chunk = itemsToSave.slice(i, i + chunkSize);
    const { error: upsertErr } = await supabase
      .from('record_club_releases')
      .upsert(chunk, { onConflict: 'id' });

    if (upsertErr) {
      console.error(`  ❌ Error en lote de tendencias: ${upsertErr.message}`);
      return itemsToSave;
    }
  }

  // Limpieza estricta: Eliminar de record_club_releases cualquier lanzamiento que ya no esté en el Top 100 actual
  try {
    const { data: existingRows } = await supabase.from('record_club_releases').select('id');
    if (existingRows && existingRows.length > 0) {
      const currentSet = new Set(itemsToSave.map((x) => x.id));
      const idsToDelete = existingRows.map((r) => r.id).filter((id) => !currentSet.has(id));
      if (idsToDelete.length > 0) {
        console.log(`  🗑️ Eliminando ${idsToDelete.length} releases que salieron del Top 100 de Record Club...`);
        const delChunkSize = 50;
        for (let j = 0; j < idsToDelete.length; j += delChunkSize) {
          const toDel = idsToDelete.slice(j, j + delChunkSize);
          await supabase.from('record_club_releases').delete().in('id', toDel);
        }
        console.log(`  ✅ Base de datos sincronizada: quedan exactamente los ${itemsToSave.length} del Top 100.`);
      }
    }
  } catch (cleanErr) {
    console.warn('  ⚠️ Nota en depuración de releases obsoletos:', cleanErr.message);
  }

  await updateSyncState('weekly_trending', todayDate, itemsToSave.length);
  console.log(`  🎉 [weekly_trending] Sincronización exitosa (${itemsToSave.length} álbumes en Supabase).`);
  return itemsToSave;
}

async function processUpcoming(apiUpcoming, todayDate) {
  console.log('\n--- ⏳ PRÓXIMOS LANZAMIENTOS (50 Lanzamientos) ---');
  let upcomingList = [];

  if (apiUpcoming && apiUpcoming.length > 0) {
    upcomingList = apiUpcoming.map((item, index) => {
      const artist = item.artists?.map((a) => a.name).join(' & ') || 'Varios Artistas';
      const title = item.title;
      const artworkUrl = item.artwork?.releaseVersionId
        ? `https://cdn.rcrd.club/releases/${item.id}/${item.artwork.releaseVersionId}.webp?v=${item.artwork.artworkVersionId || ''}&width=500`
        : `https://cdn.rcrd.club/releases/${item.id}.webp?width=500`;

      const relDate = item.releaseDate
        ? `${item.releaseDate.year}-${String((item.releaseDate.month ?? 0) + 1).padStart(2, '0')}-${String(item.releaseDate.day || 1).padStart(2, '0')}`
        : '2026-10-01';

      return {
        id: item.id || `upc_${index + 1}`,
        album_name: title,
        artist_name: artist,
        image_url: artworkUrl,
        release_date: relDate,
        release_type: item.type === 2 ? 'SENCILLO' : item.type === 3 ? 'EP' : 'ALBUM',
        total_tracks: item.type === 2 ? 1 : item.type === 3 ? 5 : null,
        popularity_rank: index + 1,
        popularity_raw: item.popularity?.popularity || 50,
        genre: 'POP / ALTERNATIVE',
        description: 'Lanzamiento anunciado oficialmente.',
        record_club_url: `https://record.club${item.uri || ''}`,
        slug: slugifyRelease(artist, title),
        artist_slug: slugifyArtist(artist),
        can_rate: false,
        is_anticipated: true,
        updated_at: new Date().toISOString(),
      };
    });
  } else {
    upcomingList = RECORD_CLUB_FALLBACK_UPCOMING;
  }

  // Guardar en tabla record_club_upcoming
  console.log(`  💾 Almacenando ${upcomingList.length} registros en [record_club_upcoming]...`);
  const chunkSize = 25;
  for (let i = 0; i < upcomingList.length; i += chunkSize) {
    const chunk = upcomingList.slice(i, i + chunkSize);
    const { error: upsertErr } = await supabase
      .from('record_club_upcoming')
      .upsert(chunk, { onConflict: 'id' });

    if (upsertErr) {
      console.error(`  ❌ Error en lote de próximos releases: ${upsertErr.message}`);
      return upcomingList;
    }
  }

  // Limpieza estricta: Eliminar de record_club_upcoming cualquier lanzamiento que ya no esté en los 50 actuales
  try {
    const { data: existingUpcRows } = await supabase.from('record_club_upcoming').select('id');
    if (existingUpcRows && existingUpcRows.length > 0) {
      const currentUpcSet = new Set(upcomingList.map((x) => x.id));
      const idsToDelete = existingUpcRows.map((r) => r.id).filter((id) => !currentUpcSet.has(id));
      if (idsToDelete.length > 0) {
        console.log(`  🗑️ Eliminando ${idsToDelete.length} upcoming releases no vigentes de Supabase...`);
        const delChunkSize = 50;
        for (let j = 0; j < idsToDelete.length; j += delChunkSize) {
          const toDel = idsToDelete.slice(j, j + delChunkSize);
          await supabase.from('record_club_upcoming').delete().in('id', toDel);
        }
        console.log(`  ✅ Base de datos de upcoming sincronizada: quedan exactamente los ${upcomingList.length} lanzamientos.`);
      }
    }
  } catch (cleanUpcErr) {
    console.warn('  ⚠️ Nota en depuración de upcoming obsoletos:', cleanUpcErr.message);
  }

  await updateSyncState('upcoming', todayDate, upcomingList.length);
  console.log(`  🎉 [upcoming] Sincronización exitosa (${upcomingList.length} lanzamientos en Supabase).`);
  return upcomingList;
}


// =========================================================================
// 4. VERIFICACIÓN Y CORRECCIÓN DE ENLACES EN ÁLBUMES EXISTENTES
// =========================================================================
async function backfillMissingLinks(existingAlbums) {
  const missing = existingAlbums.filter((a) => !a.youtube_link || !a.apple_music_link);
  if (missing.length === 0) return;

  console.log(`\n🔗 Verificando y corrigiendo enlaces en ${missing.length} álbumes existentes...`);
  for (const alb of missing) {
    const searchParam = encodeURIComponent(`${alb.artist_name || ''} ${alb.album_name || ''}`);
    const updates = {};
    if (!alb.youtube_link) {
      updates.youtube_link = `https://music.youtube.com/search?q=${searchParam}`;
    }
    if (!alb.apple_music_link) {
      updates.apple_music_link = `https://music.apple.com/search?term=${searchParam}`;
    }
    const { error } = await supabase.from('albums').update(updates).eq('id', alb.id);
    if (!error) {
      console.log(`  ✅ Enlaces completados para: ${alb.artist_name} - ${alb.album_name}`);
    }
  }
}

// =========================================================================
// 5. ENRIQUECIMIENTO CON SPOTIFY Y AGREGADO A LA TABLA "ALBUMS"
// =========================================================================
async function enrichAndAddAlbums(trendingItems) {
  console.log('\n--- 💿 ENRIQUECIMIENTO E INGESTA AL CATÁLOGO GENERAL (Tabla: albums) ---');

  // 1. Obtener todos los álbumes actuales de la base de datos
  const { data: dbAlbums, error: albErr } = await supabase
    .from('albums')
    .select('id, album_name, artist_name, youtube_link, apple_music_link, spotify_link, other_link');

  if (albErr) {
    console.error('❌ Error al consultar la tabla albums:', albErr.message);
    return;
  }

  const existingAlbums = dbAlbums || [];
  console.log(`  📦 Total de álbumes actuales en catálogo: ${existingAlbums.length}`);

  // Auto-completar enlaces faltantes si existen
  await backfillMissingLinks(existingAlbums);

  // Set para deduplicación instantánea
  const existingKeySet = new Set(
    existingAlbums.map((a) => normalizeKey(a.artist_name, a.album_name))
  );

  // Unificar candidatos ÚNICAMENTE desde tendencias (los upcoming NO se agregan a albums hasta que salgan oficialmente)
  const candidateMap = new Map();
  (trendingItems || []).forEach((item) => {
    const key = normalizeKey(item.artist_name, item.album_name);
    if (!existingKeySet.has(key) && !candidateMap.has(key)) {
      candidateMap.set(key, item);
    }
  });

  const candidates = Array.from(candidateMap.values());
  console.log(`  🎯 Nuevos lanzamientos detectados para agregar a [albums]: ${candidates.length}`);

  if (candidates.length === 0) {
    console.log('  ✨ El catálogo general ya está 100% al día. No se requieren llamadas adicionales a las APIs.');
    return;
  }

  const itemsToProcess = candidates.slice(0, MAX_ALBUMS_TO_ADD);
  console.log(`  ⚙️ Procesando ${itemsToProcess.length} de ${candidates.length} nuevos álbumes en esta corrida.`);
  console.log(`  ⏳ Regla preventiva anti rate-limit de Spotify: esperando ${ALBUM_DELAY_MS / 1000}s entre cada álbum agregado.\n`);

  let addedCount = 0;

  for (let i = 0; i < itemsToProcess.length; i++) {
    const item = itemsToProcess[i];
    const isUpcoming = !!item.is_anticipated;
    console.log(`[${i + 1}/${itemsToProcess.length}] Enriqueciendo: "${item.album_name}" de ${item.artist_name}...`);

    // 1. Consultar Spotify de forma oficial (imágenes HD + tracklist)
    const spotifyData = await fetchSpotifyAlbumDetails(item.artist_name, item.album_name);

    // 2. Consultar Deezer si Spotify no devolvió tracklist o para enlace de Deezer
    let deezerData = null;
    if (!spotifyData || !spotifyData.tracks || spotifyData.tracks.length === 0) {
      deezerData = await fetchDeezerAlbumDetails(item.artist_name, item.album_name);
    }

    // 3. Consultar MusicBrainz para MBID y metadata de género
    const mbData = await fetchMusicBrainzDetails(item.artist_name, item.album_name);

    // Construir datos canónicos consolidados
    const cleanArtist = item.artist_name;
    const cleanAlbum = item.album_name;
    const searchParam = encodeURIComponent(`${cleanArtist} ${cleanAlbum}`);

    // Portada oficial: Spotify HD > Deezer HD > Imagen de plataforma
    const finalImageUrl =
      spotifyData?.image_url ||
      deezerData?.image_url ||
      item.image_url;

    // Tracklist oficial
    const finalTracks =
      spotifyData?.tracks && spotifyData.tracks.length > 0
        ? spotifyData.tracks
        : deezerData?.tracks && deezerData.tracks.length > 0
          ? deezerData.tracks
          : [];

    // Enlaces a las 4 plataformas
    const spotifyLink = spotifyData?.spotify_url || item.spotify_url || null;
    const youtubeLink = `https://music.youtube.com/search?q=${searchParam}`;
    const appleMusicLink = `https://music.apple.com/search?term=${searchParam}`;
    const otherLink = deezerData?.deezer_url || `https://www.deezer.com/search/${searchParam}`;

    const relDate = spotifyData?.release_date || deezerData?.release_date || item.release_date || null;
    const relYear = relDate ? parseInt(relDate.slice(0, 4), 10) : new Date().getFullYear();

    const genresList = [
      ...(spotifyData?.genres || []),
      ...(deezerData?.genres || []),
      ...(mbData?.tags || []),
    ].filter(Boolean);

    const newAlbumPayload = {
      album_name: cleanAlbum,
      artist_name: cleanArtist,
      image_url: finalImageUrl,
      spotify_link: spotifyLink,
      youtube_link: youtubeLink,
      apple_music_link: appleMusicLink,
      other_link: otherLink,
      tracks: finalTracks,
      spotify_verified: !!spotifyData,
      reviews_enabled: !isUpcoming,
      release_date: relDate,
      release_year: relYear,
      mbid: mbData?.mbid || null,
      release_type: item.release_type || 'ALBUM',
      genres: genresList.length > 0 ? Array.from(new Set(genresList)) : ['POP', 'ALTERNATIVE'],
      label: spotifyData?.label || deezerData?.label || null,
      total_tracks: finalTracks.length || spotifyData?.total_tracks || item.total_tracks || 12,
    };

    const { data: inserted, error: insertErr } = await supabase
      .from('albums')
      .insert([newAlbumPayload])
      .select('id, album_name')
      .single();

    if (insertErr) {
      console.error(`  ❌ Error al insertar "${cleanAlbum}" en albums:`, insertErr.message);
    } else {
      addedCount++;
      existingKeySet.add(normalizeKey(cleanArtist, cleanAlbum));
      console.log(`  ✅ [${addedCount}] Agregado con éxito a Supabase (ID: ${inserted.id}):`);
      console.log(`     - Portada: ${finalImageUrl ? 'HD Oficial' : 'Sin imagen'}`);
      console.log(`     - Tracks: ${finalTracks.length} canciones con duración`);
      console.log(`     - Spotify: ${spotifyLink ? 'Sí' : 'No'}`);
      console.log(`     - YouTube Music: ${youtubeLink}`);
      console.log(`     - Apple Music: ${appleMusicLink}`);
      console.log(`     - Deezer: ${otherLink}`);
    }

    // Esperar 1 minuto (60s) antes del siguiente álbum para cumplir la política de Spotify
    if (i < itemsToProcess.length - 1) {
      console.log(`  ⏳ Pausando ${ALBUM_DELAY_MS / 1000}s para respetar el límite de peticiones de Spotify...`);
      await sleep(ALBUM_DELAY_MS);
    }
  }

  console.log(`\n🎉 Ingesta al catálogo finalizada: ${addedCount} nuevos álbumes agregados y enriquecidos.`);
}

// =========================================================================
// FUNCIÓN PRINCIPAL
// =========================================================================
async function main() {
  const todayDate = new Date().toISOString().split('T')[0];
  console.log(`========================================================`);
  console.log(`🔄 MUSICLUB V.9.0 - SINCRONIZADOR DIARIO GLOBAL`);
  console.log(`📅 Fecha de ejecución: ${todayDate}`);
  console.log(`⚙️ Modo forzado: ${isForced ? 'SÍ (--force)' : 'NO (Idempotente diario)'}`);
  console.log(`⏱️ Intervalo Spotify: ${ALBUM_DELAY_MS / 1000}s por álbum agregado`);
  console.log(`========================================================\n`);

  // 1. Ejecutar consultas paralelas a las 3 APIs
  console.log('⚡ Iniciando consultas paralelas a las APIs...');
  const [trendingSettled, upcomingSettled, statsSettled] = await Promise.allSettled([
    fetchTrendingReleases(),
    fetchUpcomingReleases(),
    fetchPlatformStats(),
  ]);

  const trendingData = trendingSettled.status === 'fulfilled' ? trendingSettled.value : null;
  const upcomingData = upcomingSettled.status === 'fulfilled' ? upcomingSettled.value : null;
  const statsData = statsSettled.status === 'fulfilled' ? statsSettled.value : null;

  if (trendingSettled.status === 'rejected') {
    console.warn(`⚠️ Error al consultar tendencias API: ${trendingSettled.reason?.message}`);
  }
  if (upcomingSettled.status === 'rejected') {
    console.warn(`⚠️ Error al consultar upcoming API: ${upcomingSettled.reason?.message}`);
  }
  if (statsSettled.status === 'rejected') {
    console.warn(`⚠️ Error al consultar stats API: ${statsSettled.reason?.message}`);
  }

  // 2. Procesar y guardar estadísticas globales
  await processStats(statsData, todayDate);

  // 3. Procesar y guardar tendencias (100) y upcoming (50)
  const savedTrending = await processTrending(trendingData, todayDate);
  const savedUpcoming = await processUpcoming(upcomingData, todayDate);

  // 4. Enriquecer con Spotify y agregar al catálogo general (albums)
  await enrichAndAddAlbums(savedTrending);

  console.log(`\n========================================================`);
  console.log(`✨ Sincronización diaria Musiclub V.9.0 completada exitosamente.`);
  console.log(`========================================================\n`);
}

main().catch((err) => {
  console.error('Fatal error en sincronización diaria:', err);
  process.exit(1);
});
