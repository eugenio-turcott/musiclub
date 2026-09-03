// src/pages/LandingPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Footer } from '../components/Footer';
import { ReviewSystem } from '../components/ReviewSystem';
import { SlotMachine } from '../components/SlotMachine';
import { LoginModal } from '../components/LoginModal';
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
  getTrackDisplayName,
} from '../utils/ratingUtils';
import { notifyContentLoaded } from '../utils/translateCrashGuard';

export function LandingPage() {
  const {
    albums,
    winner,
    refetch,
    markAlbumAsInactive,
  } = useAlbums();
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
  const [showFullSlotMachine, setShowFullSlotMachine] = useState(false);

  // Data states from Supabase
  const [topAlbums, setTopAlbums] = useState([]);
  const [shuffledReviewedAlbums, setShuffledReviewedAlbums] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [globalStats, setGlobalStats] = useState({
    total_reviews: 288,
    total_albums: 161,
    total_reviewed_albums: 131,
    total_users: 19,
    top_score: 9.8,
  });
  const [selectedAlbumTab, setSelectedAlbumTab] = useState('active'); // 'active' | 'top' | 'recent'
  const [quickPickAlbum, setQuickPickAlbum] = useState(null);
  const [isQuickPicking, setIsQuickPicking] = useState(false);

  // Vinyl Showcase Carousel State
  const [currentVinylIndex, setCurrentVinylIndex] = useState(0);
  const [isVinylPaused, setIsVinylPaused] = useState(false);

  // Synchronize reviewsEnabled with winner
  useEffect(() => {
    if (winner) {
      setReviewsEnabled(winner.reviews_enabled || false);
    }
  }, [winner]);

  // Load complementary data (top albums, reviews with full album relations, stats)
  useEffect(() => {
    let isMounted = true;
    const fetchLandingData = async () => {
      try {
        const [topData, reviewsRes, statsData, profilesData] =
          await Promise.all([
            supabaseService.getTopAlbums().catch((err) => {
              console.warn('Error fetching top albums:', err);
              return [];
            }),
            supabase
              .from('reviews')
              .select(
                `
              *,
              albums:album_id (
                id,
                album_name,
                artist_name,
                image_url,
                release_type,
                release_year,
                tracks
              )
            `
              )
              .order('created_at', { ascending: false }),
            supabaseService.getGlobalStats().catch((err) => {
              console.warn('Error fetching global stats:', err);
              return null;
            }),
            supabaseService.getAllProfiles().catch((err) => {
              console.warn('Error fetching profiles:', err);
              return [];
            }),
          ]);

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
        const totalReviewedAlbums =
          reviewedAlbumIds.size ||
          (topData && topData.length) ||
          statsData?.total_reviewed_albums ||
          131;
        const totalReviewsCount =
          reviewsData.length || statsData?.total_reviews || 288;
        const totalProfilesCount =
          (profilesData && profilesData.length) || statsData?.total_users || 19;
        const topScore =
          topData && topData.length > 0 && topData[0].avg_rating
            ? topData[0].avg_rating
            : statsData?.top_score || 9.8;

        setGlobalStats({
          total_reviews: totalReviewsCount,
          total_albums:
            statsData?.total_albums || (albums && albums.length) || 161,
          total_reviewed_albums: totalReviewedAlbums,
          total_users: totalProfilesCount > 0 ? totalProfilesCount : 19,
          top_score: topScore,
        });
        notifyContentLoaded('landing');
      } catch (err) {
        console.warn('Error loading landing page complementary data:', err);
      }
    };

    fetchLandingData();
    return () => {
      isMounted = false;
    };
  }, [albums]);

  // Randomize ONLY the albums that have been reviewed/rated for the Hero Vinyl Showcase
  useEffect(() => {
    if (topAlbums && topAlbums.length > 0) {
      const ratedList = topAlbums.map((t) => ({
        id: t.id,
        album: t.album_name,
        album_name: t.album_name,
        artista: t.artist_name,
        artist_name: t.artist_name,
        imagen: t.image_url,
        image_url: t.image_url,
        avg_rating: t.avg_rating,
        final_rating: t.avg_rating,
        base_rating: t.base_rating,
        review_count: t.review_count || 1,
        release_type: t.release_type || 'ALBUM',
        release_year: t.release_year,
      }));

      // Fisher-Yates shuffle
      for (let i = ratedList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ratedList[i], ratedList[j]] = [ratedList[j], ratedList[i]];
      }

      setShuffledReviewedAlbums(ratedList);
      setCurrentVinylIndex(0);
    }
  }, [topAlbums]);

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

  // Lista de álbumes ya calificados en el club (aleatorizados)
  const reviewedAlbumsList = useMemo(() => {
    if (shuffledReviewedAlbums && shuffledReviewedAlbums.length > 0) {
      return shuffledReviewedAlbums;
    }
    if (topAlbums && topAlbums.length > 0) {
      return topAlbums.map((t) => ({
        id: t.id,
        album: t.album_name,
        album_name: t.album_name,
        artista: t.artist_name,
        artist_name: t.artist_name,
        imagen: t.image_url,
        image_url: t.image_url,
        avg_rating: t.avg_rating,
        final_rating: t.avg_rating,
        base_rating: t.base_rating,
        review_count: t.review_count || 1,
        release_type: t.release_type || 'ALBUM',
        release_year: t.release_year,
      }));
    }
    return [];
  }, [shuffledReviewedAlbums, topAlbums]);

  // Rotación automática de álbumes reseñados cada 4.5 segundos
  useEffect(() => {
    if (reviewedAlbumsList.length <= 1 || isVinylPaused) return;

    const interval = setInterval(() => {
      setCurrentVinylIndex((prev) => (prev + 1) % reviewedAlbumsList.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [reviewedAlbumsList.length, isVinylPaused]);

  // Álbum actualmente mostrado en el showcase 3D
  const currentVinylAlbum = useMemo(() => {
    if (reviewedAlbumsList.length > 0) {
      return reviewedAlbumsList[currentVinylIndex % reviewedAlbumsList.length];
    }
    if (winner) return winner;
    return null;
  }, [reviewedAlbumsList, currentVinylIndex, winner]);

  // Reseñas comunitarias: Exactamente 3 reseñas de 3 usuarios DISTINTOS
  const communityReviews = useMemo(() => {
    if (!allReviews || allReviews.length === 0) return [];

    const distinctList = [];
    const seenUsers = new Set();

    for (const rev of allReviews) {
      const userKey = (
        rev.user_id ||
        rev.author_email ||
        rev.reviewer_email ||
        rev.reviewer_name ||
        ''
      )
        .toLowerCase()
        .trim();

      if (userKey && !seenUsers.has(userKey)) {
        seenUsers.add(userKey);

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

        distinctList.push({
          ...rev,
          matchedAlbum,
          favTrackTitle,
        });

        if (distinctList.length === 3) break;
      }
    }

    return distinctList;
  }, [allReviews, albums]);

  // Curated showcase albums based on active tab
  const showcaseAlbums = useMemo(() => {
    if (selectedAlbumTab === 'top') {
      if (topAlbums && topAlbums.length > 0) {
        return topAlbums.slice(0, 8).map((a) => ({
          id: a.id,
          album: a.album_name,
          artista: a.artist_name,
          imagen: a.image_url,
          score: a.avg_rating,
          reviewCount: a.review_count,
          status: a.status,
          release_type: a.release_type,
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
        .slice(0, 8)
        .map((a) => ({
          id: a.id,
          album: a.album || a.album_name,
          artista: a.artista || a.artist_name,
          imagen: a.imagen || a.image_url,
          score: a.final_rating || a.avg_rating,
          reviewCount: a.reviews_count || 1,
          status: a.status,
          release_type: a.release_type,
          release_year: a.release_year,
        }));
    }
    if (selectedAlbumTab === 'recent') {
      const topMap = new Map(topAlbums.map((t) => [t.id, t]));
      return [...albums]
        .sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        )
        .slice(0, 8)
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
            release_year: a.release_year,
          };
        });
    }
    // Default 'active': Pool Activo de la temporada
    const poolItems = activePool && activePool.length > 0 ? activePool : [];
    if (poolItems.length > 0) {
      const topMap = new Map(topAlbums.map((t) => [t.id, t]));
      return poolItems.slice(0, 8).map((a) => {
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
          release_year: a.release_year,
        };
      });
    }
    return activeAlbums.slice(0, 8).map((a) => ({
      id: a.id,
      album: a.album || a.album_name,
      artista: a.artista || a.artist_name,
      imagen: a.imagen || a.image_url,
      added_by: a.added_by,
      status: a.status,
      score: a.final_rating || a.avg_rating,
      release_type: a.release_type,
      release_year: a.release_year,
    }));
  }, [selectedAlbumTab, activePool, activeAlbums, topAlbums, albums]);

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

  return (
    <div className="min-h-screen cyber-grid p-3 sm:p-6 w-full max-w-full overflow-x-hidden flex flex-col justify-between">
      <SEO
        title="Musiclub — El Club Social de Álbumes, EPs y Música"
        description="En Musiclub descubre, califica y debate cada álbum, EP y canción. Calificaciones multi-criterio, ruleta de selección, gashapon arcade y recomendaciones personalizadas."
        url="https://musiclub.org"
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

        {/* =========================================================================
            1. HERO SECTION (Clean, Striking, Mentioning Musiclub explicitly)
            ========================================================================= */}
        <section className="relative pt-6 sm:py-16 md:py-20">
          {/* Glow Elements */}
          <div className="absolute top-1/4 -left-20 w-80 sm:w-96 h-80 sm:h-96 bg-gradient-to-tr from-[#f5576c]/15 to-[#f093fb]/10 rounded-full blur-3xl pointer-events-none -z-10 animate-aura-pulse"></div>
          <div className="absolute top-1/3 -right-20 w-80 sm:w-96 h-80 sm:h-96 bg-gradient-to-bl from-cyan-500/10 via-purple-600/10 to-pink-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column: Headline with Musiclub & Subtitle */}
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-5 sm:space-y-6">
              {/* Main Headline mentioning Musiclub */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-black text-white tracking-tight leading-[1.08]">
                En{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-rose-400">
                  Musiclub
                </span>
                , descubre, califica y debate cada disco.
              </h1>

              {/* Subtitle explicitly welcoming albums, EPs, singles */}
              <p className="text-white/70 text-sm sm:text-base md:text-lg max-w-xl font-normal leading-relaxed">
                El club social donde cada lanzamiento cuenta:{' '}
                <strong>álbumes, EPs, sencillos y canciones</strong>. Propón
                discos al Pool Activo, gira la ruleta arcade semanal, reseña con
                criterios profundos y descubre tu próxima obsesión musical.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 w-full sm:w-auto">
                <Link
                  to="/catalogo"
                  className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-[#f5576c] to-[#f093fb] hover:from-[#f5576c]/90 hover:to-[#f093fb]/90 text-white font-black text-sm rounded-2xl shadow-xl shadow-[#f5576c]/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>💿</span>
                  <span>Explorar Catálogo</span>
                </Link>

                <Link
                  to="/pool"
                  className="w-full sm:w-auto px-5 py-3.5 bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 hover:text-white font-bold text-sm rounded-2xl border border-pink-500/30 hover:border-pink-500/50 backdrop-blur-md shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>🗳️</span>
                  <span>Pool Musical (Temporada 1)</span>
                </Link>

                <Link
                  to="/gashapon"
                  className="w-full sm:w-auto px-5 py-3.5 bg-white/10 hover:bg-white/15 text-white font-bold text-sm rounded-2xl border border-white/15 hover:border-white/30 backdrop-blur-md shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>🎰</span>
                  <span>Gashapon Arcade</span>
                </Link>

                {!user && (
                  <button
                    type="button"
                    onClick={handleLogin}
                    className="w-full sm:w-auto px-5 py-3.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-semibold text-xs sm:text-sm rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <span>✨</span>
                    <span>Únete al Club</span>
                  </button>
                )}
              </div>

              {/* Community Proof */}
              <div className="pt-2 flex items-center gap-3 text-xs text-white/50">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="inline-block h-7 w-7 rounded-full ring-2 ring-[#0a0a12] bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-[10px] text-white font-black">
                    E
                  </div>
                  <div className="inline-block h-7 w-7 rounded-full ring-2 ring-[#0a0a12] bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-[10px] text-white font-black">
                    T
                  </div>
                  <div className="inline-block h-7 w-7 rounded-full ring-2 ring-[#0a0a12] bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-[10px] text-white font-black">
                    M
                  </div>
                  <div className="inline-block h-7 w-7 rounded-full ring-2 ring-[#0a0a12] bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-[10px] text-white font-black">
                    V
                  </div>
                </div>
                <span>
                  Álbumes, EPs y canciones evaluadas con pasión por la comunidad
                </span>
              </div>
            </div>

            {/* Right Column: Rotating Vinyl Sleeve Animation (Cycling Reviewed Albums) */}
            <div
              className="lg:col-span-5 flex justify-center lg:justify-end"
              onMouseEnter={() => setIsVinylPaused(true)}
              onMouseLeave={() => setIsVinylPaused(false)}
            >
              <div className="relative group w-full max-w-[360px] sm:max-w-[400px] md:max-w-[440px] lg:max-w-[480px]">
                {/* Ambient Glow */}
                <div className="absolute -inset-4 bg-gradient-to-r from-[#f5576c]/25 via-purple-600/25 to-amber-500/20 rounded-3xl blur-2xl opacity-60 group-hover:opacity-95 transition-opacity duration-700 pointer-events-none"></div>

                {/* Main 3D Sleeve Card */}
                <div className="relative bg-gradient-to-br from-[#131528]/95 via-[#0e1022]/90 to-[#070814]/95 border border-white/15 rounded-3xl p-5 sm:p-7 backdrop-blur-2xl shadow-2xl overflow-hidden text-left hover:border-pink-500/40 transition-all duration-500">
                  {/* Floating Carousel Header */}
                  <div className="flex items-center justify-between mb-4 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#f5576c] bg-[#f5576c]/15 px-3 py-1 rounded-full border border-[#f5576c]/30 flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f5576c] animate-ping"></span>
                        <span>RESEÑADO EN EL CLUB</span>
                      </span>
                      {currentVinylAlbum?.release_type && (
                        <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-wider text-white/50 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                          {currentVinylAlbum.release_type === 'EP'
                            ? '💽 EP'
                            : currentVinylAlbum.release_type === 'SENCILLO' ||
                                currentVinylAlbum.release_type === 'SINGLE'
                              ? '🎵 Sencillo'
                              : '💿 Álbum'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Vinyl Disc & Sleeve Container (Hover isolated exclusively to this area) */}
                  <div className="relative group/vinyl w-full my-2 flex items-center justify-start overflow-visible py-1">
                    {/* Shared Frame for Cover + Sliding Disc */}
                    <div className="relative w-[180px] sm:w-[210px] md:w-[230px] lg:w-[245px] aspect-square flex-shrink-0">
                      {/* Vinyl Disc: out by default, tucks into sleeve ONLY when hovering over the vinyl assembly */}
                      <div className="absolute inset-0 z-0 rounded-full bg-[#0a0a0e] border-2 border-white/25 shadow-2xl flex items-center justify-center transform translate-x-24 sm:translate-x-32 md:translate-x-40 lg:translate-x-44 group-hover/vinyl:translate-x-8 sm:group-hover/vinyl:translate-x-10 md:group-hover/vinyl:translate-x-12 transition-transform duration-700 ease-out">
                        {/* Grooves Texture with Radial Sheen */}
                        <div
                          className="w-full h-full rounded-full flex items-center justify-center animate-disc-spin relative overflow-hidden"
                          style={{
                            background:
                              'radial-gradient(circle, #252528 5%, #111114 18%, #2d2d35 22%, #0e0e12 36%, #25252b 40%, #101014 55%, #2a2a30 60%, #08080a 78%, #1f1f24 82%, #050507 100%)',
                            boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)',
                          }}
                        >
                          {/* Gloss reflection shimmer line */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none rounded-full"></div>

                          {/* Center Label */}
                          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full bg-gradient-to-tr from-[#f5576c] via-[#e11d48] to-[#f093fb] border-[3px] border-[#0a0a0e] flex items-center justify-center shadow-2xl relative">
                            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#08080c] border border-white/40 shadow-inner flex items-center justify-center">
                              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white/20"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Album Cover Sleeve (Front Layer with Glass Sheen) */}
                      <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-[#151728] group-hover/vinyl:shadow-pink-500/20 transition-all duration-500">
                        {currentVinylAlbum?.imagen ||
                        currentVinylAlbum?.image_url ? (
                          <img
                            key={currentVinylAlbum.id || currentVinylIndex}
                            src={
                              currentVinylAlbum.imagen ||
                              currentVinylAlbum.image_url
                            }
                            alt={
                              currentVinylAlbum.album ||
                              currentVinylAlbum.album_name ||
                              'Álbum'
                            }
                            className="w-full h-full object-cover animate-fadeIn notranslate"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-[#1b1c38] to-[#121324] text-white/40">
                            <span className="text-4xl mb-2">💿</span>
                            <span className="text-xs font-bold">
                              Musiclub Pick
                            </span>
                          </div>
                        )}
                        {/* Subtle sleeve reflection */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/15 pointer-events-none"></div>
                      </div>
                    </div>
                  </div>

                  {/* Album Info */}
                  <div className="relative z-20 space-y-1.5">
                    <h3
                      translate="no"
                      className="text-lg sm:text-xl font-black text-white truncate leading-tight notranslate music-title"
                    >
                      {currentVinylAlbum?.album ||
                        currentVinylAlbum?.album_name ||
                        'Álbum Seleccionado'}
                    </h3>
                    <p
                      translate="no"
                      className="text-white/70 text-xs sm:text-sm truncate notranslate artist-name"
                    >
                      {currentVinylAlbum?.artista ||
                        currentVinylAlbum?.artist_name ||
                        'Artista del Club'}
                    </p>

                    <div className="pt-3 flex items-center justify-between border-t border-white/10 mt-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs sm:text-sm font-black shadow-sm">
                          <span>⭐</span>
                          <span>
                            {currentVinylAlbum?.avg_rating !== undefined &&
                            currentVinylAlbum?.avg_rating !== null
                              ? Number(currentVinylAlbum.avg_rating).toFixed(1)
                              : '—'}
                          </span>
                          <span className="text-amber-200/60 text-[10px] font-normal">
                            / 10
                          </span>
                        </div>
                        <span className="text-white/40 text-[11px] font-normal">
                          ({currentVinylAlbum?.review_count || 1}{' '}
                          {(currentVinylAlbum?.review_count || 1) === 1
                            ? 'reseña'
                            : 'reseñas'}
                          )
                        </span>
                      </div>

                      {(currentVinylAlbum?.album ||
                        currentVinylAlbum?.album_name) && (
                        <Link
                          to={getReleaseUrl(
                            currentVinylAlbum.album ||
                              currentVinylAlbum.album_name,
                            currentVinylAlbum.release_type ||
                              currentVinylAlbum.releaseType
                          )}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#f5576c] to-[#f093fb] hover:from-[#f5576c]/90 hover:to-[#f093fb]/90 text-white font-extrabold text-xs shadow-md shadow-[#f5576c]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          <span>Ver Más</span>
                          <span>→</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              STATS STRIP (Dynamic & Clean Metric Bar)
              ========================================================================= */}
          <div className="mt-12 sm:mt-16 mb-8 lg:mb-0 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg">
            <div className="flex flex-col items-center justify-center p-3 text-center border-r-0 md:border-r border-b md:border-b-0 border-white/10">
              <span
                translate="no"
                className="notranslate text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight"
                data-stat="number"
              >
                +
                {globalStats.total_reviewed_albums ||
                  (topAlbums && topAlbums.length) ||
                  131}
              </span>
              <span className="text-xs text-white/50 font-medium uppercase tracking-wider mt-1">
                Lanzamientos con Reviews
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-3 text-center border-r-0 md:border-r border-b md:border-b-0 border-white/10">
              <span
                translate="no"
                className="notranslate text-2xl sm:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 tracking-tight"
                data-stat="number"
              >
                +
                {globalStats.total_reviews ||
                  (allReviews && allReviews.length) ||
                  271}
              </span>
              <span className="text-xs text-white/50 font-medium uppercase tracking-wider mt-1">
                Reviews Escritas
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-3 text-center border-r-0 md:border-r border-b md:border-b-0 border-white/10">
              <span
                translate="no"
                className="notranslate text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight"
                data-stat="number"
              >
                {globalStats.total_users || 19}
              </span>
              <span className="text-xs text-white/50 font-medium uppercase tracking-wider mt-1">
                Críticos & Miembros
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-3 text-center">
              <span
                translate="no"
                className="notranslate text-2xl sm:text-3xl lg:text-4xl font-black text-amber-300 tracking-tight flex items-center gap-1"
                data-stat="number"
              >
                <span>⭐</span>{' '}
                {globalStats.top_score
                  ? Number(globalStats.top_score).toFixed(1)
                  : '9.8'}
              </span>
              <span className="text-xs text-white/50 font-medium uppercase tracking-wider mt-1">
                Top Score Comunitario
              </span>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. SPOTLIGHT WINNER SECTION (Featured Album with Direct Action)
            ========================================================================= */}
        {winner && (
          <section className="my-8 sm:my-12 relative">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#161830] via-[#0d0f1f] to-[#070810] border-2 border-pink-500/30 p-6 sm:p-8 md:p-10 shadow-2xl text-left">
              <div className="absolute -top-16 -right-16 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
                {/* Album Cover */}
                <div className="relative flex-shrink-0 group">
                  <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden border-2 border-pink-500/40 shadow-2xl shadow-pink-500/20">
                    <img
                      src={winner.imagen}
                      alt={winner.album}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white text-[10px] sm:text-xs font-black px-3 py-1 rounded-full shadow-lg border border-white/20">
                    🏆 GANADOR
                  </div>
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
                        <span>🎵</span>
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
                        <span>▶️</span>
                        <span>YouTube</span>
                      </a>
                    )}
                    <Link
                      to={getReleaseUrl(
                        winner.album,
                        winner.release_type || winner.releaseType
                      )}
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-pink-300 hover:text-pink-200 transition-all flex items-center gap-1.5"
                    >
                      <span>🔍</span>
                      <span>Ver Análisis Completo</span>
                    </Link>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 flex flex-wrap items-center justify-center md:justify-start gap-3">
                    {reviewsEnabled ? (
                      <button
                        type="button"
                        onClick={() => setShowReviewModal((prev) => !prev)}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5576c] to-[#f093fb] hover:from-[#f5576c]/90 hover:to-[#f093fb]/90 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span>
                          {showReviewModal
                            ? '✕ Cerrar Reseña'
                            : isWinnerReviewed
                              ? '✏️ Modificar Mi Reseña'
                              : '⭐ Calificar y Reseñar'}
                        </span>
                      </button>
                    ) : (
                      <span className="text-xs text-white/40 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                        🔒 Reseñas pausadas por moderación
                      </span>
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
                        {togglingReviews
                          ? '...'
                          : reviewsEnabled
                            ? '🔒 Deshabilitar Reviews'
                            : '✅ Habilitar Reviews'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Inline Review Form Accordion */}
              {showReviewModal && reviewsEnabled && (
                <div className="mt-6 pt-6 border-t border-white/10 animate-fadeIn">
                  <div className="flex items-center justify-between pb-3">
                    <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <span>⭐</span>
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
            3. ¿CÓMO FUNCIONA MUSICLUB? EL POOL Y EL CICLO MUSICAL
            ========================================================================= */}
        <section className="mb-14 sm:mb-20 text-left">
          <div className="relative rounded-3xl bg-gradient-to-br from-[#131528] via-[#0d0f1e] to-[#070812] border border-white/10 p-6 sm:p-10 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-pink-500/10 via-purple-600/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-2xl space-y-2 mb-8 sm:mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs font-bold uppercase tracking-wider">
                <span>🔄</span>
                <span>Dinámica Comunitaria</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                ¿Cómo funciona Musiclub? El Pool y los Álbumes Activos
              </h2>
              <p className="text-white/70 text-xs sm:text-sm md:text-base leading-relaxed">
                Musiclub es un club vivo y dinámico donde los miembros deciden
                qué escuchar, comparten análisis profundos y construyen la
                biblioteca comunitaria.
              </p>
            </div>

            {/* 4-Step Interactive Roadmap */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative z-10">
              {/* Step 1 */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 relative hover:border-pink-500/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-xl font-black text-pink-400">
                  1
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>📥</span> El Pool Activo
                </h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Los miembros proponen sus{' '}
                  <strong>álbumes, EPs o sencillos</strong> favoritos. Los
                  discos aprobados entran al <strong>Pool Activo</strong> como
                  candidatos oficiales en espera.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 relative hover:border-purple-500/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xl font-black text-purple-400">
                  2
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🎰</span> Sorteo en Vivo
                </h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Mediante el <strong>Gashapon Arcade</strong> o la{' '}
                  <strong>Ruleta Retro</strong>, el club elige aleatoriamente el
                  próximo lanzamiento ganador del pool para escuchar en grupo.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 relative hover:border-cyan-500/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xl font-black text-cyan-400">
                  3
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🎧</span> Escucha & Reseña
                </h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Todos escuchamos el lanzamiento y publicamos nuestra{' '}
                  <strong>review multi-criterio</strong> (Producción,
                  Composición, Letras, Cohesión, Replay y Canción Favorita 👑).
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 relative hover:border-amber-500/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl font-black text-amber-400">
                  4
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🏆</span> Catálogo & Archivo
                </h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Una vez evaluado, el álbum pasa a graduarse en el{' '}
                  <strong>Historial del Pool</strong> con su nota ponderada
                  oficial y nutre el Salón de la Fama y las recomendaciones
                  'Para Ti'.
                </p>
              </div>
            </div>

            {/* Temporada 1 Callout */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                  🔒 Recepción de Propuestas: Cerrada
                </span>
                <p className="text-xs text-slate-300 text-center sm:text-left">
                  ✦ <strong>Temporada 1 en curso:</strong> Iniciada el 11 de
                  julio de 2026. Explora las propuestas de la comunidad y vota
                  en la ruleta.
                </p>
              </div>
              <Link
                to="/pool"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-black text-xs transition-all shadow-md flex items-center gap-2 flex-shrink-0 hover:scale-105"
              >
                <span>🗳️</span>
                <span>Entrar al Pool de la Temporada 1 →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. BENTO GRID: LAS CARACTERÍSTICAS DE MUSICLUB
            ========================================================================= */}
        <section className="my-12 sm:my-16 text-left">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              Todo lo que puedes hacer en{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                Musiclub
              </span>
            </h2>
            <p className="text-white/60 text-xs sm:text-sm">
              Diseñado de melómanos para melómanos. Herramientas pensadas para
              compartir, debatir y rankear con pasión.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Bento Card 1: Pool Musical por Temporadas */}
            <div className="group relative rounded-3xl bg-gradient-to-br from-pink-950/40 via-[#101222] to-[#0a0a14] border border-white/10 p-6 backdrop-blur-xl hover:border-pink-500/40 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-2xl">
                  🗳️
                </div>
                <h3 className="text-lg font-black text-white group-hover:text-pink-300 transition-colors">
                  Pool Musical por Temporadas
                </h3>
                <p className="text-white/60 text-xs leading-relaxed">
                  El corazón de escucha colectiva del club. Propón lanzamientos
                  para la <strong>Temporada 1</strong>, vota y sigue la
                  graduación de discos semanales.
                </p>
              </div>
              <div className="pt-4 mt-2">
                <Link
                  to="/pool"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-400 group-hover:text-pink-300 group-hover:translate-x-1 transition-all"
                >
                  <span>Entrar al Pool de Temporada</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Bento Card 2: Reviews Multi-Criterio */}
            <div className="group relative rounded-3xl bg-gradient-to-br from-rose-950/40 via-[#101222] to-[#0a0a14] border border-white/10 p-6 backdrop-blur-xl hover:border-pink-500/40 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-2xl">
                  📝
                </div>
                <h3 className="text-lg font-black text-white group-hover:text-rose-300 transition-colors">
                  Reviews Multi-Criterio & Track Favorito
                </h3>
                <p className="text-white/60 text-xs leading-relaxed">
                  Mucho más que simples estrellas. Califica producción, letras,
                  composición, cohesión, replay value y corona tu canción
                  favorita.
                </p>
              </div>
              <div className="pt-4 mt-2">
                <Link
                  to="/reviews"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 group-hover:text-rose-300 group-hover:translate-x-1 transition-all"
                >
                  <span>Ver Reseñas</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Bento Card 3: Recomendaciones 'Para Ti' */}
            <div className="group relative rounded-3xl bg-gradient-to-br from-indigo-950/40 via-[#101222] to-[#0a0a14] border border-white/10 p-6 backdrop-blur-xl hover:border-pink-500/40 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-2xl">
                  ✨
                </div>
                <h3 className="text-lg font-black text-white group-hover:text-indigo-300 transition-colors">
                  Algoritmo 'Para Ti' & ADN Musical
                </h3>
                <p className="text-white/60 text-xs leading-relaxed">
                  Recomendaciones matemáticas personalizadas basadas en tus
                  discos mejor valorados, similitud sónica y afinidad con otros
                  críticos.
                </p>
              </div>
              <div className="pt-4 mt-2">
                <Link
                  to="/recomendaciones"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 group-hover:text-indigo-300 group-hover:translate-x-1 transition-all"
                >
                  <span>Ver Mis Recomendaciones</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Bento Card 4: Leaderboard & Salón de la Fama */}
            <div className="group relative rounded-3xl bg-gradient-to-br from-amber-950/40 via-[#101222] to-[#0a0a14] border border-white/10 p-6 backdrop-blur-xl hover:border-pink-500/40 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl">
                  🏆
                </div>
                <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                  Leaderboard & Gamificación
                </h3>
                <p className="text-white/60 text-xs leading-relaxed">
                  El podio definitivo. Explora las obras maestras legendarias
                  del club y escala en el ranking ganando XP, medallas e
                  insignias exclusivas.
                </p>
              </div>
              <div className="pt-4 mt-2">
                <Link
                  to="/leaderboard"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 group-hover:text-amber-300 group-hover:translate-x-1 transition-all"
                >
                  <span>Ver Leaderboard</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Bento Card 5: Buzón & Playlists */}
            <div className="group relative rounded-3xl bg-gradient-to-br from-cyan-950/40 via-[#101222] to-[#0a0a14] border border-white/10 p-6 backdrop-blur-xl hover:border-pink-500/40 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-2xl">
                  📬
                </div>
                <h3 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors">
                  Buzón Musical & Playlists
                </h3>
                <p className="text-white/60 text-xs leading-relaxed">
                  Envía recomendaciones de temas directas al buzón privado de
                  tus amigos y descubre listas de reproducción curadas por la
                  comunidad.
                </p>
              </div>
              <div className="pt-4 mt-2">
                <Link
                  to="/playlists"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all"
                >
                  <span>Explorar Playlists</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Bento Card 6: Buscador Universal con Spotify */}
            <div className="group relative rounded-3xl bg-gradient-to-br from-emerald-950/40 via-[#101222] to-[#0a0a14] border border-white/10 p-6 backdrop-blur-xl hover:border-pink-500/40 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl">
                  🔍
                </div>
                <h3 className="text-lg font-black text-white group-hover:text-emerald-300 transition-colors">
                  Buscador Directo
                </h3>
                <p className="text-white/60 text-xs leading-relaxed">
                  Encuentra cualquier álbum o artista al instante con carátulas
                  en alta resolución, años de lanzamiento y verificación oficial
                  de Spotify.
                </p>
              </div>
              <div className="pt-4 mt-2">
                <Link
                  to="/catalogo"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:text-emerald-300 group-hover:translate-x-1 transition-all"
                >
                  <span>Buscar en Catálogo</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            5. CURATED ALBUM SHOWCASE (Tabs: Pool Activo, Top Obras Maestras, Recientes)
            ========================================================================= */}
        <section className="my-12 sm:my-16 text-left">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                En Rotación & Tendencias
              </h2>
              <p className="text-white/60 text-xs sm:text-sm">
                Una muestra de los álbumes, EPs y canciones que están sonando en
                el club.
              </p>
            </div>

            {/* Tabs switcher */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setSelectedAlbumTab('active')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedAlbumTab === 'active'
                    ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                🔥 Pool Activo ({activePool?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setSelectedAlbumTab('top')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedAlbumTab === 'top'
                    ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                ⭐ Top Obras Maestras
              </button>
              <button
                type="button"
                onClick={() => setSelectedAlbumTab('recent')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedAlbumTab === 'recent'
                    ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                💎 Recientes
              </button>
            </div>
          </div>

          {/* Album Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-5">
            {showcaseAlbums.map((album, idx) => (
              <Link
                key={album.id || idx}
                to={getReleaseUrl(
                  album.album || album.album_name,
                  album.release_type || album.releaseType
                )}
                className="group relative rounded-2xl bg-[#111322]/80 border border-white/10 hover:border-pink-500/40 p-3 sm:p-3.5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-500/10 flex flex-col justify-between"
              >
                {/* Artwork */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black/40 mb-2.5">
                  {album.imagen ? (
                    <img
                      src={album.imagen}
                      alt={album.album}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 notranslate"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl text-white/20">
                      💿
                    </div>
                  )}

                  {/* Format badge on top-left */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase text-white/90 tracking-wider shadow-sm">
                    {album.release_type === 'EP'
                      ? '💽 EP'
                      : album.release_type === 'SENCILLO' ||
                          album.release_type === 'SINGLE'
                        ? '🎵 Sencillo'
                        : '💿 Álbum'}
                  </div>

                  {/* Bottom right badge */}
                  {selectedAlbumTab === 'top' ||
                  (album.score !== undefined &&
                    album.score !== null &&
                    Number(album.score) > 0) ? (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/85 backdrop-blur-md border border-amber-400/40 text-[10px] sm:text-xs font-black text-amber-300 shadow-md flex items-center gap-1">
                      <span>⭐</span>
                      <span>{Number(album.score).toFixed(1)}</span>
                    </div>
                  ) : selectedAlbumTab === 'active' ||
                    album.status === 'POOL_ACTIVO' ? (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 text-[9px] font-black text-white shadow-md uppercase tracking-wider">
                      🔥 POOL
                    </div>
                  ) : (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-cyan-600/80 backdrop-blur-md text-[9px] font-black text-white shadow-md uppercase tracking-wider">
                      💎 NUEVO
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-0.5 min-w-0">
                  <h4
                    translate="no"
                    className="text-xs sm:text-sm font-bold text-white group-hover:text-pink-300 transition-colors truncate notranslate music-title"
                  >
                    {album.album}
                  </h4>
                  <p
                    translate="no"
                    className="text-[11px] sm:text-xs text-white/50 truncate notranslate artist-name"
                  >
                    {album.artista}
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[10px] text-white/40">
                    {album.reviewCount !== undefined &&
                    album.reviewCount > 0 ? (
                      <span>
                        {album.reviewCount}{' '}
                        {album.reviewCount === 1 ? 'reseña' : 'reseñas'}
                      </span>
                    ) : album.added_by ? (
                      <span className="truncate">
                        Por:{' '}
                        <strong
                          translate="no"
                          className="notranslate username-tag"
                        >
                          {album.added_by}
                        </strong>
                      </span>
                    ) : album.release_year ? (
                      <span>{album.release_year}</span>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Full Catalog Navigation CTA */}
          <div className="mt-8 text-center">
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs sm:text-sm border border-white/10 hover:border-pink-500/30 transition-all hover:scale-105"
            >
              <span>
                Ver Catálogo Completo (+{albums.length || 0} Lanzamientos)
              </span>
              <span>→</span>
            </Link>
          </div>
        </section>

        {/* =========================================================================
            6. COMMUNITY REVIEWS SNAPSHOT (1 Review por Usuario Diferente, 3 en total)
            ========================================================================= */}
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
                          <img
                            src={review.reviewer_avatar}
                            alt={review.reviewer_name || 'U'}
                            className="w-8 h-8 rounded-full object-cover border border-white/20 flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0 ${
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
                          <span>⭐</span>
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
                      to={getReleaseUrl(
                        albumTitle,
                        review.release_type ||
                          review.album?.release_type ||
                          review.album?.releaseType
                      )}
                      className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                    >
                      {albumCover ? (
                        <img
                          src={albumCover}
                          alt={albumTitle}
                          className="w-10 h-10 rounded-lg object-cover border border-white/10 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center text-lg flex-shrink-0">
                          💿
                        </div>
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
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70">
                            {emotion.emoji} {emotion.label}
                          </span>
                        )}
                        {review.favTrackTitle && (
                          <span
                            translate="no"
                            className="notranslate track-name text-[10px] px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 truncate max-w-[200px]"
                          >
                            👑 {review.favTrackTitle}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Album Reference Footer */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40">
                      <span>Musiclub Review</span>
                      <Link
                        to={getReleaseUrl(
                          albumTitle,
                          review.release_type ||
                            review.album?.release_type ||
                            review.album?.releaseType
                        )}
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

        {/* =========================================================================
            7. QUICK PLAYGROUND: MINI ROULETTE / SLOT MACHINE
            ========================================================================= */}
        <section className="my-12 sm:my-16 relative">
          <div className="rounded-3xl bg-gradient-to-r from-[#141528] via-[#101222] to-[#0d0f1c] border border-white/10 p-6 sm:p-8 backdrop-blur-xl text-center space-y-6">
            <div className="max-w-xl mx-auto space-y-2">
              <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">
                🎲 ¿NO SABES QUÉ ESCUCHAR HOY?
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Selector Rápido del Club
              </h3>
              <p className="text-white/60 text-xs sm:text-sm">
                Presiona el botón para elegir un lanzamiento al azar de los
                activos o despliega la máquina tragamonedas completa para
                sesiones oficiales.
              </p>
            </div>

            {/* Quick Pick Result Card */}
            {quickPickAlbum && (
              <div className="max-w-md mx-auto p-4 rounded-2xl bg-white/5 border border-pink-500/30 flex items-center gap-4 animate-fadeIn text-left">
                <img
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
                  className="px-3 py-1.5 rounded-xl bg-pink-500/20 text-pink-300 hover:bg-pink-500 hover:text-white text-xs font-bold transition-all flex-shrink-0"
                >
                  Ver →
                </Link>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleQuickPick}
                disabled={isQuickPicking || activeAlbums.length === 0}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#f5576c] to-[#f093fb] hover:from-[#f5576c]/90 hover:to-[#f093fb]/90 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>🎲</span>
                <span>
                  {isQuickPicking ? 'Eligiendo...' : 'Girar Selector Rápido'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowFullSlotMachine((prev) => !prev)}
                className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs sm:text-sm border border-white/10 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>🎰</span>
                <span>
                  {showFullSlotMachine
                    ? 'Ocultar Máquina Arcade'
                    : 'Abrir Tragamonedas Oficial'}
                </span>
              </button>
            </div>

            {/* Full Retro Slot Machine (Collapsible to keep landing page uncluttered) */}
            {showFullSlotMachine && (
              <div className="mt-8 pt-6 border-t border-white/10 animate-fadeIn">
                <SlotMachine
                  albums={albums}
                  onSpinComplete={() => {}}
                  isSpinning={false}
                  onSpinStart={() => {}}
                  markAlbumAsInactive={markAlbumAsInactive}
                  isAdmin={isAdmin}
                  user={user}
                />
              </div>
            )}
          </div>
        </section>

        {/* =========================================================================
            8. CALL TO ACTION BANNER (Join the Community)
            ========================================================================= */}
        <section className="my-12 sm:my-16 relative">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-600/30 via-purple-600/30 to-indigo-600/30 border border-white/20 p-8 sm:p-12 backdrop-blur-2xl text-center space-y-6">
            <div className="max-w-2xl mx-auto space-y-3">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                Sé parte del debate musical en Musiclub.
              </h2>
              <p className="text-white/80 text-xs sm:text-base font-medium leading-relaxed">
                Únete a nuestra comunidad. Recomienda tus álbumes, EPs y
                canciones favoritas, califica con criterios técnicos y construye
                tu historial de melómano hoy mismo.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              {!user ? (
                <button
                  type="button"
                  onClick={handleLogin}
                  className="px-8 py-4 bg-white text-black hover:bg-white/90 font-black text-sm rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>🚀</span>
                  <span>Iniciar Sesión con Google</span>
                </button>
              ) : (
                <Link
                  to="/profile"
                  className="px-8 py-4 bg-white text-black hover:bg-white/90 font-black text-sm rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <span>👤</span>
                  <span>Ir a Mi Perfil de Crítico</span>
                </Link>
              )}

              <Link
                to="/faq"
                className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-2xl border border-white/20 transition-all flex items-center gap-2"
              >
                <span>❓</span>
                <span>Guía & Preguntas Frecuentes</span>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default LandingPage;
