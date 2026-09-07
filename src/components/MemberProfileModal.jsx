import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShareReviewModal, InstagramIcon, SpotifyIcon } from './ShareReviewModal';
import { SendSongRecommendationModal } from './SendSongRecommendationModal';
import { ReviewInteractions } from './ReviewInteractions';
import {
  getWeightedReviewScore,
  getTrackDisplayName,
  getEmotionFromReview,
  getReviewFavoriteTrack,
  isFavoriteTrackMatch,
  getReleaseUrl,
} from '../utils/ratingUtils';
import { CRITERIA_METRICS, MELOMANO_LEVELS } from './UserProfile';
import { PLACEHOLDER_COVER } from './TierListMaker';

export function MemberProfileModal({
  isOpen,
  onClose,
  user: memberUser,
  currentUser,
}) {
  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' | 'badges' | 'stats'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date_desc'); // 'date_desc' | 'date_asc' | 'score_desc' | 'score_asc'
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsPerPage, setReviewsPerPage] = useState(10);
  const [expandedReviewId, setExpandedReviewId] = useState(null);
  const [sharingReviewItem, setSharingReviewItem] = useState(null);
  const [isSendSongModalOpen, setIsSendSongModalOpen] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);

  // Escuchar tecla Escape y bloquear scroll del body
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Resetear estados al cambiar de usuario
  useEffect(() => {
    setActiveTab('reviews');
    setSearchTerm('');
    setReviewsPage(1);
    setExpandedReviewId(null);
    setAvatarImgError(false);
  }, [memberUser?.id, memberUser?.email]);

  const totalXp = memberUser?.total_xp || 0;

  // Cálculo del nivel de melómano
  const currentMelomanoLevel = useMemo(() => {
    const sortedLevels = [...MELOMANO_LEVELS].reverse();
    const current = sortedLevels.find((lvl) => totalXp >= lvl.minXp) || MELOMANO_LEVELS[0];
    const next = MELOMANO_LEVELS.find((lvl) => lvl.level === current.level + 1) || null;

    let progressPercent = 100;
    let xpRemaining = 0;

    if (next) {
      const xpInCurrent = totalXp - current.minXp;
      const xpNeeded = next.minXp - current.minXp;
      progressPercent = Math.min(100, Math.max(0, Math.round((xpInCurrent / xpNeeded) * 100)));
      xpRemaining = Math.max(0, next.minXp - totalXp);
    }

    return {
      ...current,
      next,
      progressPercent,
      xpRemaining,
      currentXp: totalXp,
    };
  }, [totalXp]);

  // Normalizar reviews del usuario
  const normalizedReviews = useMemo(() => {
    if (!memberUser?.reviews || !Array.isArray(memberUser.reviews)) return [];
    return memberUser.reviews.map((rev) => {
      const alb = rev.albums || {};
      const weightedScore = getWeightedReviewScore(rev) ?? rev.rating_general ?? 0;
      return {
        ...rev,
        weightedScore: typeof weightedScore === 'number' ? weightedScore : parseFloat(weightedScore) || 0,
        album: {
          album: alb.album_name || rev.album_name || 'Álbum',
          album_name: alb.album_name || rev.album_name || 'Álbum',
          artista: alb.artist_name || rev.artist_name || 'Artista',
          artist_name: alb.artist_name || rev.artist_name || 'Artista',
          imagen: alb.image_url || rev.image_url || PLACEHOLDER_COVER,
          image_url: alb.image_url || rev.image_url || PLACEHOLDER_COVER,
          release_type: alb.release_type || 'ALBUM',
          tracks: alb.tracks || [],
        },
      };
    });
  }, [memberUser?.reviews]);

  // Filtrado y ordenamiento de reviews
  const filteredReviews = useMemo(() => {
    let list = [...normalizedReviews];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((r) => {
        const albName = (r.album?.album || '').toLowerCase();
        const artName = (r.album?.artista || '').toLowerCase();
        return albName.includes(q) || artName.includes(q);
      });
    }

    list.sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      if (sortBy === 'date_asc') {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }
      if (sortBy === 'score_desc') {
        return b.weightedScore - a.weightedScore;
      }
      if (sortBy === 'score_asc') {
        return a.weightedScore - b.weightedScore;
      }
      return 0;
    });

    return list;
  }, [normalizedReviews, searchTerm, sortBy]);

  // Paginación de reviews
  const totalReviewPages = Math.ceil(filteredReviews.length / reviewsPerPage) || 1;
  const paginatedReviews = useMemo(() => {
    const start = (reviewsPage - 1) * reviewsPerPage;
    return filteredReviews.slice(start, start + reviewsPerPage);
  }, [filteredReviews, reviewsPage, reviewsPerPage]);

  const handleReviewsPageChange = (newPage) => {
    setReviewsPage(newPage);
    const el = document.getElementById('member-reviews-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!isOpen || !memberUser) return null;

  const isCurrentUser =
    currentUser &&
    memberUser.email &&
    currentUser.email?.toLowerCase().trim() === memberUser.email.toLowerCase().trim();

  const isAdmin = memberUser.role === 'admin';
  const initialLetter = ((memberUser.name || memberUser.email || 'U').trim()[0] || 'U').toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-start justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-[#0c0d18] border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl my-3 sm:my-6 overflow-hidden flex flex-col space-y-4 sm:space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra Superior Decorativa del Modal */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-2 border-b border-white/5 bg-[#101222]/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#f5576c] to-[#f093fb] animate-pulse"></span>
            <span className="text-xs sm:text-sm font-bold text-white/80 tracking-wide">
              Perfil de Miembro • <strong className="text-white">Musiclub</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isCurrentUser && currentUser && (
              <button
                type="button"
                onClick={() => setIsSendSongModalOpen(true)}
                className="hidden xs:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#f5576c] via-[#f093fb] to-cyan-400 hover:brightness-110 active:scale-95 text-white text-xs font-black shadow-md shadow-[#f5576c]/20 transition-all cursor-pointer"
              >
                <span>💌</span>
                <span>Recomendar Canción</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-bold border border-white/10 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
              title="Cerrar modal (Esc)"
            >
              <span>✕</span>
              <span className="hidden sm:inline">Cerrar</span>
            </button>
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL */}
        <div className="px-3 sm:px-6 pb-6 space-y-5 sm:space-y-6">
          {/* TARJETA DE PRESENTACIÓN DEL PERFIL (Idéntica a Mi Perfil) */}
          <div className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 bg-gradient-to-br from-[#131326] via-[#0d1020] to-[#080913] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Orbes de brillo ambiental */}
            <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-bl from-[#f5576c]/15 via-[#f093fb]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-60 sm:w-80 h-60 sm:h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6 md:gap-8 text-center md:text-left">
              {/* Avatar con aura decorativa de gradiente */}
              <div className="relative group flex-shrink-0">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-[#f5576c] via-[#f093fb] to-cyan-400 rounded-full blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white/20 bg-black/60 shadow-2xl flex items-center justify-center">
                  {memberUser.avatar_url && !avatarImgError ? (
                    <img
                      src={memberUser.avatar_url}
                      alt={memberUser.name}
                      className="w-full h-full object-cover"
                      onError={() => setAvatarImgError(true)}
                    />
                  ) : (
                    <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-tr from-[#f5576c] to-[#f093fb] bg-clip-text text-transparent select-none">
                      {initialLetter}
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
                        {memberUser.name || 'Melómano de Musiclub'}
                      </h1>
                      <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/10 whitespace-nowrap">
                        {isAdmin ? '🛡️ Admin' : '🎧 Miembro'}
                      </span>
                    </div>
                    {memberUser.email && (
                      <p className="text-white/40 text-xs sm:text-sm font-mono mt-0.5 break-all">
                        {memberUser.email}
                      </p>
                    )}
                  </div>

                  {!isCurrentUser && currentUser && (
                    <button
                      type="button"
                      onClick={() => setIsSendSongModalOpen(true)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#f5576c] via-[#f093fb] to-cyan-400 hover:brightness-110 active:scale-95 text-white text-xs font-black shadow-md shadow-[#f5576c]/25 transition-all self-center sm:self-auto cursor-pointer"
                    >
                      <span>💌</span> Recomendarle Canción
                    </button>
                  )}
                </div>

                {/* Biografía */}
                {memberUser.bio ? (
                  <p className="text-white/80 text-xs sm:text-sm italic w-full bg-black/30 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/5 leading-relaxed break-words text-left">
                    "{memberUser.bio}"
                  </p>
                ) : (
                  <p className="text-white/30 text-xs italic text-center md:text-left">
                    Este miembro aún no ha agregado una biografía.
                  </p>
                )}

                {/* Badges & XP Header Pill */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2 pt-1">
                  <span className="text-xs bg-gradient-to-r from-amber-400/20 via-yellow-400/30 to-amber-400/20 text-amber-300 border border-amber-400/50 px-3 py-1 rounded-full flex items-center gap-1.5 font-black shadow-[0_0_12px_rgba(251,191,36,0.25)]">
                    <span>✨</span> {totalXp.toLocaleString()} XP de Club
                  </span>

                  {memberUser.badges?.slice(0, 3).map((b) => (
                    <span
                      key={b.id}
                      title={b.tooltip || b.desc || b.label}
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r ${b.color} ${b.borderClass || ''} shadow-sm cursor-help hover:scale-105 transition-transform`}
                    >
                      {b.label}
                    </span>
                  ))}
                </div>

                {/* Tags / Artista / Álbum / Géneros / Enlaces */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2 pt-1">
                  {memberUser.favorite_artist && (
                    <span className="text-[11px] sm:text-xs bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
                      <span>👑</span> Artista:{' '}
                      <strong
                        translate="no"
                        className="notranslate artist-name truncate max-w-[150px]"
                      >
                        {memberUser.favorite_artist}
                      </strong>
                    </span>
                  )}

                  {memberUser.favorite_album && (
                    <span className="text-[11px] sm:text-xs bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
                      <span>💿</span> Álbum:{' '}
                      <strong
                        translate="no"
                        className="notranslate music-title truncate max-w-[150px]"
                      >
                        {memberUser.favorite_album}
                      </strong>
                    </span>
                  )}

                  {memberUser.favorite_genres &&
                    Array.isArray(memberUser.favorite_genres) &&
                    memberUser.favorite_genres.length > 0 &&
                    memberUser.favorite_genres.map((genre, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] sm:text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2.5 py-0.5 rounded-full"
                      >
                        #{genre}
                      </span>
                    ))}

                  {memberUser.spotify_url && (
                    <a
                      href={memberUser.spotify_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] sm:text-xs bg-[#1DB954]/20 text-[#1DB954] hover:bg-[#1DB954]/30 border border-[#1DB954]/30 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-semibold transition-all active:scale-95"
                    >
                      <SpotifyIcon className="w-3.5 h-3.5 text-[#1DB954]" />
                      <span>Spotify</span>
                    </a>
                  )}

                  {memberUser.instagram_url && (
                    <a
                      href={memberUser.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] sm:text-xs bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 border border-pink-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-semibold transition-all active:scale-95"
                    >
                      <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
                      <span>Instagram</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* MÉTRICAS RÁPIDAS EN CABECERA (4 columnas responsivas) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 pt-4 sm:mt-6 sm:pt-6 border-t border-white/10">
              <div className="bg-black/40 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-white/5 text-center flex flex-col justify-center">
                <span className="text-white/40 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider block mb-0.5 sm:mb-1">
                  Score XP
                </span>
                <span className="text-xl sm:text-2xl md:text-3xl font-black text-amber-300">
                  ✨ {totalXp.toLocaleString()}
                </span>
              </div>

              <div className="bg-black/40 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-white/5 text-center flex flex-col justify-center">
                <span className="text-white/40 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider block mb-0.5 sm:mb-1">
                  Reviews Totales
                </span>
                <span className="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#f5576c] to-[#f093fb]">
                  {memberUser.review_count || normalizedReviews.length}
                </span>
              </div>

              <div className="bg-black/40 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-white/5 text-center flex flex-col justify-center">
                <span className="text-white/40 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider block mb-0.5 sm:mb-1">
                  Promedio Dado
                </span>
                <span className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-400">
                  ★ {(memberUser.avg_score || 0) > 0 ? (memberUser.avg_score).toFixed(1) : '—'}
                </span>
              </div>

              <div className="bg-black/40 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-white/5 text-center flex flex-col justify-center">
                <span className="text-white/40 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider block mb-0.5 sm:mb-1">
                  Tracks Calificados
                </span>
                <span className="text-xl sm:text-2xl md:text-3xl font-black text-cyan-400">
                  {memberUser.total_tracks_rated || 0}
                </span>
              </div>
            </div>
          </div>

          {/* PESTAÑAS DE NAVEGACIÓN (Touch-friendly idénticas a Mi Perfil) */}
          <div className="flex items-center gap-1.5 sm:gap-2 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar scroll-smooth snap-x -mx-1 px-1 sm:mx-0 sm:px-0">
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 snap-start active:scale-95 cursor-pointer ${
                activeTab === 'reviews'
                  ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-lg shadow-[#f5576c]/20'
                  : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
              }`}
            >
              <span>🎧</span> Reviews ({normalizedReviews.length})
            </button>

            <button
              onClick={() => setActiveTab('badges')}
              className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 snap-start active:scale-95 cursor-pointer ${
                activeTab === 'badges'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-400/20'
                  : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
              }`}
            >
              <span>🎖️</span> Insignias & Niveles ({memberUser.badges?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 snap-start active:scale-95 cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
              }`}
            >
              <span>📊</span> Estadísticas Detalladas
            </button>
          </div>

          {/* CONTENIDO DE PESTAÑA: REVIEWS */}
          {activeTab === 'reviews' && (
            <div id="member-reviews-section" className="space-y-4 sm:space-y-6 scroll-mt-24">
              {/* Barra de Filtro y Búsqueda */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 bg-black/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10">
                <div className="relative w-full sm:w-72 md:w-80">
                  <input
                    type="text"
                    placeholder="Buscar por álbum o artista..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setReviewsPage(1);
                    }}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 sm:py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#f5576c] transition-colors"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto flex-wrap">
                  <span className="text-white/40 text-[11px] sm:text-xs font-semibold whitespace-nowrap">
                    Ordenar por:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs text-white focus:outline-none focus:border-[#f5576c] flex-1 sm:flex-initial cursor-pointer"
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
                    className="bg-black/60 border border-white/10 rounded-xl px-2 py-1.5 sm:px-2.5 sm:py-2 text-xs text-white focus:outline-none focus:border-[#f5576c] cursor-pointer"
                    title="Reviews por página"
                  >
                    <option value={10}>10 / pág</option>
                    <option value={20}>20 / pág</option>
                    <option value={50}>50 / pág</option>
                  </select>
                </div>
              </div>

              {/* Listado de Reviews */}
              {filteredReviews.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {paginatedReviews.map((item, idx) => {
                      const hasTrackRatings =
                        item.track_ratings && Object.keys(item.track_ratings).length > 0;
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
                            const tracksSource = item.albums?.tracks || item.album?.tracks;
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
                              <div
                                key={cIdx}
                                className="bg-black/30 p-1 sm:p-1.5 rounded-lg text-center border border-white/5"
                              >
                                <div className="text-white/40 text-[8px] sm:text-[9px] uppercase truncate">
                                  {crit.label}
                                </div>
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
                                onClick={() =>
                                  setExpandedReviewId(isExpanded ? null : item.id)
                                }
                                className="w-full text-left flex items-center justify-between text-white/50 hover:text-white text-[10px] sm:text-xs font-semibold py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                              >
                                <span>
                                  🎵 {Object.keys(item.track_ratings).length} canciones evaluadas
                                </span>
                                <span className="text-[10px] text-white/40">
                                  {isExpanded ? 'Ocultar ▲' : 'Ver tracks ▼'}
                                </span>
                              </button>

                              {isExpanded && (
                                <div className="mt-2 p-2 sm:p-3 rounded-xl bg-black/50 border border-white/5 max-h-48 overflow-y-auto custom-scrollbar space-y-1.5 animate-fadeIn">
                                  {Object.entries(item.track_ratings).map(
                                    ([trackKey, score], tIdx) => {
                                      const tracksSource =
                                        item.albums?.tracks || item.album?.tracks;
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
                                              className={`notranslate track-name truncate text-[11px] sm:text-xs ${
                                                isFav
                                                  ? 'font-bold text-amber-200'
                                                  : 'text-white/80'
                                              }`}
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
                                    }
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Interacciones: Reacciones y Comentarios */}
                          <ReviewInteractions
                            reviewId={item.id}
                            albumId={item.album_id || item.album?.id}
                            currentUser={currentUser}
                            reviewerEmail={item.reviewer_email || memberUser?.email}
                            reviewerName={item.reviewer_name || memberUser?.name}
                          />

                          {/* Acciones de la Review: Compartir Story y Ver Álbum */}
                          <div className="flex items-center justify-between gap-1.5 sm:gap-2 pt-2.5 border-t border-white/10 mt-auto">
                            <button
                              type="button"
                              onClick={() =>
                                setSharingReviewItem({
                                  review: item,
                                  album: item.album,
                                })
                              }
                              className="flex-1 inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 text-cyan-300 hover:text-white border border-cyan-400/30 hover:border-cyan-400/50 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                              title="Compartir review en formato celular para Instagram, TikTok, WhatsApp y más"
                            >
                              <span>📱</span>
                              <span>Story</span>
                            </button>

                            <Link
                              to={getReleaseUrl(
                                item.album.album || item.album.album_name,
                                item.album.release_type
                              )}
                              onClick={onClose}
                              className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-semibold transition-all shadow-sm active:scale-95"
                              title="Ir a la página del lanzamiento"
                            >
                              <span className="hidden xs:inline">Ver Álbum</span>
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
                          onClick={() =>
                            handleReviewsPageChange(Math.max(1, reviewsPage - 1))
                          }
                          disabled={reviewsPage === 1}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 border border-white/10 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>←</span> Anterior
                        </button>

                        <span className="px-3 py-1.5 text-xs text-white/70 font-semibold bg-black/40 rounded-xl border border-white/5">
                          {reviewsPage} / {totalReviewPages}
                        </span>

                        <button
                          onClick={() =>
                            handleReviewsPageChange(
                              Math.min(totalReviewPages, reviewsPage + 1)
                            )
                          }
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
                <div className="text-center py-12 sm:py-16 bg-black/30 rounded-2xl sm:rounded-3xl border border-white/10 p-6 sm:p-8">
                  <div className="text-3xl sm:text-4xl mb-3">🎧</div>
                  <h3 className="text-white font-bold text-sm sm:text-base">
                    {searchTerm ? 'No se encontraron reseñas con ese filtro' : 'Aún no ha publicado reseñas'}
                  </h3>
                  <p className="text-white/40 text-xs mt-1">
                    {searchTerm
                      ? 'Prueba buscando con otro término o borra la búsqueda.'
                      : 'Las evaluaciones que realice aparecerán listadas aquí con todos sus detalles.'}
                  </p>
                </div>
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
                    <p className="text-[10px] text-amber-200/80 font-bold uppercase tracking-wider">
                      Total Acumulado
                    </p>
                    <p className="text-2xl sm:text-3xl font-black text-amber-300">
                      ✨ {totalXp.toLocaleString()} XP
                    </p>
                  </div>
                </div>

                {/* Desglose de Fuentes de XP */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-3.5 text-center">
                    <span className="text-base">🎧</span>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Actividad Base</p>
                    <p className="text-lg font-black text-white mt-0.5">
                      +{memberUser.activity_xp || 0} XP
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Reviews, comentarios, tracks y álbumes
                    </p>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-2xl p-3.5 text-center">
                    <span className="text-base">⚡</span>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Insignias y Tiers</p>
                    <p className="text-lg font-black text-amber-300 mt-0.5">
                      +{memberUser.badges_xp || 0} XP
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Tiers desbloqueados alcanzados
                    </p>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-2xl p-3.5 text-center">
                    <span className="text-base">👑</span>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Récords #1</p>
                    <p className="text-lg font-black text-cyan-300 mt-0.5">
                      +{memberUser.record_xp || 0} XP
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Coronas dinámicas de liderazgo
                    </p>
                  </div>
                </div>
              </div>

              {/* Insignias Desbloqueadas Actualmente */}
              <div className="bg-gradient-to-br from-[#131428] to-[#0a0d18] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-white/5">
                  <div>
                    <h3 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
                      <span>🎖️</span> Insignias Activas ({memberUser.badges?.length || 0})
                    </h3>
                    <p className="text-white/40 text-xs mt-0.5">
                      Las insignias multinivel evolucionan visualmente al nivel más alto alcanzado.
                    </p>
                  </div>
                </div>

                {memberUser.badges && memberUser.badges.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {memberUser.badges.map((b) => (
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
                      Este miembro aún no tiene insignias desbloqueadas.
                    </p>
                  </div>
                )}
              </div>

              {/* Barras de Progreso hacia los Siguientes Tiers */}
              {memberUser.badges_progress && memberUser.badges_progress.length > 0 && (
                <div className="bg-gradient-to-br from-[#131428] to-[#0a0d18] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl space-y-4">
                  <div>
                    <h3 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
                      <span>📈</span> Progreso y Próximos Desbloqueos
                    </h3>
                    <p className="text-white/40 text-xs mt-0.5">
                      Avance hacia el siguiente rango de cada categoría para sumar más puntos XP.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {memberUser.badges_progress.map((bp) => {
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
                                  Próximo:{' '}
                                  <strong className="text-amber-300">{bp.nextTier.name}</strong> (+
                                  {bp.nextTier.xp} XP)
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
                              <span>👑</span> ¡Nivel Máximo Alcanzado en esta categoría!
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CONTENIDO DE PESTAÑA: ESTADÍSTICAS DETALLADAS */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Desglose por Criterios */}
                <div className="bg-gradient-to-br from-[#131428] to-[#0a0d18] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10 shadow-2xl space-y-3.5">
                  <h3 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                    <span>🎛️</span> Promedio Otorgado por Criterio
                  </h3>
                  <p className="text-white/40 text-xs">
                    Muestra la exigencia y tendencia de sus calificaciones según cada aspecto del álbum.
                  </p>

                  <div className="space-y-3 pt-1">
                    {CRITERIA_METRICS.map((crit) => {
                      const avg = memberUser.criteria_averages?.[crit.key] || 0;
                      const pct = Math.min(100, Math.round((avg / crit.max) * 100));
                      return (
                        <div key={crit.key} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-white/70 font-medium flex items-center gap-1 text-[11px] sm:text-xs">
                              <span>{crit.icon}</span> {crit.label}
                            </span>
                            <span className="text-white font-bold text-[11px] sm:text-xs">
                              {avg > 0 ? avg.toFixed(2) : '—'} / {crit.max}
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
                      <span>🏆</span> Álbum Mejor Calificado
                    </div>
                    {memberUser.highest_review ? (
                      <div className="flex items-center gap-3 sm:gap-4">
                        <img
                          src={memberUser.highest_review.image_url || PLACEHOLDER_COVER}
                          alt="Highest"
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-emerald-500/40 flex-shrink-0"
                          onError={(e) => {
                            e.target.src = PLACEHOLDER_COVER;
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-white font-bold text-xs sm:text-sm truncate">
                            {memberUser.highest_review.album}
                          </h4>
                          <p className="text-white/60 text-[11px] sm:text-xs truncate">
                            {memberUser.highest_review.artist}
                          </p>
                          <span className="inline-block mt-1 text-emerald-400 font-extrabold text-xs sm:text-sm">
                            ★{' '}
                            {typeof memberUser.highest_review.score === 'number'
                              ? memberUser.highest_review.score.toFixed(1)
                              : memberUser.highest_review.score}{' '}
                            / 10
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
                    {memberUser.lowest_review ? (
                      <div className="flex items-center gap-3 sm:gap-4">
                        <img
                          src={memberUser.lowest_review.image_url || PLACEHOLDER_COVER}
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
                            {memberUser.lowest_review.album}
                          </h4>
                          <p
                            translate="no"
                            className="notranslate artist-name text-white/60 text-[11px] sm:text-xs truncate"
                          >
                            {memberUser.lowest_review.artist}
                          </p>
                          <span className="inline-block mt-1 text-rose-400 font-extrabold text-xs sm:text-sm">
                            ★{' '}
                            {typeof memberUser.lowest_review.score === 'number'
                              ? memberUser.lowest_review.score.toFixed(1)
                              : memberUser.lowest_review.score}{' '}
                            / 10
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-white/30 text-xs">Sin reviews suficientes</p>
                    )}
                  </div>

                  {/* Nivel de Melómano Gamificado */}
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
                          {totalXp.toLocaleString()} XP
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
                            Siguiente:{' '}
                            <strong className="text-pink-300 font-bold">
                              {currentMelomanoLevel.next.title}
                            </strong>
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
                        <span>👑</span> ¡Rango Melómano Supremo del Club!
                      </div>
                    )}

                    {/* Mini Resumen de Aportes */}
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5 text-center">
                      <div className="bg-white/[0.02] p-1.5 rounded-xl border border-white/5">
                        <span className="text-xs font-bold text-white">
                          {memberUser.review_count || normalizedReviews.length}
                        </span>
                        <p className="text-[9px] text-white/40">Reviews</p>
                      </div>
                      <div className="bg-white/[0.02] p-1.5 rounded-xl border border-white/5">
                        <span className="text-xs font-bold text-white">
                          {memberUser.total_tracks_rated || 0}
                        </span>
                        <p className="text-[9px] text-white/40">Tracks</p>
                      </div>
                      <div className="bg-white/[0.02] p-1.5 rounded-xl border border-white/5">
                        <span className="text-xs font-bold text-white">
                          {memberUser.comments_count || 0}
                        </span>
                        <p className="text-[9px] text-white/40">Comentarios</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Compartir Review en Redes Sociales (Formato Celular / Stories) */}
      {sharingReviewItem && (
        <ShareReviewModal
          isOpen={!!sharingReviewItem}
          onClose={() => setSharingReviewItem(null)}
          review={sharingReviewItem.review}
          album={sharingReviewItem.album}
          currentUser={currentUser}
        />
      )}

      {/* Modal para Enviar Recomendación de Canción */}
      {isSendSongModalOpen && (
        <SendSongRecommendationModal
          isOpen={isSendSongModalOpen}
          onClose={() => setIsSendSongModalOpen(false)}
          targetRecipient={memberUser}
        />
      )}
    </div>
  );
}
