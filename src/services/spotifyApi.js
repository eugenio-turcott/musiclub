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

/**
 * Clasifica de forma inteligente un lanzamiento de Spotify en:
 * 'ALBUM' | 'EP' | 'SENCILLO' | 'COMPILACION'
 */
export const classifyAlbumType = (album) => {
  if (!album) return 'ALBUM';
  const type = (album.album_type || album.type || '').toLowerCase();
  const name = (album.name || album.album_name || '').toLowerCase();
  const totalTracks =
    album.total_tracks ||
    album.totalTracks ||
    (Array.isArray(album.tracks) ? album.tracks.length : 0);

  if (type === 'compilation') return 'COMPILACION';

  // Si Spotify lo etiqueta como single
  if (type === 'single') {
    if (totalTracks >= 3 && totalTracks <= 7) return 'EP';
    if (
      name.includes(' - ep') ||
      name.includes('(ep)') ||
      name.includes(' ep') ||
      name.endsWith(' ep')
    ) {
      return 'EP';
    }
    return 'SENCILLO';
  }

  // Si es un EP nombrado explícitamente en el título
  if (
    name.includes(' - ep') ||
    name.includes('(ep)') ||
    name.includes(' ep') ||
    name.endsWith(' ep')
  ) {
    if (totalTracks > 0 && totalTracks <= 7) return 'EP';
  }

  if (totalTracks === 1 || totalTracks === 2) {
    return 'SENCILLO';
  }

  return 'ALBUM';
};

export const extractReleaseYear = (releaseDate) => {
  if (!releaseDate) return null;
  const year = parseInt(String(releaseDate).substring(0, 4), 10);
  return !isNaN(year) && year >= 1900 && year <= 2100 ? year : null;
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
        albums: data.albums.items.map((album) => {
          const releaseType = classifyAlbumType(album);
          const releaseYear = extractReleaseYear(album.release_date);
          return {
            id: album.id,
            name: album.name,
            artists: album.artists.map((a) => a.name),
            artist_id: album.artists[0]?.id || null,
            image: album.images[0]?.url || '',
            releaseDate: album.release_date,
            releaseYear: releaseYear,
            album_type: album.album_type,
            release_type: releaseType,
            totalTracks: album.total_tracks,
            tracks: [],
            external_urls: album.external_urls,
          };
        }),
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
      let genres = Array.isArray(album.genres) ? [...album.genres] : [];

      // Si el álbum no trae géneros a nivel álbum, obtener géneros del artista principal
      const primaryArtistId = album.artists?.[0]?.id;
      if (genres.length === 0 && primaryArtistId) {
        try {
          const artistRes = await fetch(
            `https://api.spotify.com/v1/artists/${primaryArtistId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (artistRes.ok) {
            const artistData = await artistRes.json();
            if (Array.isArray(artistData.genres) && artistData.genres.length > 0) {
              genres = artistData.genres;
            }
          }
        } catch (genreErr) {
          console.warn('No se pudieron obtener géneros del artista:', genreErr);
        }
      }

      const releaseType = classifyAlbumType(album);
      const releaseYear = extractReleaseYear(album.release_date);

      return {
        success: true,
        album: {
          id: album.id,
          name: album.name,
          artists: album.artists.map((a) => a.name),
          artists_data: album.artists.map((a) => ({ id: a.id, name: a.name })),
          primaryArtistId: primaryArtistId,
          image: album.images[0]?.url || '',
          releaseDate: album.release_date,
          releaseYear: releaseYear,
          album_type: album.album_type,
          release_type: releaseType,
          genres: genres,
          label: album.label || '',
          popularity: album.popularity || null,
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

/**
 * Busca artistas en Spotify por nombre
 */
export const searchArtist = async (query, limit = 5) => {
  if (!query || !query.trim()) return { success: true, artists: [] };
  try {
    const token = await getSpotifyToken();
    const response = await fetch(
      `${SPOTIFY_SEARCH_URL}?q=${encodeURIComponent(query)}&type=artist&limit=${limit}&market=MX`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error buscando artista: ${response.status}`);
    }

    const data = await response.json();
    if (data.artists && data.artists.items) {
      return {
        success: true,
        artists: data.artists.items.map((artist) => ({
          id: artist.id,
          name: artist.name,
          image: artist.images?.[0]?.url || artist.images?.[1]?.url || '',
          genres: artist.genres || [],
          followers: artist.followers?.total || 0,
          popularity: artist.popularity || 0,
          external_urls: artist.external_urls,
        })),
      };
    }
    return { success: true, artists: [] };
  } catch (error) {
    console.warn('Error en searchArtist:', error);
    return { success: false, error: error.message, artists: [] };
  }
};

