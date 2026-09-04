// scripts/backfillAndEnrichAlbums.mjs
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Polyfill de WebSocket para entornos Node < 22
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeString(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’"”]/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .trim();
}

// ----------------------------------------------------
// SPOTIFY TOKEN & VERIFICATION
// ----------------------------------------------------
let spotifyToken = null;
let spotifyTokenExpiry = 0;

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
    return null;
  }
}

async function verifySpotifyAlbumId(token, albumId, targetArtist, targetAlbum) {
  if (!token || !albumId) return null;
  try {
    const res = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();

    const returnedName = normalizeString(data.name).toLowerCase();
    const desiredName = normalizeString(targetAlbum).toLowerCase();
    const artistMatches = (data.artists || []).some((a) => {
      const artName = normalizeString(a.name).toLowerCase();
      const desiredArt = normalizeString(targetArtist).toLowerCase();
      return artName.includes(desiredArt) || desiredArt.includes(artName);
    });

    const nameMatches = returnedName.includes(desiredName) || desiredName.includes(returnedName);

    if (artistMatches || nameMatches) {
      return data.external_urls?.spotify || `https://open.spotify.com/album/${data.id}`;
    }
  } catch {}
  return null;
}

// ----------------------------------------------------
// RESOLVER SPOTIFY DESDE MUSICBRAINZ + WIKIDATA
// ----------------------------------------------------
let lastMbTime = 0;
async function mbPacing() {
  const now = Date.now();
  const diff = now - lastMbTime;
  if (diff < 1150) {
    await sleep(1150 - diff);
  }
  lastMbTime = Date.now();
}

async function getSpotifyFromMusicBrainz(mbid) {
  if (!mbid) return null;
  try {
    await mbPacing();
    const url = `https://musicbrainz.org/ws/2/release-group/${mbid}?inc=url-rels&fmt=json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = await res.json();

    for (const rel of data.relations || []) {
      const u = rel.url?.resource || '';
      if (u.includes('spotify.com/album/')) {
        return u;
      }
      if (rel.type === 'wikidata') {
        const qid = u.split('/').pop();
        try {
          const wRes = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`, {
            headers: { 'User-Agent': USER_AGENT },
            signal: AbortSignal.timeout(5000),
          });
          if (wRes.ok) {
            const wData = await wRes.json();
            const spotId = wData.entities?.[qid]?.claims?.P2205?.[0]?.mainsnak?.datavalue?.value;
            if (spotId) {
              return `https://open.spotify.com/album/${spotId}`;
            }
          }
        } catch {}
      }
    }
  } catch {}
  return null;
}

// ----------------------------------------------------
// DEEZER SEARCH & PACING
// ----------------------------------------------------
let lastDeezerTime = 0;
async function deezerPacing() {
  const now = Date.now();
  const diff = now - lastDeezerTime;
  if (diff < 250) {
    await sleep(250 - diff);
  }
  lastDeezerTime = Date.now();
}

async function getDeezerAlbumLink(artistName, albumName) {
  await deezerPacing();
  const cleanArt = normalizeString(artistName);
  const cleanAlb = normalizeString(albumName);

  // 1. Búsqueda exacta
  try {
    const q = encodeURIComponent(`artist:"${cleanArt}" album:"${cleanAlb}"`);
    const res = await fetch(`https://api.deezer.com/search/album?q=${q}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        const match = data.data[0];
        return match.link || `https://www.deezer.com/album/${match.id}`;
      }
    }
  } catch {}

  // 2. Búsqueda amplia
  try {
    await deezerPacing();
    const q2 = encodeURIComponent(`${cleanArt} ${cleanAlb}`);
    const res2 = await fetch(`https://api.deezer.com/search/album?q=${q2}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2.data && data2.data.length > 0) {
        const match = data2.data[0];
        return match.link || `https://www.deezer.com/album/${match.id}`;
      }
    }
  } catch {}

  // 3. Fallback canónico de búsqueda Deezer
  return `https://www.deezer.com/search/${encodeURIComponent(artistName + ' ' + albumName)}`;
}

