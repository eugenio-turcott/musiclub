// src/hooks/useAlbums.js
import { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseClient';

const FALLBACK_ALBUMS = [
  {
    artista: 'Madonna',
    album: 'Confessions II',
    imagen: 'https://www.madonna.com/cdn/shop/files/CONFESSIONS2_745da7c4-683d-40ac-9a33-62dfc582e3a5.jpg?v=1782941623',
    id: 'fallback-1'
  },
  {
    artista: 'Little Jesus',
    album: 'Disco de Oro',
    imagen: 'https://resources.sanborns.com.mx/imagenes-sanborns-ii/1200/190759443620.jpg',
    id: 'fallback-2'
  },
  // ... más fallbacks
];

export function useAlbums() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const data = await supabaseService.getActiveAlbums();

      // Mapear al formato esperado por los componentes
      const mappedAlbums = data.map(album => ({
        id: album.id,
        album: album.album_name,
        artista: album.artist_name,
        imagen: album.image_url,
        spotifyLink: album.spotify_link,
        youtubeLink: album.youtube_link,
        appleMusicLink: album.apple_music_link,
        status: album.status
      }));

      if (mappedAlbums.length > 0) {
        setAlbums(mappedAlbums);
        setError(null);
      } else {
        setAlbums(FALLBACK_ALBUMS);
        setError('Usando álbumes de ejemplo (sin datos)');
      }
    } catch (error) {
      console.warn('Error fetching albums:', error);
      setAlbums(FALLBACK_ALBUMS);
      setError('Usando álbumes de ejemplo (error de conexión)');
    }
    setLoading(false);
  };

  const markAlbumAsInactive = async (albumName, artistName) => {
    try {
      await supabaseService.markAlbumInactive(albumName, artistName);
      setAlbums((prev) =>
        prev.filter((a) => !(a.album === albumName && a.artista === artistName))
      );
      return true;
    } catch (error) {
      console.error('Error al desactivar álbum:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  return {
    albums,
    loading,
    error,
    refetch: fetchAlbums,
    markAlbumAsInactive,
  };
}