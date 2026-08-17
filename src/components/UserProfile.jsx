// src/components/UserProfile.jsx
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAlbums } from '../hooks/useAlbums';
import { useUserReviews } from '../hooks/useUserReviews';
import { getWeightedReviewScore, getTrackDisplayName } from '../utils/ratingUtils';

const CRITERIA_METRICS = [
  { key: 'rating_produccion', label: 'Producción', icon: '🎛️', max: 5, color: 'from-blue-500 to-cyan-400' },
  { key: 'rating_composicion', label: 'Composición', icon: '🎵', max: 5, color: 'from-green-500 to-emerald-400' },
  { key: 'rating_letras', label: 'Letras', icon: '📝', max: 5, color: 'from-amber-500 to-yellow-400' },
  { key: 'rating_originalidad', label: 'Originalidad', icon: '💡', max: 5, color: 'from-purple-500 to-indigo-400' },
  { key: 'rating_cohesion', label: 'Cohesión', icon: '🔗', max: 5, color: 'from-rose-500 to-red-400' },
  { key: 'rating_replay', label: 'Replay Value', icon: '🔄', max: 5, color: 'from-teal-500 to-cyan-400' },
  { key: 'rating_general', label: 'General', icon: '⭐', max: 10, color: 'from-[#f5576c] to-[#f093fb]' },
];

