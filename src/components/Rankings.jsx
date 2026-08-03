// src/components/Rankings.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '../services/supabaseClient';

// Constantes para las categorías
const CATEGORIES = [
  {
    id: 'general',
    label: 'General',
    emoji: '⭐',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'produccion',
    label: 'Producción',
    emoji: '🎛️',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'composicion',
    label: 'Composición',
    emoji: '🎵',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'letras',
    label: 'Letras',
    emoji: '📝',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'originalidad',
    label: 'Originalidad',
    emoji: '💡',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    id: 'cohesion',
    label: 'Cohesión',
    emoji: '🔗',
    color: 'from-red-500 to-rose-500',
  },
  {
    id: 'replay',
    label: 'Replay Value',
    emoji: '🔄',
    color: 'from-teal-500 to-cyan-500',
  },
];

// Medallas para el podio
const MEDALS = ['🥇', '🥈', '🥉'];

// Colores para el podio
const PODIUM_COLORS = [
  'from-yellow-400/20 to-yellow-600/20 border-yellow-400/30',
  'from-gray-300/20 to-gray-400/20 border-gray-300/30',
  'from-amber-600/20 to-amber-700/20 border-amber-600/30',
];

const PODIUM_GLOW = [
  'shadow-yellow-500/20',
  'shadow-gray-400/20',
  'shadow-amber-600/20',
];