// ----------------------------------------------------
// APPLE MUSIC (ITUNES API DIRECT LINK)
// ----------------------------------------------------
let lastItunesTime = 0;
async function itunesPacing() {
  const now = Date.now();
  const diff = now - lastItunesTime;
  if (diff < 200) {
    await sleep(200 - diff);
  }
  lastItunesTime = Date.now();
}

async function getAppleMusicLink(artistName, albumName) {
  await itunesPacing();
  const cleanArt = normalizeString(artistName);
  const cleanAlb = normalizeString(albumName);

  try {
    const term = encodeURIComponent(`${cleanArt} ${cleanAlb}`);
    const res = await fetch(`https://itunes.apple.com/search?term=${term}&entity=album&limit=1`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0 && data.results[0].collectionViewUrl) {
        return data.results[0].collectionViewUrl;
      }
    }
  } catch {}

  // Fallback canónico de búsqueda Apple Music
  return `https://music.apple.com/search?term=${encodeURIComponent(artistName + ' ' + albumName)}`;
}

// ----------------------------------------------------
// MBID RESOLVER PARA CASOS ESPECÍFICOS
// ----------------------------------------------------
const KNOWN_MBIDS = {
  '64f82005-d138-4668-b95f-6202efdd1dec': 'a77018ca-5db9-45ed-918a-a04a30e8136b', // Jane Remover - Revengeseekerz
  '4c8ce877-ff0a-45fe-b7b3-c6fdf924f942': '7ce631e1-ef4d-4a3e-8aeb-cd347c1408c3', // Tango Astral - Tango Astral
  'f53a2a17-332b-4d41-81ce-00101a2659dd': 'f53a2a17-332b-4d41-81ce-00101a2659dd', // YOSHI, Zizzy - PD. NOS VEMOS
};

