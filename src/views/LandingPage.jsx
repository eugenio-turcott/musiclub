'use client';
import { LandingMotion, LandingHero, LandingJourney, LandingFinale } from '../components/LandingExperience';
import MoodIcon from '../components/MoodIcon';
import { InterfaceText, UiIcon } from '../components/UiIcon';
import { ListenLaterButton } from '../components/ListenLaterButton';
import reviewChronology from '../utils/reviewChronology.cjs';
import { GenreIconStrip } from '../components/GenreIconStrip';
import { MusiclubVinyl } from '../components/MusiclubVinyl';
import { publicCatalog } from '../services/publicCatalog';
// src/pages/LandingPage.jsx
import { CoverImage } from '../components/CoverImage';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Footer } from '../components/Footer';
import dynamic from 'next/dynamic';
import { LoginModal } from '../components/LoginModal';
import { HourlyRecommendedRelease } from '../components/HourlyRecommendedRelease';
import { EditorialSpotlight } from '../components/EditorialSpotlight';
import { AdvertisingConsentNotice } from '../components/AdvertisingConsentNotice';
import {AdsterraAdvertising} from '../components/AdsterraAdvertising';
import { SEO } from '../components/SEO';
import { useAlbums } from '../hooks/useAlbums';
import { usePool } from '../hooks/usePool';
import { useAuth } from '../hooks/useAuth';
import { useUserReviews } from '../hooks/useUserReviews';
import { supabaseService, supabase } from '../services/supabaseClient';
import {
  getReleaseUrl,
  getWeightedReviewScore,
  getEmotionFromReview,
  getCommunityTopAlbum,
  getTrackDisplayName,
} from '../utils/ratingUtils';
import { notifyContentLoaded } from '../utils/translateCrashGuard';

const ReviewSystem = dynamic(() => import('../components/ReviewSystem').then(module => module.ReviewSystem), {
  loading: () => <p role="status" className="p-4 text-slate-300">Preparando tu valoración…</p>,
});

