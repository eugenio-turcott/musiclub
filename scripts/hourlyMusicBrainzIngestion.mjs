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
      signal: AbortSignal.timeout(5000),
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

// Buscar portada oficial y link en Spotify (con Circuit Breaker inteligente)
async function getSpotifyCoverAndLink(artistName, albumName) {
  if (Date.now() < spotifyDisabledUntil) {
    return null;
  }

  try {
    const token = await getSpotifyToken();
    if (!token) return null;

    const cleanAlb = albumName.replace(/[+]/g, '').replace(/\([^)]*\)/g, '').trim();
    const cleanArt = artistName.replace(/\([^)]*\)/g, '').trim();
    const query = `album:${cleanAlb} artist:${cleanArt}`;

    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=1`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') || '60', 10);
        console.warn(`  ⚡ Spotify API Cuota/Rate-Limit detectado (429 - Retry-After: ${retryAfter}s). Activando fallback inmediato a Deezer/iTunes/CAA sin esperas.`);
        // Activar circuit breaker: deshabilitar llamadas a Spotify durante el cooldown o por el resto del lote
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
          signal: AbortSignal.timeout(4000),
        });
        if (trkRes.ok) {
          const trkData = await trkRes.json();
          tracks = (trkData.items || []).map((t, idx) => ({
            id: t.id || `track-${idx + 1}`,
            name: t.name,
            duration_ms: t.duration_ms || 0,
            track_number: t.track_number || idx + 1,
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
  } catch {
    // Si falla silenciosamente por timeout u otro error de red, continuar
  }
  return null;
}

// Resolver portada en alta definición mediante cascada de fuentes (Spotify -> Deezer -> iTunes -> CAA)
async function resolveAlbumArtworkAndLinks(artistName, albumName, mbid) {
  // 1. Intentar Spotify primero (si no está bloqueado por cuota)
  const spData = await getSpotifyCoverAndLink(artistName, albumName);
  if (spData?.imageUrl) {
    return {
      imageUrl: spData.imageUrl,
      spotifyLink: spData.spotifyLink,
      spotifyVerified: spData.spotifyVerified,
      releaseDate: null,
      releaseYear: null,
      tracks: spData.tracks || [],
      totalTracks: spData.totalTracks || spData.tracks?.length || null,
    };
  }

  const fallbackSpotifyLink = `https://open.spotify.com/search/${encodeURIComponent(artistName + ' ' + albumName)}`;

  // 2. Intentar Deezer (1000x1000 HD, sin API key, ultra rápido y sin rate limits agresivos)
  try {
    const cleanArt = artistName.replace(/\([^)]*\)/g, '').trim();
    const cleanAlb = albumName.replace(/\([^)]*\)/g, '').trim();
    const q = encodeURIComponent(`artist:"${cleanArt}" album:"${cleanAlb}"`);
    const res = await fetch(`https://api.deezer.com/search/album?q=${q}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        const item = data.data[0];
        const imageUrl = item.cover_xl || item.cover_big || item.cover_medium;
        if (imageUrl) {
          const rawYear = item.release_date ? parseInt(item.release_date.substring(0, 4), 10) : null;
          const releaseYear = !isNaN(rawYear) && rawYear >= 1900 && rawYear <= 2100 ? rawYear : null;

          let tracks = [];
          try {
            const trkRes = await fetch(`https://api.deezer.com/album/${item.id}/tracks`, {
              signal: AbortSignal.timeout(4000),
            });
            if (trkRes.ok) {
              const trkData = await trkRes.json();
              tracks = (trkData.data || []).map((t, idx) => ({
                id: String(t.id),
                name: t.title,
                duration_ms: (t.duration || 0) * 1000,
                track_number: t.track_position || idx + 1,
              }));
            }
          } catch {}

          return {
            imageUrl,
            spotifyLink: fallbackSpotifyLink,
            spotifyVerified: false,
            releaseDate: item.release_date || null,
            releaseYear,
            tracks,
            totalTracks: item.nb_tracks || tracks.length,
          };
        }
      }
    }
  } catch {}

  // 3. Intentar iTunes / Apple Music (1000x1000 HD, sin API key)
  try {
    const term = encodeURIComponent(`${artistName} ${albumName}`);
    const res = await fetch(`https://itunes.apple.com/search?term=${term}&entity=album&limit=1`, {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const item = data.results[0];
        if (item.artworkUrl100) {
          const rawYear = item.releaseDate ? parseInt(item.releaseDate.substring(0, 4), 10) : null;
          const releaseYear = !isNaN(rawYear) && rawYear >= 1900 && rawYear <= 2100 ? rawYear : null;

          let tracks = [];
          try {
            const lkRes = await fetch(`https://itunes.apple.com/lookup?id=${item.collectionId}&entity=song`, {
              signal: AbortSignal.timeout(4000),
            });
            if (lkRes.ok) {
              const lkData = await lkRes.json();
              tracks = (lkData.results || [])
                .filter((r) => r.wrapperType === 'track')
                .map((song, idx) => ({
                  id: String(song.trackId || idx + 1),
                  name: song.trackName,
                  duration_ms: song.trackTimeMillis || 0,
                  track_number: song.trackNumber || idx + 1,
                }));
            }
          } catch {}

          return {
            imageUrl: item.artworkUrl100.replace('100x100bb', '1000x1000bb'),
            spotifyLink: fallbackSpotifyLink,
            spotifyVerified: false,
            releaseDate: item.releaseDate ? item.releaseDate.split('T')[0] : null,
            releaseYear,
            tracks,
            totalTracks: item.trackCount || tracks.length,
          };
        }
      }
    }
  } catch {}

  // 4. Fallback a Cover Art Archive de MusicBrainz (verificar que exista para no guardar enlaces 404 rotos)
  if (mbid) {
    try {
      const caaUrl = `https://coverartarchive.org/release-group/${mbid}/front-500`;
      const caaRes = await fetch(caaUrl, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
      if (caaRes.ok) {
        return {
          imageUrl: caaUrl,
          spotifyLink: fallbackSpotifyLink,
          spotifyVerified: false,
          releaseDate: null,
          releaseYear: null,
          tracks: [],
          totalTracks: null,
        };
      }
    } catch {}
  }

  return {
    imageUrl: null,
    spotifyLink: fallbackSpotifyLink,
    spotifyVerified: false,
    releaseDate: null,
    releaseYear: null,
    tracks: [],
    totalTracks: null,
  };
}

