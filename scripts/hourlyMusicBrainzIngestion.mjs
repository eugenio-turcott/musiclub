// scripts/hourlyMusicBrainzIngestion.mjs
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Polyfill de WebSocket para entornos Node < 22 (evita errores en @supabase/realtime-js)
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class DummyWebSocket {
    constructor() {}
    addEventListener() {}
    removeEventListener() {}
    send() {}
    close() {}
  };
}

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://nzsuxrycbywbdyidvsfl.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;

const USER_AGENT = 'MusiclubApp/2.0 ( contact@musiclub.app ; https://musiclub.app )';
const STATE_FILE = path.resolve(__dirname, 'crawler_state.json');

// ==========================================
// CONTROL DE RATE LIMITS Y CIRCUIT BREAKERS
// ==========================================

let lastMbRequestTime = 0;
const MB_MIN_INTERVAL_MS = 1200; // Respetar regla estricta de 1 req/sec de MusicBrainz

async function musicBrainzRateLimiter() {
  const now = Date.now();
  const elapsed = now - lastMbRequestTime;
  if (elapsed < MB_MIN_INTERVAL_MS) {
    await sleep(MB_MIN_INTERVAL_MS - elapsed);
  }
  lastMbRequestTime = Date.now();
}

let lastDeezerRequestTime = 0;
const DEEZER_MIN_INTERVAL_MS = 250; // Pacing preventivo de 4 req/sec max para Deezer

async function deezerRateLimiter() {
  const now = Date.now();
  const elapsed = now - lastDeezerRequestTime;
  if (elapsed < DEEZER_MIN_INTERVAL_MS) {
    await sleep(DEEZER_MIN_INTERVAL_MS - elapsed);
  }
  lastDeezerRequestTime = Date.now();
}

// Variables de caché y circuit breaker de Spotify
let spotifyToken = null;
let spotifyTokenExpiry = 0;
let spotifyDisabledUntil = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Cargar o inicializar estado de paginación
function getCrawlerState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      return {
        offset: data.offset || 0,
        total_ingested: data.total_ingested || 0,
        last_run: data.last_run || null,
        history: data.history || [],
      };
    }
  } catch (err) {
    console.warn('⚠️ No se pudo leer crawler_state.json, iniciando desde offset 0:', err.message);
  }
  return { offset: 0, total_ingested: 0, last_run: null, history: [] };
}

function saveCrawlerState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('❌ Error guardando crawler_state.json:', err.message);
  }
}

// Obtener token de Spotify (Client Credentials)
async function getSpotifyToken() {
  if (spotifyToken && Date.now() < spotifyTokenExpiry) {
    return spotifyToken;
  }
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) return null;

  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(5000), // Timeout de 5s
    });
    if (!res.ok) return null;
    const data = await res.json();
    spotifyToken = data.access_token;
    spotifyTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return spotifyToken;
  } catch (err) {
    console.error('Error obteniendo token de Spotify:', err.message);
    return null;
  }
}

// Petición a MusicBrainz con User-Agent, Timeout y Reintentos exponenciales
async function fetchMusicBrainzWithRetry(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await musicBrainzRateLimiter();
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(10000), // Timeout estricto de 10s
      });
      if (res.status === 503 || res.status === 429) {
        const delay = attempt * 2500;
        console.log(`    ⚠️ MusicBrainz throttled (${res.status}), esperando ${delay}ms... (intento ${attempt}/${maxRetries})`);
        await sleep(delay);
        continue;
      }
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      if (attempt < maxRetries) {
        await sleep(attempt * 2000);
      }
    }
  }
  return null;
}

