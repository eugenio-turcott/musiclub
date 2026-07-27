// src/services/spotifyApi.js

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
                'Authorization': 'Basic ' + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)
            },
            body: 'grant_type=client_credentials'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error de Spotify: ${errorData.error_description || response.statusText}`);
        }

        const data = await response.json();

        if (data.access_token) {
            accessToken = data.access_token;
            tokenExpiration = Date.now() + (data.expires_in * 1000);
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
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Error en búsqueda: ${response.status}`);
        }

        const data = await response.json();

        if (data.albums && data.albums.items) {
            return {
                success: true,
                albums: data.albums.items.map(album => ({
                    id: album.id,
                    name: album.name,
                    artists: album.artists.map(a => a.name),
                    image: album.images[0]?.url || '',
                    releaseDate: album.release_date,
                    totalTracks: album.total_tracks,
                    tracks: [],
                    external_urls: album.external_urls
                }))
            };
        }

        return { success: false, error: 'No se encontraron álbumes' };
    } catch (error) {
        console.error('Error en searchAlbum:', error);
        return { success: false, error: error.message };
    }
};

export const getAlbumDetails = async (albumId) => {
    try {
        const token = await getSpotifyToken();

        const response = await fetch(
            `${SPOTIFY_ALBUM_URL}/${albumId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

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
                    artists: album.artists.map(a => a.name),
                    image: album.images[0]?.url || '',
                    releaseDate: album.release_date,
                    totalTracks: album.total_tracks,
                    tracks: album.tracks.items.map(track => ({
                        id: track.id,
                        name: track.name,
                        duration_ms: track.duration_ms,
                        track_number: track.track_number
                    })),
                    external_urls: album.external_urls
                }
            };
        }

        return { success: false, error: 'No se encontró el álbum' };
    } catch (error) {
        console.error('Error en getAlbumDetails:', error);
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