/**
 * Obtiene el perfil de un artista dado su ID de Spotify
 */
export const getArtistById = async (artistId) => {
  if (!artistId) return { success: false, error: 'ID de artista no proporcionado' };
  try {
    const token = await getSpotifyToken();
    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error obteniendo artista: ${response.status}`);
    }

    const artist = await response.json();
    return {
      success: true,
      artist: {
        id: artist.id,
        name: artist.name,
        image: artist.images?.[0]?.url || artist.images?.[1]?.url || '',
        images: artist.images || [],
        genres: artist.genres || [],
        followers: artist.followers?.total || 0,
        popularity: artist.popularity || 0,
        spotifyUrl: artist.external_urls?.spotify || `https://open.spotify.com/artist/${artist.id}`,
        external_urls: artist.external_urls,
      },
    };
  } catch (error) {
    console.warn('Error en getArtistById:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene las canciones más populares (Top Tracks) de un artista
 */
export const getArtistTopTracks = async (artistId, artistName) => {
  if (!artistId && !artistName) return { success: false, tracks: [] };
  try {
    const token = await getSpotifyToken();
    let tracks = [];

    // Búsqueda de canciones del artista por Search API (evita endpoint /top-tracks que devuelve 403 Forbidden)
    if (artistName) {
      try {
        const searchRes = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(`artist:"${artistName}"`)}&type=track&limit=10`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (searchRes.ok) {
          const data = await searchRes.json();
          tracks = data.tracks?.items || [];
        }
      } catch (_) {}
    }

    const mappedTracks = tracks.map((track, idx) => ({
      id: track.id,
      index: idx + 1,
      name: track.name,
      albumId: track.album?.id,
      albumName: track.album?.name || '',
      albumImage: track.album?.images?.[0]?.url || '',
      albumReleaseDate: track.album?.release_date,
      durationMs: track.duration_ms,
      popularity: track.popularity || 0,
      previewUrl: track.preview_url || null,
      spotifyUrl:
        track.external_urls?.spotify ||
        `https://open.spotify.com/track/${track.id}`,
      artists: track.artists ? track.artists.map((a) => a.name) : [artistName],
    }));

    return { success: true, tracks: mappedTracks };
  } catch (error) {
    console.warn('Error en getArtistTopTracks:', error);
    return { success: false, error: error.message, tracks: [] };
  }
};

/**
 * Obtiene la discografía completa de un artista organizada y deduplicada
 * Utiliza paginación vía Search API (resistente a límites y cuotas) con fallback
 */
