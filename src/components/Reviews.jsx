// src/components/Reviews.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { getWeightedReviewScore, getAlbumWeightedAverage } from '../utils/ratingUtils';

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
            status,
            tracks
          )
        `
        )
        .order('created_at', { ascending: false });

      if (reviewsError) throw new Error(reviewsError.message);

      const { data: albumsData, error: albumsError } = await supabase
        .from('albums')
        .select('id, album_name, artist_name, status')
        .in('status', ['INACTIVO', 'GANADOR', 'INDIVIDUAL'])
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVO':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-emerald-300 bg-emerald-500/15 border border-emerald-400/30">
            Activo
          </span>
        );
      case 'INACTIVO':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-slate-300 bg-slate-500/15 border border-slate-400/30">
            Inactivo
          </span>
        );
      case 'GANADOR':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-rose-300 bg-rose-500/20 border border-rose-400/30">
            🏆 Ganador
          </span>
        );
      case 'INDIVIDUAL':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-cyan-300 bg-cyan-500/15 border border-cyan-400/30">
            📌 Individual
          </span>
        );
      default:
        return null;
    }
  };

  const getRatingBadgeStyle = (rating) => {
    if (rating >= 8.5)
      return 'text-emerald-300 bg-emerald-500/15 border-emerald-400/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]';
    if (rating >= 7.0)
      return 'text-yellow-300 bg-yellow-500/15 border-yellow-400/30 shadow-[0_0_12px_rgba(234,179,8,0.2)]';
    if (rating >= 5.0)
      return 'text-orange-300 bg-orange-500/15 border-orange-400/30 shadow-[0_0_12px_rgba(249,115,22,0.2)]';
    return 'text-rose-300 bg-rose-500/15 border-rose-400/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]';
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

    const weightedScore = getWeightedReviewScore(review) ?? review.rating_general;

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
          ? 'min-h-screen cyber-grid p-4 sm:p-6 md:p-8'
          : 'fixed inset-0 bg-black/95 backdrop-blur-2xl z-[99999] overflow-y-auto p-4 sm:p-6 md:p-8'
      }
    >
      <div className="max-w-6xl mx-auto my-2 sm:my-4">
        {/* Luces traseras decorativas */}
        <div className="relative bg-gradient-to-br from-[#0c1322] via-[#0f1b33] to-[#070d1a] border border-pink-500/30 rounded-3xl p-5 sm:p-8 backdrop-blur-2xl shadow-[0_0_60px_rgba(245,87,108,0.15)] overflow-hidden">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-pink-500/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-5 border-b border-white/10 relative z-10">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-2xl sm:text-3xl">📝</span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Reviews de la Comunidad
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/30">
                  {totalReviews} publicaciones
                </span>
              </div>
              <p className="text-blue-200/60 text-xs sm:text-sm mt-1">
                Explora todas las reseñas y calificaciones detalladas enviadas por el club
              </p>
            </div>

            {isPage ? (
              <a
                href="/"
                className="text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-xs font-semibold transition-all border border-white/10 flex items-center gap-2"
              >
                ← Volver al Club
              </a>
            ) : (
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white bg-white/5 hover:bg-white/10 w-9 h-9 rounded-full flex items-center justify-center transition-all border border-white/10 text-lg"
                title="Cerrar"
              >
                ✕
              </button>
            )}
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 relative z-10">
            <div className="bg-rose-950/20 rounded-2xl p-4 border border-rose-500/30 text-center backdrop-blur-md">
              <div className="text-rose-300 text-2xl sm:text-3xl font-black">
                {totalReviews}
              </div>
              <div className="text-rose-300/60 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-0.5">
                Total Reviews
              </div>
            </div>
            <div className="bg-cyan-950/20 rounded-2xl p-4 border border-cyan-500/30 text-center backdrop-blur-md">
              <div className="text-cyan-300 text-2xl sm:text-3xl font-black">
                ★ {avgRating}
              </div>
              <div className="text-cyan-300/60 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-0.5">
                Promedio Ponderado
              </div>
            </div>
            <div className="bg-emerald-950/20 rounded-2xl p-4 border border-emerald-500/30 text-center backdrop-blur-md">
              <div className="text-emerald-300 text-2xl sm:text-3xl font-black">
                {albumsList.length}
              </div>
              <div className="text-emerald-300/60 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-0.5">
                Álbumes Evaluados
              </div>
            </div>
            <div className="bg-purple-950/20 rounded-2xl p-4 border border-purple-500/30 text-center backdrop-blur-md">
              <div className="text-purple-300 text-2xl sm:text-3xl font-black">
                {new Set(reviews.map((r) => r.reviewer_name)).size}
              </div>
              <div className="text-purple-300/60 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-0.5">
                Reviewers Únicos
              </div>
            </div>
          </div>

          {/* Filtros y búsqueda */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 relative z-10">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-sm">
                🔍
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por álbum, artista, reviewer o comentario..."
                className="w-full bg-black/50 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-white text-xs sm:text-sm placeholder-white/30 focus:outline-none focus:border-pink-400/50 transition-all"
              />
            </div>
            <select
              value={filterAlbum}
              onChange={(e) => setFilterAlbum(e.target.value)}
              className="w-full sm:max-w-xs bg-black/50 border border-white/10 rounded-2xl px-4 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:border-pink-400/50 transition-all cursor-pointer truncate"
            >
              <option value="todos" className="bg-slate-900">
                Todos los álbumes
              </option>
              {albumsList.map((album) => (
                <option key={album.id} value={album.id} className="bg-slate-900">
                  {album.album_name} - {album.artist_name}
                </option>
              ))}
            </select>
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="w-full sm:w-auto bg-black/50 border border-white/10 rounded-2xl px-4 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:border-pink-400/50 transition-all cursor-pointer"
            >
              <option value="todos" className="bg-slate-900">
                Todas las notas
              </option>
              <option value="alta" className="bg-slate-900">
                ⭐ Alta (8-10)
              </option>
              <option value="media" className="bg-slate-900">
                ⭐ Media (5-7)
              </option>
              <option value="baja" className="bg-slate-900">
                ⭐ Baja (1-4)
              </option>
            </select>
            <button
              onClick={loadReviews}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white/70 hover:text-white hover:bg-white/10 transition-all text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <span>🔄</span> Actualizar
            </button>
          </div>

          {error && (
            <div className="text-rose-300 text-xs mb-4 bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-2xl flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Resultados */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-2">
                  <span
                    className="w-3 h-3 bg-pink-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  ></span>
                  <span
                    className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  ></span>
                  <span
                    className="w-3 h-3 bg-pink-500 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  ></span>
                </div>
                <span className="text-white/40 text-xs font-medium">
                  Cargando reseñas de la comunidad...
                </span>
              </div>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-16 bg-black/30 rounded-2xl border border-white/5">
              <p className="text-white/40 text-sm font-medium">
                No hay reseñas que coincidan con los filtros
              </p>
              <p className="text-white/20 text-xs mt-1">
                {reviews.length > 0
                  ? 'Intenta ajustar los criterios de búsqueda'
                  : 'Aún no hay reseñas registradas en el sistema'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 relative z-10">
              <div className="text-white/40 text-xs font-mono flex justify-between items-center px-1">
                <span>
                  Mostrando {paginatedReviews.length} de {filteredReviews.length} reseñas
                </span>
                {filteredReviews.length !== reviews.length && (
                  <span className="text-pink-300/60">
                    ({reviews.length} totales)
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
                    className="bg-black/40 rounded-3xl p-4 sm:p-5 border border-white/10 hover:border-pink-500/30 hover:shadow-[0_0_30px_rgba(245,87,108,0.12)] transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">
                      {/* Imagen del álbum */}
                      {album?.image_url && (
                        <div className="relative flex-shrink-0 mx-auto sm:mx-0">
                          <img
                            src={album.image_url}
                            alt={album.album_name}
                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl border border-white/10 shadow-xl"
                            onError={(e) => {
                              e.target.src =
                                'https://via.placeholder.com/100/1a1a2e/ffffff?text=🎵';
                            }}
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 w-full">
                        {/* Encabezado del álbum y score */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/10 pb-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-white font-extrabold text-base sm:text-lg">
                                {album?.album_name || 'Álbum desconocido'}
                              </h4>
                              {album?.status && getStatusBadge(album.status)}
                            </div>
                            <p className="text-blue-200/70 text-xs sm:text-sm font-medium mt-0.5">
                              {album?.artist_name || 'Artista desconocido'}
                            </p>
                          </div>

                          <div
                            className={`px-3 py-1 rounded-full border text-sm sm:text-base font-extrabold flex items-center gap-1 ${getRatingBadgeStyle(
                              rating
                            )}`}
                          >
                            <span>★</span>
                            <span>{rating ? rating.toFixed(1) : 'N/A'}</span>
                            <span className="text-[10px] opacity-60 font-normal">
                              /10
                            </span>
                          </div>
                        </div>

                        {/* Reviewer e información de fecha */}
                        <div className="flex items-center gap-2.5 flex-wrap mb-3 text-xs">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 text-white flex items-center justify-center font-bold text-[10px]">
                            {(review.reviewer_name || 'A')[0].toUpperCase()}
                          </div>
                          <span className="text-white font-semibold">
                            {review.reviewer_name || 'Anónimo'}
                          </span>
                          <span className="text-white/20">•</span>
                          <span className="text-white/40 text-[11px]">
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
                        </div>

                        {/* Comentario destacado */}
                        {review.comment && (
                          <div className="bg-black/30 p-3 rounded-2xl border border-white/5 mb-3">
                            <p className="text-white/80 text-xs sm:text-sm italic leading-relaxed">
                              "{review.comment}"
                            </p>
                          </div>
                        )}

                        {/* Categorías de calificación */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
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
                                  className="text-[10px] text-blue-200/80 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20"
                                >
                                  {label}: <span className="font-bold">{review[key]}</span>
                                </span>
                              )
                          )}
                        </div>

                        {/* Ratings por canción */}
                        {Object.keys(trackRatings).length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-white/5">
                            <p className="text-white/30 text-[9px] uppercase tracking-wider mb-1.5 font-semibold">
                              🎵 Calificaciones por canción
                            </p>
                            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto custom-scrollbar">
                              {Object.entries(trackRatings).map(
                                ([trackId, score]) => {
                                  const trackName =
                                    album?.tracks?.find(
                                      (t) =>
                                        t.id === trackId ||
                                        String(t.id) === trackId
                                    )?.name || trackId.substring(0, 12);
                                  return (
                                    <span
                                      key={trackId}
                                      className="text-[10px] text-cyan-200/80 bg-black/50 px-2.5 py-0.5 rounded-lg border border-cyan-500/20 flex items-center gap-1"
                                    >
                                      <span className="text-cyan-400/50">🎵</span>
                                      {trackName.length > 18
                                        ? trackName.substring(0, 18) + '…'
                                        : trackName}
                                      : <span className="font-bold text-white">{score}</span>
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
            <div className="flex justify-center items-center gap-3 mt-8 relative z-10">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold"
              >
                ← Anterior
              </button>
              <span className="text-white/50 text-xs font-mono">
                Página <span className="text-white font-bold">{currentPage}</span> de{' '}
                <span className="text-white font-bold">{totalPages}</span>
              </span>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold"
              >
                Siguiente →
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10 relative z-10 text-center">
            <p className="text-white/20 text-xs font-mono">
              📝 {totalReviews} reseñas totales registradas en la comunidad
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
