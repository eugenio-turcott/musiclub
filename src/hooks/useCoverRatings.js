// src/hooks/useCoverRatings.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabaseService } from '../services/supabaseClient';

export function useCoverRatings(user = null) {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRatings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await supabaseService.getAllCoverRatings();
      setRatings(data || []);
      setError(null);
    } catch (err) {
      console.warn('Error fetching cover ratings:', err);
      setError(err.message || 'Error al cargar calificaciones de portadas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  // Mapa de estadísticas por álbum: { [album_id]: { avg, count, tags: [{ tag, count }], topRating } }
  const coverStats = useMemo(() => {
    const map = new Map();

    ratings.forEach((item) => {
      const albId = item.album_id;
      if (!albId) return;

      if (!map.has(albId)) {
        map.set(albId, {
          album_id: albId,
          ratings: [],
          tagsMap: {},
          lastRatedAt: item.created_at,
        });
      }

      const entry = map.get(albId);
      const r = Number(item.rating);
      if (!isNaN(r)) entry.ratings.push(r);

      if (Array.isArray(item.aesthetic_tags)) {
        item.aesthetic_tags.forEach((tag) => {
          if (!tag) return;
          entry.tagsMap[tag] = (entry.tagsMap[tag] || 0) + 1;
        });
      }

      if (new Date(item.created_at) > new Date(entry.lastRatedAt || 0)) {
        entry.lastRatedAt = item.created_at;
      }
    });

    const computed = new Map();
    map.forEach((val, albId) => {
      const count = val.ratings.length;
      const sum = val.ratings.reduce((acc, curr) => acc + curr, 0);
      const avg = count > 0 ? parseFloat((sum / count).toFixed(1)) : 0;

      const tagsList = Object.entries(val.tagsMap)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);

      computed.set(albId, {
        album_id: albId,
        avgRating: avg,
        totalVotes: count,
        topTags: tagsList,
        lastRatedAt: val.lastRatedAt,
      });
    });

    return computed;
  }, [ratings]);

  // Mapa de calificaciones del usuario actual: { [album_id]: userRatingObject }
  const userRatingsMap = useMemo(() => {
    const map = new Map();
    if (!user) return map;

    const userEmail = user?.email?.toLowerCase()?.trim();
    const userName = user?.user_metadata?.full_name || user?.name;

    ratings.forEach((item) => {
      const itemEmail = item.user_email?.toLowerCase()?.trim();
      const itemName = item.user_name?.toLowerCase()?.trim();

      const isMatch =
        (userEmail && itemEmail === userEmail) ||
        (item.user_id && user.id && item.user_id === user.id) ||
        (userName && itemName === userName.toLowerCase().trim());

      if (isMatch) {
        map.set(item.album_id, item);
      }
    });

    return map;
  }, [ratings, user]);

  // Enviar o actualizar calificación de portada
  const submitRating = useCallback(
    async ({ album_id, rating, aesthetic_tags = [], comment = '' }) => {
      if (!album_id || !rating) return null;

      const userEmail = user?.email || null;
      const userName =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.name ||
        (userEmail ? userEmail.split('@')[0] : 'Crítico Anónimo');
      const userAvatar =
        user?.user_metadata?.avatar_url ||
        user?.user_metadata?.picture ||
        user?.avatar_url ||
        null;

      const payload = {
        album_id,
        rating,
        aesthetic_tags,
        comment,
        user_id: user?.id || null,
        user_email: userEmail,
        user_name: userName,
        user_avatar: userAvatar,
      };

      try {
        const saved = await supabaseService.submitCoverRating(payload);

        // Actualizar estado local reactivamente sin esperar refetch
        setRatings((prev) => {
          const list = [...prev];
          const idx = list.findIndex(
            (r) =>
              r.album_id === album_id &&
              ((userEmail && r.user_email === userEmail) ||
                (userName && r.user_name === userName))
          );
          if (idx >= 0) {
            list[idx] = { ...list[idx], ...saved };
          } else {
            list.unshift(saved);
          }
          return list;
        });

        return saved;
      } catch (err) {
        console.error('Error al guardar calificación de portada:', err);
        throw err;
      }
    },
    [user]
  );

  // Eliminar calificación de portada
  const deleteRating = useCallback(
    async (album_id) => {
      if (!album_id) return false;
      const existing = userRatingsMap.get(album_id);
      try {
        await supabaseService.deleteCoverRating(
          existing?.id || null,
          album_id,
          user?.email || null
        );
        setRatings((prev) =>
          prev.filter(
            (r) =>
              !(
                r.album_id === album_id &&
                ((user?.email && r.user_email === user.email) ||
                  (user?.name && r.user_name === user.name))
              )
          )
        );
        return true;
      } catch (err) {
        console.error('Error al eliminar calificación de portada:', err);
        return false;
      }
    },
    [user, userRatingsMap]
  );

  return {
    ratings,
    loading,
    error,
    coverStats,
    userRatingsMap,
    submitRating,
    deleteRating,
    refetch: fetchRatings,
  };
}