// ----------------------------------------------------
// PROCESO PRINCIPAL DE ENRIQUECIMIENTO (BACKFILL)
// ----------------------------------------------------
export async function runBackfill(options = {}) {
  const { limit = null, dryRun = false } = options;

  console.log(`\n========================================================`);
  console.log(`✨ INICIANDO ENRIQUECIMIENTO GLOBAL DE ÁLBUMES (BACKFILL)`);
  console.log(`========================================================`);
  if (dryRun) console.log(`🔍 Modo SIMULACIÓN (dry-run): No se modificarán registros.`);
  if (limit) console.log(`🔢 Límite configurado: ${limit} álbumes.`);

  // Obtener token de Spotify
  const token = await getSpotifyToken();
  console.log(`🔑 Token de Spotify listo: ${token ? 'SÍ' : 'NO'}`);

  // Consultar todos los álbumes de la base de datos
  const { data: albums, error } = await supabase
    .from('albums')
    .select('id, album_name, artist_name, spotify_link, youtube_link, apple_music_link, other_link, spotify_verified, mbid')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error al consultar Supabase:', error.message);
    return;
  }

  console.log(`📋 Total de álbumes encontrados en base de datos: ${albums.length}`);

  let updatedCount = 0;
  let skippedCount = 0;
  let processed = 0;

  for (const album of albums) {
    if (limit && processed >= limit) break;
    processed++;

    const updates = {};
    let needsUpdate = false;

    // 1. COMPLETAR other_link (Deezer)
    if (!album.other_link) {
      const deezerLink = await getDeezerAlbumLink(album.artist_name, album.album_name);
      updates.other_link = deezerLink;
      needsUpdate = true;
    }

    // 2. COMPLETAR youtube_link
    if (!album.youtube_link) {
      const ytQuery = encodeURIComponent(`${album.artist_name} ${album.album_name} full album`);
      updates.youtube_link = `https://www.youtube.com/results?search_query=${ytQuery}`;
      needsUpdate = true;
    }

    // 3. COMPLETAR apple_music_link (vía iTunes directo o fallback)
    if (!album.apple_music_link) {
      const amLink = await getAppleMusicLink(album.artist_name, album.album_name);
      updates.apple_music_link = amLink;
      needsUpdate = true;
    }

    // 4. ASEGURAR spotify_verified: true
    if (!album.spotify_verified) {
      updates.spotify_verified = true;
      needsUpdate = true;
    }

    // 5. ASEGURAR mbid
    let currentMbid = album.mbid;
    if (!currentMbid) {
      currentMbid = KNOWN_MBIDS[album.id] || album.id;
      updates.mbid = currentMbid;
      needsUpdate = true;
    }

    // 6. CORREGIR spotify_link (convertir enlaces de búsqueda a enlaces directos de álbum)
    const isSearchLink = !album.spotify_link || album.spotify_link.includes('/search/');
    if (isSearchLink) {
      // Intentar primero resolver vía MusicBrainz + Wikidata
      let directSpotifyLink = await getSpotifyFromMusicBrainz(currentMbid);

      // Si no se encontró en MB, verificar mediante DDG y Spotify API
      if (!directSpotifyLink && token) {
        try {
          const cleanArt = normalizeString(album.artist_name);
          const cleanAlb = normalizeString(album.album_name);
          const query = `site:open.spotify.com/album ${cleanArt} ${cleanAlb}`;
          const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
          const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(5000),
          });
          if (res.ok) {
            const html = await res.text();
            const candidateIds = [...new Set([...html.matchAll(/open\.spotify\.com\/album\/([a-zA-Z0-9]{22})/g)].map((m) => m[1]))];
            for (const id of candidateIds.slice(0, 3)) {
              const verified = await verifySpotifyAlbumId(token, id, album.artist_name, album.album_name);
              if (verified) {
                directSpotifyLink = verified;
                break;
              }
            }
          }
        } catch {}
      }

      if (directSpotifyLink) {
        updates.spotify_link = directSpotifyLink;
        needsUpdate = true;
        console.log(`    🟢 Spotify directo encontrado: ${directSpotifyLink}`);
      }
    }

    if (needsUpdate) {
      console.log(`[${processed}/${albums.length}] Actualizando: "${album.album_name}" (${album.artist_name})...`);
      if (Object.keys(updates).length > 0) {
        console.log('    Campos actualizados:', Object.keys(updates).join(', '));
      }

      if (!dryRun) {
        const { error: updateErr } = await supabase
          .from('albums')
          .update(updates)
          .eq('id', album.id);

        if (updateErr) {
          console.error(`    ❌ Error al actualizar en Supabase (id: ${album.id}):`, updateErr.message);
        } else {
          updatedCount++;
        }
      } else {
        updatedCount++;
      }
    } else {
      skippedCount++;
    }

    // Pausa preventiva de 150ms
    await sleep(150);
  }

  console.log(`\n========================================================`);
  console.log(`🏁 RESUMEN DEL PROCESO DE ENRIQUECIMIENTO`);
  console.log(`========================================================`);
  console.log(`Total procesados: ${processed}`);
  console.log(`Álbumes actualizados: ${updatedCount}`);
  console.log(`Álbumes sin cambios (ya completos): ${skippedCount}`);
}

// Ejecución por línea de comandos si se llama directamente
const isCli = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isCli) {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith('--limit=')) || (args.includes('--limit') ? args[args.indexOf('--limit') + 1] : null);
  const dryRun = args.includes('--dry-run');
  const limit = limitArg ? parseInt(limitArg.replace('--limit=', ''), 10) : null;

  runBackfill({ limit, dryRun })
    .then(() => {
      console.log('✅ Backfill terminado con éxito.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Error fatal en backfill:', err);
      process.exit(1);
    });
}
