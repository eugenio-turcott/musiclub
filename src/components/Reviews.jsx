// src/components/ReviewsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

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
      // Obtener todas las reviews con información del álbum
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

      // Obtener lista de álbumes para filtro (solo los que tienen reviews)
      const { data: albumsData, error: albumsError } = await supabase
        .from('albums')
        .select('id, album_name, artist_name, status')
        .in('status', ['INACTIVO', 'GANADOR', 'INDIVIDUAL'])
        .order('album_name');

      if (albumsError) throw new Error(albumsError.message);

      setReviews(reviewsData || []);
      setAlbumsList(albumsData || []);
      setTotalReviews(reviewsData?.length || 0);

      // Calcular promedio general
      const ratings =
        reviewsData
          ?.map((r) => r.rating_general)
          .filter((r) => r !== null && r !== undefined) || [];

      const avg =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;

      setAvgRating(avg.toFixed(1));
    } catch (err) {
      console.error('Error loading reviews:', err);
      setError(err.message);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVO':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'INACTIVO':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      case 'GANADOR':
        return 'text-[#f5576c] bg-[#f5576c]/10 border-[#f5576c]/20';
      case 'INDIVIDUAL':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default:
        return 'text-white/30 bg-white/5 border-white/5';
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 9) return 'text-green-400';
    if (rating >= 7) return 'text-yellow-400';
    if (rating >= 5) return 'text-orange-400';
    return 'text-red-400';
  };

  // Filtrar reviews
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

    const matchesRating =
      filterRating === 'todos' ||
      (filterRating === 'alta' && review.rating_general >= 8) ||
      (filterRating === 'media' &&
        review.rating_general >= 5 &&
        review.rating_general < 8) ||
      (filterRating === 'baja' && review.rating_general < 5);

    return matchesSearch && matchesAlbum && matchesRating;
  });

  // Paginación
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterAlbum, filterRating]);

  return (
    <div
      className={
        isPage
          ? 'min-h-screen cyber-grid p-4 sm:p-6'
          : 'fixed inset-0 bg-black/95 backdrop-blur-xl z-[99999] overflow-y-auto p-4'
      }
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">📝</span>
              Reviews de la Comunidad
            </h1>
            <p className="text-white/30 text-sm mt-1">
              Todas las reseñas de álbumes compartidas por los usuarios
            </p>
          </div>
          {isPage ? (
            <a
              href="/"
              className="text-white/40 hover:text-white/70 transition-colors text-sm flex items-center gap-2"
            >
              ← Volver
            </a>
          ) : (
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white/70 transition-colors text-2xl"
            >
              ✕
            </button>
          )}
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
            <div className="text-white text-2xl font-bold">{totalReviews}</div>
            <div className="text-white/30 text-xs uppercase tracking-wider">
              Total Reviews
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
            <div className="text-[#f5576c] text-2xl font-bold">{avgRating}</div>
            <div className="text-white/30 text-xs uppercase tracking-wider">
              Promedio General
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
            <div className="text-green-400 text-2xl font-bold">
              {albumsList.length}
            </div>
            <div className="text-white/30 text-xs uppercase tracking-wider">
              Álbumes con Reviews
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
            <div className="text-blue-400 text-2xl font-bold">
              {new Set(reviews.map((r) => r.reviewer_name)).size}
            </div>
            <div className="text-white/30 text-xs uppercase tracking-wider">
              Reviewers Únicos
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por álbum, artista, reviewer o comentario..."
            className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#f5576c]/50"
          />
          <select
            value={filterAlbum}
            onChange={(e) => setFilterAlbum(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#f5576c]/50"
          >
            <option value="todos">Todos los álbumes</option>
            {albumsList.map((album) => (
              <option key={album.id} value={album.id}>
                {album.album_name} - {album.artist_name}
              </option>
            ))}
          </select>
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#f5576c]/50"
          >
            <option value="todos">Todas las calificaciones</option>
            <option value="alta">⭐ Alta (8-10)</option>
            <option value="media">⭐ Media (5-7)</option>
            <option value="baja">⭐ Baja (1-4)</option>
          </select>
          <button
            onClick={loadReviews}
            className="px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-white/60 hover:bg-white/20 hover:text-white transition-all text-sm"
          >
            🔄 Actualizar
          </button>
        </div>

        {error && (
          <div className="text-[#f5576c] text-xs mb-3 bg-[#f5576c]/10 px-3 py-2 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        {/* Resultados */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-2">
                <span
                  className="w-3 h-3 bg-[#f5576c] rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                ></span>
                <span
                  className="w-3 h-3 bg-[#f093fb] rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                ></span>
                <span
                  className="w-3 h-3 bg-[#f5576c] rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                ></span>
              </div>
              <span className="text-white/30 text-sm">Cargando reviews...</span>
            </div>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-white/30 text-sm">
              No hay reviews que coincidan con los filtros
            </p>
            <p className="text-white/20 text-xs mt-1">
              {reviews.length > 0
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Aún no hay reviews en el sistema. ¡Sé el primero en dejar tu opinión!'}
            </p>
          </div>
        ) : (
          <>
            <div className="text-white/20 text-xs mb-3">
              Mostrando {paginatedReviews.length} de {filteredReviews.length}{' '}
              reviews
              {filteredReviews.length !== reviews.length &&
                ` (${reviews.length} totales)`}
            </div>

            <div className="space-y-3">
              {paginatedReviews.map((review) => {
                const album = review.albums;
                const rating = review.rating_general;
                const trackRatings = review.track_ratings || {};

                return (
                  <div
                    key={review.id}
                    className="bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Imagen del álbum */}
                      {album?.image_url && (
                        <img
                          src={album.image_url}
                          alt={album.album_name}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                          onError={(e) => {
                            e.target.src =
                              'https://via.placeholder.com/100/1a1a2e/ffffff?text=🎵';
                          }}
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        {/* Encabezado */}
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h4 className="text-white font-medium text-sm">
                              {album?.album_name || 'Álbum desconocido'}
                            </h4>
                            <p className="text-white/40 text-xs">
                              {album?.artist_name || 'Artista desconocido'}
                              {album?.status && (
                                <span
                                  className={`ml-2 text-[8px] px-2 py-0.5 rounded-full border ${getStatusColor(album.status)}`}
                                >
                                  {album.status}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                              className={`text-lg font-bold ${getRatingColor(rating)}`}
                            >
                              ★ {rating?.toFixed(1) || 'N/A'}
                            </span>
                            <span className="text-white/20 text-xs">/ 10</span>
                          </div>
                        </div>

                        {/* Reviewer y fecha */}
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                          <span className="text-white/30">
                            👤 {review.reviewer_name || 'Anónimo'}
                          </span>
                          {review.reviewer_email && (
                            <span className="text-white/20">
                              {review.reviewer_email}
                            </span>
                          )}
                          <span className="text-white/20">•</span>
                          <span className="text-white/20">
                            {review.created_at
                              ? new Date(review.created_at).toLocaleDateString(
                                  'es-ES',
                                  {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }
                                )
                              : ''}
                          </span>
                        </div>

                        {/* Comentario */}
                        {review.comment && (
                          <p className="text-white/60 text-sm mt-2 italic">
                            "{review.comment}"
                          </p>
                        )}

                        {/* Categorías de calificación */}
                        <div className="flex flex-wrap gap-1 mt-2">
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
                                  className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full border border-white/5"
                                >
                                  {label}: {review[key]}
                                </span>
                              )
                          )}
                        </div>

                        {/* Track ratings */}
                        {Object.keys(trackRatings).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-white/5">
                            <p className="text-white/20 text-[9px] uppercase tracking-wider mb-1">
                              🎵 Calificaciones por canción
                            </p>
                            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar">
                              {Object.entries(trackRatings)
                                .slice(0, 10)
                                .map(([trackId, rating]) => {
                                  // Intentar encontrar el nombre de la canción
                                  const trackName =
                                    album?.tracks?.find(
                                      (t) =>
                                        t.id === trackId ||
                                        String(t.id) === trackId
                                    )?.name || trackId.substring(0, 12);
                                  return (
                                    <span
                                      key={trackId}
                                      className="text-[9px] text-white/30 bg-black/30 px-2 py-0.5 rounded-full flex items-center gap-1"
                                    >
                                      <span className="text-white/10">🎵</span>
                                      {trackName.length > 15
                                        ? trackName.substring(0, 15) + '…'
                                        : trackName}
                                      : {rating}
                                    </span>
                                  );
                                })}
                              {Object.keys(trackRatings).length > 10 && (
                                <span className="text-[9px] text-white/20 bg-black/30 px-2 py-0.5 rounded-full">
                                  +{Object.keys(trackRatings).length - 10} más
                                </span>
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

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:bg-white/10 hover:text-white/70 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                >
                  ← Anterior
                </button>
                <span className="text-white/40 text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:bg-white/10 hover:text-white/70 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="text-white/20 text-xs text-center">
            📝 {totalReviews} reviews totales ·{' '}
            {new Set(reviews.map((r) => r.reviewer_name)).size} reviewers únicos
          </p>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  );
}
