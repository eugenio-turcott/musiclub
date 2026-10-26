import { useState, useEffect, useCallback } from 'react';
import presentation from '../utils/poolPresentation.cjs';
import { poolService, DEFAULT_POOL_ROOM_ID } from '../services/poolService';
import { notifyContentLoaded } from '../utils/translateCrashGuard';

export function usePool(seasonId, roomId = DEFAULT_POOL_ROOM_ID) {
  const [season, setSeason] = useState({});
  const [seasons, setSeasons] = useState([]);
  const [activePool, setActivePool] = useState([]);
  const [winner, setWinner] = useState(null);
  const [poolHistory, setPoolHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSeasons = useCallback(async () => {
    try {
      const data = await poolService.getSeasons(roomId);
      setSeasons(data);
      const active = data.find((s) => s.is_active) || data[0] || {};
      setSeason(active);
    } catch (e) {
      setError(e.message || 'No se pudieron cargar los Pools de esta sala');
    }
  }, [roomId]);

  useEffect(() => {
    loadSeasons();
    const handleSeasonsChange = (e) => {
      if (e?.detail?.seasons && (e.detail.roomId || DEFAULT_POOL_ROOM_ID) === roomId) {
        setSeasons(e.detail.seasons);
        const active = e.detail.seasons.find((s) => s.is_active) || e.detail.seasons[0];
        if (active) setSeason(active);
      }
    };
    window.addEventListener('musiclub_seasons_change', handleSeasonsChange);
    return () => {
      window.removeEventListener('musiclub_seasons_change', handleSeasonsChange);
    };
  }, [loadSeasons, roomId]);

  const fetchPoolData = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    setError(null);
    try {
      const data = await poolService.getPoolData(seasonId, roomId);
      if (data.season) { setSeason(data.season); setIsPoolOpen(data.season.is_active === true && data.season.is_open === true && !presentation.poolCapacity(data.season, data.season.entry_count).full); }
      setActivePool(data.active || []);
      setWinner(data.winner || null);
      setPoolHistory(data.history || []);
    } catch (err) {
      console.error('Error in usePool:', err);
      setActivePool([]); setWinner(null); setPoolHistory([]); setIsPoolOpen(false);
      setError(err.message || 'Error al cargar los datos del Pool');
    } finally {
      if (!background) setLoading(false);
      notifyContentLoaded('pool');
    }
  }, [seasonId, roomId]);

  useEffect(() => {
    fetchPoolData();
  }, [fetchPoolData]);

  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') fetchPoolData(true); };
    window.addEventListener('focus', refresh);
    const interval = window.setInterval(refresh, 30000);
    return () => { window.removeEventListener('focus', refresh); window.clearInterval(interval); };
  }, [fetchPoolData]);

  const nominateAlbum = useCallback(
    async ({ albumId, albumData, user, note }) => {
      const result = await poolService.nominateAlbumToPool({
        albumId,
        albumData,
        user,
        note,
        seasonId: season.id,
      });
      await fetchPoolData();
      return result;
    },
    [fetchPoolData, season.id]
  );

  const editNomination = useCallback(async (proposal) => {
    const result = await poolService.editPoolNomination({ ...proposal, seasonId: season.id });
    await fetchPoolData();
    return result;
  }, [fetchPoolData, season.id]);

  const selectWinner = useCallback(
    async (albumId) => {
      const result = await poolService.selectWinner(albumId, season.id, roomId);
      await fetchPoolData();
      return result;
    },
    [season.id, fetchPoolData, roomId]
  );

  const archiveCurrentWinner = useCallback(
    async (albumId) => {
      const result = await poolService.archiveCurrentWinner(albumId, season.id, roomId);
      await fetchPoolData();
      return result;
    },
    [season.id, fetchPoolData, roomId]
  );

  const toggleWinnerReviews = useCallback(
    async (albumId, enabled) => {
      const result = await poolService.toggleWinnerReviews(albumId, enabled, season.id);
      await fetchPoolData(true);
      window.dispatchEvent(new Event('musiclub:review-access-change'));
      return result;
    },
    [season.id, fetchPoolData]
  );
  const scheduleWinnerReviews = useCallback(async (albumId, date) => {
    await poolService.scheduleWinnerReviews(albumId, date, season.id);
    await fetchPoolData(true);
    window.dispatchEvent(new Event('musiclub:review-access-change'));
  }, [season.id, fetchPoolData]);

  const [isPoolOpen, setIsPoolOpen] = useState(() => poolService.isPoolOpen());

  // Escuchar cambios globales de estado del Pool
  useEffect(() => {
    const handleStatusChange = (e) => {
      if (e?.detail?.isOpen !== undefined && (e.detail.roomId || DEFAULT_POOL_ROOM_ID) === roomId) {
        setIsPoolOpen(Boolean(e.detail.isOpen));
      }
    };
    window.addEventListener('musiclub_pool_status_change', handleStatusChange);
    return () => {
      window.removeEventListener('musiclub_pool_status_change', handleStatusChange);
    };
  }, [roomId]);

  const setPoolOpenStatus = useCallback(async (isOpen) => {
    const ok = await poolService.setPoolOpenStatus(isOpen, season.id);
    await fetchPoolData();
    return ok;
  }, [season.id, fetchPoolData, roomId]);

  const openPool = useCallback(() => setPoolOpenStatus(true), [setPoolOpenStatus]);
  const closePool = useCallback(() => setPoolOpenStatus(false), [setPoolOpenStatus]);

  const createSeason = useCallback(async (seasonData) => {
    const res = await poolService.createSeason({ ...seasonData, room_id: roomId });
    await loadSeasons();
    await fetchPoolData();
    return res;
  }, [loadSeasons, fetchPoolData, roomId]);

  const updateSeason = useCallback(async (seasonId, seasonData) => {
    const res = await poolService.updateSeason(seasonId, seasonData, roomId);
    await loadSeasons();
    await fetchPoolData();
    return res;
  }, [loadSeasons, fetchPoolData, roomId]);

  const deleteSeason = useCallback(async (seasonId) => {
    const res = await poolService.deleteSeason(seasonId, roomId);
    await loadSeasons();
    await fetchPoolData();
    return res;
  }, [loadSeasons, fetchPoolData, roomId]);

  const setActiveSeason = useCallback(async (seasonId) => {
    const res = await poolService.setActiveSeason(seasonId, roomId);
    await loadSeasons();
    await fetchPoolData();
    return res;
  }, [loadSeasons, fetchPoolData, roomId]);

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
    editNomination,
    selectWinner,
    archiveCurrentWinner,
    toggleWinnerReviews,
    scheduleWinnerReviews,
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
