// src/services/deezerApi.js

/**
 * Servicio Deezer API para Musiclub
 * Permite buscar álbumes, consultar detalles y obtener carátulas en alta resolución (1000x1000)
 * sin requerir autenticación ni enfrentar límites de cuota agresivos.
 * 
 * Utiliza JSONP en el navegador para evitar problemas de CORS nativos de api.deezer.com.
 */

const DEEZER_API_BASE = 'https://api.deezer.com';

/**
 * Ejecuta una petición a la API de Deezer utilizando JSONP en entornos de navegador
 * o fetch nativo en entornos Node.
 */
export function fetchDeezer(endpoint, timeoutMs = 7000) {
  const url = endpoint.startsWith('http') ? endpoint : `${DEEZER_API_BASE}${endpoint}`;

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return new Promise((resolve, reject) => {
      const callbackName = `dz_cb_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      const separator = url.includes('?') ? '&' : '?';
      const scriptUrl = `${url}${separator}output=jsonp&callback=${callbackName}`;

      let timer = null;
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        try {
          if (window[callbackName]) {
            delete window[callbackName];
          }
        } catch {
          window[callbackName] = undefined;
        }
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };

      timer = setTimeout(() => {
        cleanup();
        reject(new Error('Deezer API timeout'));
      }, timeoutMs);

      window[callbackName] = (data) => {
        cleanup();
        if (data && data.error) {
          reject(new Error(data.error.message || 'Error en respuesta de Deezer'));
        } else {
          resolve(data);
        }
      };

      script.onerror = () => {
        cleanup();
        reject(new Error('Error de red al conectar con Deezer'));
      };

      document.body.appendChild(script);
    });
  }

  // Fallback para Node.js / SSR
  return fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`Deezer HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      if (data && data.error) throw new Error(data.error.message);
      return data;
    });
}

/**
 * Normaliza el record_type de Deezer al formato canónico de Musiclub
 */
export function mapDeezerRecordType(recordType, trackCount = 0) {
  const rt = (recordType || '').toLowerCase();
  if (rt === 'compile' || rt === 'compilation') return 'COMPILACION';
  if (rt === 'single') {
    if (trackCount >= 3 && trackCount <= 7) return 'EP';
    return 'SENCILLO';
  }
  if (rt === 'ep') return 'EP';
  if (trackCount === 1 || trackCount === 2) return 'SENCILLO';
  if (trackCount >= 3 && trackCount <= 7 && rt !== 'album') return 'EP';
  return 'ALBUM';
}

/**
 * Busca álbumes en Deezer
 * @param {string} query - Término de búsqueda (Álbum o Artista)
 * @param {number} limit - Límite de resultados
 */
export async function searchDeezerAlbums(query, limit = 15) {
  const cleanQ = (query || '').trim();
  if (!cleanQ || cleanQ.length < 2) {
    return { success: true, albums: [] };
  }

  try {
    const data = await fetchDeezer(`/search/album?q=${encodeURIComponent(cleanQ)}&limit=${limit}`);
    const items = data?.data || [];

    const formatted = items.map((a) => {
      const artistName = a.artist?.name || 'Artista';
      const releaseType = mapDeezerRecordType(a.record_type, a.nb_tracks);
      const hdImage =
        a.cover_xl ||
        a.cover_big ||
        a.cover_medium ||
        (a.md5_image ? `https://cdn-images.dzcdn.net/images/cover/${a.md5_image}/1000x1000-000000-80-0-0.jpg` : '');

      return {
        id: `deezer_${a.id}`,
        deezer_id: a.id,
        name: a.title,
        artist: artistName,
        artists: [artistName],
        artist_id: a.artist?.id || null,
        image: hdImage,
        releaseDate: null,
        releaseYear: null,
        release_type: releaseType,
        releaseType: releaseType,
        totalTracks: a.nb_tracks || null,
        tracks: [],
        source: 'DEEZER',
        external_urls: {
          deezer: a.link,
          spotify: `https://open.spotify.com/search/${encodeURIComponent(artistName + ' ' + a.title)}`,
        },
        rawDeezerAlbum: a,
      };
    });

    return {
      success: true,
      albums: formatted,
    };
  } catch (err) {
    console.warn('Error buscando en Deezer:', err.message);
    return {
      success: false,
      albums: [],
      error: err.message,
    };
  }
}

/**
 * Obtiene los detalles completos de un álbum en Deezer por ID
 * @param {string|number} deezerId - ID del álbum en Deezer
 */
export async function getDeezerAlbumDetails(deezerId) {
  if (!deezerId) return null;
  const cleanId = String(deezerId).replace(/^deezer_/, '').trim();

  try {
    const data = await fetchDeezer(`/album/${cleanId}`);
    if (!data || data.error) return null;

    const artistName = data.artist?.name || 'Artista';
    const hdImage =
      data.cover_xl ||
      data.cover_big ||
      data.cover_medium ||
      (data.md5_image ? `https://cdn-images.dzcdn.net/images/cover/${data.md5_image}/1000x1000-000000-80-0-0.jpg` : '');

    let releaseYear = null;
    if (data.release_date) {
      const y = parseInt(String(data.release_date).substring(0, 4), 10);
      if (!isNaN(y) && y >= 1900 && y <= 2100) releaseYear = y;
    }

    const releaseType = mapDeezerRecordType(data.record_type, data.nb_tracks);
    const genres = (data.genres?.data || []).map((g) => g.name).filter(Boolean);

    const tracks = (data.tracks?.data || []).map((t, idx) => ({
      id: `dz_track_${t.id || idx + 1}`,
      name: t.title || t.title_short || `Track ${idx + 1}`,
      duration_ms: (t.duration || 0) * 1000,
      track_number: t.track_position || idx + 1,
    }));

    return {
      id: `deezer_${data.id}`,
      deezer_id: data.id,
      name: data.title,
      artist: artistName,
      artists: [artistName],
      image: hdImage,
      releaseDate: data.release_date || null,
      releaseYear: releaseYear,
      release_type: releaseType,
      releaseType: releaseType,
      label: data.label || null,
      barcode: data.upc || null,
      genres: genres,
      totalTracks: data.nb_tracks || tracks.length || null,
      tracks: tracks,
      source: 'DEEZER',
      external_urls: {
        deezer: data.link,
        spotify: `https://open.spotify.com/search/${encodeURIComponent(artistName + ' ' + data.title)}`,
      },
      rawDeezerAlbum: data,
    };
  } catch (err) {
    console.warn(`Error obteniendo detalles del álbum Deezer ${cleanId}:`, err.message);
    return null;
  }
}

export const deezerApi = {
  searchDeezerAlbums,
  getDeezerAlbumDetails,
  mapDeezerRecordType,
  fetchDeezer,
};

export default deezerApi;
