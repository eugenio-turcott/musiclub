// src/hooks/useAlbums.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

const FALLBACK_ALBUMS = [
  {
    id: 'fallback-1',
    album: 'Confessions II',
    artista: 'Madonna',
    imagen:
      'https://www.madonna.com/cdn/shop/files/CONFESSIONS2_745da7c4-683d-40ac-9a33-62dfc582e3a5.jpg?v=1782941623',
    status: 'ACTIVO',
    added_by: 'Tadeo',
    added_by_email: 'tadeoemiliano@hotmail.com',
    reviews_enabled: false,
  },
  {
    id: 'fallback-2',
    album: 'Disco de Oro',
    artista: 'Little Jesus',
    imagen:
      'https://resources.sanborns.com.mx/imagenes-sanborns-ii/1200/190759443620.jpg',
    status: 'ACTIVO',
    added_by: 'Jesús',
    added_by_email: 'jesusroberto005@gmail.com',
    reviews_enabled: false,
  },
  {
    id: 'fallback-3',
    album: 'Prema',
    artista: 'Fujii Kaze',
    imagen:
      'https://m.media-amazon.com/images/I/71AEchV3YiL._UF1000,1000_QL80_.jpg',
    status: 'ACTIVO',
    added_by: 'Devie',
    added_by_email: 'devshtp24@gmail.com',
    reviews_enabled: false,
  },
  {
    id: 'fallback-4',
    album: 'Titanic Rising',
    artista: 'Weyes Blood',
    imagen:
      'https://cdn-images.dzcdn.net/images/cover/f2edcff8208b6c8aeb2dccff39209043/1900x1900-000000-80-0-0.jpg',
    status: 'ACTIVO',
    added_by: 'Cait',
    added_by_email: 'ricardodg351@gmail.com',
    reviews_enabled: false,
  },
  {
    id: 'fallback-5',
    album: 'Bodhiria',
    artista: 'Judeline',
    imagen:
      'https://cdn-images.dzcdn.net/images/cover/a1041dd029a6ac9dd7eeb9f51c99517c/0x1900-000000-80-0-0.jpg',
    status: 'ACTIVO',
    added_by: 'Valentín',
    added_by_email: 'valentihdz28@gmail.com',
    reviews_enabled: false,
  },
];

export function useAlbums() {
  const [albums, setAlbums] = useState([]);
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlbums = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const step = 1000;
      let allData = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('albums')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, from + step - 1);

        if (error) throw new Error(error.message);
        if (data && data.length > 0) {
          allData.push(...data);
          if (data.length < step) hasMore = false;
          else from += step;
        } else {
          hasMore = false;
        }
      }

      const mappedAlbums = allData.map((album) => ({
        id: album.id,
        album: album.album_name,
        artista: album.artist_name,
        imagen: album.image_url,
        spotifyLink: album.spotify_link,
        youtubeLink: album.youtube_link,
        appleMusicLink: album.apple_music_link,
        otherLink: album.other_link,
        mbid: album.mbid,
        release_type: album.release_type || 'ALBUM',
        release_date: album.release_date,
        release_year: album.release_year,
        genres: album.genres || [],
        label: album.label,
        country: album.country,
        barcode: album.barcode,
        total_tracks: album.total_tracks,
        status: album.status || 'INDIVIDUAL',
        user_id: album.user_id,
        created_at: album.created_at,
        tracks: album.tracks || [],
        spotify_verified: album.spotify_verified || false,
        reviews_enabled: album.reviews_enabled || false,
      }));

      if (mappedAlbums.length > 0) {
        const winnerAlbum = mappedAlbums.find((a) => a.status === 'GANADOR');
        setAlbums(mappedAlbums);
        setWinner(winnerAlbum || null);
        setError(null);
      } else {
        setAlbums(FALLBACK_ALBUMS);
        setWinner(null);
        setError('Usando álbumes de ejemplo (sin datos)');
      }
    } catch (error) {
      console.warn('Error fetching albums:', error);
      setAlbums(FALLBACK_ALBUMS);
      setWinner(null);
      setError('Usando álbumes de ejemplo (error de conexión)');
    }
    setLoading(false);
  }, []);

  const markAlbumAsInactive = useCallback(
    async (albumName, artistName) => {
      try {
        await supabase
          .from('albums')
          .update({ reviews_enabled: true })
          .eq('album_name', albumName)
          .eq('artist_name', artistName);

        // Refrescar lista
        await fetchAlbums();
        return true;
      } catch (error) {
        console.error('Error al marcar álbum:', error);
        return false;
      }
    },
    [fetchAlbums]
  );

  const resetWinner = useCallback(async () => {
    try {
      await supabase
        .from('albums')
        .update({ reviews_enabled: false })
        .eq('reviews_enabled', true);

      await fetchAlbums();
      return true;
    } catch (error) {
      console.error('Error al resetear ganador:', error);
      return false;
    }
  }, [fetchAlbums]);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  return {
    albums,
    winner,
    loading,
    error,
    refetch: fetchAlbums,
    markAlbumAsInactive,
    resetWinner,
  };
}
