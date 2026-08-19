import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabaseService } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { getTrackDisplayName } from '../utils/ratingUtils';

const CRITERIA_CONFIG = [
  {
    key: 'rating_produccion',
    label: 'Producción',
    emoji: '🎛️',
    max: 5,
    color: 'from-blue-500 to-cyan-400',
  },
  {
    key: 'rating_composicion',
    label: 'Composición',
    emoji: '🎵',
    max: 5,
    color: 'from-emerald-500 to-teal-400',
  },
  {
    key: 'rating_letras',
    label: 'Letras',
    emoji: '📝',
    max: 5,
    color: 'from-amber-500 to-yellow-400',
  },
  {
    key: 'rating_originalidad',
    label: 'Originalidad',
    emoji: '💡',
    max: 5,
    color: 'from-purple-500 to-indigo-400',
  },
  {
    key: 'rating_cohesion',
    label: 'Cohesión',
    emoji: '🔗',
    max: 5,
    color: 'from-rose-500 to-red-400',
  },
  {
    key: 'rating_replay',
    label: 'Replay Value',
    emoji: '🔄',
    max: 5,
    color: 'from-teal-500 to-cyan-400',
  },
];

export function AlbumsCatalog({ isPage = false }) {
  const { user } = useAuth();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ACTIVO | INDIVIDUAL | INACTIVO | GANADOR
  const [sortBy, setSortBy] = useState('rating_desc'); // rating_desc | rating_asc | reviews_desc | newest | name_asc | artist_asc
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [expandedReviewTracklist, setExpandedReviewTracklist] = useState({});

  useEffect(() => {
    async function loadAlbums() {
      setLoading(true);
      setError(null);
      try {
        const data = await supabaseService.getAllAlbumsWithFullStats();
        setAlbums(data || []);
      } catch (err) {
        console.error('Error loading albums catalog:', err);
        setError('No se pudieron cargar los álbumes.');
      } finally {
        setLoading(false);
      }
    }
    loadAlbums();
  }, []);

  const isUserAlbum = (album) => {
    if (!user || !album) return false;
    const userEmail = (user.email || '').toLowerCase().trim();
    const albumEmail = (album.added_by_email || '').toLowerCase().trim();
    if (albumEmail && userEmail && albumEmail === userEmail) return true;
    if (album.user_id && user.id && String(album.user_id) === String(user.id))
      return true;
    const userName = (user.name || '').toLowerCase().trim();
    const albumAuthor = (album.added_by || '').toLowerCase().trim();
    if (albumAuthor && userName && albumAuthor === userName) return true;
    return false;
  };

  // Global Statistics
  const globalStats = useMemo(() => {
    if (!albums || albums.length === 0) {
      return {
        totalAlbums: 0,
        totalReviews: 0,
        topRatedAlbum: null,
        mostReviewedAlbum: null,
        avgClubScore: '0.0',
      };
    }
    const totalAlbums = albums.length;
    const totalReviews = albums.reduce(
      (sum, a) => sum + (a.review_count || 0),
      0
    );

    const albumsWithRatings = albums.filter(
      (a) => a.final_rating !== null && a.review_count > 0
    );
    const topRatedAlbum =
      albumsWithRatings.length > 0
        ? [...albumsWithRatings].sort(
            (a, b) => b.final_rating - a.final_rating
          )[0]
        : null;

    const mostReviewedAlbum =
      [...albums].sort((a, b) => b.review_count - a.review_count)[0] || null;

    const scoreSum = albumsWithRatings.reduce(
      (sum, a) => sum + (a.final_rating || 0),
      0
    );
    const avgClubScore =
      albumsWithRatings.length > 0
        ? (scoreSum / albumsWithRatings.length).toFixed(1)
        : '0.0';

    return {
      totalAlbums,
      totalReviews,
      topRatedAlbum,
      mostReviewedAlbum,
      avgClubScore,
    };
  }, [albums]);

  // Filtered & Sorted Albums
  const filteredAlbums = useMemo(() => {
    let result = [...albums];

    // Status Filter
    if (statusFilter !== 'ALL') {
      result = result.filter((a) => a.status === statusFilter);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.album_name?.toLowerCase().includes(q) ||
          a.artist_name?.toLowerCase().includes(q) ||
          a.added_by?.toLowerCase().includes(q) ||
          a.added_by_email?.toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'rating_desc') {
        if (a.final_rating === null && b.final_rating !== null) return 1;
        if (b.final_rating === null && a.final_rating !== null) return -1;
        return (
          (b.final_rating || 0) - (a.final_rating || 0) ||
          b.review_count - a.review_count
        );
      }
      if (sortBy === 'rating_asc') {
        if (a.final_rating === null && b.final_rating !== null) return 1;
        if (b.final_rating === null && a.final_rating !== null) return -1;
        return (
          (a.final_rating || 0) - (b.final_rating || 0) ||
          a.review_count - b.review_count
        );
      }
      if (sortBy === 'reviews_desc') {
        return (
          b.review_count - a.review_count ||
          (b.final_rating || 0) - (a.final_rating || 0)
        );
      }
      if (sortBy === 'newest') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      if (sortBy === 'name_asc') {
        return (a.album_name || '').localeCompare(b.album_name || '');
      }
      if (sortBy === 'artist_asc') {
        return (a.artist_name || '').localeCompare(b.artist_name || '');
      }
      return 0;
    });

    return result;
  }, [albums, statusFilter, searchQuery, sortBy]);

  const toggleTracklistExpansion = (reviewId) => {
    setExpandedReviewTracklist((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  return (
    <div className="min-h-screen bg-[#0d0e15] text-white py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-white/5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 transition-all font-semibold"
          >
            <span>←</span> Volver al Inicio
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/leaderboard"
              className="text-xs sm:text-sm text-slate-400 hover:text-amber-300 transition-colors font-medium flex items-center gap-1.5"
            >
              <span>🏆</span> Leaderboard
            </Link>
            <Link
              to="/reviews"
              className="text-xs sm:text-sm text-slate-400 hover:text-amber-300 transition-colors font-medium flex items-center gap-1.5"
            >
              <span>📝</span> Reviews
            </Link>
            {user && (
              <Link
                to="/profile"
                className="text-xs sm:text-sm text-slate-400 hover:text-white transition-colors font-medium flex items-center gap-1.5"
              >
                <span>👤</span> Mi Perfil
              </Link>
            )}
          </div>
        </div>

        {/* Header Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 via-cyan-500/20 to-blue-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
            <span>💿</span>
            <span>Catálogo Completo y Estadísticas</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-200">
            Todos los Álbumes
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Consulta las calificaciones detalladas, desglose por canciones,
            criterios ponderados, bonus y todas las reseñas de la comunidad.
          </p>
        </div>

        {/* Global Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#151722]/80 border border-white/5 p-4 rounded-2xl backdrop-blur-sm relative overflow-hidden group hover:border-cyan-500/30 transition-all">
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                💿
              </span>
              <div>
                <p className="text-xs text-slate-400 font-medium">
                  Total Álbumes
                </p>
                <p className="text-xl sm:text-2xl font-black text-white">
                  {globalStats.totalAlbums}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#151722]/80 border border-white/5 p-4 rounded-2xl backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/30 transition-all">
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                📝
              </span>
              <div>
                <p className="text-xs text-slate-400 font-medium">
                  Total Reseñas
                </p>
                <p className="text-xl sm:text-2xl font-black text-amber-400">
                  {globalStats.totalReviews}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#151722]/80 border border-white/5 p-4 rounded-2xl backdrop-blur-sm relative overflow-hidden group hover:border-yellow-500/30 transition-all">
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                👑
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 font-medium">
                  Mejor Calificado
                </p>
                <p className="text-sm sm:text-base font-black text-yellow-300 truncate">
                  {globalStats.topRatedAlbum
                    ? globalStats.topRatedAlbum.album_name
                    : '—'}
                </p>
                {globalStats.topRatedAlbum && (
                  <p className="text-[10px] text-yellow-200/70 font-semibold">
                    {globalStats.topRatedAlbum.final_rating} ⭐
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#151722]/80 border border-white/5 p-4 rounded-2xl backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                ⭐
              </span>
              <div>
                <p className="text-xs text-slate-400 font-medium">
                  Promedio Global
                </p>
                <p className="text-xl sm:text-2xl font-black text-emerald-400">
                  {globalStats.avgClubScore} / 10
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-[#151722]/90 border border-white/5 rounded-2xl p-3.5 sm:p-5 flex flex-col md:flex-row gap-3 sm:gap-4 justify-between items-stretch md:items-center">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Buscar álbum, artista o curador..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/70 transition-colors"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'ACTIVO', label: '🎵 Pool Activo' },
              { id: 'INDIVIDUAL', label: '📌 Individuales' },
              { id: 'INACTIVO', label: '💤 Inactivos' },
              { id: 'GANADOR', label: '🏆 Ganadores' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? 'bg-cyan-500 text-black shadow-md'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <label className="text-xs text-slate-400 whitespace-nowrap">
              Ordenar por:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto bg-black/40 border border-white/10 rounded-xl text-xs text-white px-3 py-2.5 focus:outline-none focus:border-cyan-400/70"
            >
              <option value="rating_desc">🌟 Mayor Calificación</option>
              <option value="rating_asc">📉 Menor Calificación</option>
              <option value="reviews_desc">📝 Más Reseñas</option>
              <option value="newest">🕒 Más Recientes</option>
              <option value="name_asc">🔤 Álbum (A-Z)</option>
              <option value="artist_asc">🎤 Artista (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Albums Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="inline-block w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">
              Cargando catálogo de álbumes y estadísticas...
            </p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center text-red-400">
            {error}
          </div>
        ) : filteredAlbums.length === 0 ? (
          <div className="p-12 bg-white/5 border border-white/5 rounded-3xl text-center space-y-2">
            <span className="text-4xl">🎵</span>
            <h3 className="text-lg font-bold text-white">
              No se encontraron álbumes
            </h3>
            <p className="text-slate-400 text-xs">
              Intenta cambiar los filtros o el término de búsqueda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {filteredAlbums.map((album) => {
              const isMine = isUserAlbum(album);
              const score = album.final_rating;

              return (
                <div
                  key={album.id}
                  onClick={() => setSelectedAlbum(album)}
                  className={`bg-[#141622]/90 rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl cursor-pointer flex flex-col group relative ${
                    isMine
                      ? 'border-yellow-400 ring-2 ring-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.25)] hover:border-yellow-300'
                      : album.status === 'GANADOR'
                        ? 'border-[#f5576c] shadow-[0_0_20px_rgba(245,87,108,0.2)]'
                        : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  {/* Artwork Container */}
                  <div className="relative aspect-square overflow-hidden bg-black/40">
                    <img
                      src={
                        album.image_url ||
                        'https://via.placeholder.com/300/1a1a2e/ffffff?text=🎵'
                      }
                      alt={album.album_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src =
                          'https://via.placeholder.com/300/1a1a2e/ffffff?text=🎵';
                      }}
                    />

                    {/* Badge: Added by current user */}
                    {isMine && (
                      <div
                        className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg"
                        title="Añadido por ti"
                      >
                        <span>★</span>
                        <span>AÑADIDO POR TI</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2 right-2 z-10">
                      {album.status === 'GANADOR' ? (
                        <span className="bg-[#f5576c] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                          🏆 GANADOR
                        </span>
                      ) : album.status === 'INDIVIDUAL' ? (
                        <span className="bg-blue-500/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                          📌 Individual
                        </span>
                      ) : album.status === 'INACTIVO' ? (
                        <span className="bg-slate-700/80 backdrop-blur-md text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                          💤 Inactivo
                        </span>
                      ) : (
                        <span className="bg-emerald-600/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                          🎵 Pool
                        </span>
                      )}
                    </div>

                    {/* Bottom overlay: Score and review count */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 flex items-end justify-between">
                      {score !== null ? (
                        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-xl">
                          <span className="text-amber-400 text-sm font-black">
                            {score.toFixed(2)}
                          </span>
                          <span className="text-xs">⭐</span>
                          {album.bonus > 0 && (
                            <span className="text-[9px] text-cyan-300 font-bold bg-cyan-500/20 px-1.5 py-0.2 rounded-md">
                              +{album.bonus.toFixed(2)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 bg-black/60 px-2 py-1 rounded-xl">
                          Sin calificaciones
                        </div>
                      )}

                      <div className="text-[11px] text-slate-300 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded-xl font-medium">
                        📝 {album.review_count}{' '}
                        {album.review_count === 1 ? 'review' : 'reviews'}
                      </div>
                    </div>
                  </div>

                  {/* Info Body */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {album.album_name}
                      </h3>
                      <p className="text-slate-400 text-xs font-medium line-clamp-1">
                        {album.artist_name}
                      </p>
                      <p className="text-slate-500 text-[11px] mt-1 line-clamp-1">
                        Añadido por:{' '}
                        <span
                          className={
                            isMine
                              ? 'text-yellow-400 font-bold'
                              : 'text-slate-300'
                          }
                        >
                          {album.added_by || 'Miembro'}
                        </span>
                      </p>
                    </div>

                    {/* Best Track Highlight if available */}
                    {album.best_track && (
                      <div className="bg-white/5 border border-white/5 rounded-xl p-2 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-1 min-w-0 pr-1">
                          <span className="text-amber-400">👑</span>
                          <span className="text-slate-300 truncate text-[11px]">
                            {album.best_track.name}
                          </span>
                        </div>
                        <span className="text-amber-300 font-bold text-[11px] whitespace-nowrap">
                          {album.best_track.avg_rating} ⭐
                        </span>
                      </div>
                    )}

                    {/* Card Footer Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAlbum(album);
                      }}
                      className="w-full py-2 rounded-xl bg-white/5 hover:bg-cyan-500 hover:text-black text-slate-200 text-xs font-bold border border-white/10 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>📊</span>
                      <span>Ver Estadísticas y Reviews</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Deep Album Stats & Reviews Modal */}
      {selectedAlbum && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedAlbum(null)}
        >
          <div
            className="bg-[#151724] border border-white/10 rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedAlbum(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 w-9 h-9 rounded-full flex items-center justify-center transition-colors text-lg z-10"
            >
              ✕
            </button>

            {/* Top Showcase: Artwork + Title + Key Score */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-white/10 pb-6">
              <div
                className={`w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-2 flex-shrink-0 shadow-2xl ${
                  isUserAlbum(selectedAlbum)
                    ? 'border-yellow-400 ring-2 ring-yellow-400/50'
                    : 'border-white/10'
                }`}
              >
                <img
                  src={
                    selectedAlbum.image_url ||
                    'https://via.placeholder.com/300/1a1a2e/ffffff?text=🎵'
                  }
                  alt={selectedAlbum.album_name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    {selectedAlbum.album_name}
                  </h2>
                  {selectedAlbum.status === 'GANADOR' && (
                    <span className="bg-[#f5576c] text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow">
                      🏆 GANADOR
                    </span>
                  )}
                </div>
                <p className="text-lg text-slate-300 font-semibold">
                  {selectedAlbum.artist_name}
                </p>
                <p className="text-xs text-slate-400">
                  Añadido por:{' '}
                  <strong
                    className={
                      isUserAlbum(selectedAlbum)
                        ? 'text-yellow-400'
                        : 'text-slate-200'
                    }
                  >
                    {selectedAlbum.added_by || 'Miembro'}
                  </strong>
                </p>

                {/* Streaming Links */}
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-2 flex-wrap">
                  {selectedAlbum.spotify_link && (
                    <a
                      href={selectedAlbum.spotify_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-[#1DB954]/20 hover:bg-[#1DB954]/30 text-[#1DB954] border border-[#1DB954]/30 rounded-full text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <span>🟢</span> Spotify
                    </a>
                  )}
                  {selectedAlbum.apple_music_link && (
                    <a
                      href={selectedAlbum.apple_music_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 border border-pink-500/30 rounded-full text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <span>🍎</span> Apple Music
                    </a>
                  )}
                  {selectedAlbum.youtube_link && (
                    <a
                      href={selectedAlbum.youtube_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-full text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <span>▶️</span> YouTube
                    </a>
                  )}
                </div>
              </div>

              {/* Big Score Box */}
              <div className="bg-gradient-to-br from-[#1d2033] to-[#121420] border border-cyan-500/30 p-4 rounded-2xl text-center min-w-[140px] shadow-lg">
                <p className="text-[11px] uppercase tracking-wider text-cyan-300 font-bold">
                  Calificación Final
                </p>
                <p className="text-3xl sm:text-4xl font-black text-amber-400 my-1">
                  {selectedAlbum.final_rating !== null
                    ? selectedAlbum.final_rating.toFixed(1)
                    : '—'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {selectedAlbum.review_count}{' '}
                  {selectedAlbum.review_count === 1 ? 'reseña' : 'reseñas'}
                </p>
                {selectedAlbum.bonus > 0 && (
                  <p className="text-[10px] text-cyan-300 font-bold mt-1 bg-cyan-500/10 rounded-md py-0.5">
                    +{selectedAlbum.bonus.toFixed(2)} Bonus
                  </p>
                )}
              </div>
            </div>

            {/* Score Formula Details */}
            {selectedAlbum.review_count > 0 && (
              <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  📊 Desglose de Puntuación Ponderada
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="bg-white/5 p-2.5 rounded-xl">
                    <p className="text-[11px] text-slate-400">Promedio Base</p>
                    <p className="text-base font-black text-white">
                      {selectedAlbum.base_rating
                        ? selectedAlbum.base_rating.toFixed(2)
                        : '—'}{' '}
                      ⭐
                    </p>
                    <p className="text-[9px] text-slate-500">
                      50% Tracks · 30% Criterios · 20% General
                    </p>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl">
                    <p className="text-[11px] text-slate-400">
                      Bonus por Reviews
                    </p>
                    <p className="text-base font-black text-cyan-400">
                      +
                      {selectedAlbum.bonus
                        ? selectedAlbum.bonus.toFixed(2)
                        : '0.00'}
                    </p>
                    <p className="text-[9px] text-slate-500">
                      +0.25 ({'>'}5 reviews) · +0.10 ({'>'}10)
                    </p>
                  </div>
                  <div className="bg-cyan-500/10 border border-cyan-500/30 p-2.5 rounded-xl">
                    <p className="text-[11px] text-cyan-300 font-bold">
                      Puntuación Final
                    </p>
                    <p className="text-base font-black text-amber-400">
                      {selectedAlbum.final_rating
                        ? selectedAlbum.final_rating.toFixed(2)
                        : '—'}{' '}
                      / 10
                    </p>
                    <p className="text-[9px] text-cyan-200/60">Máximo 10.0</p>
                  </div>
                </div>
              </div>
            )}

            {/* Criteria Breakdown */}
            {selectedAlbum.review_count > 0 && (
              <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  🎛️ Promedios por Dimensión (Escala 1 a 5)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CRITERIA_CONFIG.map((crit) => {
                    const avg = selectedAlbum.criteria_averages?.[crit.key];
                    const percent = avg ? (avg / crit.max) * 100 : 0;
                    return (
                      <div
                        key={crit.key}
                        className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 flex items-center gap-1">
                            <span>{crit.emoji}</span>
                            <span>{crit.label}</span>
                          </span>
                          <span className="font-bold text-amber-300">
                            {avg ? `${avg} / ${crit.max}` : '—'}
                          </span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${crit.color} rounded-full`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tracklist Ratings */}
            {selectedAlbum.track_stats &&
              selectedAlbum.track_stats.length > 0 && (
                <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      🎵 Calificación por Canciones (
                      {selectedAlbum.track_stats.length})
                    </h4>
                    {selectedAlbum.best_track && (
                      <span className="text-xs text-amber-300 bg-amber-400/10 border border-amber-400/30 px-2.5 py-0.5 rounded-full font-semibold">
                        👑 Mejor: {selectedAlbum.best_track.name} (
                        {selectedAlbum.best_track.avg_rating} ⭐)
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {selectedAlbum.track_stats.map((t, idx) => {
                      const isBest =
                        selectedAlbum.best_track &&
                        selectedAlbum.best_track.name === t.name;
                      const isWorst =
                        selectedAlbum.worst_track &&
                        selectedAlbum.worst_track.name === t.name &&
                        selectedAlbum.track_stats.length > 2;

                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                            isBest
                              ? 'bg-amber-400/10 border border-amber-400/30'
                              : 'bg-white/5 border border-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className="text-slate-500 font-mono text-[10px] w-5 text-right flex-shrink-0">
                              {t.track_number || idx + 1}
                            </span>
                            <span className="text-slate-200 truncate font-medium">
                              {t.name}
                            </span>
                            {isBest && (
                              <span className="text-amber-400 text-xs">👑</span>
                            )}
                            {isWorst && (
                              <span className="text-red-400 text-[10px]">
                                📉
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {t.rating_count > 0 ? (
                              <span className="font-bold text-amber-400 bg-black/40 px-2 py-0.5 rounded-lg border border-white/5">
                                {t.avg_rating} ⭐
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px]">
                                Sin votos
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Community Reviews List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                📝 Reseñas de la Comunidad ({selectedAlbum.reviews?.length || 0}
                )
              </h4>

              {selectedAlbum.reviews && selectedAlbum.reviews.length > 0 ? (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {selectedAlbum.reviews.map((rev) => {
                    const showTracks = expandedReviewTracklist[rev.id];
                    const hasTracks =
                      rev.track_ratings &&
                      Object.keys(rev.track_ratings).length > 0;

                    return (
                      <div
                        key={rev.id}
                        className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-2.5"
                      >
                        {/* Reviewer Header */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={
                                rev.avatar_url ||
                                'https://via.placeholder.com/100/1e293b/ffffff?text=👤'
                              }
                              alt={rev.reviewer_name}
                              className="w-8 h-8 rounded-full object-cover border border-white/10"
                              onError={(e) => {
                                e.target.src =
                                  'https://via.placeholder.com/100/1e293b/ffffff?text=👤';
                              }}
                            />
                            <div>
                              <p className="text-sm font-bold text-white">
                                {rev.reviewer_name}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {new Date(rev.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="bg-amber-400/10 text-amber-300 font-black text-xs px-2.5 py-1 rounded-xl border border-amber-400/30">
                              {rev.rating_general
                                ? `${rev.rating_general} ⭐ General`
                                : '—'}
                            </span>
                          </div>
                        </div>

                        {/* Comment */}
                        {rev.comment && (
                          <p className="text-xs text-slate-300 italic bg-white/5 p-2.5 rounded-xl border border-white/5">
                            "{rev.comment}"
                          </p>
                        )}

                        {/* Criteria Subscores Chips */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {CRITERIA_CONFIG.map((crit) => {
                            const val = rev[crit.key];
                            if (val === null || val === undefined) return null;
                            return (
                              <span
                                key={crit.key}
                                className="text-[10px] bg-white/5 text-slate-300 px-2 py-0.5 rounded-lg border border-white/5"
                              >
                                {crit.emoji} {crit.label}:{' '}
                                <strong>{val}/5</strong>
                              </span>
                            );
                          })}
                        </div>

                        {/* Track ratings toggle */}
                        {hasTracks && (
                          <div>
                            <button
                              onClick={() => toggleTracklistExpansion(rev.id)}
                              className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium mt-1"
                            >
                              {showTracks
                                ? 'Ocultar notas por canción ▲'
                                : 'Ver notas por canción ▼'}
                            </button>

                            {showTracks && (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-2 bg-black/40 p-2.5 rounded-xl border border-white/5">
                                {Object.entries(rev.track_ratings).map(
                                  ([trackKey, tScore]) => {
                                    const trackName = getTrackDisplayName(
                                      trackKey,
                                      selectedAlbum.tracks
                                    );
                                    return (
                                      <div
                                        key={trackKey}
                                        className="text-[10px] flex items-center justify-between bg-white/5 px-2 py-1 rounded-md"
                                      >
                                        <span
                                          className="text-slate-300 truncate pr-1"
                                          title={trackName}
                                        >
                                          {trackName}
                                        </span>
                                        <span className="text-amber-400 font-bold">
                                          {tScore}
                                        </span>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 bg-white/5 rounded-2xl border border-white/5 text-slate-400 text-xs">
                  Aún no hay reseñas registradas para este álbum.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
