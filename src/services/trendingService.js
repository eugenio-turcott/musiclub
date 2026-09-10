// src/services/trendingService.js
import { supabase } from './supabaseClient.js';

let cachedToken = null;
let tokenExpiresAt = 0;
let inMemoryTrending = null;
let inMemoryTrendingExpires = 0;

function getSpotifyCredentials() {
  const clientId =
    process.env.REACT_APP_SPOTIFY_CLIENT_ID ||
    process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ||
    process.env.SPOTIFY_CLIENT_ID;
  const clientSecret =
    process.env.REACT_APP_SPOTIFY_CLIENT_SECRET ||
    process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET ||
    process.env.SPOTIFY_CLIENT_SECRET;
  return { clientId, clientSecret };
}

/**
 * Obtiene token de aplicación de Spotify de forma segura (soporta Node y Browser)
 */
async function getSpotifyAppToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const { clientId, clientSecret } = getSpotifyCredentials();

  if (!clientId || !clientSecret) {
    throw new Error('Credenciales de Spotify no configuradas');
  }

  const rawCreds = `${clientId}:${clientSecret}`;
  const authHeader =
    typeof btoa !== 'undefined'
      ? btoa(rawCreds)
      : Buffer.from(rawCreds).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${authHeader}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error('No se pudo obtener el token de Spotify');
  }

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + ((data.expires_in || 3600) - 60) * 1000;
  return cachedToken;
}

/**
 * Obtiene los lanzamientos en tendencia/novedades (modelo híbrido con fallback en Supabase)
 * @param {Object} options
 * @param {boolean} options.forceRefresh - Fuerza recarga ignorando la antigüedad del caché
 * @param {number} options.limit - Cantidad máxima de lanzamientos (por defecto 50)
 */
export async function getTrendingReleases(options = {}) {
  const { forceRefresh = false, limit = 50 } = options;

  // Si se ejecuta en el navegador, delegar al endpoint del servidor para evitar CORS
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/trending${forceRefresh ? '?refresh=true' : ''}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.releases?.length > 0) {
          return json;
        }
      }
    } catch (browserErr) {
      console.warn('⚠️ Fallback de cliente para tendencias:', browserErr.message);
    }
  }

  // Si tenemos caché en memoria fresco en el servidor
  if (!forceRefresh && inMemoryTrending && Date.now() < inMemoryTrendingExpires) {
    return inMemoryTrending;
  }

  let dbData = null;
  let isCacheFresh = false;

  // 1. Intentar leer desde Supabase (tabla rotatoria trending_releases) si existe
  try {
    const { data, error } = await supabase
      .from('trending_releases')
      .select('*')
      .order('release_date', { ascending: false })
      .limit(limit);

    if (!error && data && data.length > 0) {
      dbData = data;
      const newestUpdated = new Date(data[0].updated_at || 0).getTime();
      const ageHours = (Date.now() - newestUpdated) / (1000 * 60 * 60);

      if (ageHours < 6 && !forceRefresh) {
        isCacheFresh = true;
      }
    }
  } catch {
    // Si la tabla no está creada aún, continúa a Spotify
  }

  if (isCacheFresh && dbData && dbData.length > 0) {
    const response = {
      success: true,
      source: 'supabase_cache',
      releases: dbData,
    };
    inMemoryTrending = response;
    inMemoryTrendingExpires = Date.now() + 60 * 60 * 1000;
    return response;
  }

  let lastError = null;

  // 2. Consultar Spotify tag:new en vivo en lotes de 10 (límite estricto de Spotify para tag:new)
  try {
    const token = await getSpotifyAppToken();
    const targetCount = Math.min(Math.max(limit, 10), 50);
    const numBatches = Math.ceil(targetCount / 10);
    const offsets = Array.from({ length: numBatches }, (_, i) => i * 10);

    const batchResults = await Promise.all(
      offsets.map(async (offset) => {
        try {
          const res = await fetch(
            `https://api.spotify.com/v1/search?q=tag:new&type=album&market=MX&limit=10&offset=${offset}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          return await res.json();
        } catch {
          return null;
        }
      })
    );

    const rawItems = [];
    batchResults.forEach((json) => {
      if (json?.albums?.items) {
        rawItems.push(...json.albums.items);
      } else if (json?.error) {
        lastError = json.error.message;
      }
    });

    if (rawItems.length > 0) {
      const seenIds = new Set();
      const formattedReleases = [];

      for (const item of rawItems) {
        if (!item || !item.id || seenIds.has(item.id)) continue;
        seenIds.add(item.id);

        let releaseType = 'ALBUM';
        if (item.album_type === 'single') {
          releaseType = item.total_tracks > 2 ? 'EP' : 'SENCILLO';
        } else if (item.album_type === 'compilation') {
          releaseType = 'COMPILACION';
        }

        formattedReleases.push({
          id: item.id,
          album_name: item.name,
          artist_name: item.artists
            ? item.artists.map((a) => a.name).join(', ')
            : 'Varios Artistas',
          image_url: item.images?.[0]?.url || item.images?.[1]?.url || '',
          spotify_url:
            item.external_urls?.spotify ||
            `https://open.spotify.com/album/${item.id}`,
          release_date:
            item.release_date || new Date().toISOString().split('T')[0],
          release_type: releaseType,
          total_tracks: item.total_tracks || 1,
          popularity: item.popularity || 0,
          updated_at: new Date().toISOString(),
        });
      }

      // Sincronizar silenciosamente en Supabase si la tabla existe
      try {
        await supabase
          .from('trending_releases')
          .upsert(formattedReleases, { onConflict: 'id' });
      } catch {
        // Fallback silencioso sin ensuciar la base de datos principal
      }

      const response = {
        success: true,
        source: 'spotify_live',
        releases: formattedReleases,
      };

      inMemoryTrending = response;
      inMemoryTrendingExpires = Date.now() + 60 * 60 * 1000; // 1 hora de caché en memoria
      return response;
    }
  } catch (spotifyErr) {
    lastError = spotifyErr?.message;
    console.warn('⚠️ Error al consultar Spotify en vivo:', spotifyErr?.message);
  }

  // 4. Fallback resiliente: Si Spotify falla, servir el último snapshot de Supabase
  if (dbData && dbData.length > 0) {
    return {
      success: true,
      source: 'supabase_fallback',
      releases: dbData,
    };
  }

  return {
    success: false,
    source: 'none',
    releases: [],
    error: lastError,
  };
}
