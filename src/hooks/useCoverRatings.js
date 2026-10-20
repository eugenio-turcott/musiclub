// src/hooks/useCoverRatings.js
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabaseService } from '../services/supabaseClient';
import identity from '../utils/coverRatingIdentity.cjs';

export function useCoverRatings(user = null) {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ownSnapshot, setOwnSnapshot] = useState({ account: null, ratings: [] });
  const account = user?.id || null;
  const accountRef = useRef(account);
  accountRef.current = account;
  const userEmail = user?.email;

  useEffect(() => {
    let cancelled = false;
    if (!account) {
      setOwnSnapshot({ account: null, ratings: [] });
      return;
    }
    supabaseService.getUserCoverRatings({ id: account, email: userEmail }).then(data => {
      if (!cancelled) setOwnSnapshot({ account, ratings: data });
    }).catch(() => {
      if (!cancelled) setError('No pudimos cargar tus calificaciones de portadas. Recarga para intentarlo de nuevo.');
    });
    return () => { cancelled = true; };
  }, [account, userEmail]);

  const fetchRatings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await supabaseService.getAllCoverRatings();
      setRatings(data || []);
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
    const ownRows = ownSnapshot.account === account ? ownSnapshot.ratings : [];
    return identity.ownCoverRatings([...ratings, ...ownRows], user);
  }, [ratings, ownSnapshot, account, user]);

  // Enviar o actualizar calificación de portada
  const submitRating = useCallback(
    async ({ album_id, rating, aesthetic_tags = [], comment = '' }) => {
      if (!album_id || !rating) return null;
      if (!user?.id) throw new Error('Inicia sesión para calificar.');

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
        // A response from the previous session must not enter the new account's view.
        if (accountRef.current !== user.id) return saved;
        setOwnSnapshot(prev => ({ account: user.id, ratings: [saved, ...(prev.account === user.id ? prev.ratings.filter(r => r.album_id !== album_id) : [])] }));

        // Actualizar estado local reactivamente sin esperar refetch
        setRatings((prev) => {
          const list = [...prev];
          const idx = list.findIndex(
            (r) =>
              r.album_id === album_id &&
              identity.ownsCoverRating(r, user)
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
      if (!existing || !user?.id) throw new Error('No se encontró tu calificación.');
      try {
        await supabaseService.deleteCoverRating(
          existing?.id || null,
          album_id
        );
        if (accountRef.current !== user.id) return true;
        setOwnSnapshot(prev => ({ account: user.id, ratings: prev.account === user.id ? prev.ratings.filter(r => r.id !== existing.id) : [] }));
        setRatings((prev) =>
          prev.filter(
            (r) =>
              !(
                r.album_id === album_id &&
                identity.ownsCoverRating(r, user)
              )
          )
        );
        return true;
      } catch (err) {
        console.error('Error al eliminar calificación de portada:', err);
        throw err;
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
