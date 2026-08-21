// src/services/spotifyApi.js
import { isAlbumAlreadyInCatalog } from '../utils/albumDeduplication';

// Configuración de Spotify desde variables de entorno
const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_SEARCH_URL = 'https://api.spotify.com/v1/search';
const SPOTIFY_ALBUM_URL = 'https://api.spotify.com/v1/albums';

let accessToken = null;
let tokenExpiration = null;

const checkCredentials = () => {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.error('⚠️ Faltan credenciales de Spotify');
    return false;
  }
  return true;
};

const getSpotifyToken = async () => {
  if (accessToken && tokenExpiration && Date.now() < tokenExpiration) {
    return accessToken;
  }

  if (!checkCredentials()) {
    throw new Error('Credenciales de Spotify no configuradas');
  }

  try {
    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`),
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Error de Spotify: ${errorData.error_description || response.statusText}`
      );
    }

    const data = await response.json();

    if (data.access_token) {
      accessToken = data.access_token;
      tokenExpiration = Date.now() + data.expires_in * 1000;
      return accessToken;
    } else {
      throw new Error('No se recibió token de acceso');
    }
  } catch (error) {
    console.error('Error en getSpotifyToken:', error);
    throw error;
  }
};

export const searchAlbum = async (query) => {
  try {
    const token = await getSpotifyToken();

    const response = await fetch(
      `${SPOTIFY_SEARCH_URL}?q=${encodeURIComponent(query)}&type=album&limit=10&market=MX`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error en búsqueda: ${response.status}`);
    }

    const data = await response.json();

    if (data.albums && data.albums.items) {
      return {
        success: true,
        albums: data.albums.items.map((album) => ({
          id: album.id,
          name: album.name,
          artists: album.artists.map((a) => a.name),
          image: album.images[0]?.url || '',
          releaseDate: album.release_date,
          totalTracks: album.total_tracks,
          tracks: [],
          external_urls: album.external_urls,
        })),
      };
    }

    return { success: false, error: 'No se encontraron álbumes' };
  } catch (error) {
    console.error('Error en searchAlbum:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Busca canciones (tracks) individuales en Spotify por título y/o artista
 */
export const searchTracks = async (query, limit = 10) => {
  if (!query || !query.trim()) {
    return { success: true, tracks: [] };
  }

  try {
    const token = await getSpotifyToken();
    const response = await fetch(
      `${SPOTIFY_SEARCH_URL}?q=${encodeURIComponent(query)}&type=track&limit=${limit}&market=MX`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error en búsqueda de canciones: ${response.status}`);
    }

    const data = await response.json();
    if (data.tracks && data.tracks.items) {
      return {
        success: true,
        tracks: data.tracks.items.map((track) => ({
          id: track.id,
          name: track.name,
          artists: track.artists.map((a) => a.name),
          artistName: track.artists.map((a) => a.name).join(', '),
          albumName: track.album?.name || '',
          imageUrl: track.album?.images?.[0]?.url || '',
          spotifyUrl: track.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`,
          durationMs: track.duration_ms,
        })),
      };
    }

    return { success: true, tracks: [] };
  } catch (error) {
    console.warn('Error en searchTracks:', error);
    return { success: false, error: error.message, tracks: [] };
  }
};

export const getAlbumDetails = async (albumId) => {
  try {
    const token = await getSpotifyToken();

    const response = await fetch(`${SPOTIFY_ALBUM_URL}/${albumId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener detalles: ${response.status}`);
    }

    const album = await response.json();

    if (album.id) {
      return {
        success: true,
        album: {
          id: album.id,
          name: album.name,
          artists: album.artists.map((a) => a.name),
          image: album.images[0]?.url || '',
          releaseDate: album.release_date,
          totalTracks: album.total_tracks,
          tracks: album.tracks.items.map((track) => ({
            id: track.id,
            name: track.name,
            duration_ms: track.duration_ms,
            track_number: track.track_number,
          })),
          external_urls: album.external_urls,
        },
      };
    }

    return { success: false, error: 'No se encontró el álbum' };
  } catch (error) {
    console.error('Error en getAlbumDetails:', error);
    return { success: false, error: error.message };
  }
};

export const getAlbumTracksById = async (albumId) => {
  try {
    const token = await getSpotifyToken();

    const response = await fetch(
      `${SPOTIFY_ALBUM_URL}/${albumId}/tracks?limit=50&market=MX`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error al obtener tracks: ${response.status}`);
    }

    const data = await response.json();

    if (data.items) {
      return {
        success: true,
        tracks: data.items.map((track) => ({
          id: track.id,
          name: track.name,
          duration_ms: track.duration_ms,
          track_number: track.track_number,
        })),
      };
    }

    return { success: false, error: 'No se encontraron tracks' };
  } catch (error) {
    console.error('Error en getAlbumTracksById:', error);
    return { success: false, error: error.message };
  }
};

export const testSpotifyConnection = async () => {
  try {
    await getSpotifyToken();
    return { success: true, message: 'Conexión exitosa' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Busca los álbumes más representativos de un artista específico en Spotify.
 */
export const getArtistAlbums = async (artistName, limit = 6) => {
  try {
    const token = await getSpotifyToken();
    const query = `artist:"${artistName}"`;
    const response = await fetch(
      `${SPOTIFY_SEARCH_URL}?q=${encodeURIComponent(query)}&type=album&limit=${limit}&market=MX`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error buscando álbumes del artista: ${response.status}`);
    }

    const data = await response.json();
    if (data.albums && data.albums.items) {
      return {
        success: true,
        albums: data.albums.items.map((album) => ({
          id: album.id,
          name: album.name,
          artists: album.artists.map((a) => a.name),
          image: album.images[0]?.url || '',
          releaseDate: album.release_date,
          totalTracks: album.total_tracks,
          tracks: [],
          external_urls: album.external_urls,
        })),
      };
    }
    return { success: false, albums: [] };
  } catch (error) {
    console.error('Error en getArtistAlbums:', error);
    return { success: false, error: error.message, albums: [] };
  }
};

/**
 * Catálogo de artistas diversos y aclamados para enriquecer los descubrimientos musicales
 */
const CURATED_DISCOVERY_ARTISTS = [
  'Radiohead', 'Weyes Blood', 'Kendrick Lamar', 'Tame Impala', 'Björk',
  'Frank Ocean', 'Portishead', 'Cocteau Twins', 'Daft Punk', 'Sufjan Stevens',
  'Tyler, The Creator', 'Lorde', 'Arctic Monkeys', 'Charli xcx', 'Fontaines D.C.',
  'The Smile', 'Massive Attack', 'Fleetwood Mac', 'The Cure', 'David Bowie',
  'Phoebe Bridgers', 'FKA twigs', 'Beach House', 'Gorillaz', 'Mitski',
  'St. Vincent', 'The Strokes', 'LCD Soundsystem', 'Rosalía', 'MGMT',
  'Mac DeMarco', 'Caroline Polachek', 'Depeche Mode', 'Aphex Twin', 'Talking Heads'
];

/**
 * Obtiene recomendaciones de nuevos descubrimientos musicales fuera del catálogo actual.
 * Garantiza estrictamente 1 álbum por artista y rotación dinámica al refrescar.
 */
export const getRecommendedAlbumsByTaste = async (
  tasteProfile,
  existingCatalog = [],
  limit = 8,
  refreshSeed = Date.now()
) => {
  try {
    const candidateArtists = [];

    // Convertir a array si pasaron un Set
    const catalogList = Array.isArray(existingCatalog)
      ? existingCatalog
      : existingCatalog instanceof Set
      ? Array.from(existingCatalog).map((name) => ({ album_name: name }))
      : [];

    // 1. Artistas con mejores notas en el perfil del usuario
    if (tasteProfile?.topArtists && tasteProfile.topArtists.length > 0) {
      tasteProfile.topArtists.forEach((a) => {
        if (a.name && !candidateArtists.includes(a.name)) {
          candidateArtists.push(a.name);
        }
      });
    }

    // 2. Artista favorito configurado
    if (tasteProfile?.favoriteArtist && !candidateArtists.includes(tasteProfile.favoriteArtist)) {
      candidateArtists.unshift(tasteProfile.favoriteArtist);
    }

    // 3. Mezclar con artistas curados para asegurar variedad estilística
    const shuffledCurated = [...CURATED_DISCOVERY_ARTISTS].sort(() => 0.5 - Math.random());
    shuffledCurated.forEach((artist) => {
      if (!candidateArtists.includes(artist)) {
        candidateArtists.push(artist);
      }
    });

    // Barajar artistas candidatos según el refreshSeed para que cada refresco sea único
    const shuffledArtists = [...candidateArtists].sort(() => 0.5 - Math.random());

    const discoveredAlbums = [];
    const seenArtistNames = new Set();
    const seenAlbumIds = new Set();

    // Consultar artistas en paralelo por lotes
    const artistsToQuery = shuffledArtists.slice(0, 24);

    for (const artist of artistsToQuery) {
      if (discoveredAlbums.length >= limit) break;

      const normArtist = artist.toLowerCase().trim();
      if (seenArtistNames.has(normArtist)) continue;

      try {
        // Obtenemos 4 álbumes del artista para elegir uno que no esté en el catálogo
        const res = await getArtistAlbums(artist, 4);
        if (res.success && res.albums && res.albums.length > 0) {
          // Barajar los álbumes del artista
          const artistAlbums = [...res.albums].sort(() => 0.5 - Math.random());

          for (const alb of artistAlbums) {
            const mainArtist = (alb.artists && alb.artists[0] ? alb.artists[0] : artist).toLowerCase().trim();

            // Verificar si el álbum ya está en el catálogo (pool, individuales, etc.) con deduplicación inteligente
            const isDuplicate = isAlbumAlreadyInCatalog(alb, catalogList);

            if (!seenAlbumIds.has(alb.id) && !seenArtistNames.has(mainArtist) && !isDuplicate) {
              seenAlbumIds.add(alb.id);
              seenArtistNames.add(mainArtist);

              const isUserTop = tasteProfile?.topArtists?.some(
                (a) => a.name.toLowerCase().trim() === mainArtist
              );
              const isFav = tasteProfile?.favoriteArtist?.toLowerCase().trim() === mainArtist;

              const reason = isFav
                ? `De tu artista favorito (${tasteProfile.favoriteArtist})`
                : isUserTop
                ? `Por tus altas calificaciones a ${artist}`
                : `Afinidad estilística con tu arquetipo ${tasteProfile?.tasteArchetype?.title || 'musical'}`;

              discoveredAlbums.push({
                ...alb,
                recommendedBecause: reason,
              });

              // Solo 1 álbum por artista
              break;
            }
          }
        }
      } catch (err) {
        console.warn(`Error buscando descubrimientos para ${artist}:`, err);
      }
    }

    // Barajar los resultados finales para dar una presentación dinámica
    const finalSelection = [...discoveredAlbums].sort(() => 0.5 - Math.random());

    return {
      success: true,
      albums: finalSelection.slice(0, limit),
    };
  } catch (error) {
    console.error('Error en getRecommendedAlbumsByTaste:', error);
    return { success: false, error: error.message, albums: [] };
  }
};

/**
 * Obtiene la información completa de una playlist de Spotify dado su ID
 */
export const getSpotifyPlaylistDetails = async (playlistId) => {
  if (!playlistId) return { success: false, error: 'ID de playlist no proporcionado' };

  try {
    const token = await getSpotifyToken();
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}?market=MX`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error en Spotify API (${response.status})`);
    }

    const data = await response.json();
    return {
      success: true,
      title: data.name || '',
      description: data.description || '',
      imageUrl: data.images && data.images[0]?.url ? data.images[0].url : '',
      curatorName: data.owner?.display_name || 'Spotify',
      externalUrl: data.external_urls?.spotify || `https://open.spotify.com/playlist/${playlistId}`,
      totalTracks: data.tracks?.total || 0,
    };
  } catch (error) {
    console.warn('Error en getSpotifyPlaylistDetails:', error);
    return { success: false, error: error.message };
  }
};