export const getArtistDiscography = async (artistId, artistName) => {
  if (!artistId && !artistName) {
    return {
      success: false,
      discography: [],
      albums: [],
      eps: [],
      singles: [],
      compilations: [],
    };
  }

  try {
    const token = await getSpotifyToken();
    const rawItems = [];

    // 1. Obtener lanzamientos mediante Spotify Search API con paginación
    if (artistName) {
      const offsets = [0, 10, 20, 30, 40];
      const searchPromises = offsets.map((offset) =>
        fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(`artist:"${artistName}"`)}&type=album&limit=10&offset=${offset}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      );

      const searchResults = await Promise.all(searchPromises);
      searchResults.forEach((res) => {
        if (res?.albums?.items) {
          rawItems.push(...res.albums.items);
        }
      });
    }

    // 2. Si no hubo resultados o no había nombre, intentar endpoint por ID
    if (rawItems.length === 0 && artistId) {
      const discoPromises = [0, 10, 20, 30].map((offset) =>
        fetch(
          `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single,compilation&limit=10&offset=${offset}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)
      );

      const pageResults = await Promise.all(discoPromises);
      pageResults.forEach((pageData) => {
        if (pageData && Array.isArray(pageData.items)) {
          rawItems.push(...pageData.items);
        }
      });
    }

    // Deduplicar y clasificar lanzamientos
    const seenMap = new Map();
    const discography = [];

    rawItems.forEach((item) => {
      // Filtrar sólo si coincide con el artista objetivo
      if (artistName && item.artists && item.artists.length > 0) {
        const cleanTarget = artistName.toLowerCase().trim();
        const matchesArtist = item.artists.some((a) => {
          const aName = a.name.toLowerCase().trim();
          return (
            aName === cleanTarget ||
            cleanTarget.includes(aName) ||
            aName.includes(cleanTarget)
          );
        });
        if (!matchesArtist) return;
      }

      const releaseType = classifyAlbumType(item);
      const releaseYear = extractReleaseYear(item.release_date);
      const cleanName = item.name
        .toLowerCase()
        .replace(/\s*\(deluxe|\s*\(re-issue|\s*\(remastered.*/i, '')
        .trim();
      const dedupeKey = `${cleanName}-${releaseYear || ''}-${releaseType}`;

      if (!seenMap.has(dedupeKey)) {
        seenMap.set(dedupeKey, true);
        discography.push({
          id: item.id,
          name: item.name,
          artists: item.artists ? item.artists.map((a) => a.name) : [],
          image: item.images?.[0]?.url || item.images?.[1]?.url || '',
          releaseDate: item.release_date,
          releaseYear: releaseYear,
          album_type: item.album_type,
          release_type: releaseType,
          totalTracks: item.total_tracks,
          spotifyUrl:
            item.external_urls?.spotify ||
            `https://open.spotify.com/album/${item.id}`,
          external_urls: item.external_urls,
        });
      }
    });

    // Ordenar cronológicamente descendente (lo más nuevo primero)
    discography.sort((a, b) => {
      const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
      const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
      return dateB - dateA;
    });

    const albums = discography.filter((d) => d.release_type === 'ALBUM');
    const eps = discography.filter((d) => d.release_type === 'EP');
    const singles = discography.filter((d) => d.release_type === 'SENCILLO');
    const compilations = discography.filter(
      (d) => d.release_type === 'COMPILACION'
    );

    return {
      success: true,
      discography,
      albums,
      eps,
      singles,
      compilations,
    };
  } catch (error) {
    console.warn('Error en getArtistDiscography:', error);
    return {
      success: false,
      error: error.message,
      discography: [],
      albums: [],
      eps: [],
      singles: [],
      compilations: [],
    };
  }
};

/**
 * Obtiene toda la información completa de un artista (perfil y discografía completa)
 * Buscando por nombre de artista o por su ID de Spotify
 */
