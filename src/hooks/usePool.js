// src/hooks/usePool.js
import { useState, useEffect, useCallback } from 'react';
import { poolService, DEFAULT_SEASON } from '../services/poolService';

export function usePool(seasonId = DEFAULT_SEASON.id) {
  const [season, setSeason] = useState(DEFAULT_SEASON);
  const [seasons, setSeasons] = useState(() => poolService.getAllSeasons());
  const [activePool, setActivePool] = useState([]);
  const [winner, setWinner] = useState(null);
  const [poolHistory, setPoolHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSeasons = useCallback(async () => {
    try {
      const data = await poolService.getSeasons();
      setSeasons(data);
      const active = data.find((s) => s.is_active) || data[0] || DEFAULT_SEASON;
      setSeason(active);
    } catch (e) {
      console.error('Error cargando seasons:', e);
    }
  }, []);

  useEffect(() => {
    loadSeasons();
    const handleSeasonsChange = (e) => {
      if (e?.detail?.seasons) {
        setSeasons(e.detail.seasons);
        const active = e.detail.seasons.find((s) => s.is_active) || e.detail.seasons[0];
        if (active) setSeason(active);
      }
    };
    window.addEventListener('musiclub_seasons_change', handleSeasonsChange);
    return () => {
      window.removeEventListener('musiclub_seasons_change', handleSeasonsChange);
    };
  }, [loadSeasons]);

  const fetchPoolData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await poolService.getPoolData(seasonId);
      if (data.season) setSeason(data.season);
      setActivePool(data.active || []);
      setWinner(data.winner || null);
      setPoolHistory(data.history || []);
    } catch (err) {
      console.error('Error in usePool:', err);
      setError(err.message || 'Error al cargar los datos del Pool');
    } finally {
      setLoading(false);
    }
  }, [seasonId]);

  useEffect(() => {
    fetchPoolData();
  }, [fetchPoolData]);

  const nominateAlbum = useCallback(
    async ({ albumId, albumData, user, note }) => {
      const result = await poolService.nominateAlbumToPool({
        albumId,
        albumData,
        user,
        note,
      });
      await fetchPoolData();
      return result;
    },
    [fetchPoolData]
  );

  const selectWinner = useCallback(
    async (albumId) => {
      const result = await poolService.selectWinner(albumId, seasonId);
      await fetchPoolData();
      return result;
    },
    [seasonId, fetchPoolData]
  );

  const archiveCurrentWinner = useCallback(
    async (albumId) => {
      const result = await poolService.archiveCurrentWinner(albumId, seasonId);
      await fetchPoolData();
      return result;
    },
    [seasonId, fetchPoolData]
  );

  const toggleWinnerReviews = useCallback(
    async (albumId, enabled) => {
      const result = await poolService.toggleWinnerReviews(albumId, enabled);
      if (winner && winner.id === albumId) {
        setWinner((prev) => (prev ? { ...prev, reviews_enabled: enabled } : null));
      }
      return result;
    },
    [winner]
  );

  const [isPoolOpen, setIsPoolOpen] = useState(() => poolService.isPoolOpen());

  // Escuchar cambios globales de estado del Pool
  useEffect(() => {
    const handleStatusChange = (e) => {
      if (e?.detail?.isOpen !== undefined) {
        setIsPoolOpen(Boolean(e.detail.isOpen));
      }
    };
    window.addEventListener('musiclub_pool_status_change', handleStatusChange);
    return () => {
      window.removeEventListener('musiclub_pool_status_change', handleStatusChange);
    };
  }, []);

  const setPoolOpenStatus = useCallback(async (isOpen) => {
    const ok = await poolService.setPoolOpenStatus(isOpen);
    if (ok) {
      setIsPoolOpen(Boolean(isOpen));
    }
    return ok;
  }, []);

  const openPool = useCallback(() => setPoolOpenStatus(true), [setPoolOpenStatus]);
  const closePool = useCallback(() => setPoolOpenStatus(false), [setPoolOpenStatus]);

  const createSeason = useCallback(async (seasonData) => {
    const res = await poolService.createSeason(seasonData);
    await loadSeasons();
    return res;
  }, [loadSeasons]);

  const updateSeason = useCallback(async (seasonId, seasonData) => {
    const res = await poolService.updateSeason(seasonId, seasonData);
    await loadSeasons();
    return res;
  }, [loadSeasons]);

  const deleteSeason = useCallback(async (seasonId) => {
    const res = await poolService.deleteSeason(seasonId);
    await loadSeasons();
    return res;
  }, [loadSeasons]);

  const setActiveSeason = useCallback(async (seasonId) => {
    const res = await poolService.setActiveSeason(seasonId);
    await loadSeasons();
    return res;
  }, [loadSeasons]);

  return {
    season,
    seasons,
    activePool,
    winner,
    poolHistory,
    totalActive: activePool.length,
    totalHistory: poolHistory.length,
    isPoolOpen,
    loading,
    error,
    nominateAlbum,
    selectWinner,
    archiveCurrentWinner,
    toggleWinnerReviews,
    setPoolOpenStatus,
    openPool,
    closePool,
    createSeason,
    updateSeason,
    deleteSeason,
    setActiveSeason,
    refetch: fetchPoolData,
    reloadSeasons: loadSeasons,
  };
}

export default usePool;
