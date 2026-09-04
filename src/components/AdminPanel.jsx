import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';
import { supabase } from '../services/supabaseClient';
import { poolService, DEFAULT_SEASON } from '../services/poolService';
import { searchAlbum, getAlbumDetails } from '../services/spotifyApi';
import {
  SpotifyLogo,
  AppleMusicLogo,
  YouTubeLogo,
  DeezerLogo,
} from './common/PlatformLogos';

export function AdminPanel({ onClose, isPage = true }) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('pool'); // 'pool' | 'seasons' | 'catalog' | 'reviews' | 'users'

  // Global Loading & Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Pool State
  const [isPoolOpen, setIsPoolOpen] = useState(() => poolService.isPoolOpen());
  const [poolActive, setPoolActive] = useState([]);
  const [poolWinner, setPoolWinner] = useState(null);

  // Seasons Management State
  const [seasons, setSeasons] = useState(() => poolService.getAllSeasons());
  const [activeSeason, setActiveSeasonState] = useState(DEFAULT_SEASON);
  const [selectedSeasonId, setSelectedSeasonId] = useState(DEFAULT_SEASON.id);
  const [editingSeason, setEditingSeason] = useState(null);
  const [isCreatingSeason, setIsCreatingSeason] = useState(false);
  const [showDeleteSeasonConfirm, setShowDeleteSeasonConfirm] = useState(null);
  const [seasonFormData, setSeasonFormData] = useState({
    season_number: 1,
    name: '',
    start_date: '',
    end_date: '',
    is_active: false,
    description: '',
  });

  // Universal Catalog State
  const [albums, setAlbums] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogFormatFilter, setCatalogFormatFilter] = useState('ALL');
  const [selectedAlbumForAction, setSelectedAlbumForAction] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isSyncingSpotify, setIsSyncingSpotify] = useState(false);

  // Reviews Moderation State
  const [reviews, setReviews] = useState([]);
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewFilter, setReviewFilter] = useState('ALL'); // 'ALL' | 'WITH_COMMENT' | 'TOP' | 'LOW'
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  // Users State
  const [profiles, setProfiles] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);

  // Show transient toast notification
  const showToast = (message) => {
    setActionSuccess(message);
    setTimeout(() => {
      setActionSuccess(null);
    }, 3500);
  };

  // Load All System Data
  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Cargar Seasons
      const seasonsData = await poolService.getSeasons();
      setSeasons(seasonsData);
      const active = seasonsData.find((s) => s.is_active) || seasonsData[0] || DEFAULT_SEASON;
      setActiveSeasonState(active);

      // 2. Cargar datos del Pool de la temporada seleccionada
      const poolData = await poolService.getPoolData(selectedSeasonId || active.id);
      setPoolActive(poolData.active || []);
      setPoolWinner(poolData.winner || null);
      setIsPoolOpen(poolService.isPoolOpen());

      // 3. Cargar Catálogo Universal de Álbumes
      const { data: albumsData, error: albumsError } = await supabase
        .from('albums')
        .select('*')
        .order('created_at', { ascending: false });

      if (albumsError) throw new Error(albumsError.message);
      setAlbums(albumsData || []);

      // 4. Cargar Reseñas para Moderación
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(
          `
          *,
          album:album_id (id, album_name, artist_name, image_url)
        `
        )
        .order('created_at', { ascending: false });

      if (!reviewsError) {
        setReviews(reviewsData || []);
      }

      // 5. Cargar Perfiles de Usuarios
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!profilesError) {
        setProfiles(profilesData || []);
      }
    } catch (err) {
      console.error('Error cargando datos de administración:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedSeasonId]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // =========================================================================
  // SEASONS ACTIONS
  // =========================================================================
  const handleOpenCreateSeason = () => {
    const nextNumber = seasons.length > 0 ? Math.max(...seasons.map((s) => s.season_number || 1)) + 1 : 1;
    setSeasonFormData({
      season_number: nextNumber,
      name: `Temporada ${nextNumber}`,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      is_active: false,
      description: '',
    });
    setIsCreatingSeason(true);
    setEditingSeason(null);
  };

  const handleOpenEditSeason = (season) => {
    setEditingSeason(season);
    setSeasonFormData({
      season_number: season.season_number || 1,
      name: season.name || '',
      start_date: season.start_date || '',
      end_date: season.end_date || '',
      is_active: Boolean(season.is_active),
      description: season.description || '',
    });
    setIsCreatingSeason(false);
  };

  const handleSaveSeason = async (e) => {
    e.preventDefault();
    try {
      if (isCreatingSeason) {
        await poolService.createSeason(seasonFormData);
        showToast(`🏆 Temporada "${seasonFormData.name}" creada exitosamente.`);
      } else if (editingSeason) {
        await poolService.updateSeason(editingSeason.id, seasonFormData);
        showToast(`✏️ Temporada "${seasonFormData.name}" actualizada.`);
      }
      setIsCreatingSeason(false);
      setEditingSeason(null);
      await loadAllData();
    } catch (err) {
      alert(`Error al guardar temporada: ${err.message}`);
    }
  };

  const handleDeleteSeason = async (seasonId) => {
    try {
      if (seasons.length <= 1) {
        alert('No puedes eliminar la única temporada del sistema.');
        return;
      }
      await poolService.deleteSeason(seasonId);
      showToast('🗑️ Temporada eliminada.');
      setShowDeleteSeasonConfirm(null);
      await loadAllData();
    } catch (err) {
      alert(`Error al eliminar temporada: ${err.message}`);
    }
  };

  const handleActivateSeason = async (seasonId) => {
    try {
      await poolService.setActiveSeason(seasonId);
      setSelectedSeasonId(seasonId);
      showToast('🌟 Temporada activada como oficial.');
      await loadAllData();
    } catch (err) {
      alert(`Error al activar temporada: ${err.message}`);
    }
  };

  // =========================================================================
  // POOL ACTIONS
  // =========================================================================
  const handleTogglePoolOpen = async () => {
    const nextState = !isPoolOpen;
    const ok = await poolService.setPoolOpenStatus(nextState);
    if (ok) {
      setIsPoolOpen(nextState);
      showToast(
        nextState
          ? '🔓 Pool abierto con éxito para nuevas propuestas de la comunidad.'
          : '🔒 Pool cerrado para nuevas propuestas. Los miembros ya no pueden postular.'
      );
    }
  };

  const handleSetWinner = async (albumId) => {
    try {
      await poolService.selectWinner(albumId, selectedSeasonId);
      showToast('🏆 Álbum seleccionado como Ganador Semanal con reseñas habilitadas.');
      await loadAllData();
    } catch (err) {
      alert(`Error al coronar ganador: ${err.message}`);
    }
  };

  const handleArchiveWinner = async (albumId) => {
    try {
      await poolService.archiveCurrentWinner(albumId, selectedSeasonId);
      showToast('🎓 Ganador archivado y graduado al historial de la temporada.');
      await loadAllData();
    } catch (err) {
      alert(`Error al archivar: ${err.message}`);
    }
  };

  const handleToggleWinnerReviews = async (albumId, currentStatus) => {
    try {
      await poolService.toggleWinnerReviews(albumId, !currentStatus);
      showToast(
        !currentStatus
          ? '💬 Reseñas habilitadas para el álbum ganador.'
          : '⏸️ Reseñas pausadas temporalmente.'
      );
      await loadAllData();
    } catch (err) {
      alert(`Error al alternar reseñas: ${err.message}`);
    }
  };

  const handleRemoveFromPool = async (albumId) => {
    if (
      !window.confirm(
        '¿Mover este álbum fuera del Pool y dejarlo solo en el Catálogo Universal?'
      )
    )
      return;
    try {
      try {
        await supabase
          .from('pool_entries')
          .delete()
          .eq('album_id', albumId);
      } catch (e) {}

      showToast('📥 Álbum removido del Pool activo.');
      await loadAllData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // =========================================================================
  // CATALOG ACTIONS
  // =========================================================================
  const handleOpenEditModal = (album) => {
    setEditingAlbum({
      id: album.id,
      album_name: album.album_name || '',
      artist_name: album.artist_name || '',
      image_url: album.image_url || '',
      spotify_link: album.spotify_link || '',
      youtube_link: album.youtube_link || '',
      apple_music_link: album.apple_music_link || '',
      release_type: album.release_type || 'ALBUM',
      release_year: album.release_year || '',
      release_date: album.release_date || '',
      label: album.label || '',
      country: album.country || '',
      barcode: album.barcode || '',
      total_tracks: album.total_tracks || '',
      reviews_enabled: Boolean(album.reviews_enabled),
    });
  };

  const handleSaveAlbumEdit = async (e) => {
    e.preventDefault();
    if (!editingAlbum) return;
    setIsSavingEdit(true);
    try {
      const year = editingAlbum.release_year
        ? parseInt(editingAlbum.release_year, 10)
        : null;

      const { error } = await supabase
        .from('albums')
        .update({
          album_name: editingAlbum.album_name.trim(),
          artist_name: editingAlbum.artist_name.trim(),
          image_url: editingAlbum.image_url.trim(),
          spotify_link: editingAlbum.spotify_link?.trim() || null,
          youtube_link: editingAlbum.youtube_link?.trim() || null,
          apple_music_link: editingAlbum.apple_music_link?.trim() || null,
          other_link: editingAlbum.other_link?.trim() || null,
          release_type: editingAlbum.release_type,
          release_year: isNaN(year) ? null : year,
          release_date: editingAlbum.release_date || null,
          label: editingAlbum.label?.trim() || null,
          country: editingAlbum.country?.trim() || null,
          barcode: editingAlbum.barcode?.trim() || null,
          total_tracks: editingAlbum.total_tracks
            ? parseInt(editingAlbum.total_tracks, 10)
            : null,
          reviews_enabled: editingAlbum.reviews_enabled,
        })
        .eq('id', editingAlbum.id);

      if (error) throw new Error(error.message);

      showToast(`✏️ Álbum "${editingAlbum.album_name}" actualizado exitosamente.`);
      setEditingAlbum(null);
      await loadAllData();
    } catch (err) {
      alert(`Error al guardar cambios: ${err.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleSyncSpotifyMetadata = async () => {
    if (!editingAlbum?.album_name) return;
    setIsSyncingSpotify(true);
    try {
      const query = editingAlbum.artist_name
        ? `${editingAlbum.album_name} ${editingAlbum.artist_name}`
        : editingAlbum.album_name;

      const res = await searchAlbum(query);
      if (res?.success && Array.isArray(res.albums) && res.albums.length > 0) {
        const top = res.albums[0];
        const detailsRes = await getAlbumDetails(top.id);
        const details = detailsRes?.album || top;

        const tracks = (details.tracks || []).map((t, idx) => ({
          id: t.id || `track-${idx + 1}`,
          name: t.name,
          duration_ms: t.duration_ms || 0,
          track_number: t.track_number || idx + 1,
        }));

        setEditingAlbum((prev) => ({
          ...prev,
          image_url: details.image || top.image || prev.image_url,
          spotify_link:
            details.external_urls?.spotify ||
            `https://open.spotify.com/album/${top.id}` ||
            prev.spotify_link,
          release_type:
            details.release_type ||
            details.releaseType ||
            top.release_type ||
            prev.release_type,
          release_year:
            details.releaseYear ||
            top.releaseYear ||
            prev.release_year,
          release_date:
            details.releaseDate ||
            top.releaseDate ||
            prev.release_date,
          tracks: tracks.length > 0 ? tracks : prev.tracks,
        }));
        showToast('✨ Metadatos oficiales sincronizados desde Spotify.');
      } else {
        alert('No se encontraron resultados en Spotify para esta búsqueda.');
      }
    } catch (err) {
      alert(`Error al sincronizar con Spotify: ${err.message}`);
    } finally {
      setIsSyncingSpotify(false);
    }
  };

  const handleDeleteAlbum = async () => {
    if (!selectedAlbumForAction) return;
    try {
      await supabase
        .from('reviews')
        .delete()
        .eq('album_id', selectedAlbumForAction.id);

      try {
        await supabase
          .from('pool_entries')
          .delete()
          .eq('album_id', selectedAlbumForAction.id);
      } catch (e) {}

      const { error } = await supabase
        .from('albums')
        .delete()
        .eq('id', selectedAlbumForAction.id);

      if (error) throw new Error(error.message);

      showToast(`🗑️ Álbum "${selectedAlbumForAction.album_name}" eliminado.`);
      setShowDeleteConfirm(false);
      setSelectedAlbumForAction(null);
      await loadAllData();
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  const handleSendToPool = async (album) => {
    try {
      await poolService.nominateAlbumToPool({
        albumId: album.id,
        albumData: {
          albumName: album.album_name,
          artistName: album.artist_name,
          imageUrl: album.image_url,
          spotifyLink: album.spotify_link,
          youtubeLink: album.youtube_link,
          appleMusicLink: album.apple_music_link,
          releaseType: album.release_type,
          releaseYear: album.release_year,
        },
        user: { name: 'Administración Musiclub', email: 'admin@musiclub.org' },
        note: `Promovido directamente por el Administrador al Pool de la ${activeSeason.name}`,
      });
      showToast(`🗳️ "${album.album_name}" añadido al Pool Activo.`);
      await loadAllData();
    } catch (err) {
      alert(`Error al enviar al pool: ${err.message}`);
    }
  };

  // =========================================================================
  // REVIEWS MODERATION ACTIONS
  // =========================================================================
  const handleDeleteReview = async (reviewId, reviewerName) => {
    if (
      !window.confirm(
        `¿Eliminar definitivamente la reseña de ${reviewerName || 'este usuario'}?`
      )
    )
      return;

    setDeletingReviewId(reviewId);
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw new Error(error.message);

      showToast('🗑️ Reseña eliminada del sistema.');
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      alert(`Error al eliminar reseña: ${err.message}`);
    } finally {
      setDeletingReviewId(null);
    }
  };

  // =========================================================================
  // USER PROFILES ACTIONS
  // =========================================================================
  const handleUpdateUserRole = async (userId, newRole) => {
    setUpdatingUserId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw new Error(error.message);

      showToast(`👤 Rol de usuario actualizado a "${newRole}".`);
      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p))
      );
    } catch (err) {
      alert(`Error al cambiar rol: ${err.message}`);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Filtered Catalog Albums
  const filteredAlbums = useMemo(() => {
    return albums.filter((alb) => {
      const q = catalogSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (alb.album_name || '').toLowerCase().includes(q) ||
        (alb.artist_name || '').toLowerCase().includes(q) ||
        (alb.added_by || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (catalogFormatFilter !== 'ALL') {
        const type = (alb.release_type || 'ALBUM').toUpperCase();
        if (catalogFormatFilter === 'EP' && type !== 'EP') return false;
        if (
          catalogFormatFilter === 'SENCILLO' &&
          type !== 'SENCILLO' &&
          type !== 'SINGLE' &&
          type !== 'TRACK'
        )
          return false;
        if (
          catalogFormatFilter === 'ALBUM' &&
          type !== 'ALBUM' &&
          type !== 'COMPILACION'
        )
          return false;
      }

      return true;
    });
  }, [albums, catalogSearch, catalogFormatFilter]);

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((rev) => {
      const q = reviewSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (rev.reviewer_name || '').toLowerCase().includes(q) ||
        (rev.reviewer_email || '').toLowerCase().includes(q) ||
        (rev.album?.album_name || '').toLowerCase().includes(q) ||
        (rev.album?.artist_name || '').toLowerCase().includes(q) ||
        (rev.comment || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (reviewFilter === 'WITH_COMMENT') {
        return rev.comment && rev.comment.trim().length > 0;
      }
      if (reviewFilter === 'TOP') {
        return rev.rating_general >= 8.5;
      }
      if (reviewFilter === 'LOW') {
        return rev.rating_general <= 6.0;
      }

      return true;
    });
  }, [reviews, reviewSearch, reviewFilter]);

  // Filtered Profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter((prof) => {
      const q = userSearch.toLowerCase().trim();
      return (
        !q ||
        (prof.name || '').toLowerCase().includes(q) ||
        (prof.email || '').toLowerCase().includes(q) ||
        (prof.role || '').toLowerCase().includes(q)
      );
    });
  }, [profiles, userSearch]);

  return (
    <div
      className={
        isPage
          ? "min-h-screen cyber-grid p-3 sm:p-6 w-full max-w-full overflow-x-hidden text-white font-['Stack_Sans_Notch',sans-serif] flex flex-col justify-between"
          : 'fixed inset-0 bg-black/95 backdrop-blur-2xl z-[99999] overflow-y-auto p-4 sm:p-6 md:p-8 text-white'
      }
    >
      <div className="max-w-7xl mx-auto space-y-6 w-full">
        {/* Navigation Header */}
        {isPage && <AppHeader showTitle={false} />}

        {/* Toast Feedback */}
        {actionSuccess && (
          <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 bg-emerald-500 text-slate-950 font-black rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
            <span>✨</span>
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Master Control Header */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#12162b] via-[#0b0e1d] to-[#060812] border border-white/10 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl overflow-hidden text-left">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-pink-500/10 via-purple-600/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-black uppercase tracking-wider mb-2">
                <span>🛡️</span>
                <span>PANEL DE CONTROL DE ADMINISTRADOR</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                Centro de Mando Musiclub
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Gestión completa de Temporadas (Seasons), Pool de votación, Catálogo Universal, Moderación y Roles.
              </p>
            </div>

            {/* Quick Status Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleTogglePoolOpen}
                className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
                  isPoolOpen
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                }`}
              >
                <span>{isPoolOpen ? '🔓' : '🔒'}</span>
                <span>
                  {isPoolOpen ? 'Pool Abierto (Clic para Cerrar)' : 'Pool Cerrado (Clic para Abrir)'}
                </span>
              </button>

              <button
                type="button"
                onClick={loadAllData}
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2"
              >
                <span>🔄</span>
                <span>{loading ? 'Cargando...' : 'Actualizar'}</span>
              </button>

              {!isPage && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl text-xs">
              ⚠️ {error}
            </div>
          )}

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/10 text-center">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-xl sm:text-2xl font-black text-pink-400">
                {albums.length}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold">
                Catálogo Total
              </p>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-xl sm:text-2xl font-black text-emerald-300">
                {poolActive.length}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold">
                Pool Activo
              </p>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-xl sm:text-2xl font-black text-cyan-300">
                {seasons.length}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold">
                Temporadas
              </p>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-xl sm:text-2xl font-black text-purple-300">
                {reviews.length}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold">
                Reseñas
              </p>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5 col-span-2 sm:col-span-1">
              <p className="text-xl sm:text-2xl font-black text-amber-300">
                {profiles.length}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold">
                Miembros
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('pool')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === 'pool'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <span>🗳️</span>
            <span>Pool Semanal</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
              {poolActive.length + (poolWinner ? 1 : 0)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seasons')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === 'seasons'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <span>🏆</span>
            <span>Temporadas (Seasons)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
              {seasons.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === 'catalog'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <span>💿</span>
            <span>Catálogo Universal</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
              {albums.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === 'reviews'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <span>📝</span>
            <span>Moderación de Reseñas</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
              {reviews.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <span>👥</span>
            <span>Usuarios & Perfiles</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
              {profiles.length}
            </span>
          </button>
        </div>

        {/* TAB 1: POOL SEMANAL */}
        {activeTab === 'pool' && (
          <div className="space-y-6 text-left">
            {/* Master Pool State Box */}
            <div className="p-6 rounded-3xl bg-[#14172a] border border-white/10 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {isPoolOpen ? '🔓' : '🔒'}
                    </span>
                    <h2 className="text-lg font-black text-white">
                      Estado de Recepción del Pool: {isPoolOpen ? 'ABIERTO' : 'CERRADO'}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400">
                    {isPoolOpen
                      ? `Los miembros del club pueden proponer nuevos lanzamientos para ${activeSeason.name}.`
                      : 'La recepción de propuestas está pausada. Los miembros no pueden postular nuevos álbumes.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTogglePoolOpen}
                  className={`px-5 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-lg transition-all flex items-center gap-2 ${
                    isPoolOpen
                      ? 'bg-amber-500 hover:bg-amber-600 text-black'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-black'
                  }`}
                >
                  <span>{isPoolOpen ? '🔒 Pausar Recepción' : '🔓 Abrir Recepción'}</span>
                </button>
              </div>

              {/* Season Selector Card */}
              <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span>🏆</span>
                  <div>
                    <span className="font-bold text-pink-400">
                      Temporada en Foco: {activeSeason.name}
                    </span>
                    <p className="text-slate-400 mt-0.5">
                      Inicio: <strong>{activeSeason.start_date || 'Sin fecha'}</strong> &bull; Estado: <strong>{activeSeason.is_active ? 'Activa Oficial' : 'Histórica'}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedSeasonId}
                    onChange={(e) => setSelectedSeasonId(e.target.value)}
                    className="bg-black/50 border border-white/15 rounded-xl text-xs text-white px-3 py-1.5 focus:outline-none"
                  >
                    {seasons.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.is_active ? '(Activa)' : ''}
                      </option>
                    ))}
                  </select>
                  <Link
                    to="/pool"
                    className="text-cyan-400 hover:underline font-bold px-2 py-1"
                  >
                    Ver Pool en Vivo →
                  </Link>
                </div>
              </div>
            </div>

            {/* Weekly Winner Management */}
            <div className="p-6 rounded-3xl bg-[#14172a] border border-pink-500/20 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>🏆</span> Disco en Foco de la Semana (Ganador)
                </h3>
                {poolWinner && (
                  <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs font-bold">
                    En Foco Activo
                  </span>
                )}
              </div>

              {poolWinner ? (
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-black/40 border border-white/10">
                  <div className="flex items-center gap-4">
                    <img
                      src={poolWinner.imagen}
                      alt={poolWinner.album}
                      className="w-20 h-20 rounded-xl object-cover border border-white/10 flex-shrink-0"
                    />
                    <div className="space-y-1">
                      <h4 className="text-base font-black text-white">
                        {poolWinner.album}
                      </h4>
                      <p className="text-xs text-slate-300">
                        {poolWinner.artista}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Sugerido por: <strong>{poolWinner.added_by || 'Comunidad'}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Actions for Winner */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleWinnerReviews(
                          poolWinner.id,
                          poolWinner.reviews_enabled
                        )
                      }
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        poolWinner.reviews_enabled
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      }`}
                    >
                      <span>{poolWinner.reviews_enabled ? '🔒 Pausar Reseñas' : '✅ Habilitar Reseñas'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleArchiveWinner(poolWinner.id)}
                      className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <span>🎓 Graduar al Historial</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-black/20 rounded-2xl border border-white/5 space-y-2">
                  <p className="text-slate-400 text-xs">
                    No hay ningún álbum seleccionado como Ganador actualmente.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Puedes elegir un ganador desde la lista de candidatos abajo o usar la ruleta en la página del Pool.
                  </p>
                </div>
              )}
            </div>

            {/* Active Pool Candidates */}
            <div className="p-6 rounded-3xl bg-[#14172a] border border-white/10 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span>🗳️</span> Candidatos Activos en el Pool ({poolActive.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Propuestas en espera para {activeSeason.name}
                  </p>
                </div>
              </div>

              {poolActive.length === 0 ? (
                <div className="p-8 text-center bg-black/20 rounded-2xl border border-white/5 text-slate-400 text-xs">
                  No hay discos en espera en el Pool activo.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {poolActive.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.imagen}
                          alt={item.album}
                          className="w-14 h-14 rounded-xl object-cover border border-white/10 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                            {item.album}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate">
                            {item.artista}
                          </p>
                          <p className="text-[10px] text-pink-400 truncate">
                            Por: {item.added_by || 'Comunidad'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSetWinner(item.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 text-xs font-bold transition-all"
                          title="Hacer Ganador de la Semana"
                        >
                          🏆 Ganador
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromPool(item.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-all"
                          title="Quitar del Pool"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TEMPORADAS (SEASONS) */}
        {activeTab === 'seasons' && (
          <div className="space-y-6 text-left">
            {/* Header with Create Button */}
            <div className="p-6 rounded-3xl bg-[#14172a] border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>🏆</span> Control de Temporadas de Musiclub
                </h3>
                <p className="text-xs text-slate-400">
                  Crea, edita o elimina temporadas. Administra cuál es la temporada activa donde se reciben y juegan los pools semanales.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenCreateSeason}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black text-xs sm:text-sm shadow-lg transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
              >
                <span>➕</span>
                <span>Crear Nueva Temporada</span>
              </button>
            </div>

            {/* Seasons Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {seasons.map((s) => (
                <div
                  key={s.id}
                  className={`p-6 rounded-3xl border transition-all space-y-4 ${
                    s.is_active
                      ? 'bg-gradient-to-br from-[#181d38] to-[#121528] border-pink-500/40 shadow-xl shadow-pink-500/10'
                      : 'bg-[#14172a] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-pink-300 font-black text-[10px] uppercase">
                          Temporada #{s.season_number || 1}
                        </span>
                        {s.is_active ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                            🟢 Activa / Oficial
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10 text-[10px] font-semibold">
                            Archivada / Inactiva
                          </span>
                        )}
                      </div>
                      <h4 className="text-base sm:text-lg font-black text-white">
                        {s.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditSeason(s)}
                        className="px-2.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all"
                        title="Editar Temporada"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteSeasonConfirm(s)}
                        className="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-all"
                        title="Eliminar Temporada"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-black/30 p-3 rounded-2xl border border-white/5">
                    {s.description || 'Sin descripción detallada para esta temporada.'}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-[11px] text-slate-400">
                    <div>
                      <span>Fecha Inicio: <strong>{s.start_date || 'N/A'}</strong></span>
                      {s.end_date && (
                        <span className="ml-3">Fin: <strong>{s.end_date}</strong></span>
                      )}
                    </div>

                    {!s.is_active && (
                      <button
                        type="button"
                        onClick={() => handleActivateSeason(s.id)}
                        className="px-3 py-1 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 text-xs font-bold transition-all cursor-pointer"
                      >
                        🌟 Activar Esta Temporada
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal for Creating or Editing Season */}
            {(isCreatingSeason || editingSeason) && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-[#121528] border border-white/20 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-left space-y-4 shadow-2xl relative my-8">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <span>🏆</span>
                      <span>{isCreatingSeason ? 'Crear Nueva Temporada' : 'Editar Temporada'}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingSeason(false);
                        setEditingSeason(null);
                      }}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveSeason} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">
                          Número de Temporada:
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={seasonFormData.season_number}
                          onChange={(e) =>
                            setSeasonFormData({
                              ...seasonFormData,
                              season_number: parseInt(e.target.value, 10) || 1,
                            })
                          }
                          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500/50"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold mb-1">
                          Nombre Oficial:
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Temporada 1: El Origen"
                          value={seasonFormData.name}
                          onChange={(e) =>
                            setSeasonFormData({
                              ...seasonFormData,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">
                          Fecha de Inicio:
                        </label>
                        <input
                          type="date"
                          required
                          value={seasonFormData.start_date}
                          onChange={(e) =>
                            setSeasonFormData({
                              ...seasonFormData,
                              start_date: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold mb-1">
                          Fecha de Fin (Opcional):
                        </label>
                        <input
                          type="date"
                          value={seasonFormData.end_date || ''}
                          onChange={(e) =>
                            setSeasonFormData({
                              ...seasonFormData,
                              end_date: e.target.value || null,
                            })
                          }
                          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">
                        Descripción de la Temporada:
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Describe el contexto, objetivos o temática de la temporada..."
                        value={seasonFormData.description}
                        onChange={(e) =>
                          setSeasonFormData({
                            ...seasonFormData,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500/50"
                      />
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-xl bg-black/30 border border-white/10">
                      <input
                        type="checkbox"
                        id="is_active_checkbox"
                        checked={seasonFormData.is_active}
                        onChange={(e) =>
                          setSeasonFormData({
                            ...seasonFormData,
                            is_active: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded text-pink-500 focus:ring-pink-500"
                      />
                      <label htmlFor="is_active_checkbox" className="text-white font-bold cursor-pointer">
                        Marcar como Temporada Activa Oficial
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingSeason(false);
                          setEditingSeason(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black transition-all shadow-lg"
                      >
                        {isCreatingSeason ? 'Crear Temporada' : 'Guardar Cambios'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal for Delete Season Confirmation */}
            {showDeleteSeasonConfirm && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className="bg-[#151726] border border-red-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
                  <span className="text-4xl">⚠️</span>
                  <h3 className="text-lg font-black text-white">
                    ¿Eliminar esta temporada?
                  </h3>
                  <p className="text-xs text-slate-300">
                    Estás a punto de eliminar <strong>"{showDeleteSeasonConfirm.name}"</strong>. Esta acción quitará la temporada del sistema.
                  </p>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteSeasonConfirm(null)}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSeason(showDeleteSeasonConfirm.id)}
                      className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-black shadow-lg transition-all"
                    >
                      Sí, Eliminar Temporada
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CATÁLOGO UNIVERSAL */}
        {activeTab === 'catalog' && (
          <div className="space-y-4 text-left">
            {/* Search & Filter Bar */}
            <div className="p-4 rounded-2xl bg-[#14172a] border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Buscar en el catálogo por álbum, artista o curador..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/50"
                />
              </div>

              {/* Format Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={catalogFormatFilter}
                  onChange={(e) => setCatalogFormatFilter(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl text-xs text-white px-3 py-2 focus:outline-none"
                >
                  <option value="ALL">📁 Todos los Formatos</option>
                  <option value="ALBUM">💿 Álbumes</option>
                  <option value="EP">💽 EPs</option>
                  <option value="SENCILLO">🎵 Sencillos</option>
                  <option value="COMPILACION">📦 Compilaciones</option>
                  <option value="EN VIVO">🎤 En Vivo</option>
                  <option value="SOUNDTRACK">🎬 Soundtracks</option>
                  <option value="REMIX">🎛️ Remixes</option>
                </select>
              </div>
            </div>

            {/* Albums Table */}
            <div className="rounded-2xl bg-[#14172a] border border-white/10 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 border-b border-white/10 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Lanzamiento</th>
                      <th className="p-3.5">Formato</th>
                      <th className="p-3.5">Año</th>
                      <th className="p-3.5">Sello / País</th>
                      <th className="p-3.5">Calificación</th>
                      <th className="p-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredAlbums.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-8 text-center text-slate-400"
                        >
                          No se encontraron lanzamientos en el catálogo.
                        </td>
                      </tr>
                    ) : (
                      filteredAlbums.slice(0, 100).map((album) => (
                        <tr
                          key={album.id}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="p-3.5 flex items-center gap-3">
                            <img
                              src={album.image_url}
                              alt={album.album_name}
                              className="w-10 h-10 rounded-lg object-cover border border-white/10 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate max-w-xs">
                                {album.album_name}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {album.artist_name}
                              </p>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-semibold text-slate-300">
                              {album.release_type || 'ALBUM'}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-300">
                            {album.release_year || '—'}
                          </td>
                          <td className="p-3.5 text-slate-400 truncate max-w-[120px]">
                            {album.label || album.country || '—'}
                          </td>
                          <td className="p-3.5">
                            {album.avg_rating || album.final_rating ? (
                              <span className="font-bold text-amber-300">
                                ⭐{' '}
                                {(
                                  album.avg_rating || album.final_rating
                                ).toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                          <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(album)}
                              className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold transition-all"
                              title="Editar Metadata"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendToPool(album)}
                              className="px-2.5 py-1 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/30 text-[11px] font-bold transition-all"
                              title="Proponer al Pool"
                            >
                              🗳️ Al Pool
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAlbumForAction(album);
                                setShowDeleteConfirm(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] font-bold transition-all"
                              title="Eliminar Álbum"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MODERACIÓN DE RESEÑAS */}
        {activeTab === 'reviews' && (
          <div className="space-y-4 text-left">
            {/* Search & Filter */}
            <div className="p-4 rounded-2xl bg-[#14172a] border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Buscar por crítico, álbum o comentario..."
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/50"
                />
              </div>

              <select
                value={reviewFilter}
                onChange={(e) => setReviewFilter(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl text-xs text-white px-3 py-2 focus:outline-none"
              >
                <option value="ALL">Todas las Reseñas</option>
                <option value="WITH_COMMENT">💬 Con Comentarios Escritos</option>
                <option value="TOP">🌟 Calificaciones Altas (≥ 8.5)</option>
                <option value="LOW">📉 Calificaciones Bajas (≤ 6.0)</option>
              </select>
            </div>

            {/* Reviews List */}
            <div className="space-y-3">
              {filteredReviews.length === 0 ? (
                <div className="p-12 text-center bg-[#14172a] rounded-3xl border border-white/10 text-slate-400 text-xs">
                  No se encontraron reseñas con los filtros seleccionados.
                </div>
              ) : (
                filteredReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl bg-[#14172a] border border-white/10 flex flex-col md:flex-row items-start justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center text-xs font-black text-white flex-shrink-0">
                          {(rev.reviewer_name || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">
                            {rev.reviewer_name}{' '}
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({rev.reviewer_email || 'Sin correo'})
                            </span>
                          </p>
                          <p className="text-[11px] text-pink-400">
                            Álbum: <strong>{rev.album?.album_name || 'Álbum del Club'}</strong> &bull; {rev.album?.artist_name}
                          </p>
                        </div>
                      </div>

                      {/* Criteria Score Breakdown */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                          ⭐ General: {rev.rating_general}
                        </span>
                        {rev.rating_produccion && (
                          <span className="text-slate-400">
                            Prod: <strong>{rev.rating_produccion}</strong>
                          </span>
                        )}
                        {rev.rating_composicion && (
                          <span className="text-slate-400">
                            Comp: <strong>{rev.rating_composicion}</strong>
                          </span>
                        )}
                        {rev.rating_letras && (
                          <span className="text-slate-400">
                            Letras: <strong>{rev.rating_letras}</strong>
                          </span>
                        )}
                        {rev.favorite_track && (
                          <span className="text-pink-300 font-semibold">
                            👑 Track: {rev.favorite_track}
                          </span>
                        )}
                      </div>

                      {/* Review Comment */}
                      {rev.comment && (
                        <p className="text-xs text-slate-300 bg-black/30 p-2.5 rounded-xl border border-white/5 leading-relaxed">
                          "{rev.comment}"
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={deletingReviewId === rev.id}
                      onClick={() => handleDeleteReview(rev.id, rev.reviewer_name)}
                      className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-all flex-shrink-0"
                    >
                      {deletingReviewId === rev.id ? 'Eliminando...' : '🗑️ Eliminar Reseña'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: USUARIOS & PERFILES */}
        {activeTab === 'users' && (
          <div className="space-y-4 text-left">
            <div className="p-4 rounded-2xl bg-[#14172a] border border-white/10 flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Buscar usuario por nombre, email o rol..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/50"
                />
              </div>
            </div>

            <div className="rounded-2xl bg-[#14172a] border border-white/10 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 border-b border-white/10 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Usuario</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">Rol Actual</th>
                      <th className="p-3.5 text-right">Cambiar Rol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredProfiles.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-8 text-center text-slate-400"
                        >
                          No se encontraron usuarios registrados.
                        </td>
                      </tr>
                    ) : (
                      filteredProfiles.map((prof) => (
                        <tr
                          key={prof.id}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="p-3.5 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white flex-shrink-0">
                              {(prof.name || 'U')[0].toUpperCase()}
                            </div>
                            <span className="font-bold text-white">
                              {prof.name || 'Usuario Anónimo'}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-300">
                            {prof.email || '—'}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                prof.role === 'admin'
                                  ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                  : prof.role === 'critic'
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                    : 'bg-white/5 text-slate-300 border-white/10'
                              }`}
                            >
                              {prof.role || 'user'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <select
                              disabled={updatingUserId === prof.id}
                              value={prof.role || 'user'}
                              onChange={(e) =>
                                handleUpdateUserRole(prof.id, e.target.value)
                              }
                              className="bg-black/50 border border-white/15 rounded-lg text-xs text-white px-2.5 py-1 focus:outline-none"
                            >
                              <option value="user">Usuario (User)</option>
                              <option value="critic">Crítico (Critic)</option>
                              <option value="admin">Administrador (Admin)</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE EDICIÓN DE ÁLBUM */}
        {editingAlbum && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#121528] border border-white/20 rounded-3xl p-6 sm:p-8 max-w-xl w-full text-left space-y-4 shadow-2xl relative my-8">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>✏️</span> Editar Lanzamiento
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingAlbum(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveAlbumEdit} className="space-y-4 text-xs">
                {/* Image Preview & Sync Button */}
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-black/30 border border-white/10">
                  <img
                    src={editingAlbum.image_url}
                    alt={editingAlbum.album_name}
                    className="w-16 h-16 rounded-xl object-cover border border-white/10 flex-shrink-0"
                  />
                  <div className="space-y-1 flex-1">
                    <p className="font-bold text-white truncate">
                      {editingAlbum.album_name}
                    </p>
                    <p className="text-slate-400">{editingAlbum.artist_name}</p>
                    <button
                      type="button"
                      disabled={isSyncingSpotify}
                      onClick={handleSyncSpotifyMetadata}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold transition-all flex items-center gap-1"
                    >
                      <span>🔄</span>
                      <span>
                        {isSyncingSpotify
                          ? 'Sincronizando...'
                          : 'Sincronizar Carátula/Metadatos desde MusicBrainz'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">
                      Nombre del Lanzamiento:
                    </label>
                    <input
                      type="text"
                      required
                      value={editingAlbum.album_name}
                      onChange={(e) =>
                        setEditingAlbum({
                          ...editingAlbum,
                          album_name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">
                      Artista / Banda:
                    </label>
                    <input
                      type="text"
                      required
                      value={editingAlbum.artist_name}
                      onChange={(e) =>
                        setEditingAlbum({
                          ...editingAlbum,
                          artist_name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    URL de Carátula (Imagen):
                  </label>
                  <input
                    type="url"
                    required
                    value={editingAlbum.image_url}
                    onChange={(e) =>
                      setEditingAlbum({
                        ...editingAlbum,
                        image_url: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500/50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">
                      Formato:
                    </label>
                    <select
                      value={editingAlbum.release_type}
                      onChange={(e) =>
                        setEditingAlbum({
                          ...editingAlbum,
                          release_type: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none"
                    >
                      <option value="ALBUM">💿 Álbum</option>
                      <option value="EP">💽 EP</option>
                      <option value="SENCILLO">🎵 Sencillo</option>
                      <option value="COMPILACION">📦 Compilación</option>
                      <option value="EN VIVO">🎤 En Vivo</option>
                      <option value="SOUNDTRACK">🎬 Soundtrack</option>
                      <option value="REMIX">🎛️ Remix</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">
                      Año de Lanzamiento:
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2024"
                      value={editingAlbum.release_year}
                      onChange={(e) =>
                        setEditingAlbum({
                          ...editingAlbum,
                          release_year: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">
                      Sello Discográfico:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Warner Records"
                      value={editingAlbum.label || ''}
                      onChange={(e) =>
                        setEditingAlbum({
                          ...editingAlbum,
                          label: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">
                      País:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. US, MX, GB"
                      value={editingAlbum.country || ''}
                      onChange={(e) =>
                        setEditingAlbum({
                          ...editingAlbum,
                          country: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">
                      Total Pistas:
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 12"
                      value={editingAlbum.total_tracks || ''}
                      onChange={(e) =>
                        setEditingAlbum({
                          ...editingAlbum,
                          total_tracks: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="text-slate-300 font-bold mb-1 flex items-center gap-1.5 text-xs">
                      <SpotifyLogo className="w-3.5 h-3.5 text-[#1db954]" />
                      <span>Spotify:</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://open.spotify.com/..."
                      value={editingAlbum.spotify_link || ''}
                      onChange={(e) =>
                        setEditingAlbum({
                          ...editingAlbum,
                          spotify_link: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#1db954]/50"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold mb-1 flex items-center gap-1.5 text-xs">
                      <AppleMusicLogo className="w-3.5 h-3.5 text-[#fc3c44]" />
                      <span>Apple Music:</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://music.apple.com/..."
                      value={editingAlbum.apple_music_link || ''}
                      onChange={(e) =>
                        setEditingAlbum({
                          ...editingAlbum,
                          apple_music_link: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#fc3c44]/50"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold mb-1 flex items-center gap-1.5 text-xs">
                      <YouTubeLogo className="w-3.5 h-3.5 text-red-500" />
                      <span>YouTube:</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://music.youtube.com/..."
                      value={editingAlbum.youtube_link || ''}
                      onChange={(e) =>
                        setEditingAlbum({
                          ...editingAlbum,
                          youtube_link: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-red-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold mb-1 flex items-center gap-1.5 text-xs">
                      <DeezerLogo className="w-3.5 h-3.5 text-[#a238ff]" />
                      <span>Deezer:</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.deezer.com/album/..."
                      value={editingAlbum.other_link || ''}
                      onChange={(e) =>
                        setEditingAlbum({
                          ...editingAlbum,
                          other_link: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#a238ff]/50"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingAlbum(null)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black transition-all shadow-lg"
                  >
                    {isSavingEdit ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE ÁLBUM */}
        {showDeleteConfirm && selectedAlbumForAction && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#151726] border border-red-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
              <span className="text-4xl">⚠️</span>
              <h3 className="text-lg font-black text-white">
                ¿Eliminar permanentemente este álbum?
              </h3>
              <p className="text-xs text-slate-300">
                Estás a punto de eliminar <strong>"{selectedAlbumForAction.album_name}"</strong>. Esta acción borrará también todas sus reseñas y calificaciones asociadas.
              </p>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedAlbumForAction(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAlbum}
                  className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-black shadow-lg transition-all"
                >
                  Sí, Eliminar Definitivamente
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
