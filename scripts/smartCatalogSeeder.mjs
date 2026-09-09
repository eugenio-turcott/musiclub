// scripts/smartCatalogSeeder.mjs
/**
 * MUSICLUB - Smart Catalog Seeder
 * Motor inteligente de siembra y poblado de catálogo con distribución específica:
 * - 65% Lanzamientos del año actual (2026)
 * - 20% Álbumes icónicos, más famosos y tendencia global
 * - 15% Clásicos de culto distribuidos por décadas (2020s, 2010s, 2000s, 1990s, 1980s, 1970s)
 *
 * Cada álbum se inserta con portada HD CDN, tracklist detallado, metadatos y 4 enlaces de streaming.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
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
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;

import { cleanGenres, normalizeReleaseType } from './populateMissingMbidAndGenres.mjs';

const STATE_FILE = path.resolve(__dirname, 'seeder_state.json');
const USER_AGENT = 'MusiclubApp/2.0 ( contact@musiclub.app ; https://musiclub.app )';

// Rate limiting preventivo
let spotifyToken = null;
let spotifyTokenExpiry = 0;
let spotifyRateLimitedUntil = 0;
let lastDeezerRequestTime = 0;
let lastMbRequestTime = 0;
const MB_MIN_INTERVAL_MS = 1250;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function musicBrainzRateLimiter() {
  const now = Date.now();
  const elapsed = now - lastMbRequestTime;
  if (elapsed < MB_MIN_INTERVAL_MS) {
    await sleep(MB_MIN_INTERVAL_MS - elapsed);
  }
  lastMbRequestTime = Date.now();
}

async function searchMusicBrainzReleaseGroupSeeder(artistName, albumName) {
  await musicBrainzRateLimiter();
  const cleanArt = artistName.replace(/\([^)]*\)/g, '').replace(/[“”"']/g, '').trim();
  const cleanAlb = albumName.replace(/\([^)]*\)/g, '').replace(/[“”"']/g, '').trim();
  try {
    const q = `artist:"${cleanArt}" AND releasegroup:"${cleanAlb}"`;
    const url = `https://musicbrainz.org/ws/2/release-group?query=${encodeURIComponent(q)}&limit=3&fmt=json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data['release-groups']?.[0] || null;
  } catch {
    return null;
  }
}

async function deezerRateLimiter() {
  const now = Date.now();
  const elapsed = now - lastDeezerRequestTime;
  if (elapsed < 250) {
    await sleep(250 - elapsed);
  }
  lastDeezerRequestTime = Date.now();
}

// Obtener o renovar token de Spotify
async function getSpotifyToken() {
  if (spotifyToken && Date.now() < spotifyTokenExpiry) {
    return spotifyToken;
  }
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.error('❌ Faltan credenciales de Spotify en .env');
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
    console.error('❌ Error obteniendo token de Spotify:', err.message);
    return null;
  }
}

// Estado persistente del seeder
function getSeederState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch {}
  return {
    offset2026: 0,
    offsetFamous: 0,
    decadeIndex: 0,
    totalSeeded: 0,
    history: [],
  };
}

function saveSeederState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch {}
}

// Buscar en Deezer para obtener other_link verificado y fallback
async function getDeezerLink(artistName, albumName) {
  await deezerRateLimiter();
  const fallback = `https://www.deezer.com/search/${encodeURIComponent(artistName + ' ' + albumName)}`;
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
        return data.data[0].link || fallback;
      }
    }
  } catch {}
  return fallback;
}

// Obtener detalles completos de un álbum en Deezer (fallback robusto si Spotify entra en 429)
async function getDeezerAlbumDetails(artistName, albumName) {
  await deezerRateLimiter();
  try {
    const cleanArt = artistName.replace(/\([^)]*\)/g, '').trim();
    const cleanAlb = albumName.replace(/\([^)]*\)/g, '').trim();
    const q = encodeURIComponent(`artist:"${cleanArt}" album:"${cleanAlb}"`);
    const res = await fetch(`https://api.deezer.com/search/album?q=${q}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.data || data.data.length === 0) return null;

    const deezerAlbum = data.data[0];
    const albumRes = await fetch(`https://api.deezer.com/album/${deezerAlbum.id}`, {
      signal: AbortSignal.timeout(5000),
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

    if (tracks.length === 0) return null;

    return {
      name: fullDeezer.title || albumName,
      artists: [{ name: fullDeezer.artist?.name || artistName }],
      images: [{ url: fullDeezer.cover_xl || fullDeezer.cover_big || fullDeezer.cover_medium }],
      release_date: fullDeezer.release_date || null,
      total_tracks: fullDeezer.nb_tracks || tracks.length,
      album_type: fullDeezer.record_type || 'album',
      label: fullDeezer.label || null,
      genres: fullDeezer.genres?.data?.map((g) => g.name) || [],
      tracks: { items: tracks },
      external_urls: { deezer: fullDeezer.link },
    };
  } catch {
    return null;
  }
}

// Obtener detalles completos de un álbum en Spotify (tracks, fecha, imágenes) con timeout y reintentos protegidos
async function getFullSpotifyAlbum(albumId, maxRetries = 2) {
  if (Date.now() < spotifyRateLimitedUntil) {
    return null; // Si Spotify activó rate-limit reciente, usar fallback de inmediato
  }
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const token = await getSpotifyToken();
    if (!token) return null;
    try {
      const res = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(6000), // Timeout estricto de 6s
      });
      if (res.status === 429) {
        const retryHeader = res.headers.get('Retry-After');
        const retrySec = parseInt(retryHeader || '3', 10);

        // CAP CRÍTICO: Si Spotify pide esperar más de 5 segundos (a veces envía horas como 42309s!),
        // NUNCA nos quedamos esperando horas. Abortamos Spotify de inmediato y activamos fallback para no congelar.
        if (retrySec > 5) {
          console.warn(`  ⚠️ Spotify 429 con Retry-After excesivo (${retrySec}s). Activando fallback inmediato.`);
          spotifyRateLimitedUntil = Date.now() + Math.min(retrySec, 300) * 1000;
          return null;
        }
        console.warn(`  ⚡ Spotify 429 rate limit. Esperando ${retrySec}s...`);
        await sleep(retrySec * 1000);
        continue;
      }
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      if (attempt < maxRetries) {
        await sleep(Math.min(attempt * 1000, 2000));
      }
    }
  }
  return null;
}

// Lista curada de los artistas más famosos, legendarios y de máxima tendencia global
const FAMOUS_GLOBAL_ARTISTS = [
  // Pop, R&B & Global Icons
  'Kendrick Lamar', 'The Weeknd', 'Taylor Swift', 'Bad Bunny', 'Rosalía',
  'Billie Eilish', 'Daft Punk', 'Radiohead', 'Pink Floyd', 'Michael Jackson',
  'Kanye West', 'Travis Scott', 'Tyler, The Creator', 'Dua Lipa', 'SZA',
  'Gorillaz', 'Lana Del Rey', 'Arctic Monkeys', 'Sade', 'Frank Ocean',
  'Mac Miller', 'Beyoncé', 'Tame Impala', 'Kali Uchis', 'Lorde',
  'Harry Styles', 'Post Malone', 'Childish Gambino', 'J. Cole', 'Olivia Rodrigo',
  'Charli XCX', 'Sabrina Carpenter', 'Chappell Roan', 'Fred again..', 'Fontaines D.C.',
  'Ariana Grande', 'Bruno Mars', 'Justin Bieber', 'Rihanna', 'Adele',
  // Rock & Legends
  'The Beatles', 'David Bowie', 'Queen', 'Nirvana', 'Fleetwood Mac',
  'The Cure', 'Depeche Mode', 'Madonna', 'Björk', 'Massive Attack',
  'The Strokes', 'The White Stripes', 'Coldplay', 'Red Hot Chili Peppers',
  'Green Day', 'Linkin Park', 'Blink-182', 'Paramore', 'The Killers',
  'Oasis', 'Blur', 'The Smashing Pumpkins', 'Pearl Jam', 'AC/DC',
  'Led Zeppelin', 'Metallica', "Guns N' Roses", 'Prince', 'Stevie Wonder',
  // Grandes Exponentes Hispanos & Latinos
  'Peso Pluma', 'Feid', 'Karol G', 'Rauw Alejandro', 'Natanael Cano',
  'Junior H', 'Fuerza Regida', 'Carin Leon', 'Bizarrap', 'C. Tangana',
  'Duki', 'Mora', 'Álvaro Díaz', 'Eladio Carrión', 'Myke Towers',
  'Caifanes', 'Soda Stereo', 'Luis Miguel', 'Café Tacvba', 'Zoé',
  'Mon Laferte', 'Gustavo Cerati', 'Héroes del Silencio', 'Enanitos Verdes'
];

// Décadas históricas y sus exponentes definitivos
const DECADES_CONFIG = [
  { decade: '2020s', years: '2020-2025', artists: ['Bad Bunny', 'Dua Lipa', 'SZA', 'The Weeknd', 'Rosalía', 'Olivia Rodrigo', 'Charli XCX', 'Fred again..', 'Fontaines D.C.'] },
  { decade: '2010s', years: '2010-2019', artists: ['Kendrick Lamar', 'Frank Ocean', 'Tame Impala', 'Tyler, The Creator', 'Lana Del Rey', 'Daft Punk', 'Lorde', 'Arctic Monkeys'] },
  { decade: '2000s', years: '2000-2009', artists: ['The Strokes', 'Daft Punk', 'Kanye West', 'Coldplay', 'Arctic Monkeys', 'The White Stripes', 'Gorillaz', 'Amy Winehouse', 'Linkin Park', 'Belanova', 'Zoé'] },
  { decade: '1990s', years: '1990-1999', artists: ['Nirvana', 'Radiohead', 'Oasis', 'Blur', 'Sade', 'Lauryn Hill', 'Björk', 'The Smashing Pumpkins', 'Café Tacvba', 'Soda Stereo'] },
  { decade: '1980s', years: '1980-1989', artists: ['Michael Jackson', 'Prince', 'Madonna', 'The Cure', 'The Smiths', "Guns N' Roses", 'Metallica', 'Caifanes', 'Soda Stereo', 'Luis Miguel'] },
  { decade: '1970s', years: '1970-1979', artists: ['Pink Floyd', 'Fleetwood Mac', 'David Bowie', 'Queen', 'The Clash', 'Joy Division', 'Stevie Wonder', 'Led Zeppelin', 'Bob Marley'] },
];

/**
 * Función principal del Seeder Inteligente
 */
