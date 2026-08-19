// src/components/Leaderboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabaseService } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { BADGES_GUIDE_DATA, XP_CONFIG } from '../utils/badgeSystem';

const CRITERIA_INFO = [
  { key: 'rating_produccion', label: 'Producción', emoji: '🎛️' },
  { key: 'rating_composicion', label: 'Composición', emoji: '🎵' },
  { key: 'rating_letras', label: 'Letras', emoji: '📝' },
  { key: 'rating_originalidad', label: 'Originalidad', emoji: '💡' },
  { key: 'rating_cohesion', label: 'Cohesión', emoji: '🔗' },
  { key: 'rating_replay', label: 'Replay Value', emoji: '🔄' },
];

function UserAvatar({ user, size = 'md', className = '' }) {
  const [imgError, setImgError] = useState(false);
  const name = user?.name || user?.email || 'U';
  const initial = (name.trim()[0] || 'U').toUpperCase();

  // Strict dimensions matching Google Avatar proportions & preventing oversized images
  const sizeClasses =
    {
      sm: 'w-8 h-8 min-w-[32px] min-h-[32px] text-xs font-bold',
      md: 'w-11 h-11 min-w-[44px] min-h-[44px] sm:w-13 sm:h-13 sm:min-w-[52px] sm:min-h-[52px] text-base sm:text-lg font-black',
      podium_silver: 'w-full h-full text-2xl font-black',
      podium_gold: 'w-full h-full text-3xl font-black',
      podium_bronze: 'w-full h-full text-2xl font-black',
      modal:
        'w-20 h-20 min-w-[80px] min-h-[80px] sm:w-24 sm:h-24 sm:min-w-[96px] sm:min-h-[96px] text-2xl sm:text-3xl font-black',
    }[size] || 'w-11 h-11 min-w-[44px] min-h-[44px] text-sm font-black';

  const gradients = [
    'from-rose-500 to-pink-500 text-white',
    'from-amber-400 to-yellow-500 text-black',
    'from-emerald-500 to-teal-400 text-white',
    'from-cyan-400 to-blue-500 text-black',
    'from-indigo-500 to-purple-500 text-white',
    'from-fuchsia-500 to-pink-500 text-white',
    'from-orange-500 to-amber-500 text-black',
  ];
  const charCode = initial.charCodeAt(0) || 0;
  const gradient = gradients[charCode % gradients.length];

  if (user?.avatar_url && !imgError) {
    return (
      <div
        className={`${sizeClasses} rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-white relative shadow-inner ${className}`}
      >
        <img
          src={user.avatar_url}
          alt={name}
          className="w-full h-full object-cover rounded-full"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-full bg-gradient-to-tr ${gradient} flex items-center justify-center flex-shrink-0 select-none shadow-md overflow-hidden ${className}`}
      title={name}
    >
      {initial}
    </div>
  );
}

export function Leaderboard({ isPage = false }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('xp_desc'); // xp_desc | reviews_desc | rating_desc | rating_asc | albums_desc | tracks_desc | name_asc
  const [filterType, setFilterType] = useState('all'); // all | with_reviews | with_albums
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [showBadgesGuide, setShowBadgesGuide] = useState(false);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);
      try {
        const data = await supabaseService.getDetailedLeaderboard();
        setUsers(data || []);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('No se pudo cargar el Leaderboard.');
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  // Global Club Metrics
  const globalMetrics = useMemo(() => {
    if (!users || users.length === 0) {
      return {
        totalReviews: 0,
        totalUsers: 0,
        totalAlbums: 0,
        totalXp: 0,
        avgClubRating: 0,
      };
    }
    const totalReviews = users.reduce(
      (sum, u) => sum + (u.review_count || 0),
      0
    );
    const totalAlbums = users.reduce(
      (sum, u) => sum + (u.albums_added_count || 0),
      0
    );
    const totalXp = users.reduce((sum, u) => sum + (u.total_xp || 0), 0);
    const activeReviewers = users.filter((u) => u.review_count > 0);
    const avgSum = activeReviewers.reduce(
      (sum, u) => sum + (u.avg_score || 0),
      0
    );
    const avgClubRating =
      activeReviewers.length > 0
        ? (avgSum / activeReviewers.length).toFixed(1)
        : '0.0';

    return {
      totalReviews,
      totalUsers: users.length,
      totalAlbums,
      totalXp,
      avgClubRating,
    };
  }, [users]);

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Filter by type
    if (filterType === 'with_reviews') {
      result = result.filter((u) => u.review_count > 0);
    } else if (filterType === 'with_albums') {
      result = result.filter((u) => u.albums_added_count > 0);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.favorite_artist?.toLowerCase().includes(q) ||
          u.favorite_album?.toLowerCase().includes(q) ||
          u.bio?.toLowerCase().includes(q) ||
          (Array.isArray(u.favorite_genres) &&
            u.favorite_genres.some((g) => g.toLowerCase().includes(q)))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'xp_desc') {
        return (
          (b.total_xp || 0) - (a.total_xp || 0) ||
          b.review_count - a.review_count ||
          b.avg_score - a.avg_score
        );
      }
      if (sortBy === 'reviews_desc') {
        return (
          b.review_count - a.review_count ||
          (b.total_xp || 0) - (a.total_xp || 0) ||
          b.avg_score - a.avg_score
        );
      }
      if (sortBy === 'tracks_desc') {
        return (
          (b.total_tracks_rated || 0) - (a.total_tracks_rated || 0) ||
          (b.total_xp || 0) - (a.total_xp || 0)
        );
      }
      if (sortBy === 'rating_desc') {
        return (
          b.avg_score - a.avg_score || (b.total_xp || 0) - (a.total_xp || 0)
        );
      }
      if (sortBy === 'rating_asc') {
        if (a.review_count === 0 && b.review_count > 0) return 1;
        if (b.review_count === 0 && a.review_count > 0) return -1;
        return (
          a.avg_score - b.avg_score || (b.total_xp || 0) - (a.total_xp || 0)
        );
      }
      if (sortBy === 'albums_desc') {
        return (
          b.albums_added_count - a.albums_added_count ||
          (b.total_xp || 0) - (a.total_xp || 0)
        );
      }
      if (sortBy === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });

    return result;
  }, [users, searchQuery, sortBy, filterType]);

  // Top 3 for Podium (ordered by XP and Reviews)
  const podiumUsers = useMemo(() => {
    const sortedForPodium = [...users]
      .filter((u) => u.review_count > 0 || (u.total_xp || 0) > 0)
      .sort(
        (a, b) =>
          (b.total_xp || 0) - (a.total_xp || 0) ||
          b.review_count - a.review_count ||
          b.avg_score - a.avg_score
      );
    return [
      sortedForPodium[1] || null, // 2nd (Silver)
      sortedForPodium[0] || null, // 1st (Gold)
      sortedForPodium[2] || null, // 3rd (Bronze)
    ];
  }, [users]);

  const isCurrentUser = (itemUser) => {
    if (!user || !itemUser) return false;
    const emailMatch =
      user.email &&
      itemUser.email &&
      user.email.toLowerCase().trim() === itemUser.email.toLowerCase().trim();
    const idMatch =
      user.id && itemUser.id && String(user.id) === String(itemUser.id);
    const nameMatch =
      user.name &&
      itemUser.name &&
      user.name.toLowerCase().trim() === itemUser.name.toLowerCase().trim();
    return Boolean(emailMatch || idMatch || nameMatch);
  };

  return (
    <div className="min-h-screen bg-[#0d0e15] text-white py-5 sm:py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2.5 pb-2 border-b border-white/5">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 sm:px-3.5 py-1.5 rounded-xl border border-white/10 transition-all font-semibold active:scale-95"
          >
            <span>←</span> <span className="hidden xs:inline">Volver al</span>{' '}
            Inicio
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/albumes"
              className="text-xs sm:text-sm text-slate-400 hover:text-cyan-300 transition-colors font-medium flex items-center gap-1 bg-white/5 sm:bg-transparent px-2.5 py-1 rounded-lg sm:p-0"
            >
              <span>💿</span> Álbumes
            </Link>
            <Link
              to="/reviews"
              className="text-xs sm:text-sm text-slate-400 hover:text-amber-300 transition-colors font-medium flex items-center gap-1 bg-white/5 sm:bg-transparent px-2.5 py-1 rounded-lg sm:p-0"
            >
              <span>📝</span> Reviews
            </Link>
            {user && (
              <Link
                to="/profile"
                className="text-xs sm:text-sm text-slate-400 hover:text-white transition-colors font-medium flex items-center gap-1 bg-white/5 sm:bg-transparent px-2.5 py-1 rounded-lg sm:p-0"
              >
                <span>👤</span> Perfil
              </Link>
            )}
          </div>
        </div>

        {/* Header Title */}
        <div className="text-center space-y-2.5 sm:space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-yellow-500/20 to-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
            <span>🏆</span>
            <span>Clasificación y Gamificación del Club</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-amber-200">
            Leaderboard de Miembros
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm md:text-base max-w-2xl mx-auto px-2 leading-relaxed">
            Gana puntos XP por cada review, comentario, track calificado y álbum
            aportado. Desbloquea insignias evolutivas y compite por los récords
            del club.
          </p>
          <div className="pt-1">
            <button
              onClick={() => setShowBadgesGuide(true)}
              className="inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-500/20 to-amber-500/15 border border-amber-400/40 hover:border-amber-400 text-amber-300 hover:text-white font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-amber-500/10 active:scale-95"
            >
              <span>📖</span>
              <span>¿Cómo funciona el Score XP y las Insignias? Ver Guía</span>
            </button>
          </div>
        </div>

        {/* Global Stats Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-[#151722]/80 border border-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all" />
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="text-xl sm:text-3xl p-2 sm:p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                📝
              </span>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">
                  Total Reviews
                </p>
                <p className="text-lg sm:text-2xl font-black text-white">
                  {globalMetrics.totalReviews}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#151722]/80 border border-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl backdrop-blur-sm relative overflow-hidden group hover:border-cyan-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-all" />
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="text-xl sm:text-3xl p-2 sm:p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                👥
              </span>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">
                  Miembros
                </p>
                <p className="text-lg sm:text-2xl font-black text-white">
                  {globalMetrics.totalUsers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#151722]/80 border border-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl backdrop-blur-sm relative overflow-hidden group hover:border-rose-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-all" />
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="text-xl sm:text-3xl p-2 sm:p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                💿
              </span>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">
                  Álbumes Añadidos
                </p>
                <p className="text-lg sm:text-2xl font-black text-white">
                  {globalMetrics.totalAlbums}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#151722]/80 border border-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all" />
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="text-xl sm:text-3xl p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                ⭐
              </span>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">
                  Promedio del Club
                </p>
                <p className="text-lg sm:text-2xl font-black text-emerald-400">
                  {globalMetrics.avgClubRating} / 10
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Podium Top 3 */}
        {podiumUsers[1] && (
          <div className="bg-gradient-to-b from-[#181a27]/90 to-[#12131e]/90 border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
              <h2 className="text-base sm:text-xl font-bold flex items-center gap-2 text-white">
                <span>👑</span> Podio de Honor
              </h2>
              <span className="text-[11px] sm:text-xs text-amber-300 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 font-bold">
                Clasificación por Puntuación XP
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6 items-end">
              {/* 2nd Place (Silver) */}
              {podiumUsers[0] && (
                <div
                  onClick={() => setSelectedUserDetail(podiumUsers[0])}
                  className="bg-[#141622]/90 border border-slate-700/50 hover:border-slate-400/80 rounded-2xl p-4 sm:p-5 text-center flex flex-col items-center transition-all duration-300 hover:-translate-y-1 cursor-pointer shadow-lg relative group order-2 md:order-1"
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-900 font-black text-xs px-3 py-0.5 rounded-full shadow-md">
                    🥈 #2 Puesto
                  </div>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-tr from-slate-400 to-slate-200 mb-2.5 sm:mb-3 mt-1 sm:mt-2 flex items-center justify-center overflow-hidden">
                    <UserAvatar user={podiumUsers[0]} size="podium_silver" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors truncate max-w-full">
                    {podiumUsers[0].name}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 mb-2 truncate max-w-full">
                    {podiumUsers[0].favorite_artist
                      ? `Fan de ${podiumUsers[0].favorite_artist}`
                      : podiumUsers[0].email || 'Miembro'}
                  </p>

                  {/* XP Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-slate-400/20 to-slate-200/20 border border-slate-300/40 text-slate-200 text-xs font-black mb-2.5">
                    <span>✨</span>
                    <span>
                      {(podiumUsers[0].total_xp || 0).toLocaleString()} XP
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full text-xs border border-white/5 mb-2.5">
                    <span className="text-amber-400 font-bold">
                      {podiumUsers[0].review_count} reviews
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300">
                      Prom: {podiumUsers[0].avg_score.toFixed(1)} ⭐
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-1 max-w-full">
                    {podiumUsers[0].badges?.slice(0, 3).map((b) => (
                      <span
                        key={b.id}
                        title={b.tooltip || b.desc || b.label}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${b.color} ${b.borderClass || ''} shadow-sm cursor-help hover:scale-105 transition-transform`}
                      >
                        {b.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 1st Place (Gold) */}
              {podiumUsers[1] && (
                <div
                  onClick={() => setSelectedUserDetail(podiumUsers[1])}
                  className="bg-gradient-to-b from-[#221f14] via-[#1a1820] to-[#141522] border-2 border-amber-400/60 hover:border-amber-300 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-center flex flex-col items-center transition-all duration-300 hover:-translate-y-2 cursor-pointer shadow-[0_0_30px_rgba(251,191,36,0.15)] relative group order-1 md:order-2 md:-mt-4"
                >
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs px-4 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <span>👑</span>
                    <span>#1 Campeón del Club</span>
                  </div>
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1.5 bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 mb-2.5 sm:mb-3 mt-2 sm:mt-3 shadow-[0_0_20px_rgba(251,191,36,0.4)] flex items-center justify-center overflow-hidden">
                    <UserAvatar user={podiumUsers[1]} size="podium_gold" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-amber-300 group-hover:text-amber-200 transition-colors truncate max-w-full">
                    {podiumUsers[1].name}
                  </h3>
                  <p className="text-xs text-amber-200/70 mb-2 font-medium truncate max-w-full">
                    {podiumUsers[1].favorite_artist
                      ? `Fan de ${podiumUsers[1].favorite_artist}`
                      : podiumUsers[1].email || 'Líder del Club'}
                  </p>

                  {/* XP Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400/20 via-yellow-400/30 to-amber-400/20 border border-amber-400/60 text-amber-300 text-xs font-black mb-2.5 shadow-[0_0_12px_rgba(251,191,36,0.3)]">
                    <span>✨</span>
                    <span>
                      {(podiumUsers[1].total_xp || 0).toLocaleString()} XP
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-amber-400/10 px-3.5 py-1.5 rounded-full text-xs border border-amber-400/30 mb-2.5 shadow-inner">
                    <span className="text-amber-300 font-black">
                      {podiumUsers[1].review_count} reviews
                    </span>
                    <span className="text-amber-400/40">•</span>
                    <span className="text-white font-bold">
                      Prom: {podiumUsers[1].avg_score.toFixed(1)} ⭐
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-1 max-w-full">
                    {podiumUsers[1].badges?.slice(0, 3).map((b) => (
                      <span
                        key={b.id}
                        title={b.tooltip || b.desc || b.label}
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r ${b.color} ${b.borderClass || ''} shadow-md cursor-help hover:scale-105 transition-transform`}
                      >
                        {b.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 3rd Place (Bronze) */}
              {podiumUsers[2] && (
                <div
                  onClick={() => setSelectedUserDetail(podiumUsers[2])}
                  className="bg-[#141622]/90 border border-amber-800/40 hover:border-amber-600/70 rounded-2xl p-4 sm:p-5 text-center flex flex-col items-center transition-all duration-300 hover:-translate-y-1 cursor-pointer shadow-lg relative group order-3"
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-700 text-amber-100 font-black text-xs px-3 py-0.5 rounded-full shadow-md">
                    🥉 #3 Puesto
                  </div>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-tr from-amber-700 to-amber-500 mb-2.5 sm:mb-3 mt-1 sm:mt-2 flex items-center justify-center overflow-hidden">
                    <UserAvatar user={podiumUsers[2]} size="podium_bronze" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors truncate max-w-full">
                    {podiumUsers[2].name}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 mb-2 truncate max-w-full">
                    {podiumUsers[2].favorite_artist
                      ? `Fan de ${podiumUsers[2].favorite_artist}`
                      : podiumUsers[2].email || 'Miembro'}
                  </p>

                  {/* XP Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-700/20 to-amber-600/20 border border-amber-600/40 text-amber-200 text-xs font-black mb-2.5">
                    <span>✨</span>
                    <span>
                      {(podiumUsers[2].total_xp || 0).toLocaleString()} XP
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full text-xs border border-white/5 mb-2.5">
                    <span className="text-amber-400 font-bold">
                      {podiumUsers[2].review_count} reviews
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300">
                      Prom: {podiumUsers[2].avg_score.toFixed(1)} ⭐
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-1 max-w-full">
                    {podiumUsers[2].badges?.slice(0, 3).map((b) => (
                      <span
                        key={b.id}
                        title={b.tooltip || b.desc || b.label}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${b.color} ${b.borderClass || ''} shadow-sm cursor-help hover:scale-105 transition-transform`}
                      >
                        {b.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filter and Search Controls */}
        <div className="bg-[#151722]/90 border border-white/5 rounded-2xl p-3 sm:p-5 flex flex-col md:flex-row gap-3 sm:gap-4 justify-between items-stretch md:items-center">
          {/* Search Bar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre, artista favorito, género..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/70 transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === 'all'
                  ? 'bg-amber-400 text-black shadow-md font-bold'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
              }`}
            >
              Todos ({users.length})
            </button>
            <button
              onClick={() => setFilterType('with_reviews')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === 'with_reviews'
                  ? 'bg-amber-400 text-black shadow-md font-bold'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
              }`}
            >
              Con Reviews ({users.filter((u) => u.review_count > 0).length})
            </button>
            <button
              onClick={() => setFilterType('with_albums')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === 'with_albums'
                  ? 'bg-amber-400 text-black shadow-md font-bold'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
              }`}
            >
              Con Álbumes (
              {users.filter((u) => u.albums_added_count > 0).length})
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] sm:text-xs text-slate-400 whitespace-nowrap font-medium">
              Ordenar:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-black/60 border border-amber-400/30 rounded-xl text-xs text-white px-2.5 py-1.5 sm:px-3 sm:py-2 focus:outline-none focus:border-amber-400 font-semibold cursor-pointer w-full sm:w-auto"
            >
              <option value="xp_desc">👑 Mayor Puntuación (XP)</option>
              <option value="reviews_desc">📝 Más Reviews</option>
              <option value="tracks_desc">🎚️ Más Pistas Calificadas</option>
              <option value="albums_desc">💿 Más Álbumes Añadidos</option>
              <option value="rating_desc">⭐ Mayor Promedio Otorgado</option>
              <option value="rating_asc">
                🎯 Más Exigente (Menor Promedio)
              </option>
              <option value="name_asc">🔤 Nombre (A-Z)</option>
            </select>
          </div>
        </div>

        {/* User Ranking Table / Cards */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="inline-block w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">
              Cargando clasificación de usuarios y puntuación XP...
            </p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center text-red-400 text-sm">
            {error}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 bg-white/5 border border-white/5 rounded-3xl text-center space-y-2">
            <span className="text-4xl">🔍</span>
            <h3 className="text-lg font-bold text-white">
              No se encontraron usuarios
            </h3>
            <p className="text-slate-400 text-xs">
              Intenta con otro término de búsqueda o limpia los filtros.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((itemUser, index) => {
              const isSelf = isCurrentUser(itemUser);
              const userRank = index + 1;

              return (
                <div
                  key={itemUser.id || itemUser.email || index}
                  onClick={() => setSelectedUserDetail(itemUser)}
                  className={`bg-[#141624]/90 border transition-all duration-300 rounded-2xl p-3.5 sm:p-4 md:p-5 hover:bg-[#191c2e] cursor-pointer relative overflow-hidden group shadow-md hover:shadow-xl ${
                    isSelf
                      ? 'border-amber-400/80 ring-2 ring-amber-400/30 shadow-[0_0_20px_rgba(251,191,36,0.15)]'
                      : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4">
                    {/* Left: Rank + Avatar + Name + Artist/Email + Badges */}
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      {/* Rank Badge */}
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs sm:text-sm text-slate-300 group-hover:border-amber-400/40 group-hover:text-amber-300 transition-colors mt-0.5 sm:mt-0">
                        {userRank === 1
                          ? '🥇'
                          : userRank === 2
                            ? '🥈'
                            : userRank === 3
                              ? '🥉'
                              : `#${userRank}`}
                      </div>

                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <UserAvatar
                          user={itemUser}
                          size="md"
                          className="border-2 border-white/10 group-hover:border-amber-400/60 transition-colors shadow-md"
                        />
                        {isSelf && (
                          <span
                            className="absolute -bottom-1 -right-1 bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full border border-black shadow"
                            title="Tú"
                          >
                            TÚ
                          </span>
                        )}
                      </div>

                      {/* User Info & Badges */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors truncate max-w-full">
                            {itemUser.name}
                          </h3>
                          {itemUser.role === 'admin' && (
                            <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 font-semibold px-2 py-0.2 rounded-full">
                              Admin
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                          {itemUser.favorite_artist ? (
                            <span>
                              Artista:{' '}
                              <strong className="text-slate-300 font-medium">
                                {itemUser.favorite_artist}
                              </strong>
                            </span>
                          ) : (
                            itemUser.email || 'Miembro del Club'
                          )}
                        </p>

                        {/* Badges Flow Tray */}
                        {itemUser.badges && itemUser.badges.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {itemUser.badges.map((b) => (
                              <span
                                key={b.id}
                                title={b.tooltip || b.desc || b.label}
                                className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r ${b.color} ${b.borderClass || ''} shadow-sm inline-flex items-center gap-1 cursor-help hover:scale-105 transition-transform`}
                              >
                                {b.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: XP Score Box + Numerical Metrics + View Action */}
                    <div className="flex items-center justify-between lg:justify-end gap-2.5 sm:gap-4 pt-2.5 lg:pt-0 border-t lg:border-t-0 border-white/5 flex-wrap sm:flex-nowrap">
                      {/* XP Score Box */}
                      <div className="bg-gradient-to-r from-amber-400/10 via-yellow-400/15 to-amber-500/10 px-3 sm:px-3.5 py-1.5 rounded-xl border border-amber-400/35 text-center sm:text-right flex-shrink-0">
                        <p className="text-[9px] text-amber-300/80 font-bold uppercase tracking-wider leading-tight">
                          Score XP
                        </p>
                        <p className="text-sm sm:text-base font-black text-amber-300 leading-tight">
                          ✨ {(itemUser.total_xp || 0).toLocaleString()}
                        </p>
                      </div>

                      {/* Quick Metrics Strip */}
                      <div className="flex items-center gap-2 sm:gap-3 bg-black/30 px-3 py-1.5 rounded-xl border border-white/5 text-center flex-1 sm:flex-initial justify-around sm:justify-start">
                        <div>
                          <p className="text-[9px] text-slate-400 font-medium">
                            Reviews
                          </p>
                          <p className="text-xs sm:text-sm font-black text-white">
                            {itemUser.review_count}
                          </p>
                        </div>
                        <span className="text-white/10">•</span>
                        <div>
                          <p className="text-[9px] text-slate-400 font-medium">
                            Tracks
                          </p>
                          <p className="text-xs sm:text-sm font-black text-cyan-400">
                            {itemUser.total_tracks_rated || 0}
                          </p>
                        </div>
                        <span className="text-white/10">•</span>
                        <div>
                          <p className="text-[9px] text-slate-400 font-medium">
                            Álbumes
                          </p>
                          <p className="text-xs sm:text-sm font-black text-purple-400">
                            {itemUser.albums_added_count}
                          </p>
                        </div>
                        <span className="text-white/10">•</span>
                        <div>
                          <p className="text-[9px] text-slate-400 font-medium">
                            Promedio
                          </p>
                          <p className="text-xs sm:text-sm font-black text-emerald-400">
                            {itemUser.avg_score > 0
                              ? `${itemUser.avg_score.toFixed(1)} ⭐`
                              : '—'}
                          </p>
                        </div>
                      </div>

                      {/* Detail Chevron / Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUserDetail(itemUser);
                        }}
                        className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-amber-400 hover:text-black text-slate-300 text-xs font-semibold border border-white/10 transition-all flex-shrink-0 active:scale-95"
                        title="Ver detalle del miembro"
                      >
                        ➜
                      </button>
                    </div>
                  </div>

                  {/* Highlights Bar (Optional) */}
                  {(itemUser.highest_review || itemUser.lowest_review) && (
                    <div className="mt-2.5 pt-2 border-t border-white/5 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      {itemUser.highest_review && (
                        <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-0.5 rounded-lg border border-white/5 min-w-0">
                          <span>🌟</span>
                          <span className="text-slate-400 whitespace-nowrap">
                            Favorito:
                          </span>
                          <span className="text-white font-medium truncate max-w-[150px] sm:max-w-xs">
                            {itemUser.highest_review.album}
                          </span>
                          <span className="text-amber-400 font-bold whitespace-nowrap">
                            (
                            {typeof itemUser.highest_review.score === 'number'
                              ? itemUser.highest_review.score.toFixed(1)
                              : itemUser.highest_review.score}{' '}
                            ⭐)
                          </span>
                        </div>
                      )}
                      {itemUser.lowest_review && (
                        <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-0.5 rounded-lg border border-white/5 min-w-0">
                          <span>📉</span>
                          <span className="text-slate-400 whitespace-nowrap">
                            Más severo:
                          </span>
                          <span className="text-white font-medium truncate max-w-[150px] sm:max-w-xs">
                            {itemUser.lowest_review.album}
                          </span>
                          <span className="text-red-400 font-bold whitespace-nowrap">
                            (
                            {typeof itemUser.lowest_review.score === 'number'
                              ? itemUser.lowest_review.score.toFixed(1)
                              : itemUser.lowest_review.score}{' '}
                            ⭐)
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUserDetail && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setSelectedUserDetail(null)}
        >
          <div
            className="bg-[#151724] border border-white/10 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedUserDetail(null)}
              className="absolute top-4 sm:top-5 right-4 sm:right-5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors text-base sm:text-lg"
              title="Cerrar"
            >
              ✕
            </button>

            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left pr-6 sm:pr-8">
              <UserAvatar
                user={selectedUserDetail}
                size="modal"
                className="border-4 border-amber-400/40 shadow-xl"
              />
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-white truncate max-w-full">
                    {selectedUserDetail.name}
                  </h2>
                  {selectedUserDetail.role === 'admin' && (
                    <span className="text-[10px] sm:text-xs bg-red-500/20 text-red-400 border border-red-500/30 font-bold px-2.5 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-mono break-all">
                  {selectedUserDetail.email}
                </p>
                {selectedUserDetail.bio && (
                  <p className="text-xs sm:text-sm text-slate-300 italic pt-1 leading-relaxed">
                    "{selectedUserDetail.bio}"
                  </p>
                )}

                {/* Score Pill */}
                <div className="pt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400/20 to-yellow-500/20 border border-amber-400/40 text-amber-300 text-xs font-black">
                    <span>✨</span>
                    <span>
                      {(selectedUserDetail.total_xp || 0).toLocaleString()} XP
                      de Club
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* XP Breakdown Card */}
            <div className="bg-black/30 border border-amber-500/20 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <span>📊</span> Desglose de Puntuación XP
                </span>
                <span className="text-slate-400 text-[11px] sm:text-xs">
                  Total:{' '}
                  <strong className="text-white">
                    {(selectedUserDetail.total_xp || 0).toLocaleString()} XP
                  </strong>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white/5 p-2 sm:p-2.5 rounded-xl border border-white/5">
                  <p className="text-[9px] sm:text-[10px] text-slate-400">
                    Actividad Base
                  </p>
                  <p className="font-bold text-slate-200 text-xs sm:text-sm mt-0.5">
                    +{selectedUserDetail.activity_xp || 0} XP
                  </p>
                </div>
                <div className="bg-white/5 p-2 sm:p-2.5 rounded-xl border border-white/5">
                  <p className="text-[9px] sm:text-[10px] text-slate-400">
                    Insignias / Tiers
                  </p>
                  <p className="font-bold text-amber-300 text-xs sm:text-sm mt-0.5">
                    +{selectedUserDetail.badges_xp || 0} XP
                  </p>
                </div>
                <div className="bg-white/5 p-2 sm:p-2.5 rounded-xl border border-white/5">
                  <p className="text-[9px] sm:text-[10px] text-slate-400">
                    Récords #1
                  </p>
                  <p className="font-bold text-cyan-300 text-xs sm:text-sm mt-0.5">
                    +{selectedUserDetail.record_xp || 0} XP
                  </p>
                </div>
              </div>
            </div>

            {/* Badges & Progression Tiers Section */}
            <div className="space-y-3 bg-black/20 p-3.5 sm:p-4 rounded-2xl border border-white/5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span>🎖️</span> Insignias Desbloqueadas y Progreso
              </h4>

              {/* Active Badges Pills */}
              {selectedUserDetail.badges &&
              selectedUserDetail.badges.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pb-2">
                  {selectedUserDetail.badges.map((b) => (
                    <span
                      key={b.id}
                      title={b.tooltip || b.desc || b.label}
                      className={`text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full bg-gradient-to-r ${b.color} ${b.borderClass || ''} shadow-md cursor-help hover:scale-105 transition-transform`}
                    >
                      {b.label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Aún no hay insignias desbloqueadas. ¡Sigue reseñando para
                  ganar los primeros Tiers!
                </p>
              )}

              {/* Progress to Next Tiers */}
              {selectedUserDetail.badges_progress && (
                <div className="space-y-2.5 pt-2 border-t border-white/5">
                  <p className="text-[11px] font-semibold text-slate-400">
                    Progreso hacia los siguientes Tiers:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                    {selectedUserDetail.badges_progress.map((bp) => {
                      const hasNext = Boolean(bp.nextTier);
                      return (
                        <div
                          key={bp.badgeId}
                          className="bg-black/30 border border-white/5 rounded-xl p-2.5 sm:p-3 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white flex items-center gap-1 truncate pr-1">
                              <span>{bp.icon}</span>
                              <span className="truncate">
                                {bp.categoryName}
                              </span>
                            </span>
                            <span className="text-[10px] text-amber-300 font-semibold whitespace-nowrap">
                              {bp.unlockedTier
                                ? bp.unlockedTier.name
                                : 'Nivel Inicial'}
                            </span>
                          </div>

                          {hasNext ? (
                            <div>
                              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                <span className="truncate pr-1">
                                  Siguiente:{' '}
                                  <strong className="text-slate-300">
                                    {bp.nextTier.name}
                                  </strong>
                                </span>
                                <span className="whitespace-nowrap font-semibold text-white">
                                  {bp.currentValue} / {bp.nextTier.req} (
                                  {bp.progressPercent}%)
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full transition-all duration-500"
                                  style={{ width: `${bp.progressPercent}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                              <span>👑</span> ¡Nivel Máximo Alcanzado!
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="bg-black/30 border border-white/5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl text-center">
                <p className="text-[10px] sm:text-[11px] text-slate-400">
                  Total Reviews
                </p>
                <p className="text-lg sm:text-xl font-black text-amber-400 mt-0.5">
                  {selectedUserDetail.review_count}
                </p>
              </div>
              <div className="bg-black/30 border border-white/5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl text-center">
                <p className="text-[10px] sm:text-[11px] text-slate-400">
                  Promedio
                </p>
                <p className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5">
                  {selectedUserDetail.avg_score > 0
                    ? `${selectedUserDetail.avg_score.toFixed(1)} ⭐`
                    : '—'}
                </p>
              </div>
              <div className="bg-black/30 border border-white/5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl text-center">
                <p className="text-[10px] sm:text-[11px] text-slate-400">
                  Álbumes
                </p>
                <p className="text-lg sm:text-xl font-black text-purple-400 mt-0.5">
                  {selectedUserDetail.albums_added_count}
                </p>
              </div>
              <div className="bg-black/30 border border-white/5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl text-center">
                <p className="text-[10px] sm:text-[11px] text-slate-400">
                  Pistas
                </p>
                <p className="text-lg sm:text-xl font-black text-cyan-400 mt-0.5">
                  {selectedUserDetail.total_tracks_rated || 0}
                </p>
              </div>
            </div>

            {/* Criteria Breakdown */}
            {selectedUserDetail.review_count > 0 && (
              <div className="space-y-3 bg-black/20 p-3.5 sm:p-4 rounded-2xl border border-white/5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Promedios Otorgados por Criterio (Escala 1 a 5)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CRITERIA_INFO.map((crit) => {
                    const val =
                      selectedUserDetail.criteria_averages?.[crit.key];
                    return (
                      <div
                        key={crit.key}
                        className="bg-white/5 p-2 sm:p-2.5 rounded-xl border border-white/5 flex items-center justify-between"
                      >
                        <span className="text-[11px] sm:text-xs text-slate-300 flex items-center gap-1 truncate pr-1">
                          <span>{crit.emoji}</span>
                          <span className="truncate">{crit.label}</span>
                        </span>
                        <span className="text-[11px] sm:text-xs font-black text-amber-300 whitespace-nowrap">
                          {val ? `${val} / 5` : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Musical Identity */}
            {(selectedUserDetail.favorite_artist ||
              selectedUserDetail.favorite_album ||
              (selectedUserDetail.favorite_genres &&
                selectedUserDetail.favorite_genres.length > 0)) && (
              <div className="space-y-2.5 bg-black/20 p-3.5 sm:p-4 rounded-2xl border border-white/5 text-xs">
                <h4 className="font-bold uppercase tracking-wider text-slate-400">
                  🎧 Identidad Musical
                </h4>
                {selectedUserDetail.favorite_artist && (
                  <p className="text-slate-300">
                    <span className="text-slate-400">Artista favorito:</span>{' '}
                    <strong className="text-white">
                      {selectedUserDetail.favorite_artist}
                    </strong>
                  </p>
                )}
                {selectedUserDetail.favorite_album && (
                  <p className="text-slate-300">
                    <span className="text-slate-400">Álbum favorito:</span>{' '}
                    <strong className="text-white">
                      {selectedUserDetail.favorite_album}
                    </strong>
                  </p>
                )}
                {selectedUserDetail.favorite_genres &&
                  selectedUserDetail.favorite_genres.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-slate-400">Géneros:</span>
                      {selectedUserDetail.favorite_genres.map((g, i) => (
                        <span
                          key={i}
                          className="bg-amber-400/10 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/20 text-[10px]"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            )}

            {/* Albums Added by User */}
            {selectedUserDetail.albums_added &&
              selectedUserDetail.albums_added.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    💿 Álbumes Añadidos (
                    {selectedUserDetail.albums_added.length})
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {selectedUserDetail.albums_added.map((alb, i) => (
                      <div
                        key={i}
                        className="bg-black/30 border border-yellow-400/50 rounded-xl p-2 text-center group"
                      >
                        <img
                          src={
                            alb.image_url ||
                            'https://via.placeholder.com/100/1a1a2e/ffffff?text=🎵'
                          }
                          alt={alb.album_name}
                          className="w-full aspect-square rounded-lg object-cover mb-1.5"
                        />
                        <p className="text-[11px] font-bold text-white truncate">
                          {alb.album_name}
                        </p>
                        <p className="text-[9px] text-slate-400 truncate">
                          {alb.artist_name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Badges & XP Guide Modal */}
      {showBadgesGuide && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setShowBadgesGuide(false)}
        >
          <div
            className="bg-[#151724] border border-amber-500/30 rounded-2xl sm:rounded-3xl max-w-4xl w-full p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowBadgesGuide(false)}
              className="absolute top-4 sm:top-5 right-4 sm:right-5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors text-base sm:text-lg"
              title="Cerrar"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="space-y-2 text-center sm:text-left pr-6 sm:pr-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                <span>📖</span>
                <span>Sistema de Gamificación, Tiers y Puntos XP</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                Guía Oficial de Insignias y Puntos
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                El Leaderboard de Musiclub premia la constancia diaria mediante
                puntos XP de actividad y reconoce los grandes hitos a través de
                insignias evolutivas y títulos honoríficos.
              </p>
            </div>

            {/* XP Formula Card */}
            <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-400/30 rounded-2xl p-3.5 sm:p-5 space-y-3">
              <h3 className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-2">
                <span>⚡</span> ¿Cómo ganar Puntos XP de Club?
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="bg-black/40 border border-white/5 p-2.5 sm:p-3 rounded-xl text-center">
                  <span className="text-base sm:text-lg">🎧</span>
                  <p className="text-[11px] sm:text-xs font-bold text-white mt-1">
                    Álbum Reseñado
                  </p>
                  <p className="text-xs sm:text-sm font-black text-amber-400">
                    +{XP_CONFIG.REVIEW_BASE} XP
                  </p>
                </div>
                <div className="bg-black/40 border border-white/5 p-2.5 sm:p-3 rounded-xl text-center">
                  <span className="text-base sm:text-lg">✍️</span>
                  <p className="text-[11px] sm:text-xs font-bold text-white mt-1">
                    Con Comentario
                  </p>
                  <p className="text-xs sm:text-sm font-black text-amber-400">
                    +{XP_CONFIG.REVIEW_COMMENT_BONUS} XP extra
                  </p>
                </div>
                <div className="bg-black/40 border border-white/5 p-2.5 sm:p-3 rounded-xl text-center">
                  <span className="text-base sm:text-lg">🎚️</span>
                  <p className="text-[11px] sm:text-xs font-bold text-white mt-1">
                    Pista Calificada
                  </p>
                  <p className="text-xs sm:text-sm font-black text-amber-400">
                    +{XP_CONFIG.TRACK_RATED} XP / track
                  </p>
                </div>
                <div className="bg-black/40 border border-white/5 p-2.5 sm:p-3 rounded-xl text-center">
                  <span className="text-base sm:text-lg">💿</span>
                  <p className="text-[11px] sm:text-xs font-bold text-white mt-1">
                    Álbum Aportado
                  </p>
                  <p className="text-xs sm:text-sm font-black text-amber-400">
                    +{XP_CONFIG.ALBUM_ADDED} XP
                  </p>
                </div>
              </div>
            </div>

            {/* Categories List */}
            <div className="space-y-4 sm:space-y-6 pt-1">
              {BADGES_GUIDE_DATA.map((cat, idx) => (
                <div
                  key={idx}
                  className="bg-black/30 border border-white/5 rounded-2xl p-3.5 sm:p-5 space-y-3.5 sm:space-y-4"
                >
                  <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
                    <span className="text-lg sm:text-xl">{cat.icon}</span>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        {cat.category}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-400">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  {/* Records rendering */}
                  {cat.items && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      {cat.items.map((b, bIdx) => (
                        <div
                          key={bIdx}
                          className="bg-white/5 border border-white/5 hover:border-white/10 rounded-xl p-3 flex flex-col justify-between gap-2 transition-all"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span
                              className={`text-xs font-black px-2.5 py-1 rounded-full bg-gradient-to-r ${b.badgeClass} shadow-sm cursor-help hover:scale-105 transition-transform`}
                            >
                              {b.title}
                            </span>
                            <span className="text-[10px] font-black text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md">
                              {b.xp}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-snug">
                            {b.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Groups with Tiers rendering */}
                  {cat.groups && (
                    <div className="space-y-3.5 sm:space-y-4">
                      {cat.groups.map((grp, gIdx) => (
                        <div
                          key={gIdx}
                          className="bg-black/40 border border-white/5 rounded-xl p-3 sm:p-3.5 space-y-2.5"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-1.5">
                            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                              <span>{grp.icon}</span>
                              <span>{grp.name}</span>
                            </h4>
                            <p className="text-[10px] sm:text-[11px] text-slate-400">
                              {grp.description}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {grp.tiers.map((t, tIdx) => (
                              <div
                                key={tIdx}
                                className="bg-white/5 border border-white/5 rounded-lg p-2 flex flex-col justify-between gap-1"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${t.color} cursor-help hover:scale-105 transition-transform`}
                                  >
                                    {t.name}
                                  </span>
                                  <span className="text-[9px] font-black text-amber-300">
                                    {t.xp}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                                  <span>Tier {t.tierRoman}</span>
                                  <span className="font-semibold text-slate-300">
                                    {t.req}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer Tip */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-500/20 text-center text-xs text-amber-200/80">
              💡{' '}
              <em>
                ¡Cada reseña, comentario y aporte suma directamente a tu Score
                de Club y te acerca a la siguiente insignia!
              </em>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Leaderboard;
