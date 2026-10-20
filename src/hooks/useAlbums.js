import editions from '../utils/releaseEditions.cjs';
// src/hooks/useAlbums.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { registerUntranslatableEntities } from '../utils/translateCrashGuard';


export function useAlbums(initialAlbums = []) {
  const [albums, setAlbums] = useState(()=>editions.groupReleaseEditions(initialAlbums));
  const [winner, setWinner] = useState(() => initialAlbums.find(a => a.status === 'GANADOR') || null);
  const [loading, setLoading] = useState(initialAlbums.length === 0);
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
        created_at: album.created_at,
        tracks: album.tracks || [],
        spotify_verified: album.spotify_verified || false,
        reviews_enabled: album.reviews_enabled || false,
      }));

      if (mappedAlbums.length > 0) {
        // Blindaje universal de releases, artistas y curadores/usuarios contra traducción (V.8.11)
        registerUntranslatableEntities({
          releases: mappedAlbums.map((a) => a.album).filter(Boolean),
          artists: mappedAlbums.map((a) => a.artista).filter(Boolean),
          people: allData.map((a) => a.added_by).filter(Boolean),
        });

        const winnerAlbum = mappedAlbums.find((a) => a.status === 'GANADOR');
        setAlbums(editions.groupReleaseEditions(mappedAlbums));
        setWinner(winnerAlbum || null);
        setError(null);
      } else {
        setAlbums([]);
        setWinner(null);
        setError('Todavía no hay álbumes disponibles.');
      }
    } catch (error) {
      console.warn('Error fetching albums:', error);
      // Preserve the last real snapshot when the connection fails.
      setError('No pudimos actualizar el catálogo. Inténtalo de nuevo.');
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
    if (initialAlbums.length === 0) fetchAlbums();
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