export const getArtistCompleteProfile = async (artistNameOrId) => {
  if (!artistNameOrId)
    return { success: false, error: 'Identificador de artista inválido' };

  try {
    let artistId = null;
    let initialArtistData = null;
    let resolvedArtistName = artistNameOrId;

    // 1. Si parece un Spotify ID (22 caracteres alfanuméricos)
    if (/^[0-9A-Za-z]{22}$/.test(artistNameOrId.trim())) {
      artistId = artistNameOrId.trim();
    } else {
      // Buscar por nombre
      const searchRes = await searchArtist(artistNameOrId, 3);
      if (searchRes.success && searchRes.artists.length > 0) {
        // Encontrar la mejor coincidencia
        const cleanTarget = artistNameOrId.toLowerCase().trim();
        const exactMatch = searchRes.artists.find(
          (a) => a.name.toLowerCase().trim() === cleanTarget
        );
        const best = exactMatch || searchRes.artists[0];
        artistId = best.id;
        initialArtistData = best;
        resolvedArtistName = best.name || artistNameOrId;
      }
    }

    if (!artistId && !resolvedArtistName) {
      return {
        success: false,
        error: `No se encontró al artista "${artistNameOrId}" en Spotify`,
      };
    }

    // Ejecutar en paralelo perfil y discografía completa
    const [artistRes, discoRes] = await Promise.all([
      artistId ? getArtistById(artistId) : Promise.resolve({ success: false }),
      getArtistDiscography(artistId, resolvedArtistName),
    ]);

    const artist = artistRes.success
      ? artistRes.artist
      : initialArtistData || {
          name: resolvedArtistName,
          id: artistId,
          image: '',
        };

    return {
      success: true,
      artist: artist,
      topTracks: [],
      discography: discoRes.success ? discoRes.discography : [],
      albums: discoRes.success ? discoRes.albums : [],
      eps: discoRes.success ? discoRes.eps : [],
      singles: discoRes.success ? discoRes.singles : [],
      compilations: discoRes.success ? discoRes.compilations : [],
    };
  } catch (error) {
    console.error('Error en getArtistCompleteProfile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene metadatos completos de un álbum desde Spotify (año, géneros, tipo de lanzamiento, pistas)
 */
export const fetchAlbumSpotifyMetadata = async (
  albumName,
  artistName,
  spotifyLink = null
) => {
  try {
    // 1. Si tenemos link de Spotify con ID
    const albumId = extractSpotifyAlbumId(spotifyLink);
    if (albumId) {
      const details = await getAlbumDetails(albumId);
      if (details?.success && details.album) {
        return {
          success: true,
          releaseDate: details.album.releaseDate || null,
          releaseYear: details.album.releaseYear || null,
          releaseType: details.album.release_type || 'ALBUM',
          genres: details.album.genres || [],
          artists: details.album.artists || [],
          artistId: details.album.primaryArtistId || null,
          totalTracks: details.album.totalTracks || 0,
          label: details.album.label || '',
          popularity: details.album.popularity || null,
          spotifyUrl: details.album.external_urls?.spotify || spotifyLink,
        };
      }
    }

    // 2. Si no hay ID o falló, buscar por nombre y artista
    if (albumName) {
      const query = artistName
        ? `${albumName} artist:${artistName}`
        : albumName;
      const searchRes = await searchAlbum(query);
      if (
        searchRes?.success &&
        searchRes.albums &&
        searchRes.albums.length > 0
      ) {
        const bestMatch = searchRes.albums[0];
        // Obtener detalles completos para traer géneros y pistas
        if (bestMatch.id) {
          const details = await getAlbumDetails(bestMatch.id);
          if (details?.success && details.album) {
            return {
              success: true,
              releaseDate: details.album.releaseDate || null,
              releaseYear: details.album.releaseYear || null,
              releaseType: details.album.release_type || 'ALBUM',
              genres: details.album.genres || [],
              artists: details.album.artists || [],
              artistId: details.album.primaryArtistId || null,
              totalTracks: details.album.totalTracks || 0,
              label: details.album.label || '',
              popularity: details.album.popularity || null,
              spotifyUrl: details.album.external_urls?.spotify || null,
            };
          }
        }

        return {
          success: true,
          releaseDate: bestMatch.releaseDate || null,
          releaseYear: bestMatch.releaseYear || null,
          releaseType: bestMatch.release_type || 'ALBUM',
          genres: [],
          artists: bestMatch.artists || [],
          artistId: bestMatch.artist_id || null,
          totalTracks: bestMatch.totalTracks || 0,
          spotifyUrl: bestMatch.external_urls?.spotify || null,
        };
      }
    }

    return { success: false, error: 'No se encontraron metadatos' };
  } catch (error) {
    console.warn(`Error al obtener metadatos de Spotify para ${albumName}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Extrae el ID del álbum desde un link de Spotify (e.g. https://open.spotify.com/album/4LH4d3cOWNNXdsqFd44wVn)
 */
export const extractSpotifyAlbumId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/album[/:]([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
};

/**
 * Obtiene el año de lanzamiento oficial de un álbum desde Spotify mediante su link o buscando por nombre y artista
 */
export const fetchAlbumReleaseYear = async (
  albumName,
  artistName,
  spotifyLink = null
) => {
  try {
    // 1. Si tenemos link de Spotify con ID
    const albumId = extractSpotifyAlbumId(spotifyLink);
    if (albumId) {
      const details = await getAlbumDetails(albumId);
      if (details?.success && details.album?.releaseDate) {
        const year = parseInt(
          String(details.album.releaseDate).substring(0, 4),
          10
        );
        if (!isNaN(year) && year >= 1900 && year <= 2100) {
          return {
            releaseDate: details.album.releaseDate,
            releaseYear: year,
          };
        }
      }
    }

    // 2. Si no hay ID o falló, buscar por nombre y artista
    if (albumName) {
      const query = artistName
        ? `${albumName} artist:${artistName}`
        : albumName;
      const searchRes = await searchAlbum(query);
      if (
        searchRes?.success &&
        searchRes.albums &&
        searchRes.albums.length > 0
      ) {
        const bestMatch = searchRes.albums[0];
        if (bestMatch?.releaseDate) {
          const year = parseInt(
            String(bestMatch.releaseDate).substring(0, 4),
            10
          );
          if (!isNaN(year) && year >= 1900 && year <= 2100) {
            return {
              releaseDate: bestMatch.releaseDate,
              releaseYear: year,
            };
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.warn(`Error al obtener año de Spotify para ${albumName}:`, error);
    return null;
  }
};
