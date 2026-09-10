// src/services/spotifyApi.js
import { isAlbumAlreadyInCatalog } from '../utils/albumDeduplication.js';
import { searchDeezerAlbums, getDeezerAlbumDetails } from './deezerApi.js';
import { slugifyArtist } from '../utils/ratingUtils.js';



// Configuración de Spotify desde variables de entorno
const SPOTIFY_CLIENT_ID =
  process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ||
  process.env.REACT_APP_SPOTIFY_CLIENT_ID ||
  process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET =
  process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET ||
  process.env.REACT_APP_SPOTIFY_CLIENT_SECRET ||
  process.env.SPOTIFY_CLIENT_SECRET;
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

let spotifyCooldownUntil = 0;

export const searchAlbum = async (query, options = {}) => {
  if (!query || !query.trim()) {
    return { success: true, albums: [] };
  }

  const provider = (typeof options === 'string' ? options : options.provider || options.source || 'ALL').toUpperCase();

  // 1. Caso búsqueda exclusiva en Deezer
  if (provider === 'DEEZER') {
    return await searchDeezerAlbums(query, options.limit || 15);
  }

  // 2. Caso búsqueda exclusiva en Spotify
  if (provider === 'SPOTIFY') {
    try {
      const token = await getSpotifyToken();
      if (token) {
        const response = await fetch(
          `${SPOTIFY_SEARCH_URL}?q=${encodeURIComponent(query)}&type=album&limit=${options.limit || 15}&market=MX`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.albums && data.albums.items) {
            return {
              success: true,
              albums: data.albums.items.map((album) => {
                const releaseType = classifyAlbumType(album);
                const releaseYear = extractReleaseYear(album.release_date);
                const artistList = album.artists.map((a) => a.name);
                return {
                  id: album.id,
                  name: album.name,
                  artists: artistList,
                  artist: artistList.join(', '),
                  artist_id: album.artists[0]?.id || null,
                  image: album.images[0]?.url || '',
                  releaseDate: album.release_date,
                  releaseYear: releaseYear,
                  album_type: album.album_type,
                  release_type: releaseType,
                  totalTracks: album.total_tracks,
                  tracks: [],
                  source: 'SPOTIFY',
                  external_urls: album.external_urls || {
                    spotify: `https://open.spotify.com/album/${album.id}`,
                  },
                };
              }),
            };
          }
        }
      }
    } catch (error) {
      console.warn('Error en búsqueda Spotify exclusiva:', error.message);
    }
    return { success: false, albums: [] };
  }

  // 3. Caso Búsqueda General / ALL:
  // Ejecuta Deezer y Spotify concurrentemente; Deezer garantiza resultados inmediatos sin cuotas
  let spotifyAlbums = [];
  let deezerAlbums = [];

  const promises = [];

  // Buscar en Deezer (muy rápido, sin problemas de cuota)
  promises.push(
    searchDeezerAlbums(query, 12)
      .then((res) => {
        if (res?.success && Array.isArray(res.albums)) {
          deezerAlbums = res.albums;
        }
      })
      .catch((err) => console.warn('Deezer search error:', err.message))
  );

  // Buscar en Spotify si no está en cooldown
  if (Date.now() > spotifyCooldownUntil) {
    promises.push(
      (async () => {
        try {
          const token = await getSpotifyToken();
          if (token) {
            const response = await fetch(
              `${SPOTIFY_SEARCH_URL}?q=${encodeURIComponent(query)}&type=album&limit=10&market=MX`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (response.status === 429) {
              console.warn('⚠️ Spotify Search 429 (Cuota excedida). Usando resultados de Deezer.');
              spotifyCooldownUntil = Date.now() + 60 * 1000;
            } else if (response.ok) {
              const data = await response.json();
              if (data.albums && data.albums.items) {
                spotifyAlbums = data.albums.items.map((album) => {
                  const releaseType = classifyAlbumType(album);
                  const releaseYear = extractReleaseYear(album.release_date);
                  const artistList = album.artists.map((a) => a.name);
                  return {
                    id: album.id,
                    name: album.name,
                    artists: artistList,
                    artist: artistList.join(', '),
                    artist_id: album.artists[0]?.id || null,
                    image: album.images[0]?.url || '',
                    releaseDate: album.release_date,
                    releaseYear: releaseYear,
                    album_type: album.album_type,
                    release_type: releaseType,
                    totalTracks: album.total_tracks,
                    tracks: [],
                    source: 'SPOTIFY',
                    external_urls: album.external_urls || {
                      spotify: `https://open.spotify.com/album/${album.id}`,
                    },
                  };
                });
              }
            }
          }
        } catch (error) {
          console.warn('Spotify search error (usando Deezer):', error.message);
        }
      })()
    );
  }

  await Promise.allSettled(promises);

  // Mezclar y desduplicar resultados
  const seenKeys = new Set();
  const mergedAlbums = [];

  // Priorizar Spotify si está disponible para este álbum
  for (const alb of spotifyAlbums) {
    const key = `${(alb.artist || '').toLowerCase().trim()}:::${(alb.name || '').toLowerCase().trim()}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      mergedAlbums.push(alb);
    }
  }

  // Complementar con Deezer
  for (const alb of deezerAlbums) {
    const key = `${(alb.artist || '').toLowerCase().trim()}:::${(alb.name || '').toLowerCase().trim()}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      mergedAlbums.push(alb);
    }
  }

  if (mergedAlbums.length > 0) {
    return { success: true, albums: mergedAlbums };
  }

  // 4. FALLBACK FINAL: iTunes Search API
  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=album&limit=10`;
    const res = await fetch(itunesUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return {
          success: true,
          albums: data.results.map((item) => {
            const rawYear = item.releaseDate ? parseInt(item.releaseDate.substring(0, 4), 10) : null;
            const releaseYear = !isNaN(rawYear) && rawYear >= 1900 && rawYear <= 2100 ? rawYear : null;
            const totalTracks = item.trackCount || 0;
            let releaseType = 'ALBUM';
            if (totalTracks <= 2) releaseType = 'SENCILLO';
            else if (totalTracks <= 7) releaseType = 'EP';

            const cleanName = item.collectionName;
            const cleanArtist = item.artistName;
            const hdImage = item.artworkUrl100
              ? item.artworkUrl100.replace('100x100bb', '1000x1000bb')
              : '';

            return {
              id: `itunes_${item.collectionId}`,
              name: cleanName,
              artists: [cleanArtist],
              artist: cleanArtist,
              artist_id: null,
              image: hdImage,
              releaseDate: item.releaseDate ? item.releaseDate.split('T')[0] : null,
              releaseYear: releaseYear,
              album_type: 'album',
              release_type: releaseType,
              totalTracks: totalTracks,
              tracks: [],
              source: 'ITUNES',
              external_urls: {
                spotify: `https://open.spotify.com/search/${encodeURIComponent(cleanArtist + ' ' + cleanName)}`,
                itunes: item.collectionViewUrl,
              },
            };
          }),
        };
      }
    }
  } catch (itunesErr) {
    console.warn('Error en fallback iTunes search:', itunesErr);
  }

  return { success: false, error: 'No se encontraron álbumes', albums: [] };
};

