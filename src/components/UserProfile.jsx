import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';
import { useAuth } from '../hooks/useAuth';
import { useAlbums } from '../hooks/useAlbums';
import { useUserReviews } from '../hooks/useUserReviews';
import { ReviewSystem } from './ReviewSystem';
import {
  getWeightedReviewScore,
  getTrackDisplayName,
  getEmotionFromReview,
  getReviewFavoriteTrack,
  isFavoriteTrackMatch,
  getReleaseUrl,
} from '../utils/ratingUtils';
import { calculateUserGamification } from '../utils/badgeSystem';
import { Recommendations } from './Recommendations';
import { SongMailbox } from './SongMailbox';
import { SendSongRecommendationModal } from './SendSongRecommendationModal';
import { TierListMaker, PLACEHOLDER_COVER } from './TierListMaker';
import { supabaseService } from '../services/supabaseClient';

export const PLACEHOLDER_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Crect width='100' height='100' fill='%231e2238'/%3E%3Ccircle cx='50' cy='38' r='20' fill='%2364748b'/%3E%3Cpath d='M20,85 C20,62 35,62 50,62 C65,62 80,62 80,85 Z' fill='%2364748b'/%3E%3C/svg%3E";

const CRITERIA_METRICS = [
  { key: 'rating_produccion', label: 'Producción', icon: '🎛️', max: 5, color: 'from-blue-500 to-cyan-400' },
  { key: 'rating_composicion', label: 'Composición', icon: '🎵', max: 5, color: 'from-green-500 to-emerald-400' },
  { key: 'rating_letras', label: 'Letras', icon: '📝', max: 5, color: 'from-amber-500 to-yellow-400' },
  { key: 'rating_originalidad', label: 'Originalidad', icon: '💡', max: 5, color: 'from-purple-500 to-indigo-400' },
  { key: 'rating_cohesion', label: 'Cohesión', icon: '🔗', max: 5, color: 'from-rose-500 to-red-400' },
  { key: 'rating_replay', label: 'Replay Value', icon: '🔄', max: 5, color: 'from-teal-500 to-cyan-400' },
  { key: 'rating_general', label: 'General', icon: '⭐', max: 10, color: 'from-[#f5576c] to-[#f093fb]' },
];

const MELOMANO_LEVELS = [
  {
    level: 1,
    title: '🎧 Oyente Principiante',
    minXp: 0,
    maxXp: 249,
    icon: '🎧',
    color: 'from-slate-600 to-slate-800',
    desc: 'Dando los primeros pasos auditivos en Musiclub.',
  },
  {
    level: 2,
    title: '🥉 Explorador Musical',
    minXp: 250,
    maxXp: 599,
    icon: '🥉',
    color: 'from-amber-700 to-amber-950',
    desc: 'Descubriendo nuevos géneros y expandiendo tu radar musical.',
  },
  {
    level: 3,
    title: '🥈 Melómano Frecuente',
    minXp: 600,
    maxXp: 1199,
    icon: '🥈',
    color: 'from-slate-400 to-slate-600',
    desc: 'Crítico activo con oído curioso y aportes constantes al club.',
  },
  {
    level: 4,
    title: '🥇 Oído Entrenado',
    minXp: 1200,
    maxXp: 2499,
    icon: '🥇',
    color: 'from-amber-500 to-yellow-600',
    desc: 'Evaluador riguroso con criterio analítico y oído afinado.',
  },
  {
    level: 5,
    title: '💎 Melómano Consagrado',
    minXp: 2500,
    maxXp: 4499,
    icon: '💎',
    color: 'from-cyan-500 to-blue-600',
    desc: 'Voz influyente con gran bagaje musical y criterio respetado.',
  },
  {
    level: 6,
    title: '👑 Maestro del Catálogo',
    minXp: 4500,
    maxXp: 7499,
    icon: '👑',
    color: 'from-purple-500 to-fuchsia-600',
    desc: 'Pilar del club con decenas de álbumes y pistas analizadas.',
  },
  {
    level: 7,
    title: '🪐 Enciclopedia Sonora',
    minXp: 7500,
    maxXp: 11999,
    icon: '🪐',
    color: 'from-indigo-600 via-purple-600 to-pink-600',
    desc: 'Erudición auditiva total con dominio de múltiples corrientes.',
  },
  {
    level: 8,
    title: '🌌 Leyenda Melómana Suprema',
    minXp: 12000,
    maxXp: 999999,
    icon: '🌌',
    color: 'from-rose-500 via-amber-400 to-yellow-300',
    desc: 'Máximo nivel de sabiduría musical alcanzado en la historia de Musiclub.',
  },
];

