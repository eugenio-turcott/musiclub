// src/pages/PoolPage.jsx
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';
import { ReviewSystem } from '../components/ReviewSystem';
import { SlotMachine } from '../components/SlotMachine';
import { LoginModal } from '../components/LoginModal';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { usePool } from '../hooks/usePool';
import { useAuth } from '../hooks/useAuth';
import { useAlbums } from '../hooks/useAlbums';
import { getReleaseUrl } from '../utils/ratingUtils';
import {
  searchAlbum,
  getAlbumDetails,
} from '../services/spotifyApi';

export function PoolPage() {
  const { user, isAdmin, loginWithGoogle, logout, loading: authLoading } =
    useAuth();
  const {
    season,
    activePool,
    winner,
    poolHistory,
    isPoolOpen,
    loading: poolLoading,
    nominateAlbum,
    selectWinner,
    archiveCurrentWinner,
    toggleWinnerReviews,
    setPoolOpenStatus,
    refetch,
  } = usePool();

  const { markAlbumAsInactive } = useAlbums();

  // Candidatos de pool_entries para la Ruleta / Máquina Musical
  const slotMachinePool = useMemo(() => {
    return activePool.map((alb) => ({
      id: alb.id,
      album: alb.album || alb.album_name || '',
      artista: alb.artista || alb.artist_name || '',
      imagen: alb.imagen || alb.image_url || '',
      status: 'ACTIVO',
      created_at: alb.created_at || alb.nominated_at,
      added_by: alb.added_by || 'Comunidad',
      tracks: alb.tracks || [],
    }));
  }, [activePool]);

  // Local UI States
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showNominateModal, setShowNominateModal] = useState(false);
  const [showSlotMachine, setShowSlotMachine] = useState(false);
  const [showWinnerReviewModal, setShowWinnerReviewModal] = useState(false);
  const [selectedFormatFilter, setSelectedFormatFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingReviews, setTogglingReviews] = useState(false);

  // Nomination Modal States
  const [nominationSearch, setNominationSearch] = useState('');
  const [spotifyResults, setSpotifyResults] = useState([]);
  const [searchingRemote, setSearchingRemote] = useState(false);
  const [selectedAlbumToNominate, setSelectedAlbumToNominate] = useState(null);
  const [nominationNote, setNominationNote] = useState('');
  const [submittingNomination, setSubmittingNomination] = useState(false);
  const [nominationSuccess, setNominationSuccess] = useState(false);

  // Format filter calculation
  const formatCounts = useMemo(() => {
    const counts = { ALL: activePool.length, ALBUM: 0, EP: 0, SENCILLO: 0 };
    activePool.forEach((alb) => {
      const type = (alb.release_type || 'ALBUM').toUpperCase();
      if (type === 'EP') counts.EP++;
      else if (type === 'SENCILLO' || type === 'SINGLE' || type === 'TRACK')
        counts.SENCILLO++;
      else counts.ALBUM++;
    });
    return counts;
  }, [activePool]);

  // Filtered active pool albums
  const filteredActivePool = useMemo(() => {
    return activePool.filter((alb) => {
      // Format filter
      if (selectedFormatFilter !== 'ALL') {
        const type = (alb.release_type || 'ALBUM').toUpperCase();
        if (selectedFormatFilter === 'EP' && type !== 'EP') return false;
        if (
          selectedFormatFilter === 'SENCILLO' &&
          type !== 'SENCILLO' &&
          type !== 'SINGLE' &&
          type !== 'TRACK'
        )
          return false;
        if (
          selectedFormatFilter === 'ALBUM' &&
          type !== 'ALBUM' &&
          type !== 'COMPILACION'
        )
          return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (alb.album || '').toLowerCase().includes(q);
        const matchesArtist = (alb.artista || '').toLowerCase().includes(q);
        const matchesNominator = (alb.added_by || '').toLowerCase().includes(q);
        return matchesName || matchesArtist || matchesNominator;
      }

      return true;
    });
  }, [activePool, selectedFormatFilter, searchQuery]);

  // Handle Spotify search for nomination
  const handleSearchSpotify = async (e) => {
    e.preventDefault();
    if (!nominationSearch.trim()) return;
    setSearchingRemote(true);
    try {
      const res = await searchAlbum(nominationSearch);
      if (res?.success && Array.isArray(res.albums)) {
        const formatted = res.albums.map((a) => {
          const artistDisplay = Array.isArray(a.artists)
            ? a.artists.join(', ')
            : a.artist || 'Artista';
          return {
            id: a.id,
            albumName: a.name,
            artistName: artistDisplay,
            imageUrl: a.image,
            releaseDate: a.releaseDate,
            releaseYear: a.releaseYear,
            releaseType: a.release_type || a.releaseType || 'ALBUM',
            tracks: a.tracks || [],
            spotifyLink:
              a.external_urls?.spotify ||
              `https://open.spotify.com/album/${a.id}`,
          };
        });
        setSpotifyResults(formatted);
      } else {
        setSpotifyResults([]);
      }
    } catch (err) {
      console.error('Error buscando en Spotify:', err);
      setSpotifyResults([]);
    } finally {
      setSearchingRemote(false);
    }
  };

  const handleSelectAlbumForNomination = async (item) => {
    try {
      const res = await getAlbumDetails(item.id);
      if (res?.success && res.album) {
        const details = res.album;
        const artistDisplay = Array.isArray(details.artists)
          ? details.artists.join(', ')
          : details.artist || item.artistName;

        const tracks = (details.tracks || []).map((t, idx) => ({
          id: t.id || `track-${idx + 1}`,
          name: t.name,
          duration_ms: t.duration_ms || 0,
          track_number: t.track_number || idx + 1,
        }));

        setSelectedAlbumToNominate({
          albumName: details.name || item.albumName,
          artistName: artistDisplay,
          imageUrl: details.image || item.imageUrl,
          releaseDate: details.releaseDate || item.releaseDate,
          releaseYear: details.releaseYear || item.releaseYear,
          releaseType: details.release_type || item.releaseType || 'ALBUM',
          tracks: tracks,
          spotifyLink:
            details.external_urls?.spotify ||
            `https://open.spotify.com/album/${item.id}`,
          youtubeLink: null,
          appleMusicLink: null,
        });
      } else {
        setSelectedAlbumToNominate(item);
      }
    } catch (err) {
      setSelectedAlbumToNominate(item);
    }
  };

  // Submit nomination
  const handleConfirmNomination = async () => {
    if (!selectedAlbumToNominate) return;
    setSubmittingNomination(true);
    try {
      await nominateAlbum({
        albumData: selectedAlbumToNominate,
        user,
        note: nominationNote,
      });
      setNominationSuccess(true);
      setTimeout(() => {
        setNominationSuccess(false);
        setShowNominateModal(false);
        setSelectedAlbumToNominate(null);
        setNominationSearch('');
        setSpotifyResults([]);
        setNominationNote('');
      }, 1500);
    } catch (err) {
      alert(`Error al nominar: ${err.message}`);
    } finally {
      setSubmittingNomination(false);
    }
  };

  const handleToggleReviews = async () => {
    if (!isAdmin || !winner) return;
    setTogglingReviews(true);
    try {
      await toggleWinnerReviews(winner.id, !winner.reviews_enabled);
    } catch (err) {
      console.error('Error toggling winner reviews:', err);
    } finally {
      setTogglingReviews(false);
    }
  };

  const handleArchiveWinner = async () => {
    if (!isAdmin || !winner) return;
    if (
      window.confirm(
        `¿Deseas graduar y archivar "${winner.album}" al historial del Pool?`
      )
    ) {
      try {
        await archiveCurrentWinner(winner.id);
      } catch (err) {
        alert(`Error al archivar: ${err.message}`);
      }
    }
  };

  return (
    <div className="min-h-screen cyber-grid p-3 sm:p-6 w-full max-w-full overflow-x-hidden text-white font-['Stack_Sans_Notch',sans-serif] flex flex-col justify-between">
      <SEO
        title="Pool Musical — Musiclub Temporada 1"
        description="El Pool Musical comunitario de Musiclub. Descubre los álbumes propuestos para la Temporada 1, el ganador de la semana y participa en las votaciones y sorteos."
        url="https://musiclub.org/pool"
      />

      <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12 w-full">
        {/* Navigation Header */}
        <AppHeader
          user={user}
          isAdmin={isAdmin}
          onLogin={() => setShowLoginModal(true)}
          onLogout={logout}
          loading={authLoading}
          showTitle={false}
        />

        <LoadingOverlay
          loading={poolLoading && activePool.length === 0}
          message="Cargando el Pool Musical de la Temporada..."
        />

        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={async () => {
            setLoginLoading(true);
            const res = await loginWithGoogle();
            setLoginLoading(false);
            if (res.success) setShowLoginModal(false);
          }}
          onGoogleLogin={async () => {
            setLoginLoading(true);
            const res = await loginWithGoogle();
            setLoginLoading(false);
            if (res.success) setShowLoginModal(false);
          }}
          loading={loginLoading}
          googleLoading={loginLoading}
        />

        {/* =========================================================================
            1. POOL HERO HEADER & SEASON SELECTOR
            ========================================================================= */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#161832] via-[#0e1022] to-[#070812] border border-white/10 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl overflow-hidden text-left">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-pink-500/15 via-purple-600/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 max-w-2xl">
              {/* Season Live Pill & Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/40 text-pink-300 text-xs font-black tracking-wider uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{season.name}</span>
                  <span className="text-white/40">&bull;</span>
                  <span className="text-white/70">Inició: 11 Jul 2026</span>
                </div>

                {isPoolOpen ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    🔓 Pool Abierto
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold shadow-sm">
                    🔒 Pool Cerrado
                  </span>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setPoolOpenStatus(!isPoolOpen)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-all flex items-center gap-1 ${
                      isPoolOpen
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    }`}
                  >
                    <span>{isPoolOpen ? '🔒 Cerrar Pool (Admin)' : '🔓 Abrir Pool (Admin)'}</span>
                  </button>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                Pool Musical Comunitario
              </h1>

              <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed">
                El motor social de Musiclub. Aquí los miembros proponen sus{' '}
                <strong>álbumes, EPs y canciones</strong> favoritos para la temporada.
                Cada semana se sortea el disco en foco mediante la ruleta/gashapon
                para escucharlo y calificarlo en comunidad.
              </p>

              {/* Banner Pool Cerrado / Abierto */}
              {!isPoolOpen && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🔒</span>
                    <span>
                      <strong>El Pool se encuentra actualmente cerrado para nuevas propuestas.</strong> Puedes explorar los discos propuestos por la comunidad, participar en el sorteo semanal y calificar el disco en foco.
                    </span>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setPoolOpenStatus(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow transition-all flex items-center gap-1.5 flex-shrink-0"
                    >
                      <span>🔓 Abrir Pool Ahora</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {!isPoolOpen && !isAdmin ? (
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      'El Pool de la Temporada 1 se encuentra actualmente cerrado para nuevas propuestas.'
                    )
                  }
                  className="px-5 py-3.5 rounded-2xl bg-white/10 text-white/50 border border-white/10 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-not-allowed"
                  title="El pool está actualmente cerrado para nuevas propuestas"
                >
                  <span>🔒</span>
                  <span>Proponer al Pool (Cerrado)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      setShowLoginModal(true);
                    } else {
                      setShowNominateModal(true);
                    }
                  }}
                  className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#f5576c] to-[#f093fb] hover:from-[#f5576c]/90 hover:to-[#f093fb]/90 text-white font-black text-xs sm:text-sm shadow-xl shadow-pink-500/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>➕</span>
                  <span>Proponer al Pool</span>
                </button>
              )}

              <Link
                to="/gashapon"
                className="px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs sm:text-sm backdrop-blur-md hover:scale-105 transition-all flex items-center gap-2"
              >
                <span>🎰</span>
                <span>Gashapon Arcade</span>
              </Link>
            </div>
          </div>

          {/* Quick Season Stats Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/10 text-center">
            <div className="p-2">
              <p
                translate="no"
                className="notranslate text-xl sm:text-2xl font-black text-pink-400"
                data-stat="number"
              >
                {poolLoading && activePool.length === 0 ? '...' : activePool.length}
              </p>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">
                En Espera en el Pool
              </p>
            </div>
            <div className="p-2">
              <p
                translate="no"
                className="notranslate text-xl sm:text-2xl font-black text-amber-300"
                data-stat="number"
              >
                {poolLoading && poolHistory.length === 0 && !winner
                  ? '...'
                  : poolHistory.length + (winner ? 1 : 0)}
              </p>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">
                Ganadores de Temporada
              </p>
            </div>
            <div className="p-2">
              <p
                translate="no"
                className="notranslate text-xl sm:text-2xl font-black text-purple-300"
                data-stat="season"
              >
                {season.name.split(':')[0]}
              </p>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">
                Temporada Activa
              </p>
            </div>
            <div className="p-2">
              <p
                translate="no"
                className="notranslate text-xl sm:text-2xl font-black text-emerald-400"
                data-stat="date"
              >
                11 Jul 2026
              </p>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">
                Fecha de Lanzamiento
              </p>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. WINNER SPOTLIGHT: ÁLBUM EN FOCO DE LA SEMANA
            ========================================================================= */}
        {winner ? (
          <section className="relative text-left">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1b1e3d] via-[#101226] to-[#0a0a14] border-2 border-pink-500/40 p-6 sm:p-8 md:p-10 shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 relative z-10">
                {/* Artwork */}
                <div className="relative flex-shrink-0 group">
                  <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden border-2 border-pink-500/50 shadow-2xl shadow-pink-500/30">
                    <img
                      src={winner.imagen}
                      alt={winner.album}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white text-[10px] sm:text-xs font-black px-3.5 py-1 rounded-full shadow-lg border border-white/20">
                    🏆 EN FOCO SEMANAL
                  </div>
                </div>

                {/* Info & Direct Actions */}
                <div className="flex-1 text-center md:text-left space-y-3">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-pink-300 bg-pink-500/20 px-3 py-1 rounded-full border border-pink-500/30">
                      GANADOR DE LA SEMANA DEL POOL
                    </span>
                    {winner.added_by && (
                      <span className="text-xs text-white/60 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                        Propuesto por{' '}
                        <strong
                          translate="no"
                          className="notranslate username-tag text-white"
                        >
                          {winner.added_by}
                        </strong>
                      </span>
                    )}
                  </div>

                  <h2
                    translate="no"
                    className="notranslate music-title text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight"
                  >
                    {winner.album}
                  </h2>
                  <p
                    translate="no"
                    className="notranslate artist-name text-lg sm:text-xl text-slate-300 font-light"
                  >
                    {winner.artista}
                  </p>

                  {/* Links */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
                    {winner.spotifyLink && (
                      <a
                        href={winner.spotifyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
                      >
                        <span>🎵</span>
                        <span>Spotify</span>
                      </a>
                    )}
                    {winner.youtubeLink && (
                      <a
                        href={winner.youtubeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
                      >
                        <span>▶️</span>
                        <span>YouTube</span>
                      </a>
                    )}
                    <Link
                      to={getReleaseUrl(winner.album, winner.release_type || winner.releaseType)}
                      className="px-3.5 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 text-xs font-bold text-pink-300 transition-all flex items-center gap-1.5"
                    >
                      <span>🔍</span>
                      <span>Ver Ficha en Catálogo</span>
                    </Link>
                  </div>

                  {/* Review Buttons & Admin Controls */}
                  <div className="pt-3 flex flex-wrap items-center justify-center md:justify-start gap-3">
                    {winner.reviews_enabled ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!user) setShowLoginModal(true);
                          else setShowWinnerReviewModal((prev) => !prev);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5576c] to-[#f093fb] hover:from-[#f5576c]/90 hover:to-[#f093fb]/90 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span>⭐</span>
                        <span>
                          {showWinnerReviewModal
                            ? '✕ Cerrar Panel de Reseña'
                            : 'Calificar Disco de la Semana'}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-bold text-xs sm:text-sm flex items-center gap-2 opacity-60 cursor-not-allowed shadow-none select-none"
                        title="Las calificaciones para este disco no están habilitadas en este momento."
                      >
                        <span>🔒</span>
                        <span>Reseñas Pausadas</span>
                      </button>
                    )}

                    {!winner.reviews_enabled && (
                      <span className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                        🔒 Las calificaciones para este disco no están habilitadas por la administración.
                      </span>
                    )}

                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={handleToggleReviews}
                          disabled={togglingReviews}
                          className="text-xs px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                        >
                          {togglingReviews
                            ? '...'
                            : winner.reviews_enabled
                              ? '🔒 Pausar Reviews'
                              : '✅ Habilitar Reviews'}
                        </button>

                        <button
                          type="button"
                          onClick={handleArchiveWinner}
                          className="text-xs px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 hover:text-white transition-all cursor-pointer"
                        >
                          📦 Graduar y Archivar Semana
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Inline Review Form Accordion - Solo si reviews_enabled está activo */}
              {showWinnerReviewModal && winner.reviews_enabled && (
                <div className="mt-6 pt-6 border-t border-white/10 animate-fadeIn">
                  <div className="flex items-center justify-between pb-3">
                    <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <span>⭐</span>
                      <span>Tu Calificación para el Ganador de la Semana</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowWinnerReviewModal(false)}
                      className="text-xs text-white/40 hover:text-white px-2 py-1 rounded bg-white/5 cursor-pointer"
                    >
                      Cerrar ✕
                    </button>
                  </div>
                  <ReviewSystem
                    album={winner}
                    isFromSpotify={false}
                    isIndividual={false}
                    tracks={winner.tracks || []}
                    user={user}
                    onReviewSubmitted={() => {
                      setShowWinnerReviewModal(false);
                      refetch();
                    }}
                  />
                </div>
              )}
            </div>
          </section>
        ) : (
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center space-y-4">
            <span className="text-4xl">🎰</span>
            <h3 className="text-xl font-bold text-white">
              No hay un disco ganador seleccionado actualmente
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
              Usa la Ruleta o el Gashapon Arcade para sortear el próximo álbum de
              los{' '}
              <span
                translate="no"
                className="notranslate font-bold text-pink-400"
                data-stat="number"
              >
                {poolLoading ? '...' : activePool.length}
              </span>{' '}
              candidatos activos en el Pool.
            </p>
            <Link
              to="/gashapon"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-sm shadow-lg hover:scale-105 transition-all"
            >
              <span>🎲</span>
              <span>Sortear Ganador en Gashapon</span>
            </Link>
          </div>
        )}

        {/* =========================================================================
            3. ACTIVE POOL NOMINATIONS (CANDIDATOS EN ESPERA EN LA TEMPORADA)
            ========================================================================= */}
        <section className="space-y-6 text-left">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Candidatos del Pool Activo (
                <span
                  translate="no"
                  className="notranslate"
                  data-stat="number"
                >
                  {poolLoading ? '...' : activePool.length}
                </span>
                )
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Propuestas de la comunidad listas para los próximos sorteos semanales.
              </p>
            </div>

            {/* Format Filter Bar */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'ALL', label: 'Todos', count: formatCounts.ALL },
                { id: 'ALBUM', label: 'Álbumes', count: formatCounts.ALBUM },
                { id: 'EP', label: 'EPs', count: formatCounts.EP },
                { id: 'SENCILLO', label: 'Sencillos', count: formatCounts.SENCILLO },
              ].map((tab) => {
                const isSelected = selectedFormatFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedFormatFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white border-pink-400 shadow-md font-black'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-black/30 text-white' : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch justify-between">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                placeholder="Filtrar por disco, artista o quién propuso..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-400 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSlotMachine((prev) => !prev)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>🎰</span>
                <span>{showSlotMachine ? 'Ocultar Ruleta' : 'Ruleta del Pool'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!user) setShowLoginModal(true);
                  else setShowNominateModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-md hover:scale-105 cursor-pointer"
              >
                <span>➕</span>
                <span>Proponer</span>
              </button>
            </div>
          </div>

          {/* Collapsible Slot Machine for the Pool */}
          {showSlotMachine && (
            <div className="p-6 rounded-3xl bg-[#121424] border border-pink-500/30 animate-fadeIn space-y-3">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>🎰</span> Máquina Musical del Pool Activo
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sorteo interactivo con los {slotMachinePool.length} discos actualmente en la tabla de pool entries.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSlotMachine(false)}
                  className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-white/5"
                >
                  ✕ Cerrar
                </button>
              </div>

              {slotMachinePool.length === 0 ? (
                <div className="p-8 text-center bg-black/30 rounded-2xl border border-white/5 space-y-2">
                  <span className="text-3xl">🎰</span>
                  <p className="text-sm font-bold text-white">
                    No hay candidatos en el Pool para sortear
                  </p>
                  <p className="text-xs text-slate-400">
                    Propón o añade nuevos discos al Pool para activar la ruleta musical.
                  </p>
                </div>
              ) : (
                <SlotMachine
                  albums={slotMachinePool}
                  onSpinComplete={async (winningCandidate) => {
                    if (winningCandidate && winningCandidate.id && isAdmin) {
                      try {
                        await selectWinner(winningCandidate.id);
                        refetch();
                      } catch (err) {
                        console.error('Error al seleccionar ganador desde la ruleta:', err);
                      }
                    }
                  }}
                  isSpinning={false}
                  onSpinStart={() => {}}
                  markAlbumAsInactive={markAlbumAsInactive}
                  isAdmin={isAdmin}
                  user={user}
                />
              )}
            </div>
          )}

          {/* Active Pool Cards Grid */}
          {filteredActivePool.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white/5 border border-white/5 text-center space-y-2">
              <span className="text-3xl">🔍</span>
              <p className="text-white font-bold text-sm">
                No se encontraron propuestas con ese filtro
              </p>
              <p className="text-slate-400 text-xs">
                Sé el primero en proponer un nuevo lanzamiento al Pool Activo.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {filteredActivePool.map((alb) => (
                <div
                  key={alb.id}
                  className="group relative rounded-2xl bg-[#111322]/90 border border-white/10 hover:border-pink-500/40 p-3 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
                >
                  {/* Artwork */}
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black/40 mb-2">
                    <img
                      src={alb.imagen}
                      alt={alb.album}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[9px] font-black text-pink-300">
                      POOL ACTIVO
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-0.5 min-w-0">
                    <h4
                      translate="no"
                      className="notranslate music-title text-xs sm:text-sm font-bold text-white group-hover:text-pink-300 transition-colors truncate"
                    >
                      {alb.album}
                    </h4>
                    <p
                      translate="no"
                      className="notranslate artist-name text-[11px] text-slate-400 truncate"
                    >
                      {alb.artista}
                    </p>
                    {alb.added_by && (
                      <p className="text-[10px] text-pink-400/80 truncate pt-1">
                        Por:{' '}
                        <strong
                          translate="no"
                          className="notranslate username-tag font-semibold"
                        >
                          {alb.added_by}
                        </strong>
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 mt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                    <Link
                      to={getReleaseUrl(alb.album, alb.release_type || alb.releaseType)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      Ver ficha →
                    </Link>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => selectWinner(alb.id)}
                        className="text-[10px] px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 hover:bg-pink-500 hover:text-white transition-colors font-bold"
                        title="Seleccionar como ganador semanal"
                      >
                        👑 Elegir
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* =========================================================================
            4. POOL GRADUATION HISTORY (HISTORIAL DE LA TEMPORADA)
            ========================================================================= */}
        {poolHistory.length > 0 && (
          <section className="space-y-6 text-left pt-6 border-t border-white/10">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Historial de Ganadores (
                <span
                  translate="no"
                  className="notranslate"
                  data-stat="number"
                >
                  {poolLoading ? '...' : poolHistory.length}
                </span>
                )
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Lanzamientos que ganaron en el Pool de la Temporada 1 y ya fueron
                evaluados por la comunidad.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {poolHistory.map((alb) => (
                <Link
                  key={alb.id}
                  to={getReleaseUrl(alb.album, alb.release_type || alb.releaseType)}
                  className="group relative rounded-2xl bg-[#111322]/80 border border-white/10 hover:border-amber-400/40 p-2.5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black/40 mb-2">
                    <img
                      src={alb.imagen}
                      alt={alb.album}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {alb.final_rating || alb.avg_rating ? (
                      <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-black text-amber-300 border border-amber-400/30">
                        ⭐ {alb.final_rating || alb.avg_rating}
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <h4
                      translate="no"
                      className="notranslate music-title text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate"
                    >
                      {alb.album}
                    </h4>
                    <p
                      translate="no"
                      className="notranslate artist-name text-[10px] text-slate-400 truncate"
                    >
                      {alb.artista}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* =========================================================================
            5. NOMINATION MODAL (PROPONER DISCO CON SPOTIFY SEARCH)
            ========================================================================= */}
        {showNominateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-xl rounded-3xl bg-[#141628] border border-pink-500/30 p-6 sm:p-8 shadow-2xl space-y-5 text-left">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <span>📥</span> Proponer Lanzamiento al Pool
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {season.name} &bull; Sorteo Semanal
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowNominateModal(false);
                    setSelectedAlbumToNominate(null);
                  }}
                  className="text-slate-400 hover:text-white text-sm p-1"
                >
                  ✕
                </button>
              </div>

              {nominationSuccess ? (
                <div className="py-12 text-center space-y-3">
                  <span className="text-5xl">🎉</span>
                  <h4 className="text-xl font-black text-white">
                    ¡Propuesta Registrada Exitosamente!
                  </h4>
                  <p className="text-xs text-slate-300">
                    El lanzamiento ya forma parte del Pool Activo de la temporada.
                  </p>
                </div>
              ) : !selectedAlbumToNominate ? (
                <div className="space-y-4">
                  {/* Search Form */}
                  <form onSubmit={handleSearchSpotify} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Buscar en Spotify (Álbum, EP o Single)..."
                      value={nominationSearch}
                      onChange={(e) => setNominationSearch(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-400"
                    />
                    <button
                      type="submit"
                      disabled={searchingRemote}
                      className="px-5 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      {searchingRemote ? 'Buscando...' : 'Buscar'}
                    </button>
                  </form>

                  {/* Results List */}
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {spotifyResults.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        onClick={() => handleSelectAlbumForNomination(item)}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-pink-500/20 border border-white/5 hover:border-pink-500/40 cursor-pointer transition-all"
                      >
                        <img
                          src={item.imageUrl || item.imagen || 'https://via.placeholder.com/100/1a1a2e/ffffff?text=🎵'}
                          alt={item.albumName || item.album}
                          className="w-12 h-12 rounded-lg object-cover border border-white/10"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/100/1a1a2e/ffffff?text=🎵';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">
                            {item.albumName || item.album}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {item.artistName || item.artista}
                          </p>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300 font-mono">
                            {item.releaseType || 'ALBUM'} &bull;{' '}
                            {item.releaseYear || ''}
                          </span>
                        </div>
                        <span className="text-pink-400 text-xs font-bold">
                          Seleccionar →
                        </span>
                      </div>
                    ))}

                    {spotifyResults.length === 0 && !searchingRemote && (
                      <p className="text-center text-xs text-slate-500 py-6">
                        Escribe el nombre de un artista o disco para buscar en el
                        catálogo oficial de Spotify.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* Confirmation Screen */
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-pink-500/30">
                    <img
                      src={
                        selectedAlbumToNominate.imageUrl ||
                        selectedAlbumToNominate.imagen
                      }
                      alt={selectedAlbumToNominate.albumName}
                      className="w-16 h-16 rounded-xl object-cover border border-white/20"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-black text-white truncate">
                        {selectedAlbumToNominate.albumName ||
                          selectedAlbumToNominate.album}
                      </h4>
                      <p className="text-xs text-slate-300 truncate">
                        {selectedAlbumToNominate.artistName ||
                          selectedAlbumToNominate.artista}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedAlbumToNominate(null)}
                        className="text-[10px] text-pink-400 hover:underline mt-1"
                      >
                        Cambiar selección
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nota o comentario de recomendación (Opcional):
                    </label>
                    <textarea
                      rows={2}
                      placeholder="¿Por qué recomiendas este disco para el club?"
                      value={nominationNote}
                      onChange={(e) => setNominationNote(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-400"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedAlbumToNominate(null)}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300"
                    >
                      Atrás
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmNomination}
                      disabled={submittingNomination}
                      className="px-6 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-xs font-black shadow-lg"
                    >
                      {submittingNomination
                        ? 'Registrando...'
                        : 'Confirmar Propuesta'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default PoolPage;