export function Rankings({ albums, isAdmin = false }) {
  const [rankings, setRankings] = useState({
    topReviewers: [],
    topAlbums: [],
    topByCategory: {},
    stats: {},
    loading: true,
    totalReviews: 0,
  });

  const [activeTab, setActiveTab] = useState('general');
  const [activeView, setActiveView] = useState('albums');
  const [expandedStats, setExpandedStats] = useState(false);
  const [animate, setAnimate] = useState(false);

  const loadRankings = useCallback(async () => {
    setRankings((prev) => ({ ...prev, loading: true }));

    try {
      const [topReviewers, topAlbums, allReviews, stats, categoryRankings] =
        await Promise.all([
          supabaseService.getTopReviewers(),
          supabaseService.getTopAlbums(),
          supabaseService.getAllReviews(),
          supabaseService.getGlobalStats(),
          supabaseService.getTopByAllCategories(),
        ]);

      setRankings({
        topReviewers: topReviewers || [],
        topAlbums: topAlbums || [],
        topByCategory: categoryRankings || {},
        stats: stats || {},
        loading: false,
        totalReviews: allReviews?.length || 0,
      });

      setTimeout(() => setAnimate(true), 100);
    } catch (error) {
      console.error('Error loading rankings:', error);
      setRankings((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
    }
  }, []);

  useEffect(() => {
    loadRankings();
  }, [loadRankings]);

  const renderRatingBar = (
    rating,
    max = 10,
    delay = 0,
    color = 'from-[#f5576c] to-[#f093fb]'
  ) => {
    const safeRating = rating ?? 0;
    const percentage = Math.min((safeRating / max) * 100, 100);
    return (
      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-1000 ${
            animate ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            width: animate ? `${percentage}%` : '0%',
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
    );
  };

  const getMedal = (index) => {
    if (index < 3) return MEDALS[index];
    return `#${index + 1}`;
  };

  const formatRating = (rating) => {
    if (rating === null || rating === undefined || isNaN(rating)) {
      return '0.0';
    }
    return rating.toFixed(1);
  };

  if (rankings.loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            <span
              className="w-3 h-3 bg-[#f5576c] rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="w-3 h-3 bg-[#f093fb] rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="w-3 h-3 bg-[#f5576c] rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
          <span className="text-white/30 text-sm">Cargando rankings...</span>
        </div>
      </div>
    );
  }

  const { stats, topReviewers, topAlbums, topByCategory } = rankings;

  const getActiveAlbums = () => {
    if (activeTab === 'general') {
      return topAlbums;
    }
    return topByCategory[activeTab] || [];
  };

  const activeAlbums = getActiveAlbums();
  const podiumAlbums = activeAlbums.slice(0, 3);
  const restAlbums = activeAlbums.slice(3);

  return (
    <div className="mt-8 pt-6 border-t border-white/5">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h3 className="text-white text-xl font-bold tracking-tight flex items-center gap-3">
            <span className="text-2xl">📊</span>
            Rankings & Estadísticas
            <span className="text-xs font-normal text-white/30 bg-white/5 px-3 py-1 rounded-full border border-white/5">
              {rankings.totalReviews} reviews
            </span>
          </h3>
          <p className="text-white/30 text-sm mt-1 hidden sm:block">
            Descubre los álbumes y reviewers mejor calificados
          </p>
        </div>

        <button
          onClick={() => setExpandedStats(!expandedStats)}
          className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10"
        >
          {expandedStats ? '📊 Ver menos' : '📈 Ver estadísticas globales'}
          <span
            className={`transition-transform duration-300 ${expandedStats ? 'rotate-180' : ''}`}
          >
            ▼
          </span>
        </button>
      </div>

      {/* ===== ESTADÍSTICAS GLOBALES ===== */}
      {expandedStats && stats && (
        <div className="mb-6 p-6 bg-white/5 rounded-2xl border border-white/5 animate-fadeIn">
          <h4 className="text-white/40 text-xs tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
            <span className="text-[#f5576c]">📊</span>
            Promedios globales por categoría
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {CATEGORIES.map((cat, idx) => {
              const avg = stats[`avg_${cat.id}`] || 0;
              return (
                <div
                  key={cat.id}
                  className="bg-black/40 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all hover:scale-105"
                >
                  <div className="text-2xl text-center">{cat.emoji}</div>
                  <div className="text-white text-2xl font-bold text-center mt-1">
                    {avg.toFixed(1)}
                  </div>
                  <div className="text-white/20 text-[10px] uppercase tracking-wider text-center">
                    {cat.label}
                  </div>
                  <div className="mt-2">
                    {renderRatingBar(avg, 10, idx * 50, cat.color)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Distribución */}
          {stats.distribution && Object.keys(stats.distribution).length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/5">
              <h4 className="text-white/40 text-xs tracking-[0.2em] uppercase mb-3">
                Distribución de calificaciones
              </h4>
              <div className="bg-black/30 rounded-xl p-4">
                <div className="flex items-end gap-1 h-20">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => {
                    const count = stats.distribution[score] || 0;
                    const max = Math.max(
                      ...Object.values(stats.distribution || {})
                    );
                    const height = max > 0 ? (count / max) * 100 : 0;
                    const isHighest = count === max && max > 0;

                    return (
                      <div
                        key={score}
                        className="flex-1 flex flex-col items-center"
                      >
                        <div
                          className={`w-full rounded-t transition-all duration-700 ${
                            isHighest
                              ? 'bg-gradient-to-t from-[#f5576c] to-[#f093fb]'
                              : 'bg-[#f5576c]/30'
                          }`}
                          style={{
                            height: animate
                              ? `${Math.max(height * 0.6, 2)}px`
                              : '2px',
                          }}
                        />
                        <span className="text-white/40 text-xs mt-1">
                          {score}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== TABS ===== */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setActiveView('albums')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeView === 'albums'
              ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-lg shadow-[#f5576c]/20'
              : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70'
          }`}
        >
          🎵 Álbumes
        </button>
        <button
          onClick={() => setActiveView('reviewers')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeView === 'reviewers'
              ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-lg shadow-[#f5576c]/20'
              : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70'
          }`}
        >
          👤 Reviewers
        </button>
      </div>

      {/* ===== CATEGORÍAS ===== */}
      {activeView === 'albums' && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-300 ${
                activeTab === cat.id
                  ? `bg-gradient-to-r ${cat.color} text-white shadow-lg border border-white/20`
                  : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70 border border-white/5'
              }`}
            >
              <span className="mr-1">{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* ===== CONTENIDO PRINCIPAL ===== */}
      <div className="grid grid-cols-1 gap-4">
        {/* ÁLBUMES - VISTA PODIO */}
        {activeView === 'albums' && (
          <div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-white/60 text-xs tracking-[0.2em] uppercase flex items-center gap-2">
                  <span>
                    {CATEGORIES.find((c) => c.id === activeTab)?.emoji}
                  </span>
                  TOP Álbumes por{' '}
                  {CATEGORIES.find((c) => c.id === activeTab)?.label}
                  <span className="text-white/20 font-normal text-[10px] ml-2">
                    {activeAlbums.length} resultados
                  </span>
                </h4>
              </div>

              {activeAlbums.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/20 text-sm">
                    Sin suficientes reviews para esta categoría
                  </p>
                </div>
              ) : (
                <>
                  {/* ===== PODIO - TOP 3 ===== */}
                  {podiumAlbums.length > 0 && (
                    <div className="mb-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {podiumAlbums.map((album, idx) => {
                          const rating = album.avg_rating || 0;
                          const isGold = idx === 0;
                          const isSilver = idx === 1;
                          const isBronze = idx === 2;

                          // Escala de tamaño: 1er lugar más grande
                          const sizeClass = isGold
                            ? 'md:scale-110'
                            : isSilver
                              ? 'md:scale-100'
                              : 'md:scale-95';
                          const orderClass = isGold
                            ? 'md:order-2'
                            : isSilver
                              ? 'md:order-1'
                              : 'md:order-3';

                          return (
                            <div
                              key={idx}
                              className={`${orderClass} ${sizeClass} transition-all duration-500`}
                              style={{
                                animationDelay: `${idx * 150}ms`,
                              }}
                            >
                              <div
                                className={`relative bg-gradient-to-br ${PODIUM_COLORS[idx]} border rounded-2xl p-4 text-center hover:scale-105 transition-transform duration-300 shadow-lg ${PODIUM_GLOW[idx]}`}
                              >
                                {/* Medalla */}
                                <div className="text-5xl mb-2 animate-bounce">
                                  {getMedal(idx)}
                                </div>

                                {/* Posición */}
                                <div className="text-white/20 text-xs font-bold tracking-widest mb-2">
                                  #{idx + 1}
                                </div>

                                {/* Imagen del álbum - GRANDE Y DESTACADA */}
                                <div className="relative mx-auto w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48">
                                  <div
                                    className={`absolute -inset-2 bg-gradient-to-r ${PODIUM_COLORS[idx]} rounded-2xl blur-xl opacity-30`}
                                  ></div>
                                  <img
                                    src={album.image_url}
                                    alt={album.album_name}
                                    className="relative w-full h-full object-cover rounded-xl border-2 border-white/10 shadow-2xl"
                                    onError={(e) => {
                                      e.target.src =
                                        'https://via.placeholder.com/200/1a1a2e/ffffff?text=🎵';
                                    }}
                                  />
                                  {isGold && (
                                    <div className="absolute -top-2 -right-2 text-2xl animate-pulse">
                                      👑
                                    </div>
                                  )}
                                </div>

                                {/* Info del álbum */}
                                <div className="mt-3">
                                  <h4 className="text-white font-bold text-sm sm:text-base truncate">
                                    {album.album_name}
                                  </h4>
                                  <p className="text-white/40 text-xs truncate">
                                    {album.artist_name}
                                  </p>
                                </div>

                                {/* Rating */}
                                <div className="mt-2 flex items-center justify-center gap-2">
                                  <span className="text-[#f5576c] text-2xl font-bold">
                                    ★ {formatRating(rating)}
                                  </span>
                                </div>
                                <div className="mt-1 px-3">
                                  {renderRatingBar(
                                    rating,
                                    10,
                                    idx * 100,
                                    isGold
                                      ? 'from-yellow-400 to-yellow-600'
                                      : isSilver
                                        ? 'from-gray-300 to-gray-400'
                                        : 'from-amber-600 to-amber-700'
                                  )}
                                </div>
                                <div className="text-white/20 text-[10px] mt-1">
                                  {album.review_count}{' '}
                                  {album.review_count === 1
                                    ? 'review'
                                    : 'reviews'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ===== RESTO DE ÁLBUMES ===== */}
                  {restAlbums.length > 0 && (
                    <div className="border-t border-white/5 pt-4">
                      <p className="text-white/20 text-[10px] uppercase tracking-wider mb-3">
                        Más álbumes destacados
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {restAlbums.map((album, idx) => {
                          const rating = album.avg_rating || 0;
                          const position = idx + 4;

                          return (
                            <div
                              key={idx}
                              className="bg-white/5 rounded-xl p-3 border border-white/5 hover:bg-white/10 hover:scale-105 transition-all duration-300 text-center"
                            >
                              <div className="text-white/20 text-[10px] font-bold mb-1">
                                #{position}
                              </div>
                              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto">
                                <img
                                  src={album.image_url}
                                  alt={album.album_name}
                                  className="w-full h-full object-cover rounded-lg"
                                  onError={(e) => {
                                    e.target.src =
                                      'https://via.placeholder.com/100/1a1a2e/ffffff?text=🎵';
                                  }}
                                />
                              </div>
                              <h5 className="text-white/80 text-xs truncate mt-1 font-medium">
                                {album.album_name}
                              </h5>
                              <p className="text-white/30 text-[10px] truncate">
                                {album.artist_name}
                              </p>
                              <div className="flex items-center justify-center gap-1 mt-1">
                                <span className="text-[#f5576c] text-sm font-bold">
                                  ★ {formatRating(rating)}
                                </span>
                              </div>
                              <div className="text-white/20 text-[8px]">
                                {album.review_count} reviews
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ===== REVIEWERS ===== */}
        {activeView === 'reviewers' && (
          <div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <h4 className="text-white/60 text-xs tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
                🏆 TOP Reviewers
                <span className="text-white/20 font-normal text-[10px]">
                  {topReviewers.length} destacados
                </span>
              </h4>

              {topReviewers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/20 text-sm">Sin reviews aún</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {topReviewers.map((reviewer, idx) => {
                    const isTop3 = idx < 3;
                    return (
                      <div
                        key={idx}
                        className={`bg-white/5 rounded-xl p-4 border transition-all duration-300 hover:scale-105 ${
                          isTop3
                            ? `border-${idx === 0 ? 'yellow' : idx === 1 ? 'gray' : 'amber'}-400/30 bg-gradient-to-br ${PODIUM_COLORS[idx]}`
                            : 'border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{getMedal(idx)}</span>
                          <div className="flex-1">
                            <p className="text-white font-medium truncate">
                              {reviewer.reviewer_name}
                            </p>
                            <div className="flex gap-3 text-xs text-white/30">
                              <span>📝 {reviewer.review_count}</span>
                              <span>💿 {reviewer.album_count}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-lg font-bold ${isTop3 ? 'text-[#f5576c]' : 'text-white/60'}`}
                            >
                              ★ {formatRating(reviewer.avg_rating)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2">
                          {renderRatingBar(
                            reviewer.avg_rating || 0,
                            10,
                            idx * 100,
                            isTop3
                              ? 'from-[#f5576c] to-[#f093fb]'
                              : 'from-white/30 to-white/10'
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== FOOTER ===== */}
      <div className="mt-4 text-center text-white/10 text-[10px] tracking-wider">
        Datos actualizados en tiempo real · {rankings.totalReviews} reviews
        totales
        {isAdmin && (
          <span className="ml-4 text-[#f5576c]/40">🔑 Modo Admin</span>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