/**
 * Busca canciones (tracks) individuales en Spotify por título y/o artista (con fallback de Apple Music)
 */
export const searchTracks = async (query, limit = 10) => {
  if (!query || !query.trim()) {
    return { success: true, tracks: [] };
  }

  // 1. Intentar Spotify primero si no está en cooldown
  if (Date.now() > spotifyCooldownUntil) {
    try {
      const token = await getSpotifyToken();
      if (token) {
        const response = await fetch(
          `${SPOTIFY_SEARCH_URL}?q=${encodeURIComponent(query)}&type=track&limit=${limit}&market=MX`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 429) {
          spotifyCooldownUntil = Date.now() + 60 * 1000;
        } else if (response.ok) {
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
        }
      }
    } catch (error) {
      console.warn('Spotify searchTracks no disponible, usando fallback:', error.message);
    }
  }

  // 2. Fallback de canciones vía Apple Music / iTunes
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=${limit}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return {
          success: true,
          tracks: data.results.map((track) => ({
            id: `itunes_${track.trackId}`,
            name: track.trackName,
            artists: [track.artistName],
            artistName: track.artistName,
            albumName: track.collectionName || '',
            imageUrl: track.artworkUrl100 ? track.artworkUrl100.replace('100x100bb', '600x600bb') : '',
            spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(track.artistName + ' ' + track.trackName)}`,
            durationMs: track.trackTimeMillis,
          })),
        };
      }
    }
  } catch (err) {
    console.warn('Error en fallback searchTracks iTunes:', err);
  }

  return { success: true, tracks: [] };
};

export const getAlbumDetails = async (albumId) => {
  // 0. Si es un ID de Deezer
  if (albumId && String(albumId).startsWith('deezer_')) {
    try {
      const dzAlbum = await getDeezerAlbumDetails(albumId);
      if (dzAlbum) {
        return {
          success: true,
          album: dzAlbum,
        };
      }
    } catch (dzErr) {
      console.warn('Error obteniendo detalles desde Deezer:', dzErr);
    }
  }

  // 1. Si es un ID de iTunes generado por el fallback
  if (albumId && String(albumId).startsWith('itunes_')) {
    const rawId = String(albumId).replace('itunes_', '');
    try {
      const res = await fetch(`https://itunes.apple.com/lookup?id=${rawId}&entity=song`);
      if (res.ok) {
        const data = await res.json();
        const albumItem = data.results.find((r) => r.wrapperType === 'collection');
        const songItems = data.results.filter((r) => r.wrapperType === 'track');
        if (albumItem) {
          const rawYear = albumItem.releaseDate ? parseInt(albumItem.releaseDate.substring(0, 4), 10) : null;
          const releaseYear = !isNaN(rawYear) && rawYear >= 1900 && rawYear <= 2100 ? rawYear : null;
          const totalTracks = albumItem.trackCount || songItems.length;
          let releaseType = 'ALBUM';
          if (totalTracks <= 2) releaseType = 'SENCILLO';
          else if (totalTracks <= 7) releaseType = 'EP';

          return {
            success: true,
            album: {
              id: albumId,
              name: albumItem.collectionName,
              artists: [albumItem.artistName],
              artist: albumItem.artistName,
              image: albumItem.artworkUrl100
                ? albumItem.artworkUrl100.replace('100x100bb', '1000x1000bb')
                : '',
              releaseDate: albumItem.releaseDate ? albumItem.releaseDate.split('T')[0] : null,
              releaseYear: releaseYear,
              release_type: releaseType,
              totalTracks: totalTracks,
              genres: albumItem.primaryGenreName ? [albumItem.primaryGenreName] : [],
              label: albumItem.copyright || null,
              external_urls: {
                spotify: `https://open.spotify.com/search/${encodeURIComponent(albumItem.artistName + ' ' + albumItem.collectionName)}`,
              },
              tracks: songItems.map((song, idx) => ({
                id: String(song.trackId || idx + 1),
                name: song.trackName,
                duration_ms: song.trackTimeMillis || 0,
                track_number: song.trackNumber || idx + 1,
              })),
            },
          };
        }
      }
    } catch (err) {
      console.warn('Error obteniendo detalles desde iTunes:', err);
    }
  }

  // 2. Si es Spotify y no está en cooldown
  if (Date.now() > spotifyCooldownUntil) {
    try {
      const token = await getSpotifyToken();

      const response = await fetch(`${SPOTIFY_ALBUM_URL}/${albumId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 429) {
        spotifyCooldownUntil = Date.now() + 60 * 1000;
      } else if (response.ok) {
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
              tracks: (album.tracks?.items || []).map((track) => ({
                id: track.id,
                name: track.name,
                duration_ms: track.duration_ms,
                track_number: track.track_number,
              })),
              external_urls: album.external_urls,
            },
          };
        }
      }
    } catch (error) {
      console.error('Error en getAlbumDetails:', error);
    }
  }

  return { success: false, error: 'No se pudo obtener la información del álbum' };
};

export const getAlbumTracksById = async (albumId) => {
  // 1. Si es un ID de iTunes generado por el fallback
  if (albumId && String(albumId).startsWith('itunes_')) {
    const rawId = String(albumId).replace('itunes_', '');
    try {
      const res = await fetch(`https://itunes.apple.com/lookup?id=${rawId}&entity=song`);
      if (res.ok) {
        const data = await res.json();
        const songItems = data.results.filter((r) => r.wrapperType === 'track');
        return {
          success: true,
          tracks: songItems.map((song, idx) => ({
            id: String(song.trackId || idx + 1),
            name: song.trackName,
            duration_ms: song.trackTimeMillis || 0,
            track_number: song.trackNumber || idx + 1,
          })),
        };
      }
    } catch (itunesErr) {
      console.warn('Error obteniendo tracks desde iTunes:', itunesErr);
    }
  }

  // 2. Si es Spotify y no está en cooldown
  if (Date.now() > spotifyCooldownUntil) {
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

      if (response.status === 429) {
        spotifyCooldownUntil = Date.now() + 60 * 1000;
      } else if (response.ok) {
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
      }
    } catch (error) {
      console.error('Error en getAlbumTracksById:', error);
    }
  }

  return { success: false, error: 'No se encontraron tracks' };
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
 * Obtiene la discografía completa de un artista organizada y deduplicada.
 * Prioriza el endpoint oficial de Spotify por artistId (/v1/artists/{id}/albums) con límite 10 por página,
 * garantizando cero contaminación con artistas homónimos o canciones no relacionadas.
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
    let resolvedArtistId = artistId;

    // 0. Si no se proporcionó artistId pero sí artistName, buscar primero el ID oficial
    if (!resolvedArtistId && artistName) {
      try {
        const searchRes = await searchArtist(artistName, 10);
        if (searchRes.success && searchRes.artists.length > 0) {
          const cleanTarget = artistName.toLowerCase().trim();
          const targetSlug = slugifyArtist(artistName).toLowerCase();
          const match = searchRes.artists.find(
            (a) =>
              a.name.toLowerCase().trim() === cleanTarget ||
              slugifyArtist(a.name).toLowerCase() === targetSlug
          );
          if (match) {
            resolvedArtistId = match.id;
          }
        }
      } catch (_) {}
    }

    // 1. Prioridad: Endpoint oficial de álbumes por ID de artista de Spotify
    // include_groups=album,single,compilation excluye 'appears_on' ajenos.
    // Spotify limita estrictamente este endpoint a 10 elementos por llamada.
    if (resolvedArtistId) {
      const offsets = [0, 10, 20, 30, 40, 50, 60, 70];
      const discoPromises = offsets.map((offset) =>
        fetch(
          `https://api.spotify.com/v1/artists/${resolvedArtistId}/albums?include_groups=album,single,compilation&limit=10&offset=${offset}&market=MX`,
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

    // 2. Fallback: sólo si no hubo resultados con el endpoint por ID, usar Search API con filtro estricto
    if (rawItems.length === 0 && artistName) {
      const offsets = [0, 10, 20, 30];
      const searchPromises = offsets.map((offset) =>
        fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(`artist:"${artistName}"`)}&type=album&limit=10&offset=${offset}&market=MX`,
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

    // Deduplicar y clasificar lanzamientos garantizando pertenencia estricta
    const cleanTarget = (artistName || '').toLowerCase().trim();
    const targetSlug = slugifyArtist(artistName || '').toLowerCase();
    const seenMap = new Map();

    rawItems.forEach((item) => {
      // Filtrar estrictamente: solo admitir releases donde el artista sea parte verificada
      if (item.artists && item.artists.length > 0) {
        const matchesArtist = item.artists.some((a) => {
          if (resolvedArtistId && a.id && a.id === resolvedArtistId) return true;
          if (cleanTarget) {
            const aName = a.name.toLowerCase().trim();
            if (aName === cleanTarget) return true;
            if (slugifyArtist(a.name).toLowerCase() === targetSlug) return true;
          }
          return false;
        });
        if (!matchesArtist) return;
      }

      const releaseType = classifyAlbumType(item);
      const releaseYear = extractReleaseYear(item.release_date);
      const cleanName = item.name
        .toLowerCase()
        .replace(/\s*\(deluxe|\s*\(re-issue|\s*\(remastered.*/i, '')
        .trim();
      const dedupeKey = `${cleanName}-${releaseType}`;

      const mappedItem = {
        id: item.id,
        name: item.name,
        artists: item.artists ? item.artists.map((a) => a.name) : [],
        image: item.images?.[0]?.url || item.images?.[1]?.url || '',
        releaseDate: item.release_date,
        releaseYear: releaseYear,
        album_type: item.album_type,
        release_type: releaseType,
        totalTracks: item.total_tracks || item.tracks?.total || 1,
        spotifyUrl:
          item.external_urls?.spotify ||
          `https://open.spotify.com/album/${item.id}`,
        external_urls: item.external_urls,
      };

      const existing = seenMap.get(dedupeKey);
      if (
        !existing ||
        (mappedItem.totalTracks &&
          mappedItem.totalTracks > (existing.totalTracks || 0))
      ) {
        seenMap.set(dedupeKey, mappedItem);
      }
    });

    const discography = Array.from(seenMap.values());

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
 * Buscando por nombre de artista o por su ID de Spotify con resolución de máxima coincidencia
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
      // Buscar por nombre con límite más amplio para hallar coincidencias exactas
      const searchRes = await searchArtist(artistNameOrId, 10);
      if (searchRes.success && searchRes.artists.length > 0) {
        const cleanTarget = artistNameOrId.toLowerCase().trim();
        const targetSlug = slugifyArtist(artistNameOrId).toLowerCase();

        // 1. Coincidencia exacta de nombre o slug
        let best = searchRes.artists.find(
          (a) =>
            a.name.toLowerCase().trim() === cleanTarget ||
            slugifyArtist(a.name).toLowerCase() === targetSlug
        );

        // 2. Coincidencia que empiece exactamente con el término buscado
        if (!best) {
          const startingMatches = searchRes.artists.filter((a) =>
            a.name.toLowerCase().trim().startsWith(cleanTarget)
          );
          if (startingMatches.length > 0) {
            best = startingMatches.sort(
              (a, b) => (b.popularity || 0) - (a.popularity || 0)
            )[0];
          }
        }

        // 3. Fallback al artista más popular de los resultados
        if (!best) {
          best = [...searchRes.artists].sort(
            (a, b) => (b.popularity || 0) - (a.popularity || 0)
          )[0];
        }

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

export { searchDeezerAlbums, getDeezerAlbumDetails } from './deezerApi.js';


