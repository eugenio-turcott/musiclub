// src/hooks/useUserReviews.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabaseService } from '../services/supabaseClient';

export function useUserReviews(user) {
  const [userReviews, setUserReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUserReviews = useCallback(async () => {
    if (!user || (!user.email && !user.name)) {
      setUserReviews([]);
      return;
    }

    setLoading(true);
    try {
      const data = await supabaseService.getUserReviews(user.email, user.name);
      setUserReviews(data || []);
    } catch (err) {
      console.error('Error fetching user reviews:', err);
      setUserReviews([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserReviews();
  }, [fetchUserReviews]);

  const reviewedAlbumIds = useMemo(() => {
    return new Set(userReviews.map((r) => r.album_id).filter(Boolean));
  }, [userReviews]);

  const isAlbumReviewed = useCallback(
    (albumId) => {
      if (!albumId) return false;
      return reviewedAlbumIds.has(albumId);
    },
    [reviewedAlbumIds]
  );

  const getUserReviewForAlbum = useCallback(
    (albumId) => {
      if (!albumId) return null;
      return userReviews.find((r) => r.album_id === albumId) || null;
    },
    [userReviews]
  );

  return {
    userReviews,
    reviewedAlbumIds,
    isAlbumReviewed,
    getUserReviewForAlbum,
    loading,
    refetchUserReviews: fetchUserReviews,
  };
}
