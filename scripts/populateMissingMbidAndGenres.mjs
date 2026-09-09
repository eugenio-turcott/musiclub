// scripts/populateMissingMbidAndGenres.mjs
/**
 * MUSICLUB - Enriquecedor y Poblador Canónico de Metadatos (MBID & Géneros)
 * 
 * Resuelve y puebla en Supabase:
 * 1. Álbumes con MBID nulo -> Obtiene MBID canónico, géneros y tipo de release desde MusicBrainz.
 * 2. Álbumes con géneros vacíos -> Obtiene géneros desde MusicBrainz (tags/genres) con fallback a Deezer.
 * 
 * Controles de seguridad:
 * - Rate limit de MusicBrainz: 1.25s mínimo entre peticiones para respetar la política estricta de 1 req/sec.
 * - Rate limit de Deezer: 300ms entre peticiones.
 * - Reintentos con backoff exponencial en caso de HTTP 429 / 503.
 * - Guardado inmediato y persistente en Supabase tras cada álbum procesado.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Polyfill de WebSocket para Node < 22
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

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan credenciales de Supabase en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

const USER_AGENT = 'MusiclubApp/2.0 ( contact@musiclub.app ; https://musiclub.app )';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ----------------------------------------------------
// RATE LIMITERS & RESILIENCIA
// ----------------------------------------------------
let lastMbRequestTime = 0;
const MB_MIN_INTERVAL_MS = 1250; // Respetar regla estricta de MusicBrainz (1 req/sec)

async function musicBrainzRateLimiter() {
  const now = Date.now();
  const elapsed = now - lastMbRequestTime;
  if (elapsed < MB_MIN_INTERVAL_MS) {
    await sleep(MB_MIN_INTERVAL_MS - elapsed);
  }
  lastMbRequestTime = Date.now();
}

let lastDeezerRequestTime = 0;
const DEEZER_MIN_INTERVAL_MS = 300;

async function deezerRateLimiter() {
  const now = Date.now();
  const elapsed = now - lastDeezerRequestTime;
  if (elapsed < DEEZER_MIN_INTERVAL_MS) {
    await sleep(DEEZER_MIN_INTERVAL_MS - elapsed);
  }
  lastDeezerRequestTime = Date.now();
}

async function fetchMbWithRetry(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await musicBrainzRateLimiter();
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(9000),
      });

      if (res.status === 429 || res.status === 503) {
        const delay = attempt * 3500;
        console.warn(`  ⚠️ MusicBrainz HTTP ${res.status} (Rate limited). Esperando ${delay}ms... (intento ${attempt}/${maxRetries})`);
        await sleep(delay);
        continue;
      }

      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      if (attempt === maxRetries) {
        return null;
      }
      await sleep(attempt * 1500);
    }
  }
  return null;
}

// ----------------------------------------------------
// FILTRADO Y LIMPIEZA DE GÉNEROS
// ----------------------------------------------------
const IGNORED_TAGS = new Set([
  'seen live', 'favorite', 'favourites', 'owned', 'vinyl', 'cd', 'album',
  'albums i own', 'under 2000 ratings', 'spotify', 'apple music', 'deezer',
  'mexico', 'usa', 'united states', 'uk', 'spain', 'colombia', 'argentina',
  'female vocalist', 'female vocalists', 'male vocalist', 'male vocalists',
  'guitar', 'drums', 'piano', 'bass', 'singer-songwriter', '2026', '2025', '2024',
  'various artists', 'soundtrack', 'ost', 'live', 'deluxe', 'remaster', 'reissue'
]);

export function cleanGenres(tagList) {
  if (!tagList || !Array.isArray(tagList)) return [];
  const valid = [];
  for (const tag of tagList) {
    const raw = typeof tag === 'string' ? tag : tag.name;
    if (!raw) continue;
    const lower = raw.toLowerCase().trim();
    if (lower.length < 2 || lower.length > 30) continue;
    if (IGNORED_TAGS.has(lower)) continue;
    if (!valid.includes(lower)) {
      valid.push(lower);
    }
  }
  return valid.slice(0, 5);
}

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

function cleanSearchTerm(str) {
  if (!str) return '';
  return str
    .replace(/[“”"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickBestReleaseGroup(rgs, artist, album) {
  if (!rgs || rgs.length === 0) return null;
  const cleanAlb = album.toLowerCase().trim();
  const cleanArt = artist.toLowerCase().trim();

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

    if (title === cleanAlb) score += 45;
    else if (title.includes(cleanAlb) || cleanAlb.includes(title)) score += 20;

    if (rgArt === cleanArt) score += 35;
    else if (rgArt.includes(cleanArt) || cleanArt.includes(rgArt)) score += 20;

    if (primary === 'album' && secondary.length === 0) score += 30;
    else if (primary === 'album') score += 15;
    else if (primary === 'ep') score += 25;

    if (secondary.includes('compilation') && !cleanAlb.includes('compil')) score -= 25;
    if (secondary.includes('live') && !cleanAlb.includes('live') && !cleanAlb.includes('vivo')) score -= 25;
    if (secondary.includes('demo')) score -= 30;

    return { rg, calculatedScore: score };
  });

  scored.sort((a, b) => b.calculatedScore - a.calculatedScore);
  return scored[0]?.rg || null;
}

// ----------------------------------------------------
// BÚSQUEDA EN MUSICBRAINZ
// ----------------------------------------------------
async function searchMusicBrainzReleaseGroup(artistName, albumName) {
  const cleanArt = cleanSearchTerm(artistName);
  const cleanAlb = cleanSearchTerm(albumName);

  // 1. Búsqueda estructurada
  const query = `artist:"${cleanArt}" AND releasegroup:"${cleanAlb}"`;
  let url = `https://musicbrainz.org/ws/2/release-group?query=${encodeURIComponent(query)}&limit=5&fmt=json`;
  let data = await fetchMbWithRetry(url);
  if (data) {
    const rgs = data['release-groups'] || [];
    const best = pickBestReleaseGroup(rgs, cleanArt, cleanAlb);
    if (best) return best;
  }

  // 2. Búsqueda libre
  const freeQuery = `${cleanArt} ${cleanAlb}`;
  url = `https://musicbrainz.org/ws/2/release-group?query=${encodeURIComponent(freeQuery)}&limit=5&fmt=json`;
  data = await fetchMbWithRetry(url);
  if (data) {
    const rgs = data['release-groups'] || [];
    const best = pickBestReleaseGroup(rgs, cleanArt, cleanAlb);
    if (best) return best;
  }

  // 3. Título simplificado (sin paréntesis ni corchetes como "(Deluxe Edition)")
  const simplifiedAlbum = cleanAlb.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').trim();
  if (simplifiedAlbum && simplifiedAlbum !== cleanAlb) {
    const simpQuery = `artist:"${cleanArt}" AND releasegroup:"${simplifiedAlbum}"`;
    url = `https://musicbrainz.org/ws/2/release-group?query=${encodeURIComponent(simpQuery)}&limit=5&fmt=json`;
    data = await fetchMbWithRetry(url);
    if (data) {
      const rgs = data['release-groups'] || [];
      const best = pickBestReleaseGroup(rgs, cleanArt, simplifiedAlbum);
      if (best) return best;
    }
  }

  return null;
}

// ----------------------------------------------------
// FALLBACK DE GÉNEROS VÍA DEEZER
// ----------------------------------------------------
async function getDeezerGenres(artistName, albumName) {
  await deezerRateLimiter();
  try {
    const cleanArt = artistName.replace(/\([^)]*\)/g, '').trim();
    const cleanAlb = albumName.replace(/\([^)]*\)/g, '').trim();
    const q = encodeURIComponent(`${cleanArt} ${cleanAlb}`);
    const res = await fetch(`https://api.deezer.com/search/album?q=${q}&limit=3`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const first = data.data?.[0];
    if (first?.id) {
      await deezerRateLimiter();
      const albumRes = await fetch(`https://api.deezer.com/album/${first.id}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (albumRes.ok) {
        const full = await albumRes.json();
        const genres = (full.genres?.data || []).map((g) => g.name);
        return cleanGenres(genres);
      }
    }
  } catch {}
  return [];
}

// ----------------------------------------------------
// OBTENER TODOS LOS ÁLBUMES DE SUPABASE (PAGINADO)
// ----------------------------------------------------
async function fetchAllAlbumsFromSupabase() {
  const allAlbums = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('albums')
      .select('id, album_name, artist_name, mbid, genres, release_type, release_date, release_year, label, country, barcode, total_tracks, tracks')
      .range(from, from + step - 1);

    if (error) {
      console.error('❌ Error consultando Supabase:', error.message);
      break;
    }
    if (!data || data.length === 0) break;
    allAlbums.push(...data);
    from += step;
    if (data.length < step) break;
  }
  return allAlbums;
}

// ----------------------------------------------------
// FUNCIÓN PRINCIPAL DE ENRIQUECIMIENTO
// ----------------------------------------------------
export async function runBackfill(options = {}) {
  const limit = options.limit ? parseInt(options.limit, 10) : Infinity;
  const onlyMbid = !!options.onlyMbid;
  const onlyGenres = !!options.onlyGenres;

  console.log('\n========================================================');
  console.log('🎵 MUSICLUB - BACKFILL DE MBID Y GÉNEROS CANÓNICOS');
  console.log('⏱️ Timeouts y rate-limiting activos:');
  console.log('   - MusicBrainz: 1.25s entre requests (respetando límite oficial)');
  console.log('   - Deezer Fallback: 300ms entre requests');
  console.log('========================================================\n');

  console.log('📦 Paso 1: Consultando catálogo completo de Supabase...');
  const albums = await fetchAllAlbumsFromSupabase();
  console.log(`   ✅ Total de álbumes encontrados en base de datos: ${albums.length}\n`);

  // Identificar grupos objetivo
  const needMbid = [];
  const needGenresOnly = [];

  for (const a of albums) {
    const isMbidNull = !a.mbid;
    const isGenresEmpty = !a.genres || !Array.isArray(a.genres) || a.genres.length === 0;

    if (isMbidNull) {
      needMbid.push(a);
    } else if (isGenresEmpty) {
      needGenresOnly.push(a);
    }
  }

  console.log(`📊 Diagnóstico del Catálogo:`);
  console.log(`   🔸 Álbumes sin MBID (requieren búsqueda completa en MusicBrainz): ${needMbid.length}`);
  console.log(`   🔸 Álbumes con MBID pero con géneros vacíos (consulta directa rápida): ${needGenresOnly.length}`);
  console.log(`   ✨ Total de álbumes a enriquecer: ${needMbid.length + needGenresOnly.length}\n`);

  let totalProcessed = 0;
  let totalMbidEnriched = 0;
  let totalGenresEnriched = 0;

  // -----------------------------------------------------------------
  // FASE 1: PROCESAR ÁLBUMES SIN MBID (y resolver géneros también)
  // -----------------------------------------------------------------
  if (!onlyGenres && needMbid.length > 0) {
    console.log(`\n========================================================`);
    console.log(`🔥 FASE 1: Enriqueciendo ${Math.min(limit, needMbid.length)} álbumes con MBID nulo...`);
    console.log(`========================================================`);

    const targetList = needMbid.slice(0, limit);

    for (let i = 0; i < targetList.length; i++) {
      const album = targetList[i];
      totalProcessed++;
      const prefix = `[${i + 1}/${targetList.length}]`;
      console.log(`\n${prefix} Buscando MBID para: "${album.album_name}" - "${album.artist_name}"...`);

      const rg = await searchMusicBrainzReleaseGroup(album.artist_name, album.album_name);

      if (rg) {
        const mbid = rg.id;
        const releaseType = normalizeReleaseType(rg['primary-type'], rg['secondary-types']);
        let releaseDate = album.release_date;
        let releaseYear = album.release_year;

        if (rg['first-release-date'] && !releaseDate) {
          releaseDate = rg['first-release-date'];
          const y = parseInt(String(releaseDate).substring(0, 4), 10);
          if (!isNaN(y) && y >= 1900 && y <= 2100) releaseYear = y;
        }

        // Obtener géneros
        let genres = cleanGenres(rg.tags || []);

        if (genres.length === 0) {
          // Consultar detalles del release group
          const detailsUrl = `https://musicbrainz.org/ws/2/release-group/${mbid}?inc=genres+tags+artists&fmt=json`;
          const details = await fetchMbWithRetry(detailsUrl);
          if (details) {
            genres = cleanGenres([...(details.genres || []), ...(details.tags || [])]);
            if (genres.length === 0 && details['artist-credit']?.[0]?.artist?.id) {
              const artId = details['artist-credit'][0].artist.id;
              const artDetails = await fetchMbWithRetry(`https://musicbrainz.org/ws/2/artist/${artId}?inc=genres+tags&fmt=json`);
              if (artDetails) {
                genres = cleanGenres([...(artDetails.genres || []), ...(artDetails.tags || [])]);
              }
            }
          }
        }

        // Si MusicBrainz no tuvo géneros, consultar fallback Deezer
        if (genres.length === 0) {
          const dzGenres = await getDeezerGenres(album.artist_name, album.album_name);
          if (dzGenres.length > 0) genres = dzGenres;
        }

        const updatePayload = {
          mbid: mbid,
          release_type: releaseType,
          genres: genres,
        };

        if (releaseDate && !album.release_date) updatePayload.release_date = releaseDate;
        if (releaseYear && !album.release_year) updatePayload.release_year = releaseYear;

        const { error: updErr } = await supabase
          .from('albums')
          .update(updatePayload)
          .eq('id', album.id);

        if (updErr) {
          console.error(`  ❌ Error actualizando en Supabase: ${updErr.message}`);
        } else {
          totalMbidEnriched++;
          if (genres.length > 0) totalGenresEnriched++;
          console.log(`  ✅ MBID=${mbid} | Formato=${releaseType} | Géneros=[${genres.join(', ')}]`);
        }
      } else {
        // No se encontró en MusicBrainz, pero intentemos al menos poblar géneros vía Deezer
        const dzGenres = await getDeezerGenres(album.artist_name, album.album_name);
        if (dzGenres.length > 0) {
          const { error: updErr } = await supabase
            .from('albums')
            .update({ genres: dzGenres })
            .eq('id', album.id);
          if (!updErr) {
            totalGenresEnriched++;
            console.log(`  🔀 MBID no encontrado en MB, pero géneros poblados vía Deezer: [${dzGenres.join(', ')}]`);
          } else {
            console.log(`  ℹ️ No encontrado en MusicBrainz ni en Deezer.`);
          }
        } else {
          console.log(`  ℹ️ No encontrado en MusicBrainz ni en Deezer.`);
        }
      }
    }
  }

  // -----------------------------------------------------------------
  // FASE 2: PROCESAR ÁLBUMES CON MBID PERO CON GÉNEROS VACÍOS
  // -----------------------------------------------------------------
  const remainingLimit = limit - totalProcessed;
  if (!onlyMbid && remainingLimit > 0 && needGenresOnly.length > 0) {
    console.log(`\n========================================================`);
    console.log(`🏷️ FASE 2: Enriqueciendo ${Math.min(remainingLimit, needGenresOnly.length)} álbumes con géneros vacíos...`);
    console.log(`========================================================`);

    const targetList = needGenresOnly.slice(0, remainingLimit);

    for (let i = 0; i < targetList.length; i++) {
      const album = targetList[i];
      totalProcessed++;
      const prefix = `[${i + 1}/${targetList.length}]`;
      console.log(`\n${prefix} Obteniendo géneros para MBID ${album.mbid}: "${album.album_name}" - "${album.artist_name}"...`);

      const detailsUrl = `https://musicbrainz.org/ws/2/release-group/${album.mbid}?inc=genres+tags+artists&fmt=json`;
      const details = await fetchMbWithRetry(detailsUrl);
      let genres = [];

      if (details) {
        genres = cleanGenres([...(details.genres || []), ...(details.tags || [])]);
        if (genres.length === 0 && details['artist-credit']?.[0]?.artist?.id) {
          const artId = details['artist-credit'][0].artist.id;
          const artDetails = await fetchMbWithRetry(`https://musicbrainz.org/ws/2/artist/${artId}?inc=genres+tags&fmt=json`);
          if (artDetails) {
            genres = cleanGenres([...(artDetails.genres || []), ...(artDetails.tags || [])]);
          }
        }
      }

      // Si MusicBrainz no tuvo géneros, consultar fallback Deezer
      if (genres.length === 0) {
        const dzGenres = await getDeezerGenres(album.artist_name, album.album_name);
        if (dzGenres.length > 0) genres = dzGenres;
      }

      if (genres.length > 0) {
        const { error: updErr } = await supabase
          .from('albums')
          .update({ genres: genres })
          .eq('id', album.id);

        if (updErr) {
          console.error(`  ❌ Error actualizando géneros: ${updErr.message}`);
        } else {
          totalGenresEnriched++;
          console.log(`  ✅ Géneros asignados: [${genres.join(', ')}]`);
        }
      } else {
        console.log(`  ℹ️ No se encontraron géneros específicos.`);
      }
    }
  }

  console.log('\n========================================================');
  console.log('🎉 RESUMEN DE PROCESO DE ENRIQUECIMIENTO');
  console.log(`   📦 Álbumes procesados en esta corrida: ${totalProcessed}`);
  console.log(`   ✨ MBIDs asignados: ${totalMbidEnriched}`);
  console.log(`   🏷️ Conjuntos de géneros asignados: ${totalGenresEnriched}`);
  console.log('========================================================\n');
}

// Ejecución directa desde CLI
const args = process.argv.slice(2);
const options = {};
for (const arg of args) {
  if (arg.startsWith('--limit=')) {
    options.limit = parseInt(arg.split('=')[1], 10);
  }
  if (arg === '--only-mbid') options.onlyMbid = true;
  if (arg === '--only-genres') options.onlyGenres = true;
}

runBackfill(options).catch((err) => {
  console.error('❌ Error fatal en runBackfill:', err);
  process.exit(1);
});
