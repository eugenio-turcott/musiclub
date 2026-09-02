import React, { useState, useEffect, useCallback } from 'react';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';
import { supabase } from '../services/supabaseClient';
import {
  getWeightedReviewScore,
  getAlbumWeightedAverage,
  getTrackDisplayName,
  getEmotionFromReview,
  getReviewFavoriteTrack,
  isFavoriteTrackMatch,
} from '../utils/ratingUtils';

export function Reviews({ onClose, isPage = false }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAlbum, setFilterAlbum] = useState('todos');
  const [filterRating, setFilterRating] = useState('todos');
  const [albumsList, setAlbumsList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Estadísticas básicas
  const [totalReviews, setTotalReviews] = useState(0);
  const [avgRating, setAvgRating] = useState('0.0');

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: reviewsData, error: reviewsError } = await supabase
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
        .order('created_at', { ascending: false });

      if (reviewsError) throw new Error(reviewsError.message);

      const { data: albumsData, error: albumsError } = await supabase
        .from('albums')
        .select('id, album_name, artist_name, release_type, release_year')
        .order('album_name');

      if (albumsError) throw new Error(albumsError.message);

      setReviews(reviewsData || []);
      setAlbumsList(albumsData || []);
      setTotalReviews(reviewsData?.length || 0);

      const avg = getAlbumWeightedAverage(reviewsData || []);
      setAvgRating(avg || '0.0');
    } catch (err) {
      console.error('Error loading reviews:', err);
      setError(err.message);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const getReleaseTypeBadge = (type) => {
    const raw = (type || 'ALBUM').toUpperCase();
    if (raw === 'EP') {
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-indigo-300 bg-indigo-500/15 border border-indigo-400/30">
          💽 EP
        </span>
      );
    }
    if (raw === 'SENCILLO' || raw === 'SINGLE') {
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-pink-300 bg-pink-500/15 border border-pink-400/30">
          🎵 Sencillo
        </span>
      );
    }
    if (raw === 'COMPILACION' || raw === 'COMPILATION') {
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-amber-300 bg-amber-500/15 border border-amber-400/30">
          📦 Compilación
        </span>
      );
    }
    if (raw === 'EN VIVO' || raw === 'LIVE') {
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-emerald-300 bg-emerald-500/15 border border-emerald-400/30">
          🎤 En Vivo
        </span>
      );
    }
    if (raw === 'SOUNDTRACK') {
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-purple-300 bg-purple-500/15 border border-purple-400/30">
          🎬 Soundtrack
        </span>
      );
    }
    if (raw === 'REMIX') {
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-cyan-300 bg-cyan-500/15 border border-cyan-400/30">
          🎛️ Remix
        </span>
      );
    }
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-cyan-300 bg-cyan-500/15 border border-cyan-400/30">
        💿 Álbum
      </span>
    );
  };

  const getRatingBadgeStyle = (rating) => {
    if (rating >= 8.5)
      return 'text-emerald-300 bg-emerald-500/15 border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]';
    if (rating >= 7.0)
      return 'text-yellow-300 bg-yellow-500/15 border-yellow-400/40 shadow-[0_0_12px_rgba(234,179,8,0.2)]';
    if (rating >= 5.0)
      return 'text-orange-300 bg-orange-500/15 border-orange-400/40 shadow-[0_0_12px_rgba(249,115,22,0.2)]';
    return 'text-rose-300 bg-rose-500/15 border-rose-400/40 shadow-[0_0_12px_rgba(244,63,94,0.2)]';
  };

  const filteredReviews = reviews.filter((review) => {
    const albumName = review.albums?.album_name?.toLowerCase() || '';
    const artistName = review.albums?.artist_name?.toLowerCase() || '';
    const reviewerName = review.reviewer_name?.toLowerCase() || '';
    const comment = review.comment?.toLowerCase() || '';

    const matchesSearch =
      albumName.includes(searchTerm.toLowerCase()) ||
      artistName.includes(searchTerm.toLowerCase()) ||
      reviewerName.includes(searchTerm.toLowerCase()) ||
      comment.includes(searchTerm.toLowerCase());

    const matchesAlbum =
      filterAlbum === 'todos' || review.album_id === filterAlbum;

    const weightedScore =
      getWeightedReviewScore(review) ?? review.rating_general;

    const matchesRating =
      filterRating === 'todos' ||
      (filterRating === 'alta' && weightedScore >= 8) ||
      (filterRating === 'media' && weightedScore >= 5 && weightedScore < 8) ||
      (filterRating === 'baja' && weightedScore < 5);

    return matchesSearch && matchesAlbum && matchesRating;
  });

  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterAlbum, filterRating]);

  return (
    <div
      className={
        isPage
          ? 'min-h-screen cyber-grid p-3 sm:p-6 w-full max-w-full overflow-x-hidden text-white'
          : 'fixed inset-0 bg-black/90 backdrop-blur-xl z-[99999] overflow-y-auto py-5 sm:py-8 px-3 sm:px-6 lg:px-8 text-white'
      }
    >
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 w-full">
        {/* Universal Standard App Header */}
        <div className="relative">
          <AppHeader showTitle={false} />
          {!isPage && onClose && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition-all border border-white/10 text-sm z-10"
              title="Cerrar"
            >
              ✕
            </button>
          )}
        </div>

        {/* Header Title */}
        <div className="text-center space-y-2.5 sm:space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500/10 via-purple-500/20 to-pink-500/10 border border-pink-500/30 text-pink-300 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
            <span>📝</span>
            <span>Historial y Calificaciones de la Comunidad</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-pink-200">
            Reviews de Miembros
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm md:text-base max-w-2xl mx-auto px-2 leading-relaxed">
            Explora todas las reseñas, análisis detallados y puntuaciones
            ponderadas publicadas por el club.
          </p>
        </div>

        {/* Global Stats Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-[#151722]/80 border border-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl backdrop-blur-sm relative overflow-hidden group hover:border-pink-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-xl group-hover:bg-pink-500/10 transition-all" />
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="text-xl sm:text-3xl p-2 sm:p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20">
                📝
              </span>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">
                  Total Reviews
                </p>
                <p className="text-lg sm:text-2xl font-black text-white">
                  {totalReviews}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#151722]/80 border border-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl backdrop-blur-sm relative overflow-hidden group hover:border-cyan-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-all" />
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="text-xl sm:text-3xl p-2 sm:p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                ⭐
              </span>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">
                  Promedio Ponderado
                </p>
                <p className="text-lg sm:text-2xl font-black text-cyan-400">
                  ★ {avgRating}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#151722]/80 border border-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all" />
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="text-xl sm:text-3xl p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                💿
              </span>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">
                  Álbumes Evaluados
                </p>
                <p className="text-lg sm:text-2xl font-black text-white">
                  {albumsList.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#151722]/80 border border-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl backdrop-blur-sm relative overflow-hidden group hover:border-purple-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-all" />
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="text-xl sm:text-3xl p-2 sm:p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                👥
              </span>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">
                  Reviewers Únicos
                </p>
                <p className="text-lg sm:text-2xl font-black text-purple-400">
                  {new Set(reviews.map((r) => r.reviewer_name)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Controls */}
        <div className="bg-[#151722]/90 border border-white/5 rounded-2xl p-3 sm:p-5 flex flex-col md:flex-row gap-3 sm:gap-4 justify-between items-stretch md:items-center">
          {/* Search Bar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              placeholder="Buscar por álbum, artista, reviewer o comentario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-400/70 transition-colors"
            />
          </div>

          {/* Filter Selects & Refresh */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={filterAlbum}
              onChange={(e) => setFilterAlbum(e.target.value)}
              className="bg-black/60 border border-white/10 rounded-xl text-xs text-white px-2.5 py-1.5 sm:px-3 sm:py-2 focus:outline-none focus:border-pink-400 font-semibold cursor-pointer max-w-[200px] truncate"
            >
              <option value="todos">
                Todos los álbumes ({albumsList.length})
              </option>
              {albumsList.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.album_name} - {album.artist_name}
                </option>
              ))}
            </select>

            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="bg-black/60 border border-white/10 rounded-xl text-xs text-white px-2.5 py-1.5 sm:px-3 sm:py-2 focus:outline-none focus:border-pink-400 font-semibold cursor-pointer"
            >
              <option value="todos">Todas las notas</option>
              <option value="alta">⭐ Alta (8 - 10)</option>
              <option value="media">⭐ Media (5 - 7.9)</option>
              <option value="baja">⭐ Baja (&lt; 5)</option>
            </select>

            <button
              onClick={loadReviews}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 active:scale-95 flex-shrink-0"
              title="Actualizar reviews"
            >
              <span>🔄</span>{' '}
              <span className="hidden sm:inline">Refrescar</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center text-rose-300 text-xs sm:text-sm flex items-center justify-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Reviews Feed */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="inline-block w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">
              Cargando reseñas de la comunidad...
            </p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 bg-white/5 border border-white/5 rounded-3xl text-center space-y-2">
            <span className="text-4xl">🔍</span>
            <h3 className="text-lg font-bold text-white">
              No se encontraron reseñas
            </h3>
            <p className="text-slate-400 text-xs">
              {reviews.length > 0
                ? 'Intenta ajustar los criterios de búsqueda o filtros.'
                : 'Aún no hay reseñas registradas en la plataforma.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="text-slate-400 text-xs font-mono flex justify-between items-center px-1">
              <span>
                Mostrando {paginatedReviews.length} de {filteredReviews.length}{' '}
                reseñas
              </span>
              {filteredReviews.length !== reviews.length && (
                <span className="text-pink-300/70 font-semibold">
                  ({reviews.length} en total)
                </span>
              )}
            </div>

            {paginatedReviews.map((review) => {
              const album = review.albums;
              const weightedScore = getWeightedReviewScore(review);
              const rating =
                weightedScore !== null ? weightedScore : review.rating_general;
              const trackRatings = review.track_ratings || {};

              return (
                <div
                  key={review.id}
                  className="bg-[#141624]/90 border border-white/5 hover:border-white/20 transition-all duration-300 rounded-2xl p-4 sm:p-5 shadow-md hover:shadow-xl space-y-3.5 group"
                >
                  <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 items-start">
                    {/* Imagen del álbum */}
                    {album?.image_url && (
                      <div className="relative flex-shrink-0 mx-auto sm:mx-0">
                        <img
                          src={album.image_url}
                          alt={album.album_name}
                          className="w-18 h-18 sm:w-20 sm:h-20 min-w-[72px] min-h-[72px] sm:min-w-[80px] sm:min-h-[80px] object-cover rounded-xl border border-white/10 shadow-lg group-hover:border-pink-500/40 transition-colors"
                          onError={(e) => {
                            e.target.src =
                              'https://via.placeholder.com/100/1a1a2e/ffffff?text=🎵';
                          }}
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 w-full space-y-2">
                      {/* Encabezado del álbum y score */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/5 pb-2.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              translate="no"
                              className="notranslate music-title text-white font-black text-base sm:text-lg truncate group-hover:text-pink-300 transition-colors"
                            >
                              {album?.album_name || 'Álbum desconocido'}
                            </h4>
                            {album?.release_type && getReleaseTypeBadge(album.release_type)}
                          </div>
                          <p
                            translate="no"
                            className="notranslate artist-name text-slate-400 text-xs sm:text-sm font-medium mt-0.5 truncate"
                          >
                            {album?.artist_name || 'Artista desconocido'}
                          </p>
                        </div>

                        <div
                          className={`px-3 py-1 rounded-xl border text-sm sm:text-base font-black flex items-center gap-1 self-start sm:self-auto flex-shrink-0 ${getRatingBadgeStyle(
                            rating
                          )}`}
                        >
                          <span>★</span>
                          <span>{rating ? rating.toFixed(2) : 'N/A'}</span>
                          <span className="text-[10px] opacity-70 font-normal">
                            / 10
                          </span>
                        </div>
                      </div>

                      {/* Reviewer e información de fecha y sentimiento */}
                      <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
                        {review.reviewer_avatar ? (
                          <img
                            src={review.reviewer_avatar}
                            alt={review.reviewer_name || 'Reviewer'}
                            className="w-5 h-5 rounded-full object-cover border border-white/20 shadow-sm flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling)
                                e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-5 h-5 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 text-white items-center justify-center font-bold text-[10px] shadow-sm flex-shrink-0 ${
                            review.reviewer_avatar ? 'hidden' : 'flex'
                          }`}
                        >
                          {(review.reviewer_avatar ||
                            review.reviewer_name ||
                            'A')[0].toUpperCase()}
                        </div>
                        <span
                          translate="no"
                          className="notranslate username-tag text-slate-200 font-bold"
                        >
                          {review.reviewer_name || 'Anónimo'}
                        </span>
                        <span className="text-white/20">•</span>
                        <span className="text-[11px] font-mono">
                          {review.created_at
                            ? new Date(review.created_at).toLocaleDateString(
                                'es-ES',
                                {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                }
                              )
                            : ''}
                        </span>
                        {(() => {
                          const emo = getEmotionFromReview(review);
                          return emo ? (
                            <span
                              className={`text-[10px] px-2 py-0.5 mb-2 rounded-full border font-bold flex items-center gap-1 shadow-sm ${emo.badgeClass}`}
                              title={emo.description}
                            >
                              <span>{emo.emoji}</span>
                              <span>{emo.label}</span>
                            </span>
                          ) : null;
                        })()}
                      </div>

                      {/* Comentario destacado */}
                      {review.comment && (
                        <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                          <p className="text-slate-200 text-xs sm:text-sm italic leading-relaxed">
                            "{review.comment}"
                          </p>
                        </div>
                      )}

                      {/* Canción Favorita */}
                      {(() => {
                        const favTrack = getReviewFavoriteTrack(review);
                        if (!favTrack) return null;
                        const favName = getTrackDisplayName(
                          favTrack,
                          album?.tracks
                        );
                        return (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-400/30 p-2 sm:px-3 sm:py-1.5 rounded-xl text-amber-200 font-medium shadow-sm">
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="text-xl">⭐</span>
                              <span className="text-amber-400/80 font-bold text-[10px] sm:text-[11px] uppercase tracking-wider">
                                Canción Favorita:
                              </span>
                            </div>
                            <span
                              translate="no"
                              className="notranslate track-name font-extrabold text-amber-200 text-xs sm:text-sm pl-5 sm:pl-0 break-words sm:truncate sm:max-w-[240px]"
                              title={favName}
                            >
                              {favName}
                            </span>
                          </div>
                        );
                      })()}

                      {/* Categorías de calificación */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[
                          { key: 'rating_produccion', label: '🎛️ Prod.' },
                          { key: 'rating_composicion', label: '🎵 Comp.' },
                          { key: 'rating_letras', label: '📝 Letras' },
                          { key: 'rating_originalidad', label: '💡 Orig.' },
                          { key: 'rating_cohesion', label: '🔗 Cohes.' },
                          { key: 'rating_replay', label: '🔄 Replay' },
                        ].map(
                          ({ key, label }) =>
                            review[key] && (
                              <span
                                key={key}
                                className="text-[10px] text-slate-300 bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/5 font-medium"
                              >
                                {label}:{' '}
                                <strong className="text-pink-300">
                                  {review[key]}
                                </strong>
                              </span>
                            )
                        )}
                      </div>

                      {/* Ratings por canción */}
                      {Object.keys(trackRatings).length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-white/5">
                          <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-1.5 font-bold flex items-center gap-1">
                            <span>🎵</span> Calificaciones individuales por
                            track:
                          </p>
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                            {Object.entries(trackRatings).map(
                              ([trackId, score], trIdx) => {
                                const trackName = getTrackDisplayName(
                                  trackId,
                                  album?.tracks
                                );
                                const isFav = isFavoriteTrackMatch(
                                  trackId,
                                  getReviewFavoriteTrack(review),
                                  album?.tracks,
                                  trIdx
                                );
                                return (
                                  <span
                                    key={trackId}
                                    className={`text-[10px] px-2.5 py-0.5 rounded-lg border flex items-center gap-1 transition-all ${
                                      isFav
                                        ? 'text-amber-200 bg-amber-500/20 border-amber-400/40 font-bold shadow-sm'
                                        : 'text-slate-300 bg-black/40 border-white/5'
                                    }`}
                                  >
                                    <span>{isFav ? '⭐' : '🎵'}</span>
                                    <span
                                      className="max-w-[150px] truncate"
                                      title={trackName}
                                    >
                                      {trackName}
                                    </span>
                                    :{' '}
                                    <strong
                                      className={`font-bold ${isFav ? 'text-amber-300' : 'text-cyan-300'}`}
                                    >
                                      {score}
                                    </strong>
                                  </span>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 pt-4">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold active:scale-95"
            >
              ← Anterior
            </button>
            <span className="text-slate-400 text-xs font-mono">
              Página <strong className="text-white">{currentPage}</strong> de{' '}
              <strong className="text-white">{totalPages}</strong>
            </span>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold active:scale-95"
            >
              Siguiente →
            </button>
          </div>
        )}

        {/* Footer info & Navigation Footer */}
        <div className="pt-6 border-t border-white/5 text-center">
          <p className="text-slate-500 text-xs font-mono">
            📝 {totalReviews} reseñas registradas en la comunidad de Musiclub
          </p>
        </div>

        <Footer />
      </div>
    </div>
  );
}

export default Reviews;