// Petición a MusicBrainz con reintentos
async function fetchMusicBrainzWithRetry(url, maxRetries = 4) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
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
      await sleep(attempt * 2000);
    }
  }
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

/**
 * Función principal: Ingesta lanzamientos desde MusicBrainz
 * Busca portada y canciones para cada uno y guarda en Supabase
 */
export async function runIngestionBatch(targetCount = 25) {
  const startTime = Date.now();
  console.log(`\n========================================================`);
  console.log(`🚀 INICIANDO INGESTA DE ${targetCount} ÁLBUMES DESDE MUSICBRAINZ`);
  console.log(`🕒 Timestamp: ${new Date().toISOString()}`);
  console.log(`========================================================\n`);

  const state = getCrawlerState();
  let currentOffset = state.offset;
  console.log(`📍 Offset de inicio: ${currentOffset} (Total acumulado previo: ${state.total_ingested} álbumes)\n`);

  const collectedReleaseGroups = [];
  const limitPerPage = 100;
  const pagesNeeded = Math.ceil(targetCount / limitPerPage);

  // 1. Descargar release groups de MusicBrainz en páginas de 100
  console.log(`📥 Paso 1/3: Obteniendo ${targetCount} Release Groups de MusicBrainz (${pagesNeeded} páginas)...`);
  for (let page = 0; page < pagesNeeded; page++) {
    const pageOffset = currentOffset + (page * limitPerPage);
    // Filtro amplio de álbumes oficiales en orden
    const mbUrl = `https://musicbrainz.org/ws/2/release-group?query=status:official%20AND%20primarytype:album&limit=${limitPerPage}&offset=${pageOffset}&fmt=json`;

    console.log(`  📄 Descargando página ${page + 1}/${pagesNeeded} (offset ${pageOffset})...`);
    
    const data = await fetchMusicBrainzWithRetry(mbUrl);
    const releaseGroups = data?.['release-groups'] || [];
    await sleep(1200); // Respetar rate-limit de 1 req/sec de MusicBrainz

    if (releaseGroups.length === 0) {
      console.log(`  ℹ️ No se obtuvieron más resultados en offset ${pageOffset}.`);
      break;
    }

    collectedReleaseGroups.push(...releaseGroups);
    console.log(`  ✅ Página ${page + 1} descargada (+${releaseGroups.length} release groups, total: ${collectedReleaseGroups.length})`);

    if (collectedReleaseGroups.length >= targetCount) break;
  }

  const releaseGroupsToProcess = collectedReleaseGroups.slice(0, targetCount);
  console.log(`\n✨ Descargados ${releaseGroupsToProcess.length} lanzamientos de MusicBrainz.\n`);

  // 2. Resolver portadas de Spotify (con fallback automático a Deezer/iTunes/CAA) en lotes concurrentes
  console.log(`🎨 Paso 2/3: Obteniendo portadas HD (Spotify/Deezer/iTunes/CAA) para los ${releaseGroupsToProcess.length} álbumes...`);
  const preparedAlbums = [];
  const CONCURRENCY = 8;

  for (let i = 0; i < releaseGroupsToProcess.length; i += CONCURRENCY) {
    const chunk = releaseGroupsToProcess.slice(i, i + CONCURRENCY);

    const chunkResults = await Promise.all(
      chunk.map(async (rg) => {
        const mbid = rg.id;
        const albumName = rg.title || 'Álbum Desconocido';
        const artistName = formatArtistCredit(rg['artist-credit']);

        const releaseDate = rg['first-release-date'] || null;
        let releaseYear = null;
        if (releaseDate) {
          const y = parseInt(String(releaseDate).substring(0, 4), 10);
          if (!isNaN(y) && y >= 1900 && y <= 2100) releaseYear = y;
        }

        const releaseType = normalizeReleaseType(rg['primary-type'], rg['secondary-types']);
        const genres = (rg.tags || []).map((t) => t.name).slice(0, 5);

        // Resolución de portada multi-fuente resiliente
        const artData = await resolveAlbumArtworkAndLinks(artistName, albumName, mbid);
        const finalReleaseDate = releaseDate || artData.releaseDate || null;
        const finalReleaseYear = releaseYear || artData.releaseYear || null;

        return {
          album_name: albumName.substring(0, 255),
          artist_name: artistName.substring(0, 255),
          mbid: mbid,
          release_type: releaseType,
          release_date: finalReleaseDate,
          release_year: finalReleaseYear,
          genres: genres,
          image_url: artData.imageUrl,
          spotify_link: artData.spotifyLink,
          spotify_verified: artData.spotifyVerified,
          reviews_enabled: true,
          tracks: artData.tracks || [],
          total_tracks: artData.totalTracks || artData.tracks?.length || null,
        };
      })
    );

    preparedAlbums.push(...chunkResults);
    if ((i + CONCURRENCY) % 100 === 0 || i + CONCURRENCY >= releaseGroupsToProcess.length) {
      const progress = Math.min(i + CONCURRENCY, releaseGroupsToProcess.length);
      console.log(`  🖼️ Portadas resueltas: ${progress}/${releaseGroupsToProcess.length}...`);
    }

    await sleep(50);
  }

  // Filtrar estrictamente solo álbumes que tengan canciones válidas y portada para mantener la integridad de Musiclub
  const validAlbums = preparedAlbums.filter((a) => a.tracks && a.tracks.length > 0 && a.image_url);
  console.log(`\n🎵 Álbumes válidos con canciones y portada completa: ${validAlbums.length}/${preparedAlbums.length}`);

  if (validAlbums.length === 0) {
    console.log(`⚠️ Ningún álbum cumplió los requisitos de calidad (canciones + portada). Omitiendo guardado.`);
    return stats;
  }

  // 3. Upsert en lotes en Supabase
  console.log(`\n💾 Paso 3/3: Guardando ${validAlbums.length} álbumes en la base de datos Supabase...`);
  const DB_BATCH_SIZE = 50;
  let insertedCount = 0;
  let duplicateOrErrorCount = 0;

  for (let b = 0; b < validAlbums.length; b += DB_BATCH_SIZE) {
    const batch = validAlbums.slice(b, b + DB_BATCH_SIZE);
    try {
      const { data, error } = await supabase
        .from('albums')
        .upsert(batch, {
          onConflict: 'album_name,artist_name',
          ignoreDuplicates: true,
        })
        .select('id');

      if (error) {
        console.warn(`  ⚠️ Error en lote ${b / DB_BATCH_SIZE + 1}: ${error.message}`);
        duplicateOrErrorCount += batch.length;
      } else {
        const count = data ? data.length : batch.length;
        insertedCount += count;
        console.log(`  💾 Lote ${Math.floor(b / DB_BATCH_SIZE) + 1}/${Math.ceil(validAlbums.length / DB_BATCH_SIZE)} guardado (+${count} registros)`);
      }
    } catch (err) {
      console.error(`  ❌ Excepción en lote:`, err.message);
      duplicateOrErrorCount += batch.length;
    }
  }

  // 4. Actualizar automáticamente sitemap.xml para indexación inmediata en Google
  try {
    console.log(`\n🗺️ Actualizando sitemap.xml automáticamente con los nuevos lanzamientos para Google...`);
    const { execSync } = await import('child_process');
    execSync('node scripts/generate-sitemap.js', { stdio: 'inherit' });
    console.log(`✅ sitemap.xml regenerado e indexable de inmediato.`);
  } catch (err) {
    console.warn(`⚠️ Error regenerando sitemap.xml:`, err.message);
  }

  // 5. Actualizar estado persistente para la siguiente hora
  const newOffset = currentOffset + releaseGroupsToProcess.length;
  const totalIngested = state.total_ingested + insertedCount;
  const durationSec = Math.round((Date.now() - startTime) / 1000);

  const stats = {
    run_timestamp: new Date().toISOString(),
    duration_seconds: durationSec,
    offset_start: currentOffset,
    offset_end: newOffset,
    fetched: releaseGroupsToProcess.length,
    inserted_or_upserted: insertedCount,
    errors_or_duplicates: duplicateOrErrorCount,
  };

  const updatedState = {
    offset: newOffset,
    total_ingested: totalIngested,
    last_run: new Date().toISOString(),
    last_stats: stats,
    history: [stats, ...(state.history || []).slice(0, 48)], // Conservar últimas 48 ejecuciones (2 días)
  };

  saveCrawlerState(updatedState);

  console.log(`\n========================================================`);
  console.log(`🎉 INGESTA DE LA HORA COMPLETADA CON ÉXITO`);
  console.log(`⏱️ Tiempo total: ${durationSec} segundos`);
  console.log(`📊 Álbumes procesados: ${releaseGroupsToProcess.length}`);
  console.log(`✅ Álbumes guardados en Supabase: ${insertedCount}`);
  console.log(`📍 Siguiente offset para la próxima hora: ${newOffset}`);
  console.log(`========================================================\n`);

  return stats;
}

// Ejecución directa si se invoca desde CLI: node scripts/hourlyMusicBrainzIngestion.mjs
if (process.argv[1] && process.argv[1].endsWith('hourlyMusicBrainzIngestion.mjs')) {
  // Acepta argumento de límite opcional: node scripts/hourlyMusicBrainzIngestion.mjs 25
  const limitArg = parseInt(process.argv[2], 10);
  const target = !isNaN(limitArg) && limitArg > 0 ? limitArg : 25;
  runIngestionBatch(target).catch(console.error);
}
