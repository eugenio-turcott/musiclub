// src/services/trendingService.js
import { supabase } from './supabaseClient.js';

let cachedToken = null;
let tokenExpiresAt = 0;

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

  let dbData = null;
  let isCacheFresh = false;

  // 1. Intentar leer desde Supabase (tabla rotatoria trending_releases)
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

      // Si tiene menos de 8 horas y no forzamos refresco, servimos del caché instantáneo
      if (ageHours < 8 && !forceRefresh) {
        isCacheFresh = true;
      }
    }
  } catch {
    // Si la tabla no está creada aún o hay error de red con Supabase, continúa a Spotify
  }

  if (isCacheFresh && dbData && dbData.length > 0) {
    return {
      success: true,
      source: 'supabase_cache',
      releases: dbData,
    };
  }

  // 2. Consultar Spotify tag:new en vivo (Mercado MX)
  try {
    const token = await getSpotifyAppToken();
    const spotifyRes = await fetch(
      `https://api.spotify.com/v1/search?q=tag:new&type=album&market=MX&limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const spotifyJson = await spotifyRes.json();

    if (spotifyJson?.albums?.items?.length > 0) {
      const items = spotifyJson.albums.items;
      const formattedReleases = items.map((item) => {
        let releaseType = 'ALBUM';
        if (item.album_type === 'single') {
          releaseType = item.total_tracks > 2 ? 'EP' : 'SENCILLO';
        } else if (item.album_type === 'compilation') {
          releaseType = 'COMPILACION';
        }

        return {
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
        };
      });

      // 3. Sincronizar de forma rotatoria en Supabase
      try {
        await supabase
          .from('trending_releases')
          .upsert(formattedReleases, { onConflict: 'id' });
      } catch {
        // Fallback silencioso si la tabla aún no fue creada en Supabase
      }

      return {
        success: true,
        source: 'spotify_live',
        releases: formattedReleases,
      };
    }
  } catch (spotifyErr) {
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
  };
}