// Buscar en Spotify: Portada 640x640, link y pistas
async function getSpotifyData(artistName, albumName) {
  if (Date.now() < spotifyDisabledUntil) return null;

  try {
    const token = await getSpotifyToken();
    if (!token) return null;

    const cleanAlb = albumName.replace(/[+]/g, '').replace(/\([^)]*\)/g, '').trim();
    const cleanArt = artistName.replace(/\([^)]*\)/g, '').trim();
    const query = `album:${cleanAlb} artist:${cleanArt}`;

    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=1`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000), // Timeout de 5s
    });

    if (!res.ok) {
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') || '60', 10);
        console.warn(`  ⚡ Spotify API 429 (Retry-After: ${retryAfter}s). Circuit breaker activado.`);
        spotifyDisabledUntil = Date.now() + Math.min(retryAfter, 86400) * 1000;
      }
      return null;
    }

    const data = await res.json();
    const item = data.albums?.items?.[0];
    if (item && item.images && item.images.length > 0) {
      let tracks = [];
      try {
        const trkRes = await fetch(`https://api.spotify.com/v1/albums/${item.id}/tracks?limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(5000),
        });
        if (trkRes.ok) {
          const trkData = await trkRes.json();
          tracks = (trkData.items || []).map((t, idx) => ({
            id: t.id || `track-${idx + 1}`,
            name: t.name,
            duration_ms: t.duration_ms || 0,
            track_number: t.track_number || idx + 1,
            disc_number: t.disc_number || 1,
          }));
        }
      } catch {}

      return {
        imageUrl: item.images[0].url,
        spotifyLink: item.external_urls?.spotify || null,
        spotifyVerified: true,
        tracks,
        totalTracks: item.total_tracks || tracks.length,
      };
    }
  } catch {}
  return null;
}

// Buscar en Deezer: Portada 1000x1000 HD, Deezer Link (other_link) y pistas
async function getDeezerData(artistName, albumName) {
  await deezerRateLimiter();
  try {
    const cleanArt = artistName.replace(/\([^)]*\)/g, '').trim();
    const cleanAlb = albumName.replace(/\([^)]*\)/g, '').trim();
    const q = encodeURIComponent(`artist:"${cleanArt}" album:"${cleanAlb}"`);
    const res = await fetch(`https://api.deezer.com/search/album?q=${q}`, {
      signal: AbortSignal.timeout(5000), // Timeout de 5s
    });
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        const item = data.data[0];
        const imageUrl = item.cover_xl || item.cover_big || item.cover_medium;
        const deezerLink = item.link || `https://www.deezer.com/album/${item.id}`;

        let tracks = [];
        try {
          await deezerRateLimiter();
          const trkRes = await fetch(`https://api.deezer.com/album/${item.id}/tracks`, {
            signal: AbortSignal.timeout(5000),
          });
          if (trkRes.ok) {
            const trkData = await trkRes.json();
            tracks = (trkData.data || []).map((t, idx) => ({
              id: String(t.id),
              name: t.title,
              duration_ms: (t.duration || 0) * 1000,
              track_number: t.track_position || idx + 1,
              disc_number: t.disk_number || 1,
            }));
          }
        } catch {}

        return {
          imageUrl,
          deezerLink,
          releaseDate: item.release_date || null,
          tracks,
          totalTracks: item.nb_tracks || tracks.length,
        };
      }
    }
  } catch {}
  return null;
}

// Buscar en iTunes como respaldo adicional de portada HD
async function getItunesData(artistName, albumName) {
  try {
    const term = encodeURIComponent(`${artistName} ${albumName}`);
    const res = await fetch(`https://itunes.apple.com/search?term=${term}&entity=album&limit=1`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const item = data.results[0];
        if (item.artworkUrl100) {
          const imageUrl = item.artworkUrl100.replace('100x100bb', '1000x1000bb');
          return {
            imageUrl,
            appleMusicLink: item.collectionViewUrl || null,
            releaseDate: item.releaseDate ? item.releaseDate.split('T')[0] : null,
          };
        }
      }
    }
  } catch {}
  return null;
}