export async function runSmartSeed(options = {}) {
  const targetCount = parseInt(options.target || 60, 10);
  const triggerSitemap = !!options.sitemap;

  console.log('\n========================================================');
  console.log(`🌱 MUSICLUB - SMART CATALOG SEEDER`);
  console.log(`🎯 Meta total: ${targetCount} álbumes`);
  console.log(`📊 Distribución configurada:`);
  console.log(`   🔥 65% Lanzamientos 2026 (${Math.round(targetCount * 0.65)} álbumes)`);
  console.log(`   ⭐ 20% Famosos y Tendencia (${Math.round(targetCount * 0.20)} álbumes)`);
  console.log(`   ⏳ 15% Décadas (70s-2020s) (${targetCount - Math.round(targetCount * 0.65) - Math.round(targetCount * 0.20)} álbumes)`);
  console.log('========================================================\n');

  const token = await getSpotifyToken();
  if (!token) {
    console.error('❌ Imposible conectar con Spotify API.');
    return;
  }

  // 1. Cargar catálogo existente en memoria para deduplicación instantánea de 0ms
  console.log('📦 Paso 1/4: Consultando álbumes existentes en Supabase para deduplicación...');
  const existingSet = new Set();
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('albums')
      .select('album_name, artist_name, mbid')
      .range(from, from + step - 1);
    if (error || !data || data.length === 0) break;
    for (const item of data) {
      const key = `${(item.album_name || '').toLowerCase().trim()}:::${(item.artist_name || '').toLowerCase().trim()}`;
      existingSet.add(key);
      if (item.mbid) existingSet.add(item.mbid);
    }
    from += step;
    if (data.length < step) break;
  }
  console.log(`   ✅ ${existingSet.size} registros existentes protegidos contra duplicados.\n`);

  const state = getSeederState();
  const target2026 = Math.max(1, Math.round(targetCount * 0.65));
  const targetFamous = Math.max(1, Math.round(targetCount * 0.20));
  const targetDecades = Math.max(1, targetCount - target2026 - targetFamous);

  const collected = [];

  // -------------------------------------------------------------------------
  // CATEGORÍA 1: 65% RELEASES DE 2026
  // -------------------------------------------------------------------------
  console.log(`🔥 Paso 2/4: Recolectando ${target2026} lanzamientos del año 2026...`);
  let offset2026 = state.offset2026 || 0;
  const queries2026 = [
    'year:2026',
    'year:2026 a',
    'year:2026 e',
    'year:2026 o',
    'year:2026 live',
    'year:2026 ep',
    'year:2026 deluxe',
    'year:2026 vol',
  ];

  let qIdx = 0;
  let collected2026 = 0;

  while (collected2026 < target2026 * 2 && qIdx < queries2026.length) {
    const q = queries2026[qIdx];
    try {
      const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=album&limit=10&offset=${offset2026}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) });
      if (!res.ok) {
        qIdx++;
        offset2026 = 0;
        continue;
      }
      const data = await res.json();
      const items = data.albums?.items || [];
      if (items.length === 0) {
        qIdx++;
        offset2026 = 0;
        continue;
      }

      for (const it of items) {
        if (collected2026 >= target2026 * 2) break;
        if (!it.name || !it.artists?.[0]?.name) continue;
        const albumName = it.name.trim();
        const artistName = it.artists.map((a) => a.name).join(', ').trim();
        const key = `${albumName.toLowerCase()}:::${artistName.toLowerCase()}`;

        if (existingSet.has(key)) continue;
        existingSet.add(key);

        collected.push({ spotifyItem: it, category: '2026 (65%)', badge: '🔥 2026' });
        collected2026++;
      }
      offset2026 += 10;
      if (offset2026 > 400) {
        qIdx++;
        offset2026 = 0;
      }
    } catch {
      qIdx++;
      offset2026 = 0;
    }
  }
  state.offset2026 = offset2026;
  console.log(`   ✅ Recolectados ${collected2026} candidatos de 2026.\n`);

  // -------------------------------------------------------------------------
  // CATEGORÍA 2: 20% FAMOSOS Y TENDENCIA
  // -------------------------------------------------------------------------
  console.log(`⭐ Paso 3/4: Recolectando ${targetFamous} álbumes famosos y de máxima tendencia...`);
  let collectedFamous = 0;
  let famousIdx = (state.offsetFamous || 0) % FAMOUS_GLOBAL_ARTISTS.length;

  for (let i = 0; i < FAMOUS_GLOBAL_ARTISTS.length && collectedFamous < targetFamous * 2; i++) {
    const art = FAMOUS_GLOBAL_ARTISTS[(famousIdx + i) % FAMOUS_GLOBAL_ARTISTS.length];
    try {
      const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent('artist:' + art)}&type=album&limit=10`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const data = await res.json();
      const items = data.albums?.items || [];

      for (const it of items) {
        if (collectedFamous >= targetFamous * 2) break;
        if (!it.name) continue;
        const albumName = it.name.trim();
        const artistName = it.artists.map((a) => a.name).join(', ').trim();
        const key = `${albumName.toLowerCase()}:::${artistName.toLowerCase()}`;

        if (existingSet.has(key)) continue;
        existingSet.add(key);

        collected.push({ spotifyItem: it, category: 'Famosos/Tendencia (20%)', badge: '⭐ Famoso' });
        collectedFamous++;
      }
    } catch {}
  }
  state.offsetFamous = (famousIdx + collectedFamous) % FAMOUS_GLOBAL_ARTISTS.length;
  console.log(`   ✅ Recolectados ${collectedFamous} candidatos de artistas famosos/tendencia.\n`);

  // -------------------------------------------------------------------------
  // CATEGORÍA 3: 15% DÉCADAS (70s - 2020s)
  // -------------------------------------------------------------------------
  console.log(`⏳ Paso 4/4: Recolectando ${targetDecades} álbumes de culto distribuidos entre 1970s y 2020s...`);
  let collectedDecades = 0;
  let decIdx = state.decadeIndex || 0;

  for (let d = 0; d < DECADES_CONFIG.length && collectedDecades < targetDecades * 2; d++) {
    const currentDecade = DECADES_CONFIG[(decIdx + d) % DECADES_CONFIG.length];
    for (const art of currentDecade.artists) {
      if (collectedDecades >= targetDecades * 2) break;
      try {
        const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent('artist:' + art)}&type=album&limit=10`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) continue;
        const data = await res.json();
        const items = data.albums?.items || [];

        for (const it of items) {
          if (collectedDecades >= targetDecades * 2) break;
          const albumName = it.name.trim();
          const artistName = it.artists.map((a) => a.name).join(', ').trim();
          const key = `${albumName.toLowerCase()}:::${artistName.toLowerCase()}`;

          if (existingSet.has(key)) continue;
          existingSet.add(key);

          collected.push({
            spotifyItem: it,
            category: `Décadas (${currentDecade.decade})`,
            badge: `⏳ ${currentDecade.decade}`,
          });
          collectedDecades++;
        }
      } catch {}
    }
  }
  state.decadeIndex = (decIdx + 1) % DECADES_CONFIG.length;
  console.log(`   ✅ Recolectados ${collectedDecades} candidatos históricos.\n`);

  // -------------------------------------------------------------------------
  // PROCESAMIENTO Y ENRIQUECIMIENTO (Tracks >= 4, Portadas HD, Streaming Links)
  // -------------------------------------------------------------------------
  console.log(`🎵 Enriqueciendo y guardando hasta ${targetCount} álbumes completos populares en Supabase...`);
  const validRecords = [];
  let count2026 = 0;
  let countFamous = 0;
  let countDecades = 0;

  for (let i = 0; i < collected.length; i++) {
    const { spotifyItem, category, badge } = collected[i];

    // Verificar si ya se cumplió el límite de su respectiva categoría
    const is2026 = badge.includes('2026');
    const isFamous = badge.includes('Famoso');
    const isDecade = badge.includes('⏳');

    if (is2026 && count2026 >= target2026) continue;
    if (isFamous && countFamous >= targetFamous) continue;
    if (isDecade && countDecades >= targetDecades) continue;

    // Pausa preventiva de 250ms para respetar límites de tasa y no saturar Spotify
    await sleep(250);

    const rawName = (spotifyItem.name || '').substring(0, 255).trim();
    const rawArtist = (spotifyItem.artists?.map((a) => a.name).join(', ') || '').substring(0, 255).trim();

    let full = null;
    if (Date.now() >= spotifyRateLimitedUntil) {
      full = await getFullSpotifyAlbum(spotifyItem.id);
    }

    // FALLBACK A DEEZER si Spotify no respondió, dio timeout o tiene 429
    if (!full || !full.tracks?.items || full.tracks.items.length === 0) {
      const deezerFull = await getDeezerAlbumDetails(rawArtist, rawName);
      if (deezerFull && deezerFull.tracks?.items?.length > 0) {
        full = deezerFull;
        console.log(`    ↳ 🔀 Fallback Deezer activado para "${rawArtist} - ${rawName}" (${deezerFull.tracks.items.length} tracks)`);
      }
    }

    if (!full) continue;

    const albumName = (full.name || rawName).substring(0, 255).trim();
    const artistName = (full.artists?.map((a) => a.name).join(', ') || rawArtist).substring(0, 255).trim();
    const imageUrl = full.images?.[0]?.url || spotifyItem.images?.[0]?.url;
    if (!imageUrl) continue;

    // Tracklist
    const tracks = (full.tracks?.items || []).map((t, idx) => ({
      id: t.id || `tr-${idx + 1}`,
      name: t.name,
      duration_ms: t.duration_ms || 0,
      track_number: t.track_number || idx + 1,
      disc_number: t.disc_number || 1,
    }));

    // FILTRO ESTRICTO: Solo álbumes o EPs con al menos 4 canciones (elimina singles y canciones sueltas)
    if (tracks.length < 4) continue;

    // Filtrar bootlegs, instrumentales o versiones no oficiales
    const lowTitle = albumName.toLowerCase();
    if (
      lowTitle.includes('karaoke') ||
      lowTitle.includes('tribute to') ||
      lowTitle.includes('cover version') ||
      lowTitle.includes('instrumental version')
    ) {
      continue;
    }

    // Fechas y año
    const rawDate = full.release_date || spotifyItem.release_date || null;
    let releaseYear = null;
    if (rawDate) {
      const y = parseInt(String(rawDate).substring(0, 4), 10);
      if (!isNaN(y) && y >= 1900 && y <= 2100) releaseYear = y;
    }

    // Tipo de lanzamiento
    const releaseType = full.album_type === 'single' ? 'ep' : (full.album_type || 'album');

    // Streaming links (4 oficiales: Spotify, Apple Music, YouTube, Deezer)
    const spotifyLink = full.external_urls?.spotify || spotifyItem.external_urls?.spotify || `https://open.spotify.com/search/${encodeURIComponent(artistName + ' ' + albumName)}`;
    const deezerLink = full.external_urls?.deezer || await getDeezerLink(artistName, albumName);
    const appleMusicLink = `https://music.apple.com/search?term=${encodeURIComponent(artistName + ' ' + albumName)}`;
    const youtubeLink = `https://www.youtube.com/results?search_query=${encodeURIComponent(artistName + ' ' + albumName + ' full album')}`;

    // Enriquecimiento canónico vía MusicBrainz (MBID, release_type, géneros) con fallback Deezer
    let mbid = null;
    let finalReleaseType = releaseType;
    let finalGenres = (full.genres && full.genres.length > 0) ? cleanGenres(full.genres) : [];

    const mbRg = await searchMusicBrainzReleaseGroupSeeder(artistName, albumName);
    if (mbRg) {
      mbid = mbRg.id;
      finalReleaseType = normalizeReleaseType(mbRg['primary-type'], mbRg['secondary-types']);
      const mbGenres = cleanGenres(mbRg.tags || []);
      if (mbGenres.length > 0) {
        finalGenres = mbGenres;
      }
    }

    if (finalGenres.length === 0) {
      try {
        const dzDetails = await getDeezerAlbumDetails(artistName, albumName);
        if (dzDetails?.genres?.length > 0) {
          finalGenres = cleanGenres(dzDetails.genres);
        }
      } catch {}
    }

    const record = {
      album_name: albumName,
      artist_name: artistName,
      mbid: mbid,
      release_type: finalReleaseType,
      release_date: rawDate,
      release_year: releaseYear,
      genres: finalGenres,
      label: full.label || null,
      total_tracks: full.total_tracks || tracks.length,
      tracks: tracks,
      image_url: imageUrl,
      spotify_link: spotifyLink,
      apple_music_link: appleMusicLink,
      youtube_link: youtubeLink,
      other_link: deezerLink,
      spotify_verified: true,
      reviews_enabled: true,
    };

    validRecords.push(record);
    if (is2026) count2026++;
    if (isFamous) countFamous++;
    if (isDecade) countDecades++;

    const mbidStr = mbid ? `MBID: ${mbid.substring(0, 8)}...` : 'Sin MBID';
    const genresStr = finalGenres.length > 0 ? `[${finalGenres.join(', ')}]` : '[]';
    console.log(`  [${badge}] ${artistName} - ${albumName} (${releaseYear || 'N/A'}, ${tracks.length} tracks) -> ${mbidStr} | ${genresStr}`);

  }

  // -------------------------------------------------------------------------
  // INSERCIÓN POR LOTES EN SUPABASE
  // -------------------------------------------------------------------------
  console.log(`\n💾 Insertando ${validRecords.length} álbumes en la base de datos...`);
  const BATCH_SIZE = 25;
  let totalInserted = 0;

  for (let b = 0; b < validRecords.length; b += BATCH_SIZE) {
    const chunk = validRecords.slice(b, b + BATCH_SIZE);
    try {
      const { data, error } = await supabase
        .from('albums')
        .upsert(chunk, { onConflict: 'album_name,artist_name', ignoreDuplicates: true })
        .select('id');

      if (error) {
        console.warn(`  ⚠️ Error en lote: ${error.message}`);
      } else {
        const c = data ? data.length : chunk.length;
        totalInserted += c;
        console.log(`  ✅ Lote guardado con éxito (+${c} álbumes)`);
      }
    } catch (err) {
      console.error('  ❌ Excepción en inserción:', err.message);
    }
  }

  state.totalSeeded = (state.totalSeeded || 0) + totalInserted;
  state.lastRun = new Date().toISOString();
  saveSeederState(state);

  console.log(`\n🎉 Proceso completado: ${totalInserted} álbumes insertados exitosamente en Musiclub.`);

  // Opcional: Regenerar sitemap si se solicitó o si se insertaron álbumes
  if (triggerSitemap && totalInserted > 0) {
    console.log('\n🗺️ Regenerando sitemap.xml...');
    const { execSync } = await import('child_process');
    try {
      execSync('node scripts/generate-sitemap.js', { stdio: 'inherit' });
    } catch {}
  }
}

// Ejecución directa por CLI
const args = process.argv.slice(2);
let targetArg = 60;
let sitemapArg = false;

for (const a of args) {
  if (a.startsWith('--target=')) {
    targetArg = parseInt(a.split('=')[1], 10);
  } else if (a === '--sitemap') {
    sitemapArg = true;
  }
}

runSmartSeed({ target: targetArg, sitemap: sitemapArg });
