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
  const currentYear = new Date().getFullYear();

  // 1. Intentar leer desde Supabase (tabla rotatoria trending_releases) si son álbumes sustanciales de 2026
  try {
    const { data, error } = await supabase
      .from('trending_releases')
      .select('*')
      .order('release_date', { ascending: false })
      .limit(limit);

    if (!error && data && data.length > 0) {
      const allFromCurrentYear = data.every((r) =>
        (r.release_date || '').startsWith(String(currentYear))
      );
      const hasSubstantialTracks = data.some((r) => (r.total_tracks || 0) >= 8);
      const newestUpdated = new Date(data[0].updated_at || 0).getTime();
      const ageHours = (Date.now() - newestUpdated) / (1000 * 60 * 60);

      if (ageHours < 6 && allFromCurrentYear && hasSubstantialTracks && !forceRefresh) {
        isCacheFresh = true;
        dbData = data;
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

  // 2. Consultar los álbumes más famosos y tendencia de 2026 vía Spotify (Mercado MX y Global)
  try {
    const token = await getSpotifyAppToken();
    const offsets = [0, 10, 20, 30, 40, 50, 60, 70];
    const fetchTasks = [];

    offsets.forEach((offset) => {
      // Mercado México / Latino
      fetchTasks.push(
        fetch(
          `https://api.spotify.com/v1/search?q=year:${currentYear}&type=album&market=MX&limit=10&offset=${offset}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
          .then((r) => r.json())
          .catch(() => null)
      );
      // Mercado Global / Internacional
      fetchTasks.push(
        fetch(
          `https://api.spotify.com/v1/search?q=year:${currentYear}&type=album&limit=10&offset=${offset}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
          .then((r) => r.json())
          .catch(() => null)
      );
    });

    const batchResults = await Promise.all(fetchTasks);
    const seenIds = new Set();
    const seenTitleArtist = new Set();
    const formattedReleases = [];

    batchResults.forEach((json) => {
      if (!json?.albums?.items) {
        if (json?.error) lastError = json.error.message;
        return;
      }

      for (const item of json.albums.items) {
        if (!item || !item.id) continue;
        if (seenIds.has(item.id)) continue;

        const artistName = item.artists
          ? item.artists.map((a) => a.name).join(', ')
          : 'Varios Artistas';
        const normKey = `${(item.name || '').trim().toLowerCase()}:::${artistName.trim().toLowerCase()}`;
        if (seenTitleArtist.has(normKey)) continue;

        // Filtrado estricto estilo Record Club:
        // Solo ÁLBUMES y EPs legítimos de 2026 (excluyendo cualquier single suelto o compilaciones spotlight)
        const relDate = item.release_date || '';
        const isCurrentYear = relDate.startsWith(String(currentYear));
        const isTrueAlbum =
          item.album_type === 'album' || item.album_type === 'compilation';
        const isGenericSpotlight = (item.name || '')
          .toLowerCase()
          .includes('artist spotlight');

        if (!isCurrentYear || !isTrueAlbum || isGenericSpotlight) continue;

        seenIds.add(item.id);
        seenTitleArtist.add(normKey);

        let releaseType = 'ALBUM';
        if (item.album_type === 'compilation') {
          releaseType = 'COMPILACION';
        } else if ((item.total_tracks || 0) <= 6) {
          releaseType = 'EP';
        }

        formattedReleases.push({
          id: item.id,
          album_name: item.name,
          artist_name: artistName,
          image_url: item.images?.[0]?.url || item.images?.[1]?.url || '',
          spotify_url:
            item.external_urls?.spotify ||
            `https://open.spotify.com/album/${item.id}`,
          release_date: relDate || `${currentYear}-01-01`,
          release_type: releaseType,
          total_tracks: item.total_tracks || 1,
          popularity: item.popularity || 0,
          updated_at: new Date().toISOString(),
        });
      }
    });

    if (formattedReleases.length > 0) {
      const finalReleases = formattedReleases.slice(0, Math.max(limit, 50));

      // Sincronizar silenciosamente en Supabase (tabla rotatoria)
      try {
        await supabase
          .from('trending_releases')
          .upsert(finalReleases, { onConflict: 'id' });
      } catch {
        // Fallback silencioso sin ensuciar la base de datos principal
      }

      const response = {
        success: true,
        source: 'spotify_live',
        releases: finalReleases,
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