function normalizeReleaseType(primaryType, secondaryTypes = []) {
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

function formatArtistCredit(artistCredit) {
  if (!Array.isArray(artistCredit) || artistCredit.length === 0) return 'Varios Artistas';
  let formatted = '';
  for (const ac of artistCredit) {
    if (typeof ac === 'string') {
      formatted += ac;
    } else {
      const name = ac.name || ac.artist?.name || '';
      const joinphrase = ac.joinphrase !== undefined ? ac.joinphrase : (formatted ? ', ' : '');
      formatted += name + joinphrase;
    }
  }
  return formatted.trim() || 'Varios Artistas';
}

// Obtener detalles completos de MusicBrainz (Release Group, URL Rels y Release con Tracks)
async function getDetailedMusicBrainzMetadata(mbid) {
  try {
    const rgUrl = `https://musicbrainz.org/ws/2/release-group/${mbid}?inc=artists+releases+genres+tags+url-rels&fmt=json`;
    const rgData = await fetchMusicBrainzWithRetry(rgUrl);
    if (!rgData) return null;

    // Extraer enlaces externos oficiales desde MusicBrainz url-rels
    const externalLinks = {
      spotify: null,
      appleMusic: null,
      youtube: null,
      deezer: null,
    };

    if (Array.isArray(rgData.relations)) {
      for (const rel of rgData.relations) {
        const u = rel.url?.resource || '';
        if (u.includes('spotify.com')) externalLinks.spotify = u;
        else if (u.includes('apple.com') || u.includes('itunes.apple.com')) externalLinks.appleMusic = u;
        else if (u.includes('youtube.com') || u.includes('youtu.be')) externalLinks.youtube = u;
        else if (u.includes('deezer.com')) externalLinks.deezer = u;
      }
    }

    // Extraer géneros / tags
    const genres = [
      ...(rgData.genres || []).map((g) => g.name),
      ...(rgData.tags || []).map((t) => t.name),
    ].slice(0, 6);

    // Obtener tracklist canónico y detalles de edición (barcode, país, sello)
    let tracks = [];
    let barcode = null;
    let country = null;
    let label = null;
    let totalTracks = null;

    const releases = rgData.releases || [];
    if (releases.length > 0) {
      // Priorizar lanzamiento oficial
      const bestRelease = releases.find((r) => r.status === 'Official') || releases[0];
      if (bestRelease?.id) {
        const relUrl = `https://musicbrainz.org/ws/2/release/${bestRelease.id}?inc=recordings+media+labels&fmt=json`;
        const relData = await fetchMusicBrainzWithRetry(relUrl);
        if (relData) {
          barcode = relData.barcode || null;
          country = relData.country || null;
          const labelInfo = relData['label-info']?.[0]?.label?.name;
          if (labelInfo) label = labelInfo;

          if (Array.isArray(relData.media)) {
            let globalTrackIndex = 1;
            for (const medium of relData.media) {
              const discNum = medium.position || 1;
              for (const trk of medium.tracks || []) {
                tracks.push({
                  id: trk.id || `mb-${globalTrackIndex}`,
                  name: trk.title || trk.recording?.title || `Pista ${globalTrackIndex}`,
                  duration_ms: trk.length || trk.recording?.length || 0,
                  track_number: trk.position || globalTrackIndex,
                  disc_number: discNum,
                });
                globalTrackIndex++;
              }
            }
          }
          totalTracks = tracks.length;
        }
      }
    }

    return {
      genres,
      externalLinks,
      tracks,
      barcode,
      country,
      label,
      totalTracks,
    };
  } catch (err) {
    console.warn(`    ⚠️ Error obteniendo detalles completos de MusicBrainz para ${mbid}:`, err.message);
    return null;
  }
}

/**
 * Función principal: Ingesta lanzamientos desde MusicBrainz
 * Replicando exactamente el flujo canónico con portada de Deezer/Spotify y 4 links de streaming
 */
export async function runIngestionBatch(targetCount = 50) {
  const startTime = Date.now();
  console.log(`\n========================================================`);
  console.log(`🚀 INICIANDO INGESTA AUTOMÁTICA DE ${targetCount} ÁLBUMES`);
  console.log(`🕒 Intervalo: Cada 30 minutos`);
  console.log(`🕒 Timestamp: ${new Date().toISOString()}`);
  console.log(`========================================================\n`);

  const state = getCrawlerState();
  let currentOffset = state.offset;
  console.log(`📍 Offset de inicio: ${currentOffset} (Total histórico acumulado: ${state.total_ingested} álbumes)\n`);

  const PAGE_LIMIT = 100;
  let collectedReleaseGroups = [];
  let pageOffset = currentOffset;

  // 1. Obtener candidatos de MusicBrainz
  console.log(`📥 Paso 1/3: Descargando candidatos desde catálogo oficial de MusicBrainz...`);
  while (collectedReleaseGroups.length < targetCount * 2) {
    const mbUrl = `https://musicbrainz.org/ws/2/release-group?query=status:official%20AND%20primarytype:album&limit=${PAGE_LIMIT}&offset=${pageOffset}&fmt=json`;
    console.log(`  📄 Solicitando candidatos en offset ${pageOffset}...`);
    const data = await fetchMusicBrainzWithRetry(mbUrl);
    const groups = data?.['release-groups'] || [];
    if (groups.length === 0) break;

    collectedReleaseGroups.push(...groups);
    pageOffset += PAGE_LIMIT;
    if (groups.length < PAGE_LIMIT) break;
  }

  console.log(`\n✨ Candidatos obtenidos: ${collectedReleaseGroups.length} release groups.\n`);

  // 2. Procesar cada álbum replicando el proceso canónico de Musiclub
  console.log(`🔍 Paso 2/3: Enriquecimiento canónico, portada HD preservada y enlaces de streaming...`);
  const validAlbumsToInsert = [];
  let processedCandidates = 0;

  for (const rg of collectedReleaseGroups) {
    if (validAlbumsToInsert.length >= targetCount) break;

    processedCandidates++;
    const mbid = rg.id;
    const albumName = (rg.title || 'Álbum Desconocido').trim();
    const artistName = formatArtistCredit(rg['artist-credit']).trim();

    // Comprobación previa de duplicados en Supabase para no saturar APIs innecesariamente
    try {
      const { data: existing } = await supabase
        .from('albums')
        .select('id')
        .or(`mbid.eq.${mbid},and(album_name.ilike.${JSON.stringify(albumName)},artist_name.ilike.${JSON.stringify(artistName)})`)
        .limit(1)
        .maybeSingle();

      if (existing) {
        continue; // Ya existe en el club, continuar con el siguiente
      }
    } catch {}

    // A) Obtener portada en alta definición y links de streaming de Deezer / Spotify / iTunes
    const [deezerData, spotifyData] = await Promise.all([
      getDeezerData(artistName, albumName),
      getSpotifyData(artistName, albumName),
    ]);

    // Preservar portada HD de Deezer o Spotify
    let finalCoverUrl = deezerData?.imageUrl || spotifyData?.imageUrl || null;
    if (!finalCoverUrl) {
      const itunesData = await getItunesData(artistName, albumName);
      finalCoverUrl = itunesData?.imageUrl || null;
    }

    // Si no tiene carátula en alta definición de CDN, omitir para mantener estándar visual de Musiclub
    if (!finalCoverUrl) {
      continue;
    }

    // B) Obtener metadatos completos y canónicos de MusicBrainz
    const mbDetails = await getDetailedMusicBrainzMetadata(mbid);

    // C) Pistas: canónicas de MusicBrainz, o fallback a Deezer/Spotify
    const tracks = (mbDetails?.tracks && mbDetails.tracks.length > 0)
      ? mbDetails.tracks
      : (deezerData?.tracks?.length ? deezerData.tracks : (spotifyData?.tracks || []));

    if (!tracks || tracks.length === 0) {
      continue; // No insertar álbumes sin canciones
    }

    // D) Enlaces de streaming: Spotify, Apple Music, YouTube y Deezer (other_link)
    const spotifyLink = mbDetails?.externalLinks?.spotify ||
      spotifyData?.spotifyLink ||
      `https://open.spotify.com/search/${encodeURIComponent(artistName + ' ' + albumName)}`;

    const deezerLink = mbDetails?.externalLinks?.deezer ||
      deezerData?.deezerLink ||
      `https://www.deezer.com/search/${encodeURIComponent(artistName + ' ' + albumName)}`;

    const youtubeLink = mbDetails?.externalLinks?.youtube ||
      `https://www.youtube.com/results?search_query=${encodeURIComponent(artistName + ' ' + albumName + ' full album')}`;

    const appleMusicLink = mbDetails?.externalLinks?.appleMusic ||
      `https://music.apple.com/search?term=${encodeURIComponent(artistName + ' ' + albumName)}`;

    // Fechas y géneros
    const releaseType = normalizeReleaseType(rg['primary-type'], rg['secondary-types']);
    const rawDate = rg['first-release-date'] || deezerData?.releaseDate || null;
    let releaseYear = null;
    if (rawDate) {
      const y = parseInt(String(rawDate).substring(0, 4), 10);
      if (!isNaN(y) && y >= 1900 && y <= 2100) releaseYear = y;
    }

    const genres = (mbDetails?.genres && mbDetails.genres.length > 0)
      ? mbDetails.genres
      : (rg.tags || []).map((t) => t.name).slice(0, 5);

    const albumRecord = {
      album_name: albumName.substring(0, 255),
      artist_name: artistName.substring(0, 255),
      mbid: mbid,
      release_type: releaseType,
      release_date: rawDate,
      release_year: releaseYear,
      genres: genres,
      label: mbDetails?.label || null,
      country: mbDetails?.country || null,
      barcode: mbDetails?.barcode || null,
      total_tracks: mbDetails?.totalTracks || tracks.length,
      tracks: tracks,
      image_url: finalCoverUrl, // REGLA: Portada preservada estrictamente de CDN
      spotify_link: spotifyLink,
      apple_music_link: appleMusicLink,
      youtube_link: youtubeLink,
      other_link: deezerLink, // Deezer link almacenado en other_link
      spotify_verified: true,
      reviews_enabled: true,
    };

    validAlbumsToInsert.push(albumRecord);
    console.log(`  ✅ [${validAlbumsToInsert.length}/${targetCount}] ${artistName} - ${albumName} (${tracks.length} tracks, Deezer + Spotify + MBID)`);
  }

  console.log(`\n🎵 Álbumes listos para guardar en Supabase: ${validAlbumsToInsert.length}`);

  if (validAlbumsToInsert.length === 0) {
    console.log(`⚠️ Ningún álbum nuevo para insertar en esta iteración.`);
    return;
  }

  // 3. Inserción directa en lotes en Supabase
  console.log(`\n💾 Paso 3/3: Guardando ${validAlbumsToInsert.length} álbumes en Supabase...`);
  let insertedCount = 0;
  const DB_BATCH = 25;

  for (let b = 0; b < validAlbumsToInsert.length; b += DB_BATCH) {
    const chunk = validAlbumsToInsert.slice(b, b + DB_BATCH);
    try {
      const { data, error } = await supabase
        .from('albums')
        .upsert(chunk, { onConflict: 'album_name,artist_name', ignoreDuplicates: true })
        .select('id');

      if (error) {
        console.warn(`  ⚠️ Error al guardar lote: ${error.message}`);
      } else {
        const count = data ? data.length : chunk.length;
        insertedCount += count;
        console.log(`  💾 Lote guardado exitosamente (+${count} registros)`);
      }
    } catch (err) {
      console.error(`  ❌ Excepción en lote Supabase:`, err.message);
    }
  }

  // 4. Regenerar sitemap.xml
  try {
    console.log(`\n🗺️ Actualizando sitemap.xml automáticamente para indexación en Google...`);
    const { execSync } = await import('child_process');
    execSync('node scripts/generate-sitemap.js', { stdio: 'inherit' });
    console.log(`✅ sitemap.xml regenerado e indexable de inmediato.`);
  } catch (err) {
    console.warn(`⚠️ Error regenerando sitemap.xml:`, err.message);
  }

  // 5. Actualizar estado persistente para la siguiente ejecución (cada 30 min)
  const newOffset = currentOffset + processedCandidates;
  const totalIngested = state.total_ingested + insertedCount;
  const durationSec = Math.round((Date.now() - startTime) / 1000);

  const stats = {
    run_timestamp: new Date().toISOString(),
    duration_seconds: durationSec,
    offset_start: currentOffset,
    offset_end: newOffset,
    candidates_analyzed: processedCandidates,
    inserted_or_upserted: insertedCount,
  };

  const updatedState = {
    offset: newOffset,
    total_ingested: totalIngested,
    last_run: new Date().toISOString(),
    last_stats: stats,
    history: [stats, ...(state.history || []).slice(0, 96)], // Conservar últimas 96 ejecuciones (2 días a 30m)
  };

  saveCrawlerState(updatedState);

  console.log(`\n========================================================`);
  console.log(`🎉 INGESTA COMPLETADA EXITOSAMENTE`);
  console.log(`⏱️ Tiempo total: ${durationSec} segundos`);
  console.log(`📊 Candidatos evaluados: ${processedCandidates}`);
  console.log(`✅ Nuevos álbumes guardados en la BD: ${insertedCount}`);
  console.log(`📍 Próximo offset (en 30 minutos): ${newOffset}`);
  console.log(`========================================================\n`);

  return stats;
}

// Ejecución directa si se invoca desde CLI: node scripts/hourlyMusicBrainzIngestion.mjs [count]
if (process.argv[1] && process.argv[1].endsWith('hourlyMusicBrainzIngestion.mjs')) {
  const limitArg = parseInt(process.argv[2], 10);
  const target = !isNaN(limitArg) && limitArg > 0 ? limitArg : 50;
  runIngestionBatch(target).catch(console.error);
}