export function LandingPage({ initialAlbums = [], initialReviews = [], initialStats, initialDemoAlbums = [], initialDemoReviews = [] } = {}) {
  const { albums, winner, refetch, markAlbumAsInactive } = useAlbums(initialAlbums);
  const { activePool } = usePool();
  const {
    user,
    loading: authLoading,
    isAdmin,
    loginWithGoogle,
    logout,
  } = useAuth();
  const { reviewedAlbumIds, refetchUserReviews } = useUserReviews(user);

  // Modals & UI Controls
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewsEnabled, setReviewsEnabled] = useState(
    winner?.reviews_enabled || false
  );
  const [togglingReviews, setTogglingReviews] = useState(false);

  // Data states from Supabase
  const [topAlbums, setTopAlbums] = useState(() => initialAlbums.filter(a => a.review_count > 0)
    .map(a => ({ ...a, avg_rating: a.final_rating })).sort((a, b) => b.avg_rating - a.avg_rating));
  const [allReviews, setAllReviews] = useState(initialReviews);
  const [globalStats, setGlobalStats] = useState(initialStats || {
    total_reviews: null,
    total_albums: null,
    total_reviewed_albums: null,
    total_users: null,
    top_score: null,
  });
  const [preferredAlbumTab, setSelectedAlbumTab] = useState('active'); // 'active' | 'top' | 'recent'
  const hasActivePool = (activePool?.length || 0) > 0;
  const selectedAlbumTab = preferredAlbumTab === 'active' && !hasActivePool ? 'top' : preferredAlbumTab;
  const [quickPickAlbum, setQuickPickAlbum] = useState(null);
  const [isQuickPicking, setIsQuickPicking] = useState(false);

  // En Rotación & Tendencias Slider State
  const [isShowcaseSliderPaused, setIsShowcaseSliderPaused] = useState(false);

  // Synchronize reviewsEnabled with winner
  useEffect(() => {
    if (winner) {
      setReviewsEnabled(winner.reviews_enabled || false);
    }
  }, [winner]);

  // Load complementary data (top albums, reviews with full album relations, stats)
  const loadedInitialSnapshot = useRef(false);
  useEffect(() => {
    let isMounted = true;
    const fetchLandingData = async () => {
      try {
        const data = await publicCatalog();
        const topData = data.albums.filter(a => a.review_count > 0).map(a => ({ ...a, avg_rating: a.final_rating })).sort((a,b) => b.avg_rating-a.avg_rating);
        const reviewsRes = { data: data.reviews };
        const statsData = data.stats;
        const profilesData = [];

        if (!isMounted) return;

        if (topData && Array.isArray(topData) && topData.length > 0) {
          setTopAlbums(topData);
        }

        const reviewsData = reviewsRes?.data || [];
        if (
          reviewsData &&
          Array.isArray(reviewsData) &&
          reviewsData.length > 0
        ) {
          const profileAvatarByEmail = new Map();
          const profileAvatarByName = new Map();
          (profilesData || []).forEach((p) => {
            if (p.email && p.avatar_url)
              profileAvatarByEmail.set(
                p.email.toLowerCase().trim(),
                p.avatar_url
              );
            if (p.name && p.avatar_url)
              profileAvatarByName.set(
                p.name.toLowerCase().trim(),
                p.avatar_url
              );
          });

          const enrichedReviews = reviewsData.map((rev) => {
            if (rev.reviewer_avatar) return rev;
            const emailKey = rev.reviewer_email?.toLowerCase()?.trim();
            const nameKey = rev.reviewer_name?.toLowerCase()?.trim();
            const fallbackAvatar =
              (emailKey && profileAvatarByEmail.get(emailKey)) ||
              (nameKey && profileAvatarByName.get(nameKey)) ||
              null;
            return fallbackAvatar
              ? { ...rev, reviewer_avatar: fallbackAvatar }
              : rev;
          });
          setAllReviews(enrichedReviews);
        }

        // Calculate global stats
        const reviewedAlbumIds = new Set(
          (reviewsData || []).map((rev) => rev.album_id).filter(Boolean)
        );
        const totalReviewedAlbums = statsData?.total_reviewed_albums ?? reviewedAlbumIds.size;
        const totalReviewsCount = statsData?.total_reviews ?? reviewsData.length;
        const uniqueReviewersCount = new Set(
          (reviewsData || [])
            .map((rev) => rev.reviewer_name?.trim())
            .filter(Boolean)
        ).size;
        const totalMembersCount = statsData?.total_users ?? uniqueReviewersCount;
        const topScore = getCommunityTopAlbum(data.albums)?.final_rating ?? null;
        setGlobalStats({
          total_reviews: totalReviewsCount,
          total_albums: statsData?.total_albums ?? albums.length,
          total_reviewed_albums: totalReviewedAlbums,
          total_users: totalMembersCount,
          top_score: topScore,
        });
        notifyContentLoaded('landing');
      } catch (err) {
        console.warn('Error loading landing page complementary data:', err);
      }
    };

    // The server already supplied this snapshot. Avoid downloading the entire catalog again on mount.
    if (!initialStats || loadedInitialSnapshot.current) fetchLandingData();
    loadedInitialSnapshot.current = true;
    return () => {
      isMounted = false;
    };
  }, [albums]);

  const handleLogin = () => setShowLoginModal(true);

  const handleLoginWithGoogle = async () => {
    setLoginLoading(true);
    const result = await loginWithGoogle();
    setLoginLoading(false);
    if (result.success && !result.redirecting) {
      setShowLoginModal(false);
    }
    return result;
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleAlbumUpdated = () => {
    refetch();
    if (refetchUserReviews) refetchUserReviews();
  };

  const toggleWinnerReviews = async () => {
    if (!isAdmin || !winner) return;
    setTogglingReviews(true);
    try {
      const newValue = !reviewsEnabled;
      const { error } = await supabase
        .from('albums')
        .update({ reviews_enabled: newValue })
        .eq('id', winner.id);

      if (!error) {
        setReviewsEnabled(newValue);
        winner.reviews_enabled = newValue;
        if (handleAlbumUpdated) handleAlbumUpdated();
      }
    } catch (err) {
      console.error('Error toggling reviews on landing:', err);
    }
    setTogglingReviews(false);
  };

  const isWinnerReviewed =
    winner?.id &&
    reviewedAlbumIds &&
    (reviewedAlbumIds instanceof Set
      ? reviewedAlbumIds.has(winner.id)
      : Array.isArray(reviewedAlbumIds) &&
        reviewedAlbumIds.includes(winner.id));

  // Active pool albums for quick roulette & tabs
  const activeAlbums = useMemo(
    () => (albums.length > 0 ? albums : []),
    [albums]
  );

  // La reseña más reciente de cada persona, hasta tres personas distintas.
  const communityReviews = useMemo(() => {
    const latestList = [];
    for (const rev of reviewChronology.latestCommunityReviews(allReviews)) {
      // Encontrar álbum asociado si no vino por join
      const matchedAlbum =
        rev.albums ||
        albums.find(
          (a) =>
            a.id === rev.album_id ||
            (a.album_name &&
              a.album_name.toLowerCase() ===
                (rev.album_name || '').toLowerCase()) ||
            (a.album &&
              a.album.toLowerCase() === (rev.album_name || '').toLowerCase())
        );

      // Resolver nombre legible de la canción favorita
      let favTrackTitle = null;
      const rawFav = rev.favorite_track || rev.favoriteTrack;
      if (rawFav) {
        const resolvedName = getTrackDisplayName(
          rawFav,
          matchedAlbum?.tracks || []
        );
        // Si el nombre resuelto sigue siendo un hash de Spotify de 20-25 caracteres alfanumérico, buscar en tracks o ignorar hash
        if (/^[a-zA-Z0-9]{20,25}$/.test(resolvedName)) {
          const trk = (matchedAlbum?.tracks || []).find(
            (t) =>
              t &&
              (t.id === rawFav ||
                t.spotify_id === rawFav ||
                String(t.track_number) === String(rawFav))
          );
          favTrackTitle = trk ? trk.name : null;
        } else {
          favTrackTitle = resolvedName;
        }
      }

      latestList.push({
        ...rev,
        matchedAlbum,
        favTrackTitle,
      });

    }
    return latestList;
  }, [allReviews, albums]);

  // Curated showcase albums based on active tab
  const showcaseAlbums = useMemo(() => {
    const genresById = new Map(albums.map(album => [album.id, album.genres || []]));
    const releaseGenres = album => album.genres?.length ? album.genres : genresById.get(album.id) || [];
    if (selectedAlbumTab === 'top') {
      if (topAlbums && topAlbums.length > 0) {
        return topAlbums.slice(0, 16).map((a) => ({
          id: a.id,
          album: a.album_name,
          artista: a.artist_name,
          imagen: a.image_url,
          score: a.avg_rating,
          reviewCount: a.review_count,
          status: a.status,
          release_type: a.release_type,
          genres: releaseGenres(a),
          release_year: a.release_year,
        }));
      }
      return [...albums]
        .filter((a) => (a.avg_rating || a.final_rating || 0) > 0)
        .sort(
          (a, b) =>
            (b.final_rating || b.avg_rating || 0) -
            (a.final_rating || a.avg_rating || 0)
        )
        .slice(0, 16)
        .map((a) => ({
          id: a.id,
          album: a.album || a.album_name,
          artista: a.artista || a.artist_name,
          imagen: a.imagen || a.image_url,
          score: a.final_rating || a.avg_rating,
          reviewCount: a.reviews_count || 1,
          status: a.status,
          release_type: a.release_type,
          genres: releaseGenres(a),
          release_year: a.release_year,
        }));
    }
    if (selectedAlbumTab === 'recent') {
      const topMap = new Map(topAlbums.map((t) => [t.id, t]));
      return [...albums]
        .sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        )
        .slice(0, 16)
        .map((a) => {
          const topInfo = topMap.get(a.id);
          return {
            id: a.id,
            album: a.album || a.album_name,
            artista: a.artista || a.artist_name,
            imagen: a.imagen || a.image_url,
            added_by: a.added_by,
            status: a.status,
            score: topInfo?.avg_rating || a.final_rating || a.avg_rating,
            reviewCount: topInfo?.review_count || 0,
            release_type: a.release_type,
            genres: releaseGenres(a),
            release_year: a.release_year,
          };
        });
    }
    // Default 'active': Pool Activo de la temporada
    const poolItems = activePool && activePool.length > 0 ? activePool : [];
    if (poolItems.length > 0) {
      const topMap = new Map(topAlbums.map((t) => [t.id, t]));
      return poolItems.slice(0, 16).map((a) => {
        const topInfo = topMap.get(a.id);
        return {
          id: a.id,
          album: a.album || a.album_name,
          artista: a.artista || a.artist_name,
          imagen: a.imagen || a.image_url,
          added_by: a.added_by,
          status: 'POOL_ACTIVO',
          score: topInfo?.avg_rating || a.final_rating || a.avg_rating,
          reviewCount: topInfo?.review_count || 0,
          release_type: a.release_type,
          genres: releaseGenres(a),
          release_year: a.release_year,
        };
      });
    }
    return activeAlbums.slice(0, 16).map((a) => ({
      id: a.id,
      album: a.album || a.album_name,
      artista: a.artista || a.artist_name,
      imagen: a.imagen || a.image_url,
      added_by: a.added_by,
      status: a.status,
      score: a.final_rating || a.avg_rating,
      release_type: a.release_type,
      genres: releaseGenres(a),
      release_year: a.release_year,
    }));
  }, [selectedAlbumTab, activePool, activeAlbums, topAlbums, albums]);

  // Lógica del Slider de "En Rotación & Tendencias":
  // Si hay máximo 4, el slider no se mueve (estático).
  // Si hay más de 4, se mueve constantemente como un slider automático infinito.
  const isShowcaseSliderActive = showcaseAlbums.length > 4;

  const showcaseMarqueeItems = useMemo(() => {
    if (!isShowcaseSliderActive) return showcaseAlbums;
    let base = [...showcaseAlbums];
    while (base.length < 8) {
      base = [...base, ...showcaseAlbums];
    }
    // Duplicamos exactamente la base para crear las mitades 50% / 50% para un bucle continuo infinito
    return [...base, ...base];
  }, [showcaseAlbums, isShowcaseSliderActive]);

  const showcaseSliderDuration = useMemo(() => {
    if (!isShowcaseSliderActive) return '0s';
    const baseCount = showcaseMarqueeItems.length / 2;
    return `${Math.max(25, Math.round(baseCount * 4.5))}s`;
  }, [isShowcaseSliderActive, showcaseMarqueeItems.length]);

  // Quick Pick random album generator
  const handleQuickPick = () => {
    if (activeAlbums.length === 0) return;
    setIsQuickPicking(true);
    let count = 0;
    const interval = setInterval(() => {
      const rand =
        activeAlbums[Math.floor(Math.random() * activeAlbums.length)];
      setQuickPickAlbum(rand);
      count++;
      if (count >= 12) {
        clearInterval(interval);
        setIsQuickPicking(false);
      }
    }, 100);
  };

  // Renderizador unificado y responsivo de tarjetas de lanzamiento para el showcase
  const renderShowcaseCard = (album, key, isSliderMode = false) => (
    <article
      key={key}
      className={`group relative rounded-2xl bg-[#111322]/85 border border-white/10 hover:border-pink-500/50 p-3 sm:p-3.5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-500/15 flex flex-col justify-between ${
        isSliderMode
          ? 'w-[200px] sm:w-[230px] md:w-[260px] shrink-0'
          : 'w-full'
      }`}
    >
      <Link to={getReleaseUrl(album)} className="block min-w-0">
      {/* Artwork */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black/40 mb-2.5">
        {album.imagen ? (
          <CoverImage
            src={album.imagen}
            alt={album.album}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 notranslate"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl text-white/20"><InterfaceText>{" 💿 "}</InterfaceText></div>
        )}

        <GenreIconStrip genres={album.genres} className="absolute left-2 top-2 z-10" />

        {/* Bottom right badge */}
        {selectedAlbumTab === 'top' ||
        (album.score !== undefined &&
          album.score !== null &&
          Number(album.score) > 0) ? (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/85 backdrop-blur-md border border-amber-400/40 text-[10px] sm:text-xs font-black text-amber-300 shadow-md flex items-center gap-1">
            <span><InterfaceText>{"⭐"}</InterfaceText></span>
            <span>{Number(album.score).toFixed(1)}</span>
          </div>
        ) : selectedAlbumTab === 'active' || album.status === 'POOL_ACTIVO' ? (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-linear-to-r from-pink-600 to-rose-600 text-[9px] font-black text-white shadow-md uppercase tracking-wider"><InterfaceText>{" 🔥 POOL "}</InterfaceText></div>
        ) : (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-cyan-600/80 backdrop-blur-md text-[9px] font-black text-white shadow-md uppercase tracking-wider"><InterfaceText>{" 💎 NUEVO "}</InterfaceText></div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-0.5 min-w-0">
        <h3
          translate="no"
          className="text-xs sm:text-sm font-bold text-white group-hover:text-pink-300 transition-colors truncate notranslate music-title"
        >
          {album.album}
        </h3>
        <p
          translate="no"
          className="text-[11px] sm:text-xs text-white/50 truncate notranslate artist-name"
        >
          {album.artista}
        </p>
        <div className="pt-1 flex items-center justify-between text-[10px] text-white/40">
          {album.reviewCount !== undefined && album.reviewCount > 0 ? (
            <span>
              {album.reviewCount}{' '}
              {album.reviewCount === 1 ? 'reseña' : 'reseñas'}
            </span>
          ) : album.added_by ? (
            <span className="truncate">
              Por:{' '}
              <strong translate="no" className="notranslate username-tag">
                {album.added_by}
              </strong>
            </span>
          ) : album.release_year ? (
            <span>{album.release_year}</span>
          ) : null}
        </div>
      </div>
      </Link>
      <div className="release-card-actions mt-3 grid grid-cols-2 gap-2">
        <Link to={getReleaseUrl(album)} className="release-action-tile flex items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[11px] font-bold text-slate-200"><InterfaceText>{"💿"}</InterfaceText><span>Ver release</span></Link>
        <ListenLaterButton album={album} tile className="w-full" />
      </div>
    </article>
  );

  return (
    <LandingMotion><div className="min-h-screen p-4 sm:p-6 w-full max-w-full flex flex-col justify-between">
      <SEO
        title="Musiclub — El Club Social de Álbumes, EPs y Reviews de Música"
        description="En Musiclub descubre, califica y debate cada álbum, EP y canción. Calificaciones multi-criterio, Máquina Musical, gashapon arcade, rankings y reviews de la comunidad."
        url="https://www.musiclub.org"
        keywords="musica, albumes, reviews, calificaciones de musica, reseñas de discos, criticas musicales, spotify, discografias, rankings de albumes, musiclub"
      />

      <div className="max-w-7xl mx-auto w-full">
        {/* Navigation Header */}
        <AppHeader
          user={user}
          isAdmin={isAdmin}
          onLogin={handleLogin}
          onLogout={handleLogout}
          loading={authLoading}
          showTitle={false}
        />

        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLoginWithGoogle}
          onGoogleLogin={handleLoginWithGoogle}
          loading={loginLoading}
          googleLoading={loginLoading}
        />

        <main className="landing-live" data-icon-palette="varied">
        <LandingHero albums={initialDemoAlbums.length?initialDemoAlbums:albums} reviews={initialDemoReviews.length?initialDemoReviews:allReviews} stats={globalStats} user={user} onLogin={handleLogin}/>

        {/* =========================================================================
            2. SPOTLIGHT WINNER SECTION (Featured Album with Direct Action)
            ========================================================================= */}
        {winner && (
          <section className="my-6 sm:my-8 relative">
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#161830] via-[#0d0f1f] to-[#070810] border-2 border-pink-500/30 p-6 sm:p-8 md:p-10 shadow-2xl text-left">
              <div className="absolute -top-16 -right-16 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
                {/* Album Cover */}
                <div className="relative shrink-0 group">
                  <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden border-2 border-pink-500/40 shadow-2xl shadow-pink-500/20">
                    <CoverImage
                      src={winner.imagen}
                      alt={winner.album}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="absolute -top-3 -right-3 bg-linear-to-r from-[#f5576c] to-[#f093fb] text-white text-[10px] sm:text-xs font-black px-3 py-1 rounded-full shadow-lg border border-white/20"><InterfaceText>{" 🏆 GANADOR "}</InterfaceText></div>
                </div>

                {/* Album Info */}
                <div className="flex-1 text-center md:text-left space-y-3">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-pink-400 bg-pink-500/20 px-3 py-1 rounded-full border border-pink-500/30">
                      ÁLBUM EN EL FOCO DEL CLUB
                    </span>
                    {winner.added_by && (
                      <span className="text-xs text-white/50 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                        Sugerido por{' '}
                        <strong
                          translate="no"
                          className="notranslate username-tag text-white/80"
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
                    className="notranslate artist-name text-lg sm:text-xl text-white/60 font-light"
                  >
                    {winner.artista}
                  </p>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                    {winner.spotifyLink && (
                      <a
                        href={winner.spotifyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition-all flex items-center gap-1.5"
                      >
                        <span><InterfaceText>{"🎵"}</InterfaceText></span>
                        <span>Spotify</span>
                      </a>
                    )}
                    {winner.youtubeLink && (
                      <a
                        href={winner.youtubeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition-all flex items-center gap-1.5"
                      >
                        <span><InterfaceText>{"▶️"}</InterfaceText></span>
                        <span>YouTube</span>
                      </a>
                    )}
                    <Link
                      to={getReleaseUrl(winner)}
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-pink-300 hover:text-pink-200 transition-all flex items-center gap-1.5"
                    >
                      <span><InterfaceText>{"🔍"}</InterfaceText></span>
                      <span>Ver Análisis Completo</span>
                    </Link>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 flex flex-wrap items-center justify-center md:justify-start gap-3">
                    {reviewsEnabled ? (
                      <button
                        type="button"
                        onClick={() => setShowReviewModal((prev) => !prev)}
                        className="px-5 py-2.5 rounded-xl bg-linear-to-r from-[#f5576c] to-[#f093fb] hover:from-[#f5576c]/90 hover:to-[#f093fb]/90 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span>
                          <InterfaceText>{showReviewModal
                            ? '✕ Cerrar Reseña'
                            : isWinnerReviewed
                              ? '✏️ Modificar Mi Reseña'
                              : '⭐ Calificar y Reseñar'}</InterfaceText>
                        </span>
                      </button>
                    ) : (
                      <span className="text-xs text-white/40 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10"><InterfaceText>{" 🔒 Reseñas pausadas por moderación "}</InterfaceText></span>
                    )}

                    {isWinnerReviewed && (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1">
                        <span>✓</span> Ya calificaste este álbum
                      </span>
                    )}

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={toggleWinnerReviews}
                        disabled={togglingReviews}
                        className="text-xs px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
                      >
                        <InterfaceText>{togglingReviews
                          ? '...'
                          : reviewsEnabled
                            ? '🔒 Deshabilitar Reviews'
                            : '✅ Habilitar Reviews'}</InterfaceText>
                      </button>
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

              {/* Inline Review Form Accordion */}
              {showReviewModal && reviewsEnabled && (
                <div className="mt-6 pt-6 border-t border-white/10 animate-fadeIn">
                  <div className="flex items-center justify-between pb-3">
                    <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <span><InterfaceText>{"⭐"}</InterfaceText></span>
                      <span>
                        {isWinnerReviewed
                          ? 'Actualizar tu Calificación'
                          : 'Escribir Reseña'}
                      </span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowReviewModal(false)}
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
                      setShowReviewModal(false);
                      handleAlbumUpdated();
                    }}
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* =========================================================================
            RELEASE ALEATORIO POR HORA RECOMENDADO PARA CALIFICAR (1 A 3 RESEÑAS)
            ========================================================================= */}
        <EditorialSpotlight />
        <AdsterraAdvertising variant="inline" slot="home-radar" />
        {communityReviews.length > 0 && (
          <section className="my-12 sm:my-16 text-left">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  La Voz de la Comunidad
                </h2>
                <p className="text-white/60 text-xs sm:text-sm">
                  Opiniones, calificaciones y canciones favoritas compartidas
                  por los miembros del club.
                </p>
              </div>
              <Link
                to="/reviews"
                className="text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors self-start sm:self-auto"
              >
                Ver todas las reviews{' '}
                <span translate="no" className="notranslate" data-stat="count">
                  ({globalStats.total_reviews})
                </span>{' '}
                →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {communityReviews.map((review, idx) => {
                const weighted =
                  getWeightedReviewScore(review) ?? review.rating_general;
                const emotion = getEmotionFromReview(review);
                const albumInfo = review.matchedAlbum;
                const albumTitle =
                  albumInfo?.album_name ||
                  albumInfo?.album ||
                  review.album_name ||
                  'Álbum';
                const artistTitle =
                  albumInfo?.artist_name ||
                  albumInfo?.artista ||
                  review.artist_name ||
                  'Artista';
                const albumCover =
                  albumInfo?.image_url || albumInfo?.imagen || null;

                return (
                  <div
                    key={review.id || idx}
                    className="rounded-3xl bg-[#111322]/80 border border-white/10 p-5 sm:p-6 backdrop-blur-xl flex flex-col justify-between space-y-4 hover:border-pink-500/30 transition-all shadow-lg"
                  >
                    {/* Header: Reviewer Avatar, Name & Score */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {review.reviewer_avatar ? (
                          <CoverImage
                            src={review.reviewer_avatar}
                            width={32}
                            height={32}
                            sizes="32px"
                            alt={review.reviewer_name || 'U'}
                            className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-8 h-8 rounded-full bg-linear-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shrink-0 ${
                            review.reviewer_avatar ? 'hidden' : 'flex'
                          }`}
                        >
                          {(review.reviewer_name || 'U')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p
                            translate="no"
                            className="notranslate username-tag text-white text-xs font-bold truncate"
                          >
                            {review.reviewer_name || 'Miembro del Club'}
                          </p>
                          <p className="text-white/40 text-[10px]">
                            {review.created_at
                              ? new Date(review.created_at).toLocaleDateString(
                                  'es-ES',
                                  {
                                    timeZone: 'America/Mexico_City',
                                    month: 'short',
                                    day: 'numeric',
                                  }
                                )
                              : 'Reciente'}
                          </p>
                        </div>
                      </div>

                      {weighted !== null && (
                        <div className="px-2.5 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs font-black flex items-center gap-1">
                          <span><InterfaceText>{"⭐"}</InterfaceText></span>
                          <span>
                            {typeof weighted === 'number'
                              ? weighted.toFixed(1)
                              : weighted}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Album Reference Banner */}
                    <Link
                      to={getReleaseUrl(albumInfo || { album_name: albumTitle, artist_name: artistTitle, release_type: review.release_type })}
                      className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                    >
                      {albumCover ? (
                        <CoverImage
                          src={albumCover}
                          alt={albumTitle}
                          className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center text-lg shrink-0"><InterfaceText>{" 💿 "}</InterfaceText></div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p
                          translate="no"
                          className="notranslate music-title text-white text-xs font-bold truncate group-hover:text-pink-300 transition-colors"
                        >
                          {albumTitle}
                        </p>
                        <p
                          translate="no"
                          className="notranslate artist-name text-white/50 text-[10px] truncate"
                        >
                          {artistTitle}
                        </p>
                      </div>
                    </Link>

                    {/* Review Snippet / Text */}
                    <div className="space-y-2">
                      {review.review_text || review.comment ? (
                        <p className="text-white/80 text-xs sm:text-sm italic line-clamp-3 leading-relaxed">
                          "{review.review_text || review.comment}"
                        </p>
                      ) : (
                        <p className="text-white/50 text-xs italic">
                          Calificó y puntuó este lanzamiento en la comunidad.
                        </p>
                      )}

                      {/* Emotion & Favorite Track Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {emotion && (
                          <span data-community-mood-icon role="img" aria-label={`Estado de ánimo: ${emotion.label}`} title={emotion.label} className={`inline-flex items-center justify-center p-1 rounded-full border ${emotion.badgeClass}`}>
                            <MoodIcon mood={emotion.id} size={32}/>
                          </span>
                        )}
                        {review.favTrackTitle && (
                          <span
                            translate="no"
                            className="notranslate track-name text-[10px] px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 truncate max-w-[200px]"
                          ><InterfaceText>{" 👑 "}</InterfaceText>{review.favTrackTitle}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Album Reference Footer */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40">
                      <span>Musiclub Review</span>
                      <Link
                        to={getReleaseUrl(albumInfo || { album_name: albumTitle, artist_name: artistTitle, release_type: review.release_type })}
                        className="text-pink-400 hover:text-white transition-colors font-semibold"
                      >
                        Ver lanzamiento →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <AdvertisingConsentNotice />
        <AdsterraAdvertising variant="rectangle" slot="home-community" />

        <HourlyRecommendedRelease
          albums={albums}
          allReviews={allReviews}
          topAlbums={topAlbums}
          user={user}
          onLogin={handleLogin}
          onAlbumUpdated={handleAlbumUpdated}
        />

        <LandingJourney albums={initialDemoAlbums.length?initialDemoAlbums:albums} reviews={initialDemoReviews.length?initialDemoReviews:allReviews}/>
        <AdsterraAdvertising variant="native" slot="home-features" />

        {/* =========================================================================
            5. CURATED ALBUM SHOWCASE (Tabs: Pool Activo, Top Obras Maestras, Recientes)
            ========================================================================= */}
        <section className="my-12 sm:my-16 text-left">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CoverImage
                  src="/musiclub_logo_corchea.png"
                  alt="Musiclub"
                  className="w-8 h-8 object-contain"
                />
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  En Rotación & Tendencias
                </h2>
              </div>
              <p className="text-white/60 text-xs sm:text-sm">
                Una muestra de los álbumes, EPs y canciones que están sonando en
                el club.
              </p>
            </div>

            {/* Controles de la derecha: Botón de Slider en Vivo + Selector de pestañas */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {/* Tabs switcher */}
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                {hasActivePool && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAlbumTab('active');
                    setIsShowcaseSliderPaused(false);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedAlbumTab === 'active'
                      ? 'bg-linear-to-r from-[#f5576c] to-[#f093fb] text-white shadow-md'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                ><InterfaceText>{" 🗳️ Propuestas ("}</InterfaceText>{activePool?.length || 0})
                </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAlbumTab('top');
                    setIsShowcaseSliderPaused(false);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedAlbumTab === 'top'
                      ? 'bg-linear-to-r from-[#f5576c] to-[#f093fb] text-white shadow-md'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                ><InterfaceText>{" ⭐ Top Obras Maestras "}</InterfaceText></button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAlbumTab('recent');
                    setIsShowcaseSliderPaused(false);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedAlbumTab === 'recent'
                      ? 'bg-linear-to-r from-[#f5576c] to-[#f093fb] text-white shadow-md'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                ><InterfaceText>{" 💎 Recientes "}</InterfaceText></button>
              </div>
            </div>
          </div>

          {/* Renderizado condicional del Showcase:
              - Si no hay lanzamientos: Estado vacío informativo.
              - Si hay máximo 4 lanzamientos: Se muestran en fila estática (no se mueve).
              - Si hay más de 4 lanzamientos: Slider horizontal automático en movimiento continuo. */}
          {showcaseAlbums.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-white/5 border border-white/10 text-white/50 text-xs sm:text-sm">
              No hay lanzamientos disponibles en esta categoría actualmente.
            </div>
          ) : !isShowcaseSliderActive ? (
            /* CASO 1: MÁXIMO 4 ELEMENTOS -> EL SLIDER NO SE MUEVE (ESTÁTICO, SIN DESPLEGARSE HACIA ABAJO) */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 w-full">
              {showcaseAlbums.map((album, idx) =>
                renderShowcaseCard(album, album.id || idx, false)
              )}
            </div>
          ) : (
            /* CASO 2: MÁS DE 4 ELEMENTOS -> SLIDER AUTOMÁTICO EN MOVIMIENTO CONSTANTE */
            <div
              className="relative w-full overflow-hidden py-2 group/showcase-slider"
              onMouseEnter={() => setIsShowcaseSliderPaused(true)}
              onMouseLeave={() => setIsShowcaseSliderPaused(false)}
            >
              {/* Gradientes laterales de desvanecimiento estético */}
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-linear-to-r from-[#0a0a12] via-[#0a0a12]/80 to-transparent opacity-70 z-10" />
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-linear-to-l from-[#0a0a12] via-[#0a0a12]/80 to-transparent opacity-70 z-10" />

              {/* Pista del slider infinito en traslación perpetua fluida */}
              <div
                key={selectedAlbumTab}
                className={`mb-6 animate-continuous-slider flex gap-3 sm:gap-5 w-max will-change-transform ${
                  isShowcaseSliderPaused ? 'slider-paused' : ''
                }`}
                style={{
                  '--slider-duration': showcaseSliderDuration,
                }}
              >
                {showcaseMarqueeItems.map((album, idx) =>
                  renderShowcaseCard(
                    album,
                    `marquee-${selectedAlbumTab}-${album.id || idx}-${idx}`,
                    true
                  )
                )}
              </div>
            </div>
          )}

          {/* Full Catalog Navigation CTA */}
          <div className="mt-8 text-center">
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs sm:text-sm border border-white/10 hover:border-pink-500/30 transition-all hover:scale-105"
            >
              <span>
                Ver Catálogo Completo ({globalStats.total_albums || 0} Lanzamientos)
              </span>
              <span>→</span>
            </Link>
          </div>
        </section>

        {/* =========================================================================
            6. COMMUNITY REVIEWS SNAPSHOT (1 Review por Usuario Diferente, 3 en total)
            ========================================================================= */}


        {/* =========================================================================
            7. QUICK PLAYGROUND: MINI ROULETTE / GASHAPON ARCADE
            ========================================================================= */}
        <section className="my-12 sm:my-16 relative">
          <div className="rounded-3xl bg-linear-to-r from-[#141528] via-[#101222] to-[#0d0f1c] border border-white/10 p-6 sm:p-8 backdrop-blur-xl text-center space-y-6">
            <div className="max-w-xl mx-auto space-y-2">
              <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">
                ¿NO SABES QUÉ ESCUCHAR HOY?
              </span>
              <div className="flex items-center justify-center gap-2">
                <CoverImage
                  src="/musiclub_logo_corchea.png"
                  alt="Musiclub"
                  className="w-8 h-8 object-contain"
                />
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Selector Rápido del Club
                </h3>
              </div>
              <p className="text-white/60 text-xs sm:text-sm">
                Elige una sugerencia al azar de los releases disponibles o entra
                al Gashapon para explorar cápsulas por género.
              </p>
            </div>

            {/* Quick Pick Result Card */}
            {quickPickAlbum && (
              <div className="max-w-md mx-auto p-4 rounded-2xl bg-white/5 border border-pink-500/30 flex items-center gap-4 animate-fadeIn text-left">
                <CoverImage
                  src={quickPickAlbum.imagen}
                  alt={quickPickAlbum.album}
                  className="w-16 h-16 rounded-xl object-cover border border-white/20"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-pink-400 font-bold uppercase">
                    Sugerencia Aleatoria
                  </span>
                  <h4
                    translate="no"
                    className="notranslate music-title text-white font-black text-sm truncate"
                  >
                    {quickPickAlbum.album}
                  </h4>
                  <p
                    translate="no"
                    className="notranslate artist-name text-white/60 text-xs truncate"
                  >
                    {quickPickAlbum.artista}
                  </p>
                </div>
                <Link
                  to={getReleaseUrl(
                    quickPickAlbum.album,
                    quickPickAlbum.release_type || quickPickAlbum.releaseType
                  )}
                  className="px-3 py-1.5 rounded-xl bg-pink-500/20 text-pink-300 hover:bg-pink-500 hover:text-white text-xs font-bold transition-all shrink-0"
                >
                  Ver →
                </Link>
              </div>
            )}

            {/* Control Buttons */}
            <div className="quick-selector-actions flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleQuickPick}
                disabled={isQuickPicking || activeAlbums.length === 0}
                className="px-6 py-3 rounded-2xl bg-linear-to-r from-[#f5576c] to-[#f093fb] hover:from-[#f5576c]/90 hover:to-[#f093fb]/90 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <UiIcon name="cycle" className={isQuickPicking ? "motion-safe:animate-spin" : ""} />
                <span>
                  {isQuickPicking ? 'Eligiendo...' : 'Girar Selector Rápido'}
                </span>
              </button>

              <Link
                to="/gashapon"
                className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs sm:text-sm border border-white/10 hover:border-pink-500/40 hover:text-pink-200 transition-all flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 shadow-md group"
              >
                <CoverImage
                  src="/musiclub_logo_3.png"
                  alt="Gashapon Arcade"
                  className="w-6 h-6 object-contain"
                />
                <span>Gashapon Arcade</span>
                <span className="text-pink-400 group-hover:translate-x-0.5 transition-transform text-xs">
                  →
                </span>
              </Link>
            </div>
          </div>
        </section>

        <LandingFinale user={user} onLogin={handleLogin}/>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div></LandingMotion>
  );
}

export default LandingPage;