export function UserProfile({ isPage = false }) {
  const { user, isAdmin, logout } = useAuth();
  const { albums } = useAlbums();
  const { userReviews, loading: reviewsLoading } = useUserReviews(user);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' | 'stats' | 'pending'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date_desc'); // 'date_desc' | 'date_asc' | 'score_desc' | 'score_asc'
  const [expandedReviewId, setExpandedReviewId] = useState(null);

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

  // List of reviewed albums combined with review data
  const enrichedReviews = useMemo(() => {
    return userReviews.map((review) => {
      const album = albumMap.get(review.album_id) || {
        album: review.album_title || 'Álbum',
        artista: review.album_artist || 'Artista',
        imagen: review.album_image || 'https://via.placeholder.com/300/1a1a2e/ffffff?text=🎵',
        status: 'INDIVIDUAL',
      };
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
    <div className="w-full max-w-6xl mx-auto space-y-5 sm:space-y-8 pb-16 animate-fadeIn">
      {/* HEADER DE NAVEGACIÓN SUPERIOR */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 sm:pb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-white/10 transition-all active:scale-95"
        >
          <span>←</span> <span className="hidden xs:inline">Volver al</span> Inicio
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-cyan-300 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-cyan-500/30 transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] active:scale-95"
          >
            <span>⚙️</span> <span className="hidden xs:inline">Configuración</span><span className="xs:hidden">Ajustes</span>
          </Link>
          <button
            onClick={logout}
            className="text-xs text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-rose-500/20 transition-all active:scale-95"
            title="Cerrar sesión"
          >
            Salir
          </button>
        </div>
      </div>

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
                    e.target.src = 'https://via.placeholder.com/150/1a1a2e/ffffff?text=👤';
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
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight truncate max-w-full">
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

            {/* Tags / Artista / Álbum / Géneros */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2 pt-1">
              {user.favorite_artist && (
                <span className="text-[11px] sm:text-xs bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
                  <span>👑</span> Artista: <strong className="truncate max-w-[150px]">{user.favorite_artist}</strong>
                </span>
              )}

              {user.favorite_album && (
                <span className="text-[11px] sm:text-xs bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
                  <span>💿</span> Álbum: <strong className="truncate max-w-[150px]">{user.favorite_album}</strong>
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

        {/* MÉTRICAS RÁPIDAS EN CABECERA (2x2 en móvil, 4x1 en escritorio) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 pt-4 sm:mt-6 sm:pt-6 border-t border-white/10">
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
              Promedio Otorgado
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

          <div className="bg-black/40 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-white/5 text-center flex flex-col justify-center">
            <span className="text-white/40 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider block mb-0.5 sm:mb-1">
              Cobertura Club
            </span>
            <span className="text-xl sm:text-2xl md:text-3xl font-black text-purple-400">
              {stats.completionPercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN TOUCH-FRIENDLY */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar scroll-smooth snap-x -mx-1 px-1 sm:mx-0 sm:px-0">
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
        <div className="space-y-4 sm:space-y-6">
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

            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
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
            </div>
          </div>

          {/* Listado de Reviews */}
          {reviewsLoading ? (
            <div className="py-16 text-center text-white/40 text-xs sm:text-sm">
              <span className="w-2.5 h-2.5 bg-[#f5576c] rounded-full animate-ping inline-block mr-2"></span>
              Cargando tus reviews...
            </div>
          ) : filteredReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {filteredReviews.map((item, idx) => {
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
                            e.target.src = 'https://via.placeholder.com/150/1a1a2e/ffffff?text=🎵';
                          }}
                        />
                        {/* Palomita */}
                        <div className="absolute bottom-1 right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] sm:text-[10px] font-bold shadow-md">
                          ✓
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1.5">
                          <h3 className="text-white font-bold text-sm sm:text-base truncate leading-snug" title={item.album.album}>
                            {item.album.album}
                          </h3>
                          <span className="text-emerald-400 font-black text-xs sm:text-sm px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex-shrink-0">
                            ★ {item.weightedScore.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-white/60 text-xs truncate mt-0.5" title={item.album.artista}>
                          {item.album.artista}
                        </p>
                        <p className="text-white/30 text-[10px] font-mono mt-1.5 sm:mt-2">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Fecha no registrada'}
                        </p>
                      </div>
                    </div>

                    {/* Comentario si existe */}
                    {item.comment && (
                      <p className="text-white/80 text-xs italic bg-black/40 p-2.5 sm:p-3 rounded-xl border border-white/5 leading-relaxed break-words">
                        "{item.comment}"
                      </p>
                    )}

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
                              const trackName = getTrackDisplayName(
                                trackKey,
                                item.albums?.tracks || albumMap.get(item.album_id)?.tracks
                              );
                              return (
                                <div
                                  key={tIdx}
                                  className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white/5 border border-white/5"
                                >
                                  <span className="text-white/80 truncate pr-2 text-[11px] sm:text-xs" title={trackName}>
                                    {trackName}
                                  </span>
                                  <span
                                    className={`font-black text-[11px] sm:text-xs flex-shrink-0 ${
                                      score >= 8
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
                  </div>
                );
              })}
            </div>
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
        </div>
      )}

      {/* CONTENIDO DE PESTAÑA: ESTADÍSTICAS DETALLADAS */}
      {activeTab === 'stats' && (
        <div className="space-y-4 sm:space-y-6">
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

            {/* Álbumes Destacados del Usuario */}
            <div className="space-y-3 sm:space-y-4">
              {/* Más Alto */}
              <div className="bg-gradient-to-br from-[#101b2b] to-[#0a121e] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-emerald-500/30 shadow-xl">
                <div className="flex items-center gap-1.5 text-emerald-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2.5 sm:mb-3">
                  <span>🏆</span> Tu Álbum Mejor Calificado
                </div>
                {stats.highestRatedAlbum ? (
                  <div className="flex items-center gap-3 sm:gap-4">
                    <img
                      src={albumMap.get(stats.highestRatedAlbum.album_id)?.imagen || 'https://via.placeholder.com/150'}
                      alt="Highest"
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-emerald-500/40 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-white font-bold text-xs sm:text-sm truncate">
                        {albumMap.get(stats.highestRatedAlbum.album_id)?.album || 'Álbum'}
                      </h4>
                      <p className="text-white/60 text-[11px] sm:text-xs truncate">
                        {albumMap.get(stats.highestRatedAlbum.album_id)?.artista || 'Artista'}
                      </p>
                      <span className="inline-block mt-1 text-emerald-400 font-extrabold text-xs sm:text-sm">
                        ★ {(getWeightedReviewScore(stats.highestRatedAlbum) ?? stats.highestRatedAlbum.rating_general)?.toFixed(1)} / 10
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/30 text-xs">Sin reviews suficientes</p>
                )}
              </div>

              {/* Más Exigente / Bajo */}
              <div className="bg-gradient-to-br from-[#24131a] to-[#140a0f] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-rose-500/30 shadow-xl">
                <div className="flex items-center gap-1.5 text-rose-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2.5 sm:mb-3">
                  <span>⚡</span> Calificación Más Exigente
                </div>
                {stats.lowestRatedAlbum ? (
                  <div className="flex items-center gap-3 sm:gap-4">
                    <img
                      src={albumMap.get(stats.lowestRatedAlbum.album_id)?.imagen || 'https://via.placeholder.com/150'}
                      alt="Lowest"
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-rose-500/40 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-white font-bold text-xs sm:text-sm truncate">
                        {albumMap.get(stats.lowestRatedAlbum.album_id)?.album || 'Álbum'}
                      </h4>
                      <p className="text-white/60 text-[11px] sm:text-xs truncate">
                        {albumMap.get(stats.lowestRatedAlbum.album_id)?.artista || 'Artista'}
                      </p>
                      <span className="inline-block mt-1 text-rose-400 font-extrabold text-xs sm:text-sm">
                        ★ {(getWeightedReviewScore(stats.lowestRatedAlbum) ?? stats.lowestRatedAlbum.rating_general)?.toFixed(1)} / 10
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/30 text-xs">Sin reviews suficientes</p>
                )}
              </div>

              {/* Medalla de participación */}
              <div className="bg-black/40 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-white/10 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-white font-bold text-xs sm:text-sm">Nivel de Melómano</h4>
                  <p className="text-white/40 text-[11px] sm:text-xs leading-relaxed">
                    {stats.totalReviews >= 20
                      ? '🏅 Gran Crítico del Club (20+ reviews)'
                      : stats.totalReviews >= 10
                      ? '🥈 Evaluador Frecuente (10+ reviews)'
                      : stats.totalReviews >= 5
                      ? '🥉 Miembro Activo (5+ reviews)'
                      : '🎧 Principiante en Musiclub'}
                  </p>
                </div>
                <div className="text-2xl sm:text-3xl flex-shrink-0">
                  {stats.totalReviews >= 20 ? '👑' : stats.totalReviews >= 10 ? '🔥' : stats.totalReviews >= 5 ? '⭐' : '🎵'}
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
                        e.target.src = 'https://via.placeholder.com/150/1a1a2e/ffffff?text=🎵';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-white font-bold text-xs truncate leading-snug" title={alb.album}>
                      {alb.album}
                    </h4>
                    <p className="text-white/50 text-[10px] truncate mb-2" title={alb.artista}>
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
    </div>
  );
}

export default UserProfile;
