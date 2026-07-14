// src/hooks/useAlbums.js
import { useState, useEffect } from 'react';
import { albumsApi } from '../services/api'; // <-- IMPORTANTE: agregar esta línea

const FALLBACK_ALBUMS = [
  {
    artista: 'Madonna',
    album: 'Confessions II',
    imagen:
      'https://www.madonna.com/cdn/shop/files/CONFESSIONS2_745da7c4-683d-40ac-9a33-62dfc582e3a5.jpg?v=1782941623',
  },
  {
    artista: 'Little Jesus',
    album: 'Disco de Oro',
    imagen:
      'https://resources.sanborns.com.mx/imagenes-sanborns-ii/1200/190759443620.jpg',
  },
  {
    artista: 'Fujii Kaze',
    album: 'Prema',
    imagen:
      'https://m.media-amazon.com/images/I/71AEchV3YiL._UF1000,1000_QL80_.jpg',
  },
  {
    artista: 'Rosé',
    album: 'Rosie',
    imagen:
      'https://m.media-amazon.com/images/I/91xxhrUT8yL._UF1000,1000_QL80_.jpg',
  },
  {
    artista: 'pH-1',
    album: 'WHAT HAVE WE DONE',
    imagen:
      'https://cdn-images.dzcdn.net/images/cover/09a9157913ade51c21fbfd65d290275b/0x1900-000000-80-0-0.jpg',
  },
  {
    artista: 'Knocked Loose',
    album: "You Won't Go...",
    imagen:
      'https://m.media-amazon.com/images/I/81H4eStQkKL._UF1000,1000_QL80_.jpg',
  },
];

export function useAlbums() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const result = await albumsApi.getActiveAlbums();

      if (result.albums && result.albums.length > 0) {
        setAlbums(result.albums);
        setError(null);
      } else {
        setAlbums(FALLBACK_ALBUMS);
        setError('Usando álbumes de ejemplo (sin datos)');
      }
    } catch (error) {
      console.warn('Usando álbumes de ejemplo:', error);
      setAlbums(FALLBACK_ALBUMS);
      setError('Usando álbumes de ejemplo (error de conexión)');
    }
    setLoading(false);
  };

  const markAlbumAsInactive = async (album, artista) => {
    try {
      await albumsApi.markAsInactive(album, artista);
      setAlbums((prev) =>
        prev.filter((a) => !(a.album === album && a.artista === artista))
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
