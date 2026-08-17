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
    maxValue: 10, // 👈 AGREGAR máximo para cada categoría
  },
  {
    id: 'produccion',
    label: 'Producción',
    emoji: '🎛️',
    color: 'from-blue-500 to-cyan-500',
    maxValue: 5,
  },
  {
    id: 'composicion',
    label: 'Composición',
    emoji: '🎵',
    color: 'from-green-500 to-emerald-500',
    maxValue: 5,
  },
  {
    id: 'letras',
    label: 'Letras',
    emoji: '📝',
    color: 'from-yellow-500 to-orange-500',
    maxValue: 5,
  },
  {
    id: 'originalidad',
    label: 'Originalidad',
    emoji: '💡',
    color: 'from-indigo-500 to-purple-500',
    maxValue: 5,
  },
  {
    id: 'cohesion',
    label: 'Cohesión',
    emoji: '🔗',
    color: 'from-red-500 to-rose-500',
    maxValue: 5,
  },
  {
    id: 'replay',
    label: 'Replay Value',
    emoji: '🔄',
    color: 'from-teal-500 to-cyan-500',
    maxValue: 5,
  },
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
  const [albumType, setAlbumType] = useState('pool'); // 'pool' | 'individual' | 'all'
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

  const formatRating = (rating) => {
    if (rating === null || rating === undefined || isNaN(rating)) {
      return '0.0';
    }
    const num = Number(rating);
    if (Number.isInteger(num)) return num.toFixed(1);
    return (num * 10) % 1 !== 0 ? num.toFixed(2) : num.toFixed(1);
  };

  // 👈 Función para obtener el máximo según la categoría activa
  const getMaxForCategory = (categoryId) => {
    const category = CATEGORIES.find((c) => c.id === categoryId);
    return category ? category.maxValue : 10;
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

  const getRawAlbumsForTab = () => {
    if (activeTab === 'general') {
      return topAlbums;
    }
    return topByCategory[activeTab] || [];
  };

  const getActiveAlbums = () => {
    const rawList = getRawAlbumsForTab();
    if (albumType === 'pool') {
      return rawList.filter((a) => a.status !== 'INDIVIDUAL');
    }
    if (albumType === 'individual') {
      return rawList.filter((a) => a.status === 'INDIVIDUAL');
    }
    return rawList;
  };

  const allCurrentTabAlbums = getRawAlbumsForTab();
  const poolCount = allCurrentTabAlbums.filter(
    (a) => a.status !== 'INDIVIDUAL'
  ).length;
  const individualCount = allCurrentTabAlbums.filter(
    (a) => a.status === 'INDIVIDUAL'
  ).length;

  const activeAlbums = getActiveAlbums();
  const podiumAlbums = activeAlbums.slice(0, 3);
  const restAlbums = activeAlbums.slice(3);

  const top3Reviewers = (topReviewers || []).slice(0, 3);
  const restReviewers = (topReviewers || []).slice(3);

  const renderUserAvatar = (
    reviewer,
    size = 'w-10 h-10',
    borderClass = 'border-white/20'
  ) => {
    if (reviewer.avatar_url) {
      return (
        <img
          src={reviewer.avatar_url}
          alt={reviewer.reviewer_name}
          className={`${size} rounded-full object-cover border-2 ${borderClass} shadow-md shrink-0 bg-white`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = 'none';
          }}
        />
      );
    }
    const initial = (reviewer.reviewer_name || '?').charAt(0).toUpperCase();
    return (
      <div
        className={`${size} rounded-full bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 border-2 ${borderClass} flex items-center justify-center font-bold text-white shadow-md text-sm shrink-0`}
      >
        {initial}
      </div>
    );
  };

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
              const maxValue = cat.maxValue; // 👈 Usar el maxValue de la categoría
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
                    {/* 👈 Pasar el maxValue correcto */}
                    {renderRatingBar(avg, maxValue, idx * 50, cat.color)}
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

      {/* ===== TABS PRINCIPALES ===== */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setActiveView('albums')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeView === 'albums'
              ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-lg shadow-[#f5576c]/20 font-bold'
              : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70'
          }`}
        >
          🎵 Álbumes
        </button>
        <button
          onClick={() => setActiveView('reviewers')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeView === 'reviewers'
              ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-lg shadow-[#f5576c]/20 font-bold'
              : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70'
          }`}
        >
          👤 Reviewers
        </button>
      </div>

      {/* ===== FILTRO POOL vs INDIVIDUAL (SEPARACIÓN DE PODIO) ===== */}
      {activeView === 'albums' && (
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-black/40 p-2 sm:p-2.5 rounded-2xl border border-white/10">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-white/40 text-[11px] font-bold uppercase tracking-wider px-2 hidden md:inline">
              Podio:
            </span>
            <button
              onClick={() => setAlbumType('pool')}
              className={`px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                albumType === 'pool'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 scale-[1.02]'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>🎰</span>
              <span>Álbumes del Pool</span>
              <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded-full font-mono font-semibold">
                {poolCount}
              </span>
            </button>

            <button
              onClick={() => setAlbumType('individual')}
              className={`px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                albumType === 'individual'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 scale-[1.02]'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>📌</span>
              <span>Álbumes Individuales</span>
              <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded-full font-mono font-semibold">
                {individualCount}
              </span>
            </button>

            <button
              onClick={() => setAlbumType('all')}
              className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                albumType === 'all'
                  ? 'bg-white/20 text-white shadow font-bold'
                  : 'bg-transparent text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <span>🌐</span>
              <span>Todos ({allCurrentTabAlbums.length})</span>
            </button>
          </div>

          <div className="text-right px-2">
            <span className="text-white/30 text-[11px]">
              {albumType === 'pool' && 'Mostrando podio de selección del club'}
              {albumType === 'individual' &&
                'Mostrando podio de reseñas individuales'}
              {albumType === 'all' && 'Mostrando podio general unificado'}
            </span>
          </div>
        </div>
      )}

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
                <h4 className="text-white/70 text-xs sm:text-sm tracking-[0.15em] uppercase font-bold flex flex-wrap items-center gap-2">
                  <span>
                    {CATEGORIES.find((c) => c.id === activeTab)?.emoji}
                  </span>
                  <span>
                    TOP{' '}
                    {albumType === 'pool'
                      ? 'ÁLBUMES DEL POOL (CLUB)'
                      : albumType === 'individual'
                        ? 'ÁLBUMES INDIVIDUALES'
                        : 'TODOS LOS ÁLBUMES'}{' '}
                    POR {CATEGORIES.find((c) => c.id === activeTab)?.label}
                  </span>
                  <span className="text-white/30 font-normal text-xs ml-1">
                    ({activeAlbums.length}{' '}
                    {activeAlbums.length === 1 ? 'álbum' : 'álbumes'})
                  </span>
                </h4>
              </div>

              {activeAlbums.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="text-4xl mb-2">
                    {albumType === 'pool'
                      ? '🎰'
                      : albumType === 'individual'
                        ? '📌'
                        : '🎵'}
                  </div>
                  <p className="text-white/70 text-sm font-semibold">
                    {albumType === 'pool'
                      ? 'No hay álbumes del Pool con reviews en esta categoría'
                      : albumType === 'individual'
                        ? 'No hay álbumes individuales con reviews en esta categoría'
                        : 'Sin suficientes reviews para esta categoría'}
                  </p>
                  <p className="text-white/30 text-xs mt-1">
                    Prueba cambiando de categoría o explorando los otros podios
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {albumType !== 'pool' && (
                      <button
                        onClick={() => setAlbumType('pool')}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/30 transition-all"
                      >
                        🎰 Ver Podio del Pool ({poolCount})
                      </button>
                    )}
                    {albumType !== 'individual' && (
                      <button
                        onClick={() => setAlbumType('individual')}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-500/30 transition-all"
                      >
                        📌 Ver Podio Individuales ({individualCount})
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* ===== PODIO - TOP 3 ===== */}
                  {podiumAlbums.length > 0 && (
                    <div className="mb-10 pt-2">
                      <div className="flex flex-col md:flex-row justify-center items-center md:items-end gap-6 md:gap-4 lg:gap-6">
                        {/* 2do Lugar - Izquierda en desktop, 2do en mobile */}
                        {podiumAlbums[1] && (
                          <div className="w-full max-w-[300px] md:w-1/3 order-2 md:order-1 transition-all duration-300 hover:-translate-y-2">
                            <div className="relative bg-gradient-to-b from-slate-300/20 via-slate-400/10 to-black/80 border border-slate-300/40 rounded-2xl p-5 text-center shadow-[0_0_25px_rgba(203,213,225,0.15)] flex flex-col items-center">
                              {/* Medal badge */}
                              <div className="absolute -top-4 bg-slate-300 text-slate-950 font-black text-xs px-3 py-1 rounded-full shadow-lg border border-white/40 flex items-center gap-1 z-10">
                                <span>🥈</span> #2 LUGAR
                              </div>

                              {/* Album cover */}
                              <div className="relative mt-2 w-32 h-32 sm:w-36 sm:h-36 mx-auto">
                                <div className="absolute -inset-2 bg-slate-300/20 rounded-2xl blur-lg"></div>
                                <img
                                  src={podiumAlbums[1].image_url}
                                  alt={podiumAlbums[1].album_name}
                                  className="relative w-full h-full object-cover rounded-xl border border-slate-200/50 shadow-xl"
                                  onError={(e) => {
                                    e.target.src =
                                      'https://via.placeholder.com/200/1a1a2e/ffffff?text=🎵';
                                  }}
                                />
                              </div>

                              <div className="mt-3 w-full">
                                <div className="mb-1">
                                  <span
                                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                      podiumAlbums[1].status === 'INDIVIDUAL'
                                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    }`}
                                  >
                                    {podiumAlbums[1].status === 'INDIVIDUAL'
                                      ? '📌 Individual'
                                      : '🎰 Pool Club'}
                                  </span>
                                </div>
                                <h4
                                  className="text-white font-bold text-sm sm:text-base truncate"
                                  title={podiumAlbums[1].album_name}
                                >
                                  {podiumAlbums[1].album_name}
                                </h4>
                                <p
                                  className="text-white/50 text-xs truncate"
                                  title={podiumAlbums[1].artist_name}
                                >
                                  {podiumAlbums[1].artist_name}
                                </p>
                              </div>

                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-slate-200 text-xl font-black">
                                  ★{' '}
                                  {formatRating(
                                    podiumAlbums[1].avg_rating || 0
                                  )}
                                </span>
                              </div>

                              {/* Bonus badge */}
                              {podiumAlbums[1].bonus > 0 && (
                                <span className="mt-1 text-[10px] bg-slate-400/20 text-slate-200 px-2.5 py-0.5 rounded-full border border-slate-300/30 font-medium">
                                  ⚡ +{podiumAlbums[1].bonus.toFixed(2)} bonus (
                                  {podiumAlbums[1].review_count} reviews)
                                </span>
                              )}

                              <div className="mt-2 w-full px-2">
                                {renderRatingBar(
                                  podiumAlbums[1].avg_rating || 0,
                                  getMaxForCategory(activeTab),
                                  100,
                                  'from-slate-300 to-slate-400'
                                )}
                              </div>
                              <div className="text-white/30 text-[10px] mt-1.5 font-medium">
                                {podiumAlbums[1].review_count}{' '}
                                {podiumAlbums[1].review_count === 1
                                  ? 'review'
                                  : 'reviews'}
                              </div>

                              {/* Pedestal Base */}
                              <div className="mt-4 w-full bg-gradient-to-r from-slate-400/20 via-slate-300/20 to-slate-400/20 border-t border-slate-300/30 text-slate-200 font-extrabold text-[11px] py-1.5 uppercase tracking-widest rounded-b-xl">
                                🥈 SUB-CAMPEÓN #2
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 1er Lugar - Centro en desktop (más alto / elevado), 1ro en mobile */}
                        {podiumAlbums[0] && (
                          <div className="w-full max-w-[340px] md:w-2/5 order-1 md:order-2 md:-translate-y-4 transition-all duration-300 hover:-translate-y-6">
                            <div className="relative bg-gradient-to-b from-amber-500/25 via-yellow-500/10 to-black/90 border-2 border-yellow-400/60 rounded-3xl p-5 sm:p-6 text-center shadow-[0_0_40px_rgba(234,179,8,0.3)] flex flex-col items-center">
                              {/* Crown & Winner Badge */}
                              <div className="absolute -top-5 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm px-4 py-1.5 rounded-full shadow-2xl border-2 border-yellow-200 flex items-center gap-1.5 z-10 animate-bounce">
                                👑 🥇 #1 CAMPEÓN
                              </div>

                              {/* Album cover */}
                              <div className="relative mt-3 w-40 h-40 sm:w-48 sm:h-48 mx-auto">
                                <div className="absolute -inset-3 bg-gradient-to-r from-yellow-400/40 via-amber-500/40 to-yellow-400/40 rounded-3xl blur-xl animate-pulse"></div>
                                <img
                                  src={podiumAlbums[0].image_url}
                                  alt={podiumAlbums[0].album_name}
                                  className="relative w-full h-full object-cover rounded-2xl border-2 border-yellow-300/80 shadow-2xl ring-4 ring-yellow-400/30"
                                  onError={(e) => {
                                    e.target.src =
                                      'https://via.placeholder.com/200/1a1a2e/ffffff?text=🎵';
                                  }}
                                />
                              </div>

                              <div className="mt-4 w-full">
                                <div className="mb-1">
                                  <span
                                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                                      podiumAlbums[0].status === 'INDIVIDUAL'
                                        ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/40 shadow-sm'
                                        : 'bg-amber-500/25 text-amber-300 border border-amber-400/40 shadow-sm'
                                    }`}
                                  >
                                    {podiumAlbums[0].status === 'INDIVIDUAL'
                                      ? '📌 Individual'
                                      : '🎰 Pool Club'}
                                  </span>
                                </div>
                                <h4
                                  className="text-white font-black text-base sm:text-lg lg:text-xl truncate"
                                  title={podiumAlbums[0].album_name}
                                >
                                  {podiumAlbums[0].album_name}
                                </h4>
                                <p
                                  className="text-amber-200/70 text-xs sm:text-sm font-medium truncate"
                                  title={podiumAlbums[0].artist_name}
                                >
                                  {podiumAlbums[0].artist_name}
                                </p>
                              </div>

                              <div className="mt-2.5 flex items-center gap-2">
                                <span className="text-yellow-400 text-2xl sm:text-3xl font-black tracking-tight">
                                  ★{' '}
                                  {formatRating(
                                    podiumAlbums[0].avg_rating || 0
                                  )}
                                </span>
                              </div>

                              {/* Bonus badge */}
                              {podiumAlbums[0].bonus > 0 && (
                                <span className="mt-1.5 text-xs bg-yellow-400/20 text-yellow-300 px-3 py-0.5 rounded-full border border-yellow-400/40 font-semibold shadow-sm">
                                  ⚡ +{podiumAlbums[0].bonus.toFixed(2)} bonus (
                                  {podiumAlbums[0].review_count} reviews)
                                </span>
                              )}

                              <div className="mt-3 w-full px-2">
                                {renderRatingBar(
                                  podiumAlbums[0].avg_rating || 0,
                                  getMaxForCategory(activeTab),
                                  0,
                                  'from-yellow-400 via-amber-400 to-yellow-500'
                                )}
                              </div>
                              <div className="text-yellow-200/40 text-xs mt-1.5 font-semibold">
                                {podiumAlbums[0].review_count}{' '}
                                {podiumAlbums[0].review_count === 1
                                  ? 'review'
                                  : 'reviews'}
                              </div>

                              {/* Pedestal Base */}
                              <div className="mt-4 w-full bg-gradient-to-r from-yellow-500/30 via-amber-400/20 to-yellow-500/30 border-t border-yellow-400/40 text-yellow-300 font-black text-xs py-2 uppercase tracking-widest rounded-b-2xl shadow-inner">
                                🏆 PODIO #1
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 3er Lugar - Derecha en desktop, 3ro en mobile */}
                        {podiumAlbums[2] && (
                          <div className="w-full md:w-1/3 max-w-[280px] order-3 md:order-3 transition-all duration-300 hover:-translate-y-2">
                            <div className="relative bg-gradient-to-b from-amber-700/20 via-amber-800/10 to-black/80 border border-amber-600/40 rounded-2xl p-4 text-center shadow-[0_0_20px_rgba(217,119,6,0.2)] flex flex-col items-center">
                              {/* Medal badge */}
                              <div className="absolute -top-4 bg-amber-600 text-amber-950 font-black text-xs px-3 py-1 rounded-full shadow-lg border border-amber-400/40 flex items-center gap-1 z-10">
                                <span>🥉</span> #3 LUGAR
                              </div>

                              {/* Album cover */}
                              <div className="relative mt-2 w-28 h-28 sm:w-32 sm:h-32 mx-auto">
                                <div className="absolute -inset-2 bg-amber-600/20 rounded-2xl blur-lg"></div>
                                <img
                                  src={podiumAlbums[2].image_url}
                                  alt={podiumAlbums[2].album_name}
                                  className="relative w-full h-full object-cover rounded-xl border border-amber-600/40 shadow-lg"
                                  onError={(e) => {
                                    e.target.src =
                                      'https://via.placeholder.com/200/1a1a2e/ffffff?text=🎵';
                                  }}
                                />
                              </div>

                              <div className="mt-3 w-full">
                                <div className="mb-1">
                                  <span
                                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                      podiumAlbums[2].status === 'INDIVIDUAL'
                                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    }`}
                                  >
                                    {podiumAlbums[2].status === 'INDIVIDUAL'
                                      ? '📌 Individual'
                                      : '🎰 Pool Club'}
                                  </span>
                                </div>
                                <h4
                                  className="text-white font-bold text-xs sm:text-sm truncate"
                                  title={podiumAlbums[2].album_name}
                                >
                                  {podiumAlbums[2].album_name}
                                </h4>
                                <p
                                  className="text-white/40 text-[11px] truncate"
                                  title={podiumAlbums[2].artist_name}
                                >
                                  {podiumAlbums[2].artist_name}
                                </p>
                              </div>

                              <div className="mt-2 flex items-center gap-1.5">
                                <span className="text-amber-400 text-lg font-black">
                                  ★{' '}
                                  {formatRating(
                                    podiumAlbums[2].avg_rating || 0
                                  )}
                                </span>
                              </div>

                              {/* Bonus badge */}
                              {podiumAlbums[2].bonus > 0 && (
                                <span className="mt-1 text-[10px] bg-amber-600/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-medium">
                                  ⚡ +{podiumAlbums[2].bonus.toFixed(2)} bonus (
                                  {podiumAlbums[2].review_count} reviews)
                                </span>
                              )}

                              <div className="mt-2 w-full px-2">
                                {renderRatingBar(
                                  podiumAlbums[2].avg_rating || 0,
                                  getMaxForCategory(activeTab),
                                  200,
                                  'from-amber-600 to-amber-700'
                                )}
                              </div>
                              <div className="text-white/30 text-[10px] mt-1.5 font-medium">
                                {podiumAlbums[2].review_count}{' '}
                                {podiumAlbums[2].review_count === 1
                                  ? 'review'
                                  : 'reviews'}
                              </div>

                              {/* Pedestal Base */}
                              <div className="mt-4 w-full bg-gradient-to-r from-amber-700/30 via-amber-600/20 to-amber-700/30 border-t border-amber-600/30 text-amber-300 font-extrabold text-[11px] py-1.5 uppercase tracking-widest rounded-b-xl">
                                🥉 3ER LUGAR #3
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ===== RESTO DE ÁLBUMES ===== */}
                  {restAlbums.length > 0 && (
                    <div className="border-t border-white/10 pt-5">
                      <p className="text-white/40 text-xs uppercase tracking-wider mb-4 font-semibold flex items-center gap-2">
                        <span>🎵</span> Otros álbumes destacados en el Ranking{' '}
                        {albumType === 'pool'
                          ? '(Pool Club)'
                          : albumType === 'individual'
                            ? '(Individuales)'
                            : ''}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {restAlbums.map((album, idx) => {
                          const rating = album.avg_rating || 0;
                          const position = idx + 4;

                          return (
                            <div
                              key={idx}
                              className="bg-white/5 rounded-xl p-3 border border-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-[1.03] transition-all duration-300 text-center flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-white/50 text-[11px] font-extrabold">
                                    #{position}
                                  </span>
                                  <span
                                    className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${
                                      album.status === 'INDIVIDUAL'
                                        ? 'bg-cyan-500/20 text-cyan-300'
                                        : 'bg-amber-500/20 text-amber-300'
                                    }`}
                                  >
                                    {album.status === 'INDIVIDUAL'
                                      ? '📌 Ind.'
                                      : '🎰 Pool'}
                                  </span>
                                </div>
                                <div className="relative w-20 h-20 sm:w-28 sm:h-28 mx-auto">
                                  <img
                                    src={album.image_url}
                                    alt={album.album_name}
                                    className="w-full h-full object-cover rounded-lg shadow-md"
                                    onError={(e) => {
                                      e.target.src =
                                        'https://via.placeholder.com/100/1a1a2e/ffffff?text=🎵';
                                    }}
                                  />
                                </div>
                                <h5
                                  className="text-white/90 text-xs truncate mt-2 font-semibold"
                                  title={album.album_name}
                                >
                                  {album.album_name}
                                </h5>
                                <p
                                  className="text-white/40 text-[10px] truncate"
                                  title={album.artist_name}
                                >
                                  {album.artist_name}
                                </p>
                              </div>

                              <div className="mt-2">
                                <div className="flex items-center justify-center gap-1">
                                  <span className="text-[#f5576c] text-sm font-bold">
                                    ★ {formatRating(rating)}
                                  </span>
                                </div>
                                {album.bonus > 0 && (
                                  <span className="text-[9px] text-[#f093fb] bg-[#f093fb]/10 px-1.5 py-0.5 rounded border border-[#f093fb]/20 inline-block mt-0.5 font-medium">
                                    +{album.bonus.toFixed(2)} pts
                                  </span>
                                )}
                                <div className="text-white/30 text-[9px] mt-0.5">
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
                </>
              )}
            </div>
          </div>
        )}

        {/* ===== REVIEWERS ===== */}
        {activeView === 'reviewers' && (
          <div>
            <div className="bg-white/5 rounded-2xl p-4 sm:p-6 border border-white/5 shadow-2xl backdrop-blur-md">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-white/80 text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase flex items-center gap-2">
                  🏆 Leaderboard de Reviewers
                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/50 font-normal">
                    {topReviewers.length} destacados
                  </span>
                </h4>
              </div>

              {topReviewers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/30 text-sm">Sin reviews aún</p>
                </div>
              ) : (
                <>
                  {/* PODIO TOP 3 REVIEWERS */}
                  {top3Reviewers.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {top3Reviewers.map((reviewer, idx) => {
                        const orderClass =
                          idx === 0
                            ? 'md:order-2 md:-translate-y-2'
                            : idx === 1
                              ? 'md:order-1'
                              : 'md:order-3';

                        const podiumTheme =
                          idx === 0
                            ? {
                                border:
                                  'border-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.2)]',
                                bg: 'bg-gradient-to-b from-amber-500/15 via-amber-950/20 to-black/40',
                                badge:
                                  'bg-amber-400/20 text-amber-300 border-amber-400/30',
                                badgeText: '👑 #1 Crítico Principal',
                                medal: '🥇',
                                avatarBorder:
                                  'border-amber-400 shadow-amber-400/30',
                                ratingColor: 'text-amber-300',
                              }
                            : idx === 1
                              ? {
                                  border:
                                    'border-slate-300/40 shadow-[0_0_20px_rgba(203,213,225,0.15)]',
                                  bg: 'bg-gradient-to-b from-slate-400/15 via-slate-900/20 to-black/40',
                                  badge:
                                    'bg-slate-300/20 text-slate-200 border-slate-300/30',
                                  badgeText: '🥈 #2 Subcampeón',
                                  medal: '🥈',
                                  avatarBorder:
                                    'border-slate-300 shadow-slate-300/30',
                                  ratingColor: 'text-slate-200',
                                }
                              : {
                                  border:
                                    'border-amber-700/40 shadow-[0_0_20px_rgba(180,83,9,0.15)]',
                                  bg: 'bg-gradient-to-b from-amber-800/15 via-zinc-900/20 to-black/40',
                                  badge:
                                    'bg-amber-700/20 text-amber-400 border-amber-700/30',
                                  badgeText: '🥉 #3 Podio',
                                  medal: '🥉',
                                  avatarBorder:
                                    'border-amber-600 shadow-amber-600/30',
                                  ratingColor: 'text-amber-400',
                                };

                        return (
                          <div
                            key={reviewer.reviewer_name}
                            className={`rounded-2xl p-5 border transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between ${podiumTheme.border} ${podiumTheme.bg} ${orderClass}`}
                          >
                            <div>
                              <div className="flex justify-between items-center mb-3">
                                <span
                                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${podiumTheme.badge}`}
                                >
                                  {podiumTheme.badgeText}
                                </span>
                                <span className="text-2xl">
                                  {podiumTheme.medal}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 my-2">
                                {renderUserAvatar(
                                  reviewer,
                                  'w-12 h-12',
                                  podiumTheme.avatarBorder
                                )}
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-white font-bold text-base truncate">
                                    {reviewer.reviewer_name}
                                  </h5>
                                  <p className="text-white/40 text-xs truncate">
                                    {reviewer.reviewer_email ||
                                      'Crítico activo'}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 my-4 bg-black/30 rounded-xl p-2.5 text-center border border-white/5">
                                <div>
                                  <p className="text-[10px] text-white/40 uppercase tracking-wider">
                                    Reviews
                                  </p>
                                  <p className="text-sm font-bold text-white">
                                    {reviewer.review_count}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-white/40 uppercase tracking-wider">
                                    Álbumes
                                  </p>
                                  <p className="text-sm font-bold text-white">
                                    {reviewer.album_count}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-white/40 uppercase tracking-wider">
                                    Promedio
                                  </p>
                                  <p
                                    className={`text-sm font-bold ${podiumTheme.ratingColor}`}
                                  >
                                    ★ {formatRating(reviewer.avg_rating)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div>
                              {renderRatingBar(
                                reviewer.avg_rating || 0,
                                10,
                                idx * 100,
                                idx === 0
                                  ? 'from-amber-400 to-amber-600'
                                  : idx === 1
                                    ? 'from-slate-200 to-slate-400'
                                    : 'from-amber-600 to-amber-800'
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* RESTO DE REVIEWERS (#4 EN ADELANTE) */}
                  {restReviewers.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-3">
                        Otros Críticos Destacados
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {restReviewers.map((reviewer, idx) => {
                          const rank = idx + 4;
                          return (
                            <div
                              key={reviewer.reviewer_name}
                              className="bg-white/5 rounded-xl p-3.5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all duration-200 flex items-center gap-3"
                            >
                              <span className="text-xs font-bold text-white/40 w-6 text-center">
                                #{rank}
                              </span>
                              {renderUserAvatar(
                                reviewer,
                                'w-9 h-9',
                                'border-white/10'
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">
                                  {reviewer.reviewer_name}
                                </p>
                                <div className="flex gap-2 text-[11px] text-white/40">
                                  <span>
                                    📝 {reviewer.review_count} reviews
                                  </span>
                                  <span>·</span>
                                  <span>💿 {reviewer.album_count} álbumes</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-bold text-white/90 block">
                                  ★ {formatRating(reviewer.avg_rating)}
                                </span>
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
