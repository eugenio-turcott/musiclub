'use client';
import { enrichPoolReleaseGenres } from '../services/poolReleaseGenres.mjs';
import { searchDeezerAlbums, getDeezerAlbumDetails } from '../services/deezerApi';
import { PoolCapsuleDeposit, PoolCapsuleToken } from '../components/PoolCapsuleDeposit';
import { PoolHero } from '../components/PoolHero';
import { PoolManualControls } from '../components/PoolManualControls';
import { GenreLabel } from '../components/GenreLabel';
import genreCatalog from '../utils/genreCatalog.cjs';
import { searchMusicBrainzReleases, getMusicBrainzReleaseGroupDetails } from '../services/musicBrainzService';
import { MusiclubVinyl } from '../components/MusiclubVinyl';
// src/pages/PoolPage.jsx
import React, { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';
import { ReviewSystem } from '../components/ReviewSystem';
import { SlotMachine } from '../components/SlotMachine';
import { LoginModal } from '../components/LoginModal';
import { usePool } from '../hooks/usePool';
import { useAuth } from '../hooks/useAuth';
import { useAlbums } from '../hooks/useAlbums';
import { getReleaseUrl } from '../utils/ratingUtils';
import { searchAlbum, getAlbumDetails } from '../services/spotifyApi';
import {
  SpotifyLogo,
  AppleMusicLogo,
  YouTubeLogo,
  DeezerLogo,
} from '../components/common/PlatformLogos';

export function PoolPage() {
  const {
    user,
    isAdmin,
    loginWithGoogle,
    logout,
    loading: authLoading,
  } = useAuth();
  const {
    season,
    seasons,
    createSeason,
    updateSeason,
    setActiveSeason,
    error: poolError,
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

  const { albums: catalogAlbums = [] } = useAlbums();


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
  const [poolActionError, setPoolActionError] = useState('');
  const [poolActionBusy, setPoolActionBusy] = useState(false);
  const runPoolAction = async action => {
    setPoolActionError(''); setPoolActionBusy(true);
    try { await action(); } catch (error) { setPoolActionError(error.message); } finally { setPoolActionBusy(false); }
  };

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showNominateModal, setShowNominateModal] = useState(false);
  const [showSlotMachine, setShowSlotMachine] = useState(false);
  const [showWinnerReviewModal, setShowWinnerReviewModal] = useState(false);
  const [selectedFormatFilter, setSelectedFormatFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingReviews, setTogglingReviews] = useState(false);
  const [isPoolSliderPaused, setIsPoolSliderPaused] = useState(false);

  // Historial de Ganadores ordenados de mayor a menor calificación (V.9.4)
  const sortedPoolHistory = useMemo(() => {
    return [...poolHistory].sort((a, b) => {
      const scoreA = Number(
        a.final_rating ?? a.avg_rating ?? a.puntuacion ?? 0
      );
      const scoreB = Number(
        b.final_rating ?? b.avg_rating ?? b.puntuacion ?? 0
      );
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      const reviewsA = Number(
        a.review_count ?? (Array.isArray(a.reviews) ? a.reviews.length : 0)
      );
      const reviewsB = Number(
        b.review_count ?? (Array.isArray(b.reviews) ? b.reviews.length : 0)
      );
      if (reviewsB !== reviewsA) {
        return reviewsB - reviewsA;
      }
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [poolHistory]);

  const isPoolSliderActive = sortedPoolHistory.length > 4;

  const poolMarqueeItems = useMemo(() => {
    if (!isPoolSliderActive) return [];
    let base = [...sortedPoolHistory];
    while (base.length < 8) {
      base = [...base, ...sortedPoolHistory];
    }
    return [...base, ...base];
  }, [isPoolSliderActive, sortedPoolHistory]);

  const poolSliderDuration = useMemo(() => {
    const baseCount = poolMarqueeItems.length / 2;
    return `${Math.max(25, Math.round(baseCount * 4.5))}s`;
  }, [poolMarqueeItems.length]);

  // Nomination Modal States
  const nominationSelection = useRef(0);
  const [nominationSearch, setNominationSearch] = useState('');
  const [spotifyResults, setSpotifyResults] = useState([]);
  const [searchingRemote, setSearchingRemote] = useState(false);
  const [selectedAlbumToNominate, setSelectedAlbumToNominate] = useState(null);
  const [nominationNote, setNominationNote] = useState('');
  const [submittingNomination, setSubmittingNomination] = useState(false);
  const [nominationSuccess, setNominationSuccess] = useState(false);
  const [nominationError, setNominationError] = useState('');
  const closeNomination = () => { if (submittingNomination) return; nominationSelection.current++; setShowNominateModal(false); setNominationSuccess(false); setSelectedAlbumToNominate(null); setNominationError(''); setNominationNote(''); };
  const enrichGenres = item => enrichPoolReleaseGenres(item, {
    searchDeezer: searchDeezerAlbums, deezerDetails: getDeezerAlbumDetails,
    searchMusicBrainz: searchMusicBrainzReleases, musicBrainzDetails: getMusicBrainzReleaseGroupDetails,
  });

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
      const query = nominationSearch.trim().toLowerCase();
      const local = catalogAlbums.filter(album => `${album.album_name || album.album} ${album.artist_name || album.artista}`.toLowerCase().includes(query)).slice(0,15).map(album => ({
        albumId: album.id, id: album.id, albumName: album.album_name || album.album, artistName: album.artist_name || album.artista,
        imageUrl: album.image_url || album.imagen, genres: album.genres || [], tracks: album.tracks || [],
        releaseDate: album.release_date, releaseYear: album.release_year, releaseType: album.release_type,
        spotifyLink: album.spotify_link, youtubeLink: album.youtube_link, appleMusicLink: album.apple_music_link, otherLink: album.other_link,
      }));
      const [spotify, mb] = await Promise.allSettled([searchAlbum(nominationSearch), searchMusicBrainzReleases(nominationSearch, 12)]);
      const remote = spotify.status === 'fulfilled' && spotify.value?.success ? (spotify.value.albums || []).map(album => ({
        id: album.id, albumName: album.name, artistName: Array.isArray(album.artists) ? album.artists.join(', ') : album.artist,
        imageUrl: album.image, releaseDate: album.releaseDate, releaseYear: album.releaseYear, releaseType: album.release_type || album.releaseType || 'ALBUM',
        genres: album.genres || [], tracks: album.tracks || [], spotifyLink: album.external_urls?.spotify || `https://open.spotify.com/album/${album.id}`,
      })) : [];
      const musicbrainz = mb.status === 'fulfilled' ? mb.value.map(album => ({
        id: album.id, mbid: album.mbid, albumName: album.name, artistName: album.artist, imageUrl: album.image,
        releaseDate: album.releaseDate, releaseYear: album.releaseYear, releaseType: album.releaseType, genres: [],
      })) : [];
      const seen = new Set();
      setSpotifyResults([...local, ...remote, ...musicbrainz].filter(item => { const key = `${item.artistName}::${item.albumName}`.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; }));
    } catch (err) {
      console.error('Error buscando en Spotify:', err);
      setSpotifyResults([]);
    } finally {
      setSearchingRemote(false);
    }
  };

  const handleSelectAlbumForNomination = async (item) => {
    const ticket = ++nominationSelection.current;
    setNominationError(''); setSearchingRemote(true);
    let result = item;
    try {
      if (item.mbid && !item.albumId) {
        const details = await getMusicBrainzReleaseGroupDetails(item.mbid);
        if (details) result = { ...item, tracks: details.tracks || [], genres: details.genres || [], releaseDate: details.releaseDate || item.releaseDate,
          spotifyLink: details.externalLinks?.spotify, youtubeLink: details.externalLinks?.youtube,
          appleMusicLink: details.externalLinks?.apple_music, otherLink: details.externalLinks?.deezer };
      } else if (!item.albumId) {
        const res = await getAlbumDetails(item.id);
        if (res?.success && res.album) {
          const details = res.album;
          result = { ...item, albumName: details.name || item.albumName, artistName: Array.isArray(details.artists) ? details.artists.join(', ') : details.artist || item.artistName,
            imageUrl: details.image || item.imageUrl, releaseDate: details.releaseDate || item.releaseDate, releaseYear: details.releaseYear || item.releaseYear,
            releaseType: details.release_type || item.releaseType || 'ALBUM', genres: details.genres || item.genres || [],
            tracks: (details.tracks || []).map((track,index)=>({...track, id:track.id || `track-${index+1}`,track_number:track.track_number || index+1})),
            spotifyLink: details.external_urls?.spotify || item.spotifyLink };
        }
      }
      result = await enrichGenres(result);
    } catch { result = { ...item, genres: genreCatalog.normalizeGenres(item.genres || []) }; }
    finally { if (ticket === nominationSelection.current) { setSelectedAlbumToNominate(result); setSearchingRemote(false); } }
  };

  // Submit nomination
  const handleConfirmNomination = async () => {
    if (!isPoolOpen) {
      alert('El Pool se encuentra actualmente cerrado para nuevas propuestas.');
      return;
    }
    if (!selectedAlbumToNominate) return;
    setSubmittingNomination(true); setNominationError('');
    const motion = new Promise(resolve => setTimeout(resolve, 2300));
    try {
      await nominateAlbum({
        albumId: selectedAlbumToNominate.albumId || null,
        albumData: selectedAlbumToNominate,
        user,
        note: nominationNote,
      });
      await motion;
      setNominationSuccess(true);
    } catch (err) {
      setNominationError(err.message || 'No se pudo guardar la cápsula. Puedes intentarlo de nuevo.');
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
      setPoolActionError(err.message);
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
    <div className="min-h-screen cyber-grid p-3 sm:p-6 w-full max-w-full overflow-x-hidden text-white font-sans flex flex-col justify-between">
      <SEO
        title="Pool Musical Comunitario y Temporadas | Musiclub"
        description="El Pool Musical comunitario de Musiclub. Descubre los álbumes propuestos para las temporadas, el álbum ganador de la semana y participa en las votaciones."
        url="https://www.musiclub.org/pool"
        keywords="pool musical, club de musica, album de la semana, votaciones de albumes, musiclub pool"
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
        <PoolHero season={season} waiting={poolLoading && !activePool.length ? '…' : activePool.length}
          winners={poolLoading && !poolHistory.length && !winner ? '…' : poolHistory.length + (winner ? 1 : 0)}
          isOpen={isPoolOpen} isAdmin={isAdmin} busy={poolActionBusy}
          onDeposit={() => user ? setShowNominateModal(true) : setShowLoginModal(true)}
          onOpen={() => runPoolAction(() => setPoolOpenStatus(true))} />
        {(poolActionError || poolError) && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">{poolActionError || poolError}</p>}
        {isAdmin && <PoolManualControls user={user} sampleRelease={catalogAlbums[0]} season={season} seasons={seasons} isPoolOpen={isPoolOpen} createSeason={createSeason} updateSeason={updateSeason} setActiveSeason={setActiveSeason} setPoolOpenStatus={setPoolOpenStatus} onError={setPoolActionError} />}

        {/* =========================================================================
            2. WINNER SPOTLIGHT: ÁLBUM EN FOCO DE LA SEMANA
            ========================================================================= */}
        {winner ? (
          <section className="relative text-left">
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#1b1e3d] via-[#101226] to-[#0a0a14] border-2 border-pink-500/40 p-6 sm:p-8 md:p-10 shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 relative z-10">
                {/* Artwork */}
                <div className="relative shrink-0 group">
                  <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden border-2 border-pink-500/50 shadow-2xl shadow-pink-500/30">
                    <img
                      src={winner.imagen}
                      alt={winner.album}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="absolute -top-3 -right-3 bg-linear-to-r from-[#f5576c] to-[#f093fb] text-white text-[10px] sm:text-xs font-black px-3.5 py-1 rounded-full shadow-lg border border-white/20">
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

                  {/* Enlaces Oficiales de Streaming con Logos */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-2">
                    {(winner.spotifyLink || winner.spotify_link) && (
                      <a
                        href={winner.spotifyLink || winner.spotify_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-[#1db954]/15 hover:bg-[#1db954]/25 text-[#1db954] border border-[#1db954]/30 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 group hover:scale-105"
                        title="Escuchar en Spotify"
                      >
                        <SpotifyLogo className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform" />
                        <span>Spotify</span>
                      </a>
                    )}

                    {(winner.appleMusicLink ||
                      winner.apple_music_link ||
                      (winner.album && winner.artista)) && (
                      <a
                        href={
                          winner.appleMusicLink ||
                          winner.apple_music_link ||
                          `https://music.apple.com/search?term=${encodeURIComponent(
                            winner.artista + ' ' + winner.album
                          )}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-[#fc3c44]/15 hover:bg-[#fc3c44]/25 text-[#fc3c44] border border-[#fc3c44]/30 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 group hover:scale-105"
                        title="Escuchar en Apple Music"
                      >
                        <AppleMusicLogo className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform" />
                        <span>Apple Music</span>
                      </a>
                    )}

                    {(winner.youtubeLink ||
                      winner.youtube_link ||
                      (winner.album && winner.artista)) && (
                      <a
                        href={
                          winner.youtubeLink ||
                          winner.youtube_link ||
                          `https://music.youtube.com/search?q=${encodeURIComponent(
                            winner.artista + ' ' + winner.album
                          )}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 group hover:scale-105"
                        title="Escuchar en YouTube Music"
                      >
                        <YouTubeLogo className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform" />
                        <span>YouTube Music</span>
                      </a>
                    )}

                    {(winner.deezerLink ||
                      winner.otherLink ||
                      winner.other_link ||
                      (winner.album && winner.artista)) && (
                      <a
                        href={
                          winner.deezerLink ||
                          winner.otherLink ||
                          winner.other_link ||
                          `https://www.deezer.com/search/${encodeURIComponent(
                            winner.artista + ' ' + winner.album
                          )}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-[#a238ff]/15 hover:bg-[#a238ff]/25 text-[#c77dff] border border-[#a238ff]/30 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 group hover:scale-105"
                        title="Escuchar en Deezer"
                      >
                        <DeezerLogo className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform" />
                        <span>Deezer</span>
                      </a>
                    )}

                    <Link
                      to={getReleaseUrl(
                        winner.album,
                        winner.release_type || winner.releaseType
                      )}
                      className="px-3.5 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 text-xs font-bold text-pink-300 transition-all flex items-center gap-1.5 hover:scale-105"
                    >
                      <span>🔍</span>
                      <span>Ver Release</span>
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
                        className="px-5 py-2.5 rounded-xl bg-linear-to-r from-[#f5576c] to-[#f093fb] hover:from-[#f5576c]/90 hover:to-[#f093fb]/90 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
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
                        🔒 Las calificaciones para este disco no están
                        habilitadas por la administración.
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

                {/* Spinning Vinyl Disc on the Right */}
                <div className="hidden md:flex shrink-0 items-center justify-center relative p-2 self-center">
                  <div className="relative w-32 h-32 lg:w-44 lg:h-44 xl:w-52 xl:h-52 group">
                    {/* Ambient Glow behind disc */}
                    <div className="absolute -inset-3 bg-linear-to-tr from-[#f5576c]/25 via-[#a855f7]/25 to-transparent rounded-full blur-2xl pointer-events-none animate-pulse"></div>

                    {/* Disc Frame & Shadow */}
                    <div className="relative w-full h-full rounded-full border-2 border-white/20 shadow-2xl p-1 bg-[#0b0c16]/60 backdrop-blur-sm">
                      <MusiclubVinyl
                        src="/musiclub_logo_3.png"
                        alt="Disco de la semana"
                        className="w-full h-full rounded-full object-cover animate-disc-spin pointer-events-none select-none drop-shadow-[0_10px_20px_rgba(245,87,108,0.25)]"
                      />
                    </div>
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
              {activePool.length ? <>Usa la Ruleta o el Gashapon Arcade para sortear el próximo release de los{' '}
              <span
                translate="no"
                className="notranslate font-bold text-pink-400"
                data-stat="number"
              >
                {poolLoading ? '...' : activePool.length}
              </span>{' '}
              candidatos activos en el Pool.</> : isPoolOpen ? 'Las propuestas están abiertas. El siguiente descubrimiento puede ser el tuyo.' : 'El próximo turno comenzará cuando el administrador abra las propuestas.'}
            </p>
            {activePool.length > 0 && <Link
              to={`/gashapon?pool=${encodeURIComponent(season.id)}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-linear-to-r from-pink-500 to-purple-500 text-white font-bold text-sm shadow-lg hover:scale-105 transition-all"
            >
              <span>🎲</span>
              <span>Explorar releases del Pool en Gashapon</span>
            </Link>}
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
                <span translate="no" className="notranslate" data-stat="number">
                  {poolLoading ? '...' : activePool.length}
                </span>
                )
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Propuestas de la comunidad listas para los próximos sorteos
                semanales.
              </p>
            </div>

            {/* Format Filter Bar */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'ALL', label: 'Todos', count: formatCounts.ALL },
                { id: 'ALBUM', label: 'Álbumes', count: formatCounts.ALBUM },
                { id: 'EP', label: 'EPs', count: formatCounts.EP },
                {
                  id: 'SENCILLO',
                  label: 'Sencillos',
                  count: formatCounts.SENCILLO,
                },
              ].map((tab) => {
                const isSelected = selectedFormatFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedFormatFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-linear-to-r from-pink-500 to-purple-500 text-white border-pink-400 shadow-md font-black'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? 'bg-black/30 text-white'
                          : 'bg-white/10 text-slate-400'
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
                <span>
                  {showSlotMachine ? 'Ocultar Ruleta' : 'Ruleta del Pool'}
                </span>
              </button>

              {!isPoolOpen ? (
                <button
                  type="button"
                  disabled
                  className="px-4 py-2.5 rounded-xl bg-white/[0.04] text-slate-500 border border-white/5 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed opacity-60 select-none shadow-none"
                  title="El Pool se encuentra actualmente cerrado para nuevas propuestas"
                >
                  <span className="opacity-70">🔒</span>
                  <span>Proponer (Cerrado)</span>
                </button>
              ) : (
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
              )}
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
                    Sorteo interactivo con los {slotMachinePool.length} discos
                    actualmente en la tabla de pool entries.
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
                    Propón o añade nuevos discos al Pool para activar la ruleta
                    musical.
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
                        setPoolActionError(err.message || 'No se pudo elegir el ganador.');
                      }
                    }
                  }}
                  isSpinning={false}
                  onSpinStart={() => {}}
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
                  <PoolCapsuleToken album={alb} />

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

                  {/* Actions & Platform Badges */}
                  <div className="pt-2 mt-2 border-t border-white/5 flex flex-col gap-1.5">
                    {/* Quick Streaming Logos */}
                    <div className="flex items-center gap-1.5">
                      {(alb.spotifyLink || alb.spotify_link) && (
                        <a
                          href={alb.spotifyLink || alb.spotify_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-md bg-[#1db954]/10 hover:bg-[#1db954]/25 text-[#1db954] transition-all hover:scale-110"
                          title="Spotify"
                        >
                          <SpotifyLogo className="w-3 h-3 fill-current" />
                        </a>
                      )}
                      {(alb.appleMusicLink ||
                        alb.apple_music_link ||
                        (alb.album && alb.artista)) && (
                        <a
                          href={
                            alb.appleMusicLink ||
                            alb.apple_music_link ||
                            `https://music.apple.com/search?term=${encodeURIComponent(
                              alb.artista + ' ' + alb.album
                            )}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-md bg-[#fc3c44]/10 hover:bg-[#fc3c44]/25 text-[#fc3c44] transition-all hover:scale-110"
                          title="Apple Music"
                        >
                          <AppleMusicLogo className="w-3 h-3 fill-current" />
                        </a>
                      )}
                      {(alb.youtubeLink ||
                        alb.youtube_link ||
                        (alb.album && alb.artista)) && (
                        <a
                          href={
                            alb.youtubeLink ||
                            alb.youtube_link ||
                            `https://music.youtube.com/search?q=${encodeURIComponent(
                              alb.artista + ' ' + alb.album
                            )}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-md bg-red-500/10 hover:bg-red-500/25 text-red-400 transition-all hover:scale-110"
                          title="YouTube Music"
                        >
                          <YouTubeLogo className="w-3 h-3 fill-current" />
                        </a>
                      )}
                      {(alb.deezerLink ||
                        alb.otherLink ||
                        alb.other_link ||
                        (alb.album && alb.artista)) && (
                        <a
                          href={
                            alb.deezerLink ||
                            alb.otherLink ||
                            alb.other_link ||
                            `https://www.deezer.com/search/${encodeURIComponent(
                              alb.artista + ' ' + alb.album
                            )}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-md bg-[#a238ff]/10 hover:bg-[#a238ff]/25 text-[#c77dff] transition-all hover:scale-110"
                          title="Deezer"
                        >
                          <DeezerLogo className="w-3 h-3 fill-current" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <Link
                        to={getReleaseUrl(
                          alb.album,
                          alb.release_type || alb.releaseType
                        )}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        Ver Release →
                      </Link>

                      {isAdmin && (
                        <button
                          type="button"
                          disabled={Boolean(winner) || poolActionBusy}
                          onClick={() => runPoolAction(() => selectWinner(alb.id))}
                          className="text-[10px] px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 hover:bg-pink-500 hover:text-white transition-colors font-bold cursor-pointer"
                          title="Seleccionar como ganador semanal"
                        >
                          👑 Elegir
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* =========================================================================
            4. POOL GRADUATION HISTORY (HISTORIAL DE LA TEMPORADA)
            ========================================================================= */}
        {sortedPoolHistory.length > 0 && (
          <section className="space-y-6 text-left pt-6 border-t border-white/10">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Historial de Ganadores (
                <span translate="no" className="notranslate" data-stat="number">
                  {poolLoading ? '...' : sortedPoolHistory.length}
                </span>
                )
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Lanzamientos que ganaron en esta temporada y ya
                fueron evaluados por la comunidad, ordenados de mayor a menor
                calificación.
              </p>
            </div>

            {!isPoolSliderActive ? (
              /* CASO 1: MÁXIMO 4 ELEMENTOS -> CUADRÍCULA ESTÁTICA */
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {sortedPoolHistory.map((alb, idx) => (
                  <Link
                    key={alb.id || idx}
                    to={getReleaseUrl(
                      alb.album,
                      alb.release_type || alb.releaseType
                    )}
                    className="group relative rounded-2xl bg-[#111322]/80 border border-white/10 hover:border-amber-400/40 p-2.5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between w-full"
                  >
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black/40 mb-2">
                      <img
                        src={alb.imagen}
                        alt={alb.album}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      {alb.final_rating || alb.avg_rating ? (
                        <div
                          className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-black/85 backdrop-blur-md text-[11px] font-black text-amber-300 border border-amber-400/35 flex items-center gap-1 shadow-lg shadow-black/50"
                          title={`Calificación promedio del club: ${Number(alb.final_rating || alb.avg_rating).toFixed(1)} / 10`}
                        >
                          <span className="text-amber-400 text-xs">★</span>
                          <span
                            translate="no"
                            className="notranslate tracking-tight"
                          >
                            {Number(alb.final_rating || alb.avg_rating).toFixed(
                              1
                            )}
                          </span>
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
            ) : (
              /* CASO 2: MÁS DE 4 ELEMENTOS -> SLIDER HORIZONTAL CONTINUO */
              <div
                className="relative w-full overflow-hidden py-2 group/pool-slider"
                onMouseEnter={() => setIsPoolSliderPaused(true)}
                onMouseLeave={() => setIsPoolSliderPaused(false)}
              >
                {/* Gradientes laterales de desvanecimiento estético */}
                <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-linear-to-r from-[#0a0a12] via-[#0a0a12]/80 to-transparent opacity-70 z-10" />
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-linear-to-l from-[#0a0a12] via-[#0a0a12]/80 to-transparent opacity-70 z-10" />

                {/* Pista del slider infinito en traslación perpetua */}
                <div
                  className={`mb-6 animate-continuous-slider flex gap-3 sm:gap-5 w-max will-change-transform ${
                    isPoolSliderPaused ? 'slider-paused' : ''
                  }`}
                  style={{
                    '--slider-duration': poolSliderDuration,
                  }}
                >
                  {poolMarqueeItems.map((alb, idx) => (
                    <Link
                      key={`pool-marquee-${alb.id || idx}-${idx}`}
                      to={getReleaseUrl(
                        alb.album,
                        alb.release_type || alb.releaseType
                      )}
                      className="group relative rounded-2xl bg-[#111322]/80 border border-white/10 hover:border-amber-400/40 p-2.5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between w-[200px] sm:w-[230px] md:w-[260px] shrink-0"
                    >
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black/40 mb-2">
                        <img
                          src={alb.imagen}
                          alt={alb.album}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        {alb.final_rating || alb.avg_rating ? (
                          <div
                            className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-black/85 backdrop-blur-md text-[14px] font-black text-amber-300 border border-amber-400/35 flex items-center gap-1 shadow-lg shadow-black/50"
                            title={`Calificación promedio del club: ${Number(alb.final_rating || alb.avg_rating).toFixed(1)} / 10`}
                          >
                            <span className="text-amber-400 text-xs">★</span>
                            <span
                              translate="no"
                              className="notranslate tracking-tight"
                            >
                              {Number(
                                alb.final_rating || alb.avg_rating
                              ).toFixed(1)}
                            </span>
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
              </div>
            )}
          </section>
        )}

        {/* =========================================================================
            5. NOMINATION MODAL (PROPONER DISCO CON SPOTIFY SEARCH)
            ========================================================================= */}
        {showNominateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="relative max-h-[90dvh] overflow-y-auto w-full max-w-xl rounded-3xl bg-[#141628] border border-pink-500/30 p-6 sm:p-8 shadow-2xl space-y-5 text-left">
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
                  disabled={submittingNomination}
                  onClick={closeNomination}
                  className="text-slate-400 hover:text-white text-sm p-1"
                >
                  ✕
                </button>
              </div>

              {nominationError && <p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-500/10 p-3 text-xs text-rose-200">{nominationError}</p>}
              {nominationSuccess || submittingNomination ? (
                <div className="text-center space-y-3">
                  <PoolCapsuleDeposit album={selectedAlbumToNominate} user={user} phase={nominationSuccess ? 'saved' : 'saving'} />
                  <p className="text-sm font-bold text-white">{selectedAlbumToNominate?.albumName}</p>
                  <p className="text-xs text-slate-400">{nominationSuccess ? `Guardada en ${season.name}. Las reseñas conservan su control manual.` : 'Espera a que se confirme el registro para ocupar tu lugar.'}</p>
                  {nominationSuccess && <button onClick={closeNomination} className="min-h-11 rounded-xl bg-pink-500 px-5 text-sm font-bold text-white">Volver al Pool</button>}
                </div>
              ) : !selectedAlbumToNominate ? (
                <div className="space-y-4">
                  {/* Search Form */}
                  <form onSubmit={handleSearchSpotify} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Buscar en Musiclub, Spotify o MusicBrainz..."
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
                    {searchingRemote && <p role="status" className="py-3 text-center text-xs text-purple-200">Buscando el release y sus géneros…</p>}
                    {spotifyResults.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        aria-disabled={searchingRemote}
                        onClick={() => { if (!searchingRemote) handleSelectAlbumForNomination(item); }}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-pink-500/20 border border-white/5 hover:border-pink-500/40 cursor-pointer transition-all"
                      >
                        <img
                          src={
                            item.imageUrl ||
                            item.imagen ||
                            'https://via.placeholder.com/100/1a1a2e/ffffff?text=🎵'
                          }
                          alt={item.albumName || item.album}
                          className="w-12 h-12 rounded-lg object-cover border border-white/10"
                          onError={(e) => {
                            e.target.src =
                              'https://via.placeholder.com/100/1a1a2e/ffffff?text=🎵';
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
                        Escribe el nombre de un artista o disco para buscar en
                        Musiclub y las fuentes musicales disponibles.
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

                  <PoolCapsuleDeposit album={selectedAlbumToNominate} user={user} />
                  <p className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-xs text-cyan-100">Tu propuesta se registra en <strong>{season.name}</strong>. Proponer no habilita las reseñas: el administrador elige el ganador y controla cuándo se puede calificar.</p>
                  {genreCatalog.normalizeGenres(selectedAlbumToNominate.genres || []).length ? <div className="flex flex-wrap gap-2">{genreCatalog.normalizeGenres(selectedAlbumToNominate.genres).map(genre => <GenreLabel key={genre} genre={genre} className="rounded-lg bg-white/5 px-2 py-1 text-xs" />)}</div> : !selectedAlbumToNominate.albumId && <label className="block text-xs text-slate-300">No encontramos el género automáticamente. Indica el principal para completar la cápsula.
                    <select value="" onChange={event => setSelectedAlbumToNominate(previous => ({...previous, genres: genreCatalog.normalizeGenres([event.target.value])}))} className="mt-1 min-h-11 w-full rounded-xl border border-white/20 bg-[#111424] p-2 text-white"><option value="">Elige un género para continuar</option>{genreCatalog.GENRES.map(genre => <option key={genre.id} value={genre.id}>{genre.name}</option>)}</select>
                  </label>}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      ¿Cómo encaja con la dinámica del Pool? (opcional)
                    </label>
                    <textarea
                      rows={2}
                      maxLength={600}
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
                      disabled={submittingNomination || !isPoolOpen || (!selectedAlbumToNominate.albumId && !genreCatalog.normalizeGenres(selectedAlbumToNominate.genres || []).length)}
                      className="px-6 py-2 rounded-xl bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-xs font-black shadow-lg"
                    >
                      {submittingNomination
                        ? 'Registrando...'
                        : 'Depositar mi cápsula'}
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