export function UserProfile({ isPage = false }) {
  const { user, isAdmin } = useAuth();
  const { albums } = useAlbums();
  const { userReviews, loading: reviewsLoading, refetchUserReviews } = useUserReviews(user);
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['reviews', 'recommendations', 'badges', 'stats', 'pending', 'mailbox'].includes(tabParam)) {
        return tabParam;
      }
    } catch {
      // fallback
    }
    return 'reviews';
  }); // 'recommendations' | 'reviews' | 'badges' | 'stats' | 'pending' | 'mailbox'

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date_desc'); // 'date_desc' | 'date_asc' | 'score_desc' | 'score_asc'
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsPerPage, setReviewsPerPage] = useState(10);
  const [expandedReviewId, setExpandedReviewId] = useState(null);
  const [editingReviewItem, setEditingReviewItem] = useState(null);
  const [leaderboardList, setLeaderboardList] = useState([]);

  // Buzón de Canciones
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendModalRecipient, setSendModalRecipient] = useState(null);
  const [unreadMailboxCount, setUnreadMailboxCount] = useState(0);

  // Escuchar cambios en query params (?tab=mailbox)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['reviews', 'recommendations', 'badges', 'stats', 'pending', 'mailbox'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Fetch detailed community leaderboard to sync global records & max XP
  useEffect(() => {
    let isMounted = true;
    async function fetchLeaderboardData() {
      try {
        const data = await supabaseService.getDetailedLeaderboard();
        if (isMounted && data) {
          setLeaderboardList(data);
        }
      } catch (err) {
        console.error('Error fetching leaderboard in UserProfile:', err);
      }
    }
    fetchLeaderboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch unread count for mailbox badge
  useEffect(() => {
    let isMounted = true;
    async function fetchUnreadCount() {
      if (!user || (!user.email && !user.id)) return;
      try {
        const recs = await supabaseService.getReceivedSongRecommendations(user.email, user.id);
        if (isMounted && recs) {
          const unread = recs.filter((r) => !r.is_read).length;
          setUnreadMailboxCount(unread);
        }
      } catch (err) {
        console.warn('Error fetching unread mailbox count:', err);
      }
    }
    fetchUnreadCount();
    return () => {
      isMounted = false;
    };
  }, [user, isSendModalOpen]);

  // Map of album by ID for quick lookup
  const albumMap = useMemo(() => {
    const map = new Map();
    albums.forEach((alb) => {
      if (alb && alb.id) {
        map.set(alb.id, alb);
      }
    });
    return map;
  }, [albums]);

  // User albums added
  const userAlbumsAdded = useMemo(() => {
    if (!user || !albums) return [];
    const uEmail = (user.email || '').toLowerCase().trim();
    const uName = (user.name || '').toLowerCase().trim();
    const uId = user.id ? String(user.id) : null;
    return albums.filter((alb) => {
      const albEmail = (alb.added_by_email || '').toLowerCase().trim();
      const albName = (alb.added_by || '').toLowerCase().trim();
      const albUid = alb.user_id ? String(alb.user_id) : null;
      return (
        (uEmail && albEmail === uEmail) ||
        (uId && albUid === uId) ||
        (uName && albName === uName)
      );
    });
  }, [user, albums]);

  // Calculate user statistics
  const stats = useMemo(() => {
    if (!userReviews || userReviews.length === 0) {
      return {
        totalReviews: 0,
        averageScore: 0,
        totalTracksRated: 0,
        criteriaAverages: {},
        highestRatedAlbum: null,
        lowestRatedAlbum: null,
        completionPercentage: 0,
      };
    }

    let totalScoreSum = 0;
    let validScoreCount = 0;
    let totalTracksRated = 0;
    const criteriaSums = {};
    const criteriaCounts = {};

    CRITERIA_METRICS.forEach((crit) => {
      criteriaSums[crit.key] = 0;
      criteriaCounts[crit.key] = 0;
    });

    let highest = null;
    let lowest = null;

    userReviews.forEach((rev) => {
      const score = getWeightedReviewScore(rev) ?? rev.rating_general;
      if (score !== null && score !== undefined && !isNaN(score)) {
        totalScoreSum += score;
        validScoreCount += 1;

        if (!highest || score > (getWeightedReviewScore(highest) ?? highest.rating_general ?? 0)) {
          highest = rev;
        }
        if (!lowest || score < (getWeightedReviewScore(lowest) ?? lowest.rating_general ?? 10)) {
          lowest = rev;
        }
      }

      CRITERIA_METRICS.forEach((crit) => {
        const val = rev[crit.key];
        if (val !== undefined && val !== null && !isNaN(val)) {
          criteriaSums[crit.key] += Number(val);
          criteriaCounts[crit.key] += 1;
        }
      });

      if (rev.track_ratings && typeof rev.track_ratings === 'object') {
        totalTracksRated += Object.keys(rev.track_ratings).length;
      }
    });

    const criteriaAverages = {};
    CRITERIA_METRICS.forEach((crit) => {
      criteriaAverages[crit.key] =
        criteriaCounts[crit.key] > 0
          ? criteriaSums[crit.key] / criteriaCounts[crit.key]
          : 0;
    });

    const totalAlbumsCount = albums.length || 1;
    const completionPercentage = Math.min(
      100,
      Math.round((userReviews.length / totalAlbumsCount) * 100)
    );

    return {
      totalReviews: userReviews.length,
      averageScore: validScoreCount > 0 ? totalScoreSum / validScoreCount : 0,
      totalTracksRated,
      criteriaAverages,
      highestRatedAlbum: highest,
      lowestRatedAlbum: lowest,
      completionPercentage,
    };
  }, [userReviews, albums]);

  // Global community max metrics to determine dynamic #1 record crowns
  const communityMaxes = useMemo(() => {
    if (!leaderboardList || leaderboardList.length === 0) return {};
    return {
      review_count: Math.max(...leaderboardList.map((u) => u.review_count || 0), 0),
      total_tracks_rated: Math.max(...leaderboardList.map((u) => u.total_tracks_rated || 0), 0),
      comments_count: Math.max(...leaderboardList.map((u) => u.comments_count || 0), 0),
      tens_count: Math.max(...leaderboardList.map((u) => u.tens_count || 0), 0),
    };
  }, [leaderboardList]);

  // Gamification & Badges synchronized with Leaderboard records
  const userGamification = useMemo(() => {
    // If leaderboard data is already loaded and contains the current user, use official synced score
    if (user && leaderboardList && leaderboardList.length > 0) {
      const uEmail = (user.email || '').toLowerCase().trim();
      const uName = (user.name || '').toLowerCase().trim();
      const matched = leaderboardList.find((lb) => {
        const lbEmail = (lb.email || '').toLowerCase().trim();
        const lbName = (lb.name || '').toLowerCase().trim();
        return (
          (uEmail && lbEmail === uEmail) ||
          (uName && lbName === uName) ||
          (user.id && lb.id && String(lb.id) === String(user.id))
        );
      });

      if (matched) {
        return {
          totalXp: matched.total_xp || 0,
          activityXp: matched.activity_xp || 0,
          badgesXp: matched.badges_xp || 0,
          recordXp: matched.record_xp || 0,
          badges: matched.badges || [],
          allBadgesProgress: matched.badges_progress || [],
        };
      }
    }

    // Dynamic real-time calculation with communityMaxes
    const userObj = {
      review_count: stats.totalReviews,
      avg_score: stats.averageScore,
      total_tracks_rated: stats.totalTracksRated,
      reviews: userReviews,
    };
    return calculateUserGamification(userObj, communityMaxes);
  }, [user, leaderboardList, communityMaxes, stats, userReviews]);

  // Nivel de Melómano Dinámico
  const currentMelomanoLevel = useMemo(() => {
    const currentXp = userGamification.totalXp || 0;
    let current = MELOMANO_LEVELS[0];
    let next = MELOMANO_LEVELS[1] || null;

    for (let i = 0; i < MELOMANO_LEVELS.length; i++) {
      if (currentXp >= MELOMANO_LEVELS[i].minXp) {
        current = MELOMANO_LEVELS[i];
        next = MELOMANO_LEVELS[i + 1] || null;
      }
    }

    const xpInCurrent = currentXp - current.minXp;
    const xpNeededForNext = next ? next.minXp - current.minXp : 0;
    const progressPercent = next
      ? Math.min(
          100,
          Math.max(0, Math.round((xpInCurrent / xpNeededForNext) * 100))
        )
      : 100;
    const xpRemaining = next ? Math.max(0, next.minXp - currentXp) : 0;

    return {
      ...current,
      currentXp,
      next,
      progressPercent,
      xpRemaining,
    };
  }, [userGamification]);

  // List of reviewed albums combined with review data
  const enrichedReviews = useMemo(() => {
    return userReviews.map((review) => {
      const relAlbum = review.albums || review.album;
      const album =
        albumMap.get(review.album_id) ||
        (relAlbum
          ? {
              id: relAlbum.id,
              album: relAlbum.album_name || review.album_title || 'Álbum',
              artista: relAlbum.artist_name || review.album_artist || 'Artista',
              imagen: relAlbum.image_url || review.album_image || PLACEHOLDER_COVER,
              tracks: relAlbum.tracks || [],
              release_type: relAlbum.release_type || 'ALBUM',
              release_year: relAlbum.release_year || null,
              status: relAlbum.status || 'INDIVIDUAL',
            }
          : {
              album: review.album_title || 'Álbum',
              artista: review.album_artist || 'Artista',
              imagen: review.album_image || PLACEHOLDER_COVER,
              status: 'INDIVIDUAL',
            });
      const weightedScore = getWeightedReviewScore(review) ?? review.rating_general ?? 0;
      return {
        ...review,
        album,
        weightedScore,
      };
    });
  }, [userReviews, albumMap]);

  // Filtered and sorted reviews
  const filteredReviews = useMemo(() => {
    let result = enrichedReviews.filter((item) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const albumName = (item.album?.album || '').toLowerCase();
      const artistName = (item.album?.artista || '').toLowerCase();
      const comment = (item.comment || '').toLowerCase();
      return (
        albumName.includes(term) ||
        artistName.includes(term) ||
        comment.includes(term)
      );
    });

    result.sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      if (sortBy === 'date_asc') {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }
      if (sortBy === 'score_desc') {
        return (b.weightedScore || 0) - (a.weightedScore || 0);
      }
      if (sortBy === 'score_asc') {
        return (a.weightedScore || 0) - (b.weightedScore || 0);
      }
      return 0;
    });

    return result;
  }, [enrichedReviews, searchTerm, sortBy]);

  // Reset reviews page when search, sort or pageSize changes
  useEffect(() => {
    setReviewsPage(1);
  }, [searchTerm, sortBy, reviewsPerPage]);

  const totalReviewPages = Math.ceil(filteredReviews.length / reviewsPerPage) || 1;

  useEffect(() => {
    if (reviewsPage > totalReviewPages) {
      setReviewsPage(1);
    }
  }, [totalReviewPages, reviewsPage]);

  const paginatedReviews = useMemo(() => {
    const start = (reviewsPage - 1) * reviewsPerPage;
    return filteredReviews.slice(start, start + reviewsPerPage);
  }, [filteredReviews, reviewsPage, reviewsPerPage]);

  const handleReviewsPageChange = (newPage) => {
    setReviewsPage(newPage);
    const el = document.getElementById('reviews-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Pending albums to review
  const pendingAlbums = useMemo(() => {
    const reviewedSet = new Set(userReviews.map((r) => r.album_id));
    return albums.filter((alb) => !reviewedSet.has(alb.id));
  }, [albums, userReviews]);

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 sm:p-6 text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl sm:text-4xl mb-4 shadow-xl">
          🔒
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Acceso a Perfil</h2>
        <p className="text-white/50 text-xs sm:text-sm max-w-md mb-6 leading-relaxed">
          Inicia sesión para consultar tu información general, historial de reviews y estadísticas musicales personalizadas.
        </p>
        <button
          onClick={() => navigate('/')}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white rounded-xl font-bold shadow-lg shadow-[#f5576c]/20 active:scale-95 hover:scale-105 transition-all text-xs sm:text-sm"
        >
          Ir al Inicio / Iniciar Sesión
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 sm:space-y-8 pb-16 animate-fadeIn">
      {/* Universal Standard App Header */}
      <AppHeader showTitle={false} />

      {/* TARJETA DE PRESENTACIÓN DEL PERFIL */}
      <div className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 bg-gradient-to-br from-[#131326] via-[#0d1020] to-[#080913] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-bl from-[#f5576c]/15 via-[#f093fb]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-60 sm:w-80 h-60 sm:h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6 md:gap-8 text-center md:text-left">
          {/* Avatar con aura decorativa */}
          <div className="relative group flex-shrink-0">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-[#f5576c] via-[#f093fb] to-cyan-400 rounded-full blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white/20 bg-black/60 shadow-2xl flex items-center justify-center">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = PLACEHOLDER_AVATAR;
                  }}
                />
              ) : (
                <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-tr from-[#f5576c] to-[#f093fb] bg-clip-text text-transparent">
                  {(user.name || 'U')[0].toUpperCase()}
                </span>
              )}
            </div>
            {isAdmin && (
              <div
                className="absolute -bottom-1 -right-1 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-0.5 rounded-full border border-white/20 shadow-lg"
                title="Administrador"
              >
                ADMIN
              </div>
            )}
          </div>

          {/* Información del Usuario */}
          <div className="flex-1 min-w-0 w-full space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                  <h1
                    translate="no"
                    className="notranslate username-tag text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight truncate max-w-full"
                  >
                    {user.name || 'Melómano de Musiclub'}
                  </h1>
                  <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/10 whitespace-nowrap">
                    {isAdmin ? '🛡️ Admin' : '🎧 Miembro'}
                  </span>
                </div>
                <p className="text-white/40 text-xs sm:text-sm font-mono mt-0.5 break-all">
                  {user.email}
                </p>
              </div>

              <Link
                to="/settings"
                className="inline-flex items-center justify-center gap-1.5 text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl border border-white/10 transition-all font-medium self-center sm:self-auto active:scale-95"
              >
                <span>✏️</span> Editar Perfil
              </Link>
            </div>

            {/* Biografía */}
            {user.bio ? (
              <p className="text-white/80 text-xs sm:text-sm italic w-full bg-black/30 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/5 leading-relaxed break-words text-left">
                "{user.bio}"
              </p>
            ) : (
              <p className="text-white/30 text-xs italic text-center md:text-left">
                Aún no has agregado una biografía. Puedes agregarla en Configuración.
              </p>
            )}

            {/* Badges & XP Header Pill */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2 pt-1">
              <span className="text-xs bg-gradient-to-r from-amber-400/20 via-yellow-400/30 to-amber-400/20 text-amber-300 border border-amber-400/50 px-3 py-1 rounded-full flex items-center gap-1.5 font-black shadow-[0_0_12px_rgba(251,191,36,0.25)]">
                <span>✨</span> {(userGamification.totalXp || 0).toLocaleString()} XP de Club
              </span>

              {userGamification.badges?.slice(0, 3).map((b) => (
                <span
                  key={b.id}
                  title={b.tooltip || b.desc || b.label}
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r ${b.color} ${b.borderClass || ''} shadow-sm cursor-help hover:scale-105 transition-transform`}
                >
                  {b.label}
                </span>
              ))}
            </div>

            {/* Tags / Artista / Álbum / Géneros */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2 pt-1">
              {user.favorite_artist && (
                <span className="text-[11px] sm:text-xs bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
                  <span>👑</span> Artista:{' '}
                  <strong
                    translate="no"
                    className="notranslate artist-name truncate max-w-[150px]"
                  >
                    {user.favorite_artist}
                  </strong>
                </span>
              )}

              {user.favorite_album && (
                <span className="text-[11px] sm:text-xs bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
                  <span>💿</span> Álbum:{' '}
                  <strong
                    translate="no"
                    className="notranslate music-title truncate max-w-[150px]"
                  >
                    {user.favorite_album}
                  </strong>
                </span>
              )}

              {user.favorite_genres && Array.isArray(user.favorite_genres) && user.favorite_genres.length > 0 && (
                user.favorite_genres.map((genre, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] sm:text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2.5 py-0.5 rounded-full"
                  >
                    #{genre}
                  </span>
                ))
              )}

              {user.spotify_url && (
                <a
                  href={user.spotify_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] sm:text-xs bg-[#1DB954]/20 text-[#1DB954] hover:bg-[#1DB954]/30 border border-[#1DB954]/30 px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold transition-all active:scale-95"
                >
                  <span>🎵</span> Spotify
                </a>
              )}

              {user.instagram_url && (
                <a
                  href={user.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] sm:text-xs bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 border border-pink-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold transition-all active:scale-95"
                >
                  <span>📷</span> Instagram
                </a>
              )}
            </div>
          </div>
        </div>

        {/* MÉTRICAS RÁPIDAS EN CABECERA */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 pt-4 sm:mt-6 sm:pt-6 border-t border-white/10">
          <div className="bg-black/40 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-white/5 text-center flex flex-col justify-center">
            <span className="text-white/40 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider block mb-0.5 sm:mb-1">
              Score XP
            </span>
            <span className="text-xl sm:text-2xl md:text-3xl font-black text-amber-300">
              ✨ {(userGamification.totalXp || 0).toLocaleString()}
            </span>
          </div>

          <div className="bg-black/40 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-white/5 text-center flex flex-col justify-center">
            <span className="text-white/40 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider block mb-0.5 sm:mb-1">
              Reviews Totales
            </span>
            <span className="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#f5576c] to-[#f093fb]">
              {stats.totalReviews}
            </span>
          </div>

          <div className="bg-black/40 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-white/5 text-center flex flex-col justify-center">
            <span className="text-white/40 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider block mb-0.5 sm:mb-1">
              Promedio Dado
            </span>
            <span className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-400">
              ★ {stats.averageScore.toFixed(1)}
            </span>
          </div>

          <div className="bg-black/40 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-white/5 text-center flex flex-col justify-center">
            <span className="text-white/40 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider block mb-0.5 sm:mb-1">
              Tracks Calificados
            </span>
            <span className="text-xl sm:text-2xl md:text-3xl font-black text-cyan-400">
              {stats.totalTracksRated}
            </span>
          </div>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN TOUCH-FRIENDLY */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar scroll-smooth snap-x -mx-1 px-1 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab('mailbox')}
          className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 snap-start active:scale-95 ${
            activeTab === 'mailbox'
              ? 'bg-gradient-to-r from-[#f5576c] via-[#f093fb] to-cyan-400 text-slate-950 shadow-lg shadow-[#f5576c]/30 font-black'
              : 'text-white/80 hover:text-white bg-gradient-to-r from-[#f5576c]/15 to-[#f093fb]/15 hover:from-[#f5576c]/25 hover:to-[#f093fb]/25 border border-[#f5576c]/30'
          }`}
        >
          <span>💌</span> Buzón de Canciones
          {unreadMailboxCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
              {unreadMailboxCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 snap-start active:scale-95 ${
            activeTab === 'recommendations'
              ? 'bg-gradient-to-r from-[#f5576c] via-[#f093fb] to-cyan-400 text-slate-950 shadow-lg shadow-[#f5576c]/30 font-black'
              : 'text-white/80 hover:text-white bg-white/5 hover:bg-white/10'
          }`}
        >
          <span>✨</span> Para Ti (Recomendaciones)
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 snap-start active:scale-95 ${
            activeTab === 'reviews'
              ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-lg shadow-[#f5576c]/20'
              : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
          }`}
        >
          <span>🎧</span> Mis Reviews ({stats.totalReviews})
        </button>

        <button
          onClick={() => setActiveTab('badges')}
          className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 snap-start active:scale-95 ${
            activeTab === 'badges'
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-400/20 font-black'
              : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
          }`}
        >
          <span>🎖️</span> Insignias & Niveles ({userGamification.badges?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 snap-start active:scale-95 ${
            activeTab === 'stats'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
              : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
          }`}
        >
          <span>📊</span> Estadísticas Detalladas
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 snap-start active:scale-95 ${
            activeTab === 'pending'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20'
              : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
          }`}
        >
          <span>⏳</span> Por Calificar ({pendingAlbums.length})
        </button>
      </div>

      {/* CONTENIDO DE PESTAÑA: MIS REVIEWS */}
      {activeTab === 'reviews' && (
        <div id="reviews-section" className="space-y-4 sm:space-y-6 scroll-mt-24">
          {/* Barra de Filtro y Búsqueda */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 bg-black/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10">
            <div className="relative w-full sm:w-72 md:w-80">
              <input
                type="text"
                placeholder="Buscar por álbum o artista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#f5576c] transition-all pl-8 sm:pl-9"
              />
              <span className="absolute left-2.5 sm:left-3 top-2 sm:top-2.5 text-white/40 text-xs sm:text-sm">🔍</span>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2 sm:top-2.5 text-white/40 hover:text-white text-xs p-0.5"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto flex-wrap">
              <span className="text-white/40 text-[11px] sm:text-xs font-semibold whitespace-nowrap">Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs text-white focus:outline-none focus:border-[#f5576c] flex-1 sm:flex-initial"
              >
                <option value="date_desc">Más recientes primero</option>
                <option value="date_asc">Más antiguas primero</option>
                <option value="score_desc">Mayor calificación</option>
                <option value="score_asc">Menor calificación</option>
              </select>

              <select
                value={reviewsPerPage}
                onChange={(e) => {
                  setReviewsPerPage(Number(e.target.value));
                  setReviewsPage(1);
                }}
                className="bg-black/60 border border-white/10 rounded-xl px-2 py-1.5 sm:px-2.5 sm:py-2 text-xs text-white focus:outline-none focus:border-[#f5576c]"
                title="Reviews por página"
              >
                <option value={10}>10 / pág</option>
                <option value={20}>20 / pág</option>
                <option value={50}>50 / pág</option>
              </select>
            </div>
          </div>

          {/* Listado de Reviews */}
          {reviewsLoading ? (
            <div className="py-16 text-center text-white/40 text-xs sm:text-sm">
              <span className="w-2.5 h-2.5 bg-[#f5576c] rounded-full animate-ping inline-block mr-2"></span>
              Cargando tus reviews...
            </div>
          ) : filteredReviews.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {paginatedReviews.map((item, idx) => {
                const hasTrackRatings = item.track_ratings && Object.keys(item.track_ratings).length > 0;
                const isExpanded = expandedReviewId === item.id;

                return (
                  <div
                    key={item.id || idx}
                    className="rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 bg-gradient-to-br from-[#121424] to-[#0a0d18] border border-white/10 hover:border-white/20 transition-all shadow-xl flex flex-col justify-between space-y-3 sm:space-y-4"
                  >
                    {/* Encabezado del Álbum */}
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl sm:rounded-2xl overflow-hidden flex-shrink-0 border border-white/10 shadow-lg group">
                        <img
                          src={item.album.imagen}
                          alt={item.album.album}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            e.target.src = PLACEHOLDER_COVER;
                          }}
                        />
                        <div className="absolute bottom-1 right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] sm:text-[10px] font-bold shadow-md">
                          ✓
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1.5">
                          <h3
                            translate="no"
                            className="notranslate music-title text-white font-bold text-sm sm:text-base truncate leading-snug"
                            title={item.album.album}
                          >
                            {item.album.album}
                          </h3>
                          <span className="text-emerald-400 font-black text-xs sm:text-sm px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex-shrink-0">
                            ★ {item.weightedScore.toFixed(1)}
                          </span>
                        </div>
                        <p
                          translate="no"
                          className="notranslate artist-name text-white/60 text-xs truncate mt-0.5"
                          title={item.album.artista}
                        >
                          {item.album.artista}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap mt-1.5 sm:mt-2">
                          <p className="text-white/30 text-[10px] font-mono">
                            {item.created_at
                              ? new Date(item.created_at).toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'Fecha no registrada'}
                          </p>
                          {(() => {
                            const emo = getEmotionFromReview(item);
                            return emo ? (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 shadow-sm ${emo.badgeClass}`}
                                title={emo.description}
                              >
                                <span>{emo.emoji}</span>
                                <span>{emo.label}</span>
                              </span>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Comentario si existe */}
                    {item.comment && (
                      <p className="text-white/80 text-xs italic bg-black/40 p-2.5 sm:p-3 rounded-xl border border-white/5 leading-relaxed break-words">
                        "{item.comment}"
                      </p>
                    )}

                    {/* Canción Favorita */}
                    {(() => {
                      const favTrack = getReviewFavoriteTrack(item);
                      if (!favTrack) return null;
                      const tracksSource = item.albums?.tracks || albumMap.get(item.album_id)?.tracks;
                      const favName = getTrackDisplayName(favTrack, tracksSource);
                      return (
                        <div className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-400/30 px-2.5 py-1 rounded-xl text-amber-200 font-medium shadow-sm">
                          <span className="text-sm">⭐</span>
                          <span className="text-amber-400/80 font-bold text-[10px] uppercase tracking-wider">
                            Canción Favorita:
                          </span>
                          <span
                            translate="no"
                            className="notranslate track-name font-extrabold text-amber-200 truncate max-w-[200px]"
                            title={favName}
                          >
                            {favName}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Mini Desglose de Criterios (4 columnas responsivas) */}
                    <div className="grid grid-cols-4 gap-1 sm:gap-1.5 pt-2 border-t border-white/5">
                      {[
                        { label: '🎛️ Prod', val: item.rating_produccion, max: 5 },
                        { label: '🎵 Comp', val: item.rating_composicion, max: 5 },
                        { label: '📝 Letras', val: item.rating_letras, max: 5 },
                        { label: '⭐ Gral', val: item.rating_general, max: 10 },
                      ].map((crit, cIdx) => (
                        <div key={cIdx} className="bg-black/30 p-1 sm:p-1.5 rounded-lg text-center border border-white/5">
                          <div className="text-white/40 text-[8px] sm:text-[9px] uppercase truncate">{crit.label}</div>
                          <div className="text-white font-bold text-[11px] sm:text-xs mt-0.5">
                            {crit.val ?? '-'}/{crit.max}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Canciones Calificadas con Acordeón Interactivo */}
                    {hasTrackRatings && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setExpandedReviewId(isExpanded ? null : item.id)}
                          className="w-full text-left flex items-center justify-between text-white/50 hover:text-white text-[10px] sm:text-xs font-semibold py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                        >
                          <span>🎵 {Object.keys(item.track_ratings).length} canciones evaluadas</span>
                          <span className="text-[10px] text-white/40">
                            {isExpanded ? 'Ocultar ▲' : 'Ver tracks ▼'}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="mt-2 p-2 sm:p-3 rounded-xl bg-black/50 border border-white/5 max-h-48 overflow-y-auto custom-scrollbar space-y-1.5 animate-fadeIn">
                            {Object.entries(item.track_ratings).map(([trackKey, score], tIdx) => {
                              const tracksSource = item.albums?.tracks || albumMap.get(item.album_id)?.tracks;
                              const trackName = getTrackDisplayName(
                                trackKey,
                                tracksSource
                              );
                              const isFav = isFavoriteTrackMatch(
                                trackKey,
                                getReviewFavoriteTrack(item),
                                tracksSource,
                                tIdx
                              );
                              return (
                                <div
                                  key={tIdx}
                                  className={`flex items-center justify-between text-xs py-1 px-2 rounded-lg border transition-all ${
                                    isFav
                                      ? 'bg-amber-500/20 border-amber-400/40 text-amber-200 shadow-sm'
                                      : 'bg-white/5 border-white/5'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate pr-2 min-w-0">
                                    <span>{isFav ? '⭐' : '🎵'}</span>
                                    <span
                                      translate="no"
                                      className={`notranslate track-name truncate text-[11px] sm:text-xs ${isFav ? 'font-bold text-amber-200' : 'text-white/80'}`}
                                      title={trackName}
                                    >
                                      {trackName}
                                    </span>
                                  </div>
                                  <span
                                    className={`font-black text-[11px] sm:text-xs flex-shrink-0 ${
                                      isFav
                                        ? 'text-amber-300'
                                        : score >= 8
                                        ? 'text-emerald-400'
                                        : score >= 6
                                        ? 'text-cyan-400'
                                        : 'text-amber-400'
                                    }`}
                                  >
                                    {score}/10
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    {/* Acciones de la Review: Botón Editar y Ver Página del Álbum */}
                    <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-white/10 mt-auto">
                      <button
                        type="button"
                        onClick={() => setEditingReviewItem(item)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 text-pink-300 hover:text-white border border-pink-500/30 hover:border-pink-500/50 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                        title="Editar las calificaciones y comentario de esta review"
                      >
                        <span>✏️</span>
                        <span>Editar Review</span>
                      </button>

                      <Link
                        to={getReleaseUrl(
                          item.album.album || item.album.album_name,
                          item.album.release_type || item.album.releaseType
                        )}
                        className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-semibold transition-all shadow-sm active:scale-95"
                        title="Ir a la página del lanzamiento"
                      >
                        <span>Ver Más</span>
                        <span>➔</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Controles de Paginación */}
            {totalReviewPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
                <div className="text-xs text-white/50 text-center sm:text-left">
                  Mostrando{' '}
                  <span className="text-white font-bold">
                    {(reviewsPage - 1) * reviewsPerPage + 1}
                  </span>{' '}
                  a{' '}
                  <span className="text-white font-bold">
                    {Math.min(reviewsPage * reviewsPerPage, filteredReviews.length)}
                  </span>{' '}
                  de{' '}
                  <span className="text-[#f093fb] font-bold">
                    {filteredReviews.length}
                  </span>{' '}
                  reviews
                </div>

                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  <button
                    onClick={() => handleReviewsPageChange(1)}
                    disabled={reviewsPage === 1}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 border border-white/10 transition-all cursor-pointer"
                    title="Primera Página"
                  >
                    «
                  </button>

                  <button
                    onClick={() => handleReviewsPageChange(Math.max(1, reviewsPage - 1))}
                    disabled={reviewsPage === 1}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 border border-white/10 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>←</span> Anterior
                  </button>

                  {Array.from({ length: totalReviewPages }, (_, i) => i + 1)
                    .filter((page) => {
                      return (
                        page === 1 ||
                        page === totalReviewPages ||
                        Math.abs(page - reviewsPage) <= 2
                      );
                    })
                    .map((page, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && page - prev > 1;

                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && (
                            <span className="text-white/30 px-1 text-xs">...</span>
                          )}
                          <button
                            onClick={() => handleReviewsPageChange(page)}
                            className={`min-w-[32px] h-8 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                              reviewsPage === page
                                ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white border-[#f5576c]/50 shadow-md shadow-[#f5576c]/20 font-black'
                                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    onClick={() => handleReviewsPageChange(Math.min(totalReviewPages, reviewsPage + 1))}
                    disabled={reviewsPage === totalReviewPages}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 border border-white/10 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    Siguiente <span>→</span>
                  </button>

                  <button
                    onClick={() => handleReviewsPageChange(totalReviewPages)}
                    disabled={reviewsPage === totalReviewPages}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 border border-white/10 transition-all cursor-pointer"
                    title="Última Página"
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </>
          ) : (
            <div className="text-center py-12 sm:py-16 bg-black/30 rounded-2xl sm:rounded-3xl border border-dashed border-white/10 p-6 sm:p-8">
              <div className="text-3xl sm:text-4xl mb-3">🎧</div>
              <h3 className="text-white font-bold text-sm sm:text-base mb-1">
                {searchTerm ? 'No se encontraron reviews con esa búsqueda' : 'Aún no tienes reviews registradas'}
              </h3>
              <p className="text-white/40 text-xs max-w-sm mx-auto mb-5 leading-relaxed">
                {searchTerm
                  ? 'Intenta con otro término de búsqueda o limpia el filtro.'
                  : 'Explora el catálogo de álbumes del club y califica tus primeros proyectos para generar tu perfil musical.'}
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#f5576c]/20 hover:scale-105 active:scale-95 transition-all"
              >
                <span>🎵</span> Explorar Álbumes
              </Link>
            </div>
          )}

          {/* Modal para Editar Review */}
          {editingReviewItem && typeof document !== 'undefined' && createPortal(
            <div 
              className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl overflow-y-auto"
              onClick={() => setEditingReviewItem(null)}
            >
              <div 
                className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0d0f1c] border border-pink-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 text-left custom-scrollbar my-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header del modal */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-lg flex-shrink-0">
                      ✏️
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-white truncate">
                        Editar Review: {editingReviewItem.album?.album || editingReviewItem.album?.album_name}
                      </h3>
                      <p className="text-xs text-white/50 truncate">
                        {editingReviewItem.album?.artista || editingReviewItem.album?.artist_name}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingReviewItem(null)}
                    className="text-white/60 hover:text-white bg-white/5 hover:bg-white/15 p-2 rounded-xl transition-all border border-white/10 cursor-pointer"
                    title="Cerrar modal de edición"
                  >
                    ✕
                  </button>
                </div>

                <ReviewSystem
                  album={{
                    id: editingReviewItem.album_id || editingReviewItem.album?.id,
                    album: editingReviewItem.album?.album || editingReviewItem.album?.album_name,
                    artista: editingReviewItem.album?.artista || editingReviewItem.album?.artist_name,
                    imagen: editingReviewItem.album?.imagen || editingReviewItem.album?.image_url,
                    tracks: editingReviewItem.album?.tracks || albumMap.get(editingReviewItem.album_id)?.tracks || [],
                    status: editingReviewItem.album?.status || 'INDIVIDUAL',
                  }}
                  tracks={editingReviewItem.album?.tracks || albumMap.get(editingReviewItem.album_id)?.tracks || []}
                  user={user}
                  isIndividual={editingReviewItem.album?.status === 'INDIVIDUAL'}
                  initialEditing={true}
                  initialReview={editingReviewItem}
                  isModal={true}
                  hideOtherReviews={true}
                  onCancelEdit={() => setEditingReviewItem(null)}
                  onReviewSubmitted={() => {
                    if (refetchUserReviews) refetchUserReviews();
                    setEditingReviewItem(null);
                  }}
                />
              </div>
            </div>,
            document.body
          )}
        </div>
      )}

      {/* CONTENIDO DE PESTAÑA: INSIGNIAS Y NIVELES */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          {/* Tarjeta de Resumen XP */}
          <div className="bg-gradient-to-br from-[#1b1928] via-[#141525] to-[#0d0e1a] rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-amber-400/30 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span>🏆</span> Progreso en el Leaderboard
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  Puntuación de Club (Score XP)
                </h3>
              </div>
              <div className="text-center sm:text-right px-4 py-2 bg-amber-400/10 border border-amber-400/40 rounded-2xl">
                <p className="text-[10px] text-amber-200/80 font-bold uppercase tracking-wider">Total Acumulado</p>
                <p className="text-2xl sm:text-3xl font-black text-amber-300">
                  ✨ {(userGamification.totalXp || 0).toLocaleString()} XP
                </p>
              </div>
            </div>

            {/* Desglose de Fuentes de XP */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-black/40 border border-white/5 rounded-2xl p-3.5 text-center">
                <span className="text-base">🎧</span>
                <p className="text-xs text-slate-400 mt-1 font-medium">Actividad Base</p>
                <p className="text-lg font-black text-white mt-0.5">
                  +{userGamification.activityXp || 0} XP
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Reviews, comentarios, tracks y álbumes</p>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-2xl p-3.5 text-center">
                <span className="text-base">⚡</span>
                <p className="text-xs text-slate-400 mt-1 font-medium">Insignias y Tiers</p>
                <p className="text-lg font-black text-amber-300 mt-0.5">
                  +{userGamification.badgesXp || 0} XP
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Tiers desbloqueados alcanzados</p>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-2xl p-3.5 text-center">
                <span className="text-base">👑</span>
                <p className="text-xs text-slate-400 mt-1 font-medium">Récords #1</p>
                <p className="text-lg font-black text-cyan-300 mt-0.5">
                  +{userGamification.recordXp || 0} XP
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Coronas dinámicas de liderazgo</p>
              </div>
            </div>
          </div>

          {/* Insignias Desbloqueadas Actualmente */}
          <div className="bg-gradient-to-br from-[#131428] to-[#0a0d18] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-white/5">
              <div>
                <h3 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
                  <span>🎖️</span> Tus Insignias Activas ({userGamification.badges?.length || 0})
                </h3>
                <p className="text-white/40 text-xs mt-0.5">
                  Las insignias multinivel evolucionan visualmente al nivel más alto que hayas desbloqueado.
                </p>
              </div>
              <Link
                to="/leaderboard"
                className="text-xs font-bold text-amber-300 hover:text-white bg-amber-400/10 hover:bg-amber-400/20 px-3 py-1.5 rounded-xl border border-amber-400/30 transition-all"
              >
                Ver Leaderboard ➜
              </Link>
            </div>

            {userGamification.badges && userGamification.badges.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {userGamification.badges.map((b) => (
                  <div
                    key={b.id}
                    className="bg-black/40 border border-white/5 rounded-2xl p-3.5 space-y-2 hover:border-white/15 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-full bg-gradient-to-r ${b.color} ${b.borderClass || ''} shadow-sm`}
                      >
                        {b.label}
                      </span>
                      <span className="text-[10px] font-black text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md">
                        +{b.xp} XP
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-snug">
                      {b.desc}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-black/20 rounded-2xl border border-dashed border-white/10 p-4">
                <p className="text-xs text-slate-400">
                  Aún no tienes insignias desbloqueadas. ¡Comienza a calificar álbumes y tracks para subir de nivel!
                </p>
              </div>
            )}
          </div>

          {/* Barras de Progreso hacia los Siguientes Tiers */}
          <div className="bg-gradient-to-br from-[#131428] to-[#0a0d18] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl space-y-4">
            <div>
              <h3 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
                <span>📈</span> Progreso y Próximos Desbloqueos
              </h3>
              <p className="text-white/40 text-xs mt-0.5">
                Sigue tu avance para desbloquear el siguiente rango y sumar más puntos XP a tu perfil.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {userGamification.allBadgesProgress?.map((bp) => {
                const hasNext = Boolean(bp.nextTier);
                return (
                  <div
                    key={bp.badgeId}
                    className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{bp.icon}</span>
                        <span>{bp.categoryName}</span>
                      </span>
                      <span className="text-xs text-amber-300 font-bold px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
                        {bp.unlockedTier ? bp.unlockedTier.name : 'Nivel Inicial'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-snug">
                      {bp.description}
                    </p>

                    {hasNext ? (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-300">
                          <span>
                            Próximo: <strong className="text-amber-300">{bp.nextTier.name}</strong> (+{bp.nextTier.xp} XP)
                          </span>
                          <span className="font-semibold text-white">
                            {bp.currentValue} / {bp.nextTier.req} ({bp.progressPercent}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full transition-all duration-700"
                            style={{ width: `${bp.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="pt-1 flex items-center gap-1.5 text-xs text-emerald-400 font-black">
                        <span>👑</span> ¡Has alcanzado el Tier Máximo en esta categoría!
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO DE PESTAÑA: ESTADÍSTICAS DETALLADAS */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* 1. TIER LIST MAKER (S-F TIERS) - Arriba de todo */}
          <TierListMaker
            userReviews={userReviews}
            albums={albums}
            albumMap={albumMap}
            user={user}
          />

          {/* 2. ESTADÍSTICAS, CRITERIOS Y NIVEL */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Desglose por Criterios */}
            <div className="bg-gradient-to-br from-[#131428] to-[#0a0d18] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10 shadow-2xl space-y-3.5">
              <h3 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                <span>🎛️</span> Promedio Otorgado por Criterio
              </h3>
              <p className="text-white/40 text-xs">
                Muestra la exigencia y tendencia de tus calificaciones según cada aspecto del álbum.
              </p>

              <div className="space-y-3 pt-1">
                {CRITERIA_METRICS.map((crit) => {
                  const avg = stats.criteriaAverages[crit.key] || 0;
                  const pct = Math.min(100, Math.round((avg / crit.max) * 100));
                  return (
                    <div key={crit.key} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/70 font-medium flex items-center gap-1 text-[11px] sm:text-xs">
                          <span>{crit.icon}</span> {crit.label}
                        </span>
                        <span className="text-white font-bold text-[11px] sm:text-xs">
                          {avg.toFixed(2)} / {crit.max}
                        </span>
                      </div>
                      <div className="w-full bg-black/40 rounded-full h-1.5 sm:h-2 overflow-hidden border border-white/5">
                        <div
                          className={`h-full bg-gradient-to-r ${crit.color} rounded-full transition-all duration-1000`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Álbumes Destacados y Nivel de Melómano */}
            <div className="space-y-3 sm:space-y-4">
              {/* Más Alto */}
              <div className="bg-gradient-to-br from-[#101b2b] to-[#0a121e] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-emerald-500/30 shadow-xl">
                <div className="flex items-center gap-1.5 text-emerald-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2.5 sm:mb-3">
                  <span>🏆</span> Tu Álbum Mejor Calificado
                </div>
                {stats.highestRatedAlbum ? (() => {
                  const highAlb =
                    albumMap.get(stats.highestRatedAlbum.album_id) ||
                    stats.highestRatedAlbum.albums ||
                    stats.highestRatedAlbum.album;
                  const albumTitle = highAlb?.album || highAlb?.album_name || 'Álbum';
                  const artistTitle = highAlb?.artista || highAlb?.artist_name || 'Artista';
                  const coverImg = highAlb?.imagen || highAlb?.image_url || PLACEHOLDER_COVER;

                  return (
                    <div className="flex items-center gap-3 sm:gap-4">
                      <img
                        src={coverImg}
                        alt="Highest"
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-emerald-500/40 flex-shrink-0"
                        onError={(e) => {
                          e.target.src = PLACEHOLDER_COVER;
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-white font-bold text-xs sm:text-sm truncate">
                          {albumTitle}
                        </h4>
                        <p className="text-white/60 text-[11px] sm:text-xs truncate">
                          {artistTitle}
                        </p>
                        <span className="inline-block mt-1 text-emerald-400 font-extrabold text-xs sm:text-sm">
                          ★ {(getWeightedReviewScore(stats.highestRatedAlbum) ?? stats.highestRatedAlbum.rating_general)?.toFixed(1)} / 10
                        </span>
                      </div>
                    </div>
                  );
                })() : (
                  <p className="text-white/30 text-xs">Sin reviews suficientes</p>
                )}
              </div>

              {/* Más Exigente / Bajo */}
              <div className="bg-gradient-to-br from-[#24131a] to-[#140a0f] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-rose-500/30 shadow-xl">
                <div className="flex items-center gap-1.5 text-rose-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2.5 sm:mb-3">
                  <span>⚡</span> Calificación Más Exigente
                </div>
                {stats.lowestRatedAlbum ? (() => {
                  const lowAlb =
                    albumMap.get(stats.lowestRatedAlbum.album_id) ||
                    stats.lowestRatedAlbum.albums ||
                    stats.lowestRatedAlbum.album;
                  const albumTitle = lowAlb?.album || lowAlb?.album_name || 'Álbum';
                  const artistTitle = lowAlb?.artista || lowAlb?.artist_name || 'Artista';
                  const coverImg = lowAlb?.imagen || lowAlb?.image_url || PLACEHOLDER_COVER;

                  return (
                    <div className="flex items-center gap-3 sm:gap-4">
                      <img
                        src={coverImg}
                        alt="Lowest"
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-rose-500/40 flex-shrink-0"
                        onError={(e) => {
                          e.target.src = PLACEHOLDER_COVER;
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <h4
                          translate="no"
                          className="notranslate music-title text-white font-bold text-xs sm:text-sm truncate"
                        >
                          {albumTitle}
                        </h4>
                        <p
                          translate="no"
                          className="notranslate artist-name text-white/60 text-[11px] sm:text-xs truncate"
                        >
                          {artistTitle}
                        </p>
                        <span className="inline-block mt-1 text-rose-400 font-extrabold text-xs sm:text-sm">
                          ★ {(getWeightedReviewScore(stats.lowestRatedAlbum) ?? stats.lowestRatedAlbum.rating_general)?.toFixed(1)} / 10
                        </span>
                      </div>
                    </div>
                  );
                })() : (
                  <p className="text-white/30 text-xs">Sin reviews suficientes</p>
                )}
              </div>

              {/* Nivel de Melómano Modernizado & Gamificado */}
              <div className="bg-gradient-to-br from-[#181935] via-[#101226] to-[#0a0b18] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-pink-500/30 shadow-2xl space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr ${currentMelomanoLevel.color} text-white flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-lg`}
                    >
                      {currentMelomanoLevel.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                          Nivel {currentMelomanoLevel.level}
                        </span>
                        <h4 className="text-white font-black text-xs sm:text-sm truncate">
                          {currentMelomanoLevel.title}
                        </h4>
                      </div>
                      <p className="text-white/50 text-[11px] sm:text-xs truncate mt-0.5">
                        {currentMelomanoLevel.desc}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs sm:text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-[#f5576c] to-[#f093fb]">
                      {currentMelomanoLevel.currentXp.toLocaleString()} XP
                    </span>
                    <p className="text-[9px] text-white/40 uppercase tracking-wider font-bold">
                      Puntos Totales
                    </p>
                  </div>
                </div>

                {/* Barra de progreso hacia el siguiente nivel */}
                {currentMelomanoLevel.next ? (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-white/60 truncate pr-2">
                        Siguiente: <strong className="text-pink-300 font-bold">{currentMelomanoLevel.next.title}</strong>
                      </span>
                      <span className="text-white font-semibold flex-shrink-0">
                        +{currentMelomanoLevel.xpRemaining} XP ({currentMelomanoLevel.progressPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-[#f5576c] to-[#f093fb] rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(245,87,108,0.5)]"
                        style={{ width: `${currentMelomanoLevel.progressPercent}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-amber-300 font-bold flex items-center gap-1.5 pt-1">
                    <span>👑</span> ¡Has alcanzado el Rango Melómano Supremo del Club!
                  </div>
                )}

                {/* Mini Resumen de Aportes para subir de nivel */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5 text-center">
                  <div className="bg-white/[0.02] p-1.5 rounded-xl border border-white/5">
                    <span className="text-xs font-bold text-white">{stats.totalReviews}</span>
                    <p className="text-[9px] text-white/40">Reviews</p>
                  </div>
                  <div className="bg-white/[0.02] p-1.5 rounded-xl border border-white/5">
                    <span className="text-xs font-bold text-white">{stats.totalTracksRated}</span>
                    <p className="text-[9px] text-white/40">Tracks</p>
                  </div>
                  <div className="bg-white/[0.02] p-1.5 rounded-xl border border-white/5">
                    <span className="text-xs font-bold text-white">{userAlbumsAdded.length}</span>
                    <p className="text-[9px] text-white/40">Aportes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO DE PESTAÑA: ÁLBUMES PENDIENTES POR CALIFICAR */}
      {activeTab === 'pending' && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-xs sm:text-base flex items-center gap-1.5 sm:gap-2">
              <span>⏳</span> Álbumes Disponibles para tu Review ({pendingAlbums.length})
            </h3>
          </div>

          {pendingAlbums.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
              {pendingAlbums.map((alb, idx) => (
                <div
                  key={alb.id || idx}
                  className="rounded-xl sm:rounded-2xl p-2 sm:p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group flex flex-col justify-between"
                >
                  <div className="aspect-square rounded-lg sm:rounded-xl overflow-hidden mb-2 relative">
                    <img
                      src={alb.imagen}
                      alt={alb.album}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = PLACEHOLDER_COVER;
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h4
                      translate="no"
                      className="notranslate music-title text-white font-bold text-xs truncate leading-snug"
                      title={alb.album}
                    >
                      {alb.album}
                    </h4>
                    <p
                      translate="no"
                      className="notranslate artist-name text-white/50 text-[10px] truncate mb-2"
                      title={alb.artista}
                    >
                      {alb.artista}
                    </p>
                    <Link
                      to="/"
                      className="w-full py-1.5 bg-[#f5576c]/20 hover:bg-[#f5576c]/30 text-[#f5576c] hover:text-white rounded-lg text-[10px] sm:text-[11px] font-bold border border-[#f5576c]/30 flex items-center justify-center gap-1 transition-all active:scale-95"
                    >
                      <span>✍️</span> Evaluar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16 bg-black/30 rounded-2xl sm:rounded-3xl border border-white/10 p-6 sm:p-8">
              <div className="text-3xl sm:text-4xl mb-3">🎉</div>
              <h3 className="text-white font-bold text-sm sm:text-base">¡Felicidades! Has calificado todos los álbumes</h3>
              <p className="text-white/40 text-xs mt-1">
                No tienes álbumes pendientes por revisar en el catálogo actual.
              </p>
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO DE PESTAÑA: BUZÓN MUSICAL (CARTITAS) */}
      {activeTab === 'mailbox' && (
        <div className="pt-2 animate-fadeIn">
          <SongMailbox
            user={user}
            onOpenSendModal={(targetRecipient) => {
              setSendModalRecipient(targetRecipient || null);
              setIsSendModalOpen(true);
            }}
          />
        </div>
      )}

      {/* CONTENIDO DE PESTAÑA: RECOMENDACIONES PERSONALIZADAS */}
      {activeTab === 'recommendations' && (
        <div className="pt-2 animate-fadeIn">
          <Recommendations user={user} />
        </div>
      )}

      {/* MODAL PARA ENVIAR RECOMENDACIÓN DE CANCIÓN */}
      <SendSongRecommendationModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        currentUser={user}
        defaultRecipient={sendModalRecipient}
        onSuccess={() => {
          // Si estamos en el buzón, el componente se refrescará con los nuevos datos
          setActiveTab('mailbox');
        }}
      />

      {/* Global Footer */}
      <Footer />
    </div>
  );
}

export default UserProfile;
