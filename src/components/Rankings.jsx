// src/components/Rankings.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabaseService } from '../services/supabaseClient';

// Constantes para las categorías
const CATEGORIES = [
  {
    id: 'general',
    label: 'General',
    emoji: '⭐',
    color: 'from-purple-500 to-pink-500',
    maxValue: 10,
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
  const [albumType, setAlbumType] = useState('pool');
  const [expandedStats, setExpandedStats] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [flippedCards, setFlippedCards] = useState({});

  const toggleCardFlip = (cardKey) => {
    setFlippedCards((prev) => ({
      ...prev,
      [cardKey]: !prev[cardKey],
    }));
  };

  // Refs para los sliders
  const albumSliderRef = useRef(null);
  const reviewerSliderRef = useRef(null);

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

  const getMaxForCategory = (categoryId) => {
    const category = CATEGORIES.find((c) => c.id === categoryId);
    return category ? category.maxValue : 10;
  };

  // Funciones para el slider
  const scrollSlider = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = ref.current.offsetWidth * 0.8;
      ref.current.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth',
      });
    }
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
  const currentCategory =
    CATEGORIES.find((c) => c.id === activeTab) || CATEGORIES[0];

  const activeAlbums = getActiveAlbums();
  const podiumAlbums = activeAlbums.slice(0, 3);
  const restAlbums = activeAlbums.slice(3, 10);

  const top3Reviewers = (topReviewers || []).slice(0, 3);
  const restReviewers = (topReviewers || []).slice(3, 10);

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
          loading="lazy"
          decoding="async"
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
              const maxValue = cat.maxValue;
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
                    {renderRatingBar(avg, maxValue, idx * 50, cat.color)}
                  </div>
                </div>
              );
            })}
          </div>

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

      {/* ===== FILTROS Y CATEGORÍAS (RESPONSIVE) ===== */}
      {activeView === 'albums' && (
        <>
          {/* MODO MÓVIL / PANTALLAS REDUCIDAS (< lg): Botón intuitivo y compacto */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className="w-full flex items-center justify-between p-3 sm:p-3.5 bg-black/40 hover:bg-black/60 active:scale-[0.99] border border-white/10 hover:border-white/20 rounded-2xl transition-all shadow-lg backdrop-blur-md text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#f5576c]/20 to-[#f093fb]/20 border border-[#f5576c]/30 flex items-center justify-center text-base shrink-0">
                  🎯
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-white font-bold text-xs">
                      Filtros de Podio:
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/10 flex items-center gap-1">
                      <span>{currentCategory.emoji}</span>
                      <span>{currentCategory.label}</span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        albumType === 'pool'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : albumType === 'individual'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-white/10 text-white/80 border border-white/10'
                      }`}
                    >
                      {albumType === 'pool' && `🎰 Pool (${poolCount})`}
                      {albumType === 'individual' &&
                        `📌 Indiv (${individualCount})`}
                      {albumType === 'all' &&
                        `🌐 Todos (${allCurrentTabAlbums.length})`}
                    </span>
                  </div>
                  <p className="text-white/40 text-[10px] sm:text-[11px] truncate mt-0.5">
                    {albumType === 'pool' &&
                      'Mostrando podio de selección del club'}
                    {albumType === 'individual' &&
                      'Mostrando podio de reseñas individuales'}
                    {albumType === 'all' && 'Mostrando podio general unificado'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 pl-2 shrink-0">
                <span className="text-[11px] text-[#f093fb] font-semibold hidden sm:inline">
                  {showFilterDrawer ? 'Cerrar' : 'Cambiar'}
                </span>
                <div
                  className={`w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/60 text-xs transition-transform duration-300 ${
                    showFilterDrawer ? 'rotate-180 bg-white/15 text-white' : ''
                  }`}
                >
                  ▼
                </div>
              </div>
            </button>

            {/* Panel expandible cuando se abre el botón */}
            {showFilterDrawer && (
              <div className="mt-2.5 p-4 bg-[#12131f]/95 backdrop-blur-xl rounded-2xl border border-white/15 shadow-2xl animate-fadeIn space-y-4">
                {/* 1. Tipo de Podio */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/50 text-[11px] font-bold uppercase tracking-wider">
                      🎰 Tipo de Podio
                    </span>
                    <span className="text-white/30 text-[10px]">
                      {albumType === 'pool' && 'Selección del Club'}
                      {albumType === 'individual' && 'Reseñas Individuales'}
                      {albumType === 'all' && 'General Unificado'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    <button
                      onClick={() => setAlbumType('pool')}
                      className={`px-2 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 text-center ${
                        albumType === 'pool'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 scale-[1.02]'
                          : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span>🎰</span>
                        <span className="truncate">Pool Club</span>
                      </div>
                      <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded-full font-mono font-semibold">
                        {poolCount}
                      </span>
                    </button>

                    <button
                      onClick={() => setAlbumType('individual')}
                      className={`px-2 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 text-center ${
                        albumType === 'individual'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 scale-[1.02]'
                          : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span>📌</span>
                        <span className="truncate">Indiv.</span>
                      </div>
                      <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded-full font-mono font-semibold">
                        {individualCount}
                      </span>
                    </button>

                    <button
                      onClick={() => setAlbumType('all')}
                      className={`px-2 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 text-center ${
                        albumType === 'all'
                          ? 'bg-white/20 text-white shadow font-bold scale-[1.02]'
                          : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span>🌐</span>
                        <span className="truncate">Todos</span>
                      </div>
                      <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded-full font-mono font-semibold">
                        {allCurrentTabAlbums.length}
                      </span>
                    </button>
                  </div>
                </div>

                {/* 2. Categorías */}
                <div>
                  <span className="text-white/50 text-[11px] font-bold uppercase tracking-wider block mb-2">
                    ⭐ Categoría a Evaluar
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveTab(cat.id)}
                        className={`px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left flex items-center justify-between gap-1.5 ${
                          activeTab === cat.id
                            ? `bg-gradient-to-r ${cat.color} text-white shadow-md font-bold border border-white/25 scale-[1.02]`
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                          <span>{cat.emoji}</span>
                          <span className="truncate">{cat.label}</span>
                        </div>
                        {activeTab === cat.id && (
                          <span className="text-[10px] font-bold">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Footer del panel */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-white/40 text-[11px] truncate mr-2">
                    {albumType === 'pool' &&
                      '🎰 Mostrando podio de selección del club'}
                    {albumType === 'individual' &&
                      '📌 Mostrando podio de reseñas individuales'}
                    {albumType === 'all' &&
                      '🌐 Mostrando podio general unificado'}
                  </span>
                  <button
                    onClick={() => setShowFilterDrawer(false)}
                    className="px-4 py-1.5 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white text-xs font-bold rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all shrink-0"
                  >
                    Listo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* MODO ESCRITORIO (>= lg): Barra horizontal completa y limpia */}
          <div className="hidden lg:block">
            {/* Filtro Pool vs Individual */}
            <div className="mb-4 flex flex-row items-center justify-between gap-3 bg-black/40 p-2.5 rounded-2xl border border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-white/40 text-[11px] font-bold uppercase tracking-wider px-2">
                  Podio:
                </span>
                <button
                  onClick={() => setAlbumType('pool')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
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
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
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
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
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
                  {albumType === 'pool' &&
                    'Mostrando podio de selección del club'}
                  {albumType === 'individual' &&
                    'Mostrando podio de reseñas individuales'}
                  {albumType === 'all' && 'Mostrando podio general unificado'}
                </span>
              </div>
            </div>

            {/* Categorías */}
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
          </div>
        </>
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
                  {/* ===== PODIO - TOP 3 (RESPONSIVE) ===== */}
                  {podiumAlbums.length > 0 && (
                    <div className="mb-8 pt-4">
                      {/* --- VISTA MÓVIL Y TABLETS (< lg): Podio Uno Tras Otro con Portadas Grandes y Flip 3D Compacto --- */}
                      <div className="lg:hidden flex flex-col items-center gap-6 pt-2 pb-6 px-2 w-full">
                        {/* #1 CAMPEÓN (Dorado) */}
                        {podiumAlbums[0] && (
                          <div className="w-full flex justify-center">
                            <div
                              onClick={() => toggleCardFlip('podium-mobile-0')}
                              className="flip-card-container relative w-full max-w-[270px] sm:max-w-[310px] aspect-square mx-auto cursor-pointer select-none group"
                            >
                              <div
                                className={`flip-card-inner ${
                                  flippedCards['podium-mobile-0']
                                    ? 'flipped'
                                    : ''
                                }`}
                              >
                                {/* CARA FRONTAL: Portada Gigante, Medalla y Efectos */}
                                <div className="flip-card-front rounded-3xl overflow-hidden border-2 border-yellow-400 shadow-[0_0_35px_rgba(234,179,8,0.35)] ring-4 ring-yellow-400/30">
                                  <img
                                    src={podiumAlbums[0].image_url}
                                    alt={podiumAlbums[0].album_name}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    onError={(e) => {
                                      e.target.src =
                                        'https://via.placeholder.com/500/1a1a2e/ffffff?text=🎵';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/60 pointer-events-none"></div>

                                  {/* Insignia Superior */}
                                  <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 font-black text-xs sm:text-sm px-4 py-1 rounded-full shadow-2xl border border-yellow-200 z-10 whitespace-nowrap">
                                    👑 #1 CAMPEÓN
                                  </div>

                                  {/* Indicador Inferior Toca para info */}
                                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-md text-yellow-300 border border-yellow-400/30 text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                                    <span>ℹ️</span> Toca para ver info
                                  </div>
                                </div>

                                {/* CARA TRASERA: Información Compacta Sin Desborde */}
                                <div className="flip-card-back rounded-3xl p-3.5 sm:p-4 flex flex-col justify-between bg-gradient-to-b from-amber-950/95 via-slate-950/95 to-black/95 border-2 border-yellow-400 shadow-2xl backdrop-blur-xl text-center overflow-hidden">
                                  {/* Cabecera */}
                                  <div>
                                    <div className="flex items-center justify-between gap-1 mb-1.5">
                                      <span className="bg-yellow-400/25 text-yellow-300 border border-yellow-400/50 text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                                        👑 #1 CAMPEÓN
                                      </span>
                                      <span
                                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                          podiumAlbums[0].status === 'INDIVIDUAL'
                                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                                            : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                                        }`}
                                      >
                                        {podiumAlbums[0].status === 'INDIVIDUAL'
                                          ? '📌 Indiv.'
                                          : '🎰 Pool'}
                                      </span>
                                    </div>

                                    <h4
                                      className="text-white font-black text-xs sm:text-sm line-clamp-1 mt-1 leading-tight"
                                      title={podiumAlbums[0].album_name}
                                    >
                                      {podiumAlbums[0].album_name}
                                    </h4>
                                    <p
                                      className="text-amber-200/90 text-[11px] sm:text-xs font-semibold truncate mt-0.5"
                                      title={podiumAlbums[0].artist_name}
                                    >
                                      {podiumAlbums[0].artist_name}
                                    </p>
                                  </div>

                                  {/* Sección Central de Calificación Compacta */}
                                  <div className="my-1 bg-black/40 rounded-xl p-2 sm:p-2.5 border border-yellow-400/20">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <span className="text-yellow-400 text-base sm:text-lg font-black">
                                        ★{' '}
                                        {formatRating(
                                          podiumAlbums[0].avg_rating || 0
                                        )}
                                      </span>
                                      {podiumAlbums[0].bonus > 0 && (
                                        <span className="text-[9px] bg-yellow-400/20 text-yellow-300 px-1.5 py-0.5 rounded-full border border-yellow-400/30 font-semibold">
                                          +{podiumAlbums[0].bonus.toFixed(1)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-1.5">
                                      {renderRatingBar(
                                        podiumAlbums[0].avg_rating || 0,
                                        getMaxForCategory(activeTab),
                                        0,
                                        'from-yellow-400 via-amber-400 to-yellow-500'
                                      )}
                                    </div>
                                  </div>

                                  {/* Pie para Regresar */}
                                  <div className="text-yellow-400/70 text-[9px] sm:text-[10px] font-medium flex items-center justify-center gap-1">
                                    <span>🔄</span> Toca para volver a la portada
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* #2 SUBCAMPEÓN (Plateado) */}
                        {podiumAlbums[1] && (
                          <div className="w-full flex justify-center">
                            <div
                              onClick={() => toggleCardFlip('podium-mobile-1')}
                              className="flip-card-container relative w-full max-w-[250px] sm:max-w-[285px] aspect-square mx-auto cursor-pointer select-none group"
                            >
                              <div
                                className={`flip-card-inner ${
                                  flippedCards['podium-mobile-1']
                                    ? 'flipped'
                                    : ''
                                }`}
                              >
                                {/* CARA FRONTAL */}
                                <div className="flip-card-front rounded-3xl overflow-hidden border-2 border-slate-300 shadow-[0_0_30px_rgba(203,213,225,0.25)] ring-4 ring-white/20">
                                  <img
                                    src={podiumAlbums[1].image_url}
                                    alt={podiumAlbums[1].album_name}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    onError={(e) => {
                                      e.target.src =
                                        'https://via.placeholder.com/400/1a1a2e/ffffff?text=🎵';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/60 pointer-events-none"></div>

                                  <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950 font-black text-xs sm:text-sm px-4 py-1 rounded-full shadow-2xl border border-white/50 z-10 whitespace-nowrap">
                                    🥈 #2 SUBCAMPEÓN
                                  </div>

                                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-md text-slate-200 border border-white/20 text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                                    <span>ℹ️</span> Toca para ver info
                                  </div>
                                </div>

                                {/* CARA TRASERA */}
                                <div className="flip-card-back rounded-3xl p-3.5 sm:p-4 flex flex-col justify-between bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-black/95 border-2 border-slate-300 shadow-2xl backdrop-blur-xl text-center overflow-hidden">
                                  <div>
                                    <div className="flex items-center justify-between gap-1 mb-1.5">
                                      <span className="bg-slate-300/20 text-slate-200 border border-slate-300/30 text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                        🥈 #2 SUBCAMPEÓN
                                      </span>
                                      <span
                                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                          podiumAlbums[1].status === 'INDIVIDUAL'
                                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        }`}
                                      >
                                        {podiumAlbums[1].status === 'INDIVIDUAL'
                                          ? '📌 Indiv.'
                                          : '🎰 Pool'}
                                      </span>
                                    </div>

                                    <h4
                                      className="text-white font-bold text-xs sm:text-sm line-clamp-1 mt-1 leading-tight"
                                      title={podiumAlbums[1].album_name}
                                    >
                                      {podiumAlbums[1].album_name}
                                    </h4>
                                    <p
                                      className="text-white/70 text-[11px] sm:text-xs font-medium truncate mt-0.5"
                                      title={podiumAlbums[1].artist_name}
                                    >
                                      {podiumAlbums[1].artist_name}
                                    </p>
                                  </div>

                                  <div className="my-1 bg-black/40 rounded-xl p-2 sm:p-2.5 border border-white/10">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <span className="text-slate-200 text-base sm:text-lg font-black">
                                        ★{' '}
                                        {formatRating(
                                          podiumAlbums[1].avg_rating || 0
                                        )}
                                      </span>
                                      {podiumAlbums[1].bonus > 0 && (
                                        <span className="text-[9px] bg-slate-400/20 text-slate-200 px-1.5 py-0.5 rounded-full border border-slate-300/30 font-medium">
                                          +{podiumAlbums[1].bonus.toFixed(1)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-1.5">
                                      {renderRatingBar(
                                        podiumAlbums[1].avg_rating || 0,
                                        getMaxForCategory(activeTab),
                                        100,
                                        'from-slate-300 to-slate-400'
                                      )}
                                    </div>
                                  </div>

                                  <div className="text-white/50 text-[9px] sm:text-[10px] font-medium flex items-center justify-center gap-1">
                                    <span>🔄</span> Toca para volver a la portada
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* #3 TERCER LUGAR (Bronce) */}
                        {podiumAlbums[2] && (
                          <div className="w-full flex justify-center">
                            <div
                              onClick={() => toggleCardFlip('podium-mobile-2')}
                              className="flip-card-container relative w-full max-w-[230px] sm:max-w-[265px] aspect-square mx-auto cursor-pointer select-none group"
                            >
                              <div
                                className={`flip-card-inner ${
                                  flippedCards['podium-mobile-2']
                                    ? 'flipped'
                                    : ''
                                }`}
                              >
                                {/* CARA FRONTAL */}
                                <div className="flip-card-front rounded-3xl overflow-hidden border-2 border-amber-600 shadow-[0_0_25px_rgba(217,119,6,0.25)] ring-4 ring-amber-500/20">
                                  <img
                                    src={podiumAlbums[2].image_url}
                                    alt={podiumAlbums[2].album_name}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    onError={(e) => {
                                      e.target.src =
                                        'https://via.placeholder.com/400/1a1a2e/ffffff?text=🎵';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/60 pointer-events-none"></div>

                                  <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-black text-xs sm:text-sm px-4 py-1 rounded-full shadow-2xl border border-amber-400/50 z-10 whitespace-nowrap">
                                    🥉 #3 TERCER LUGAR
                                  </div>

                                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-md text-amber-300 border border-amber-500/30 text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                                    <span>ℹ️</span> Toca para ver info
                                  </div>
                                </div>

                                {/* CARA TRASERA */}
                                <div className="flip-card-back rounded-3xl p-3.5 sm:p-4 flex flex-col justify-between bg-gradient-to-b from-amber-950/95 via-slate-950/95 to-black/95 border-2 border-amber-600 shadow-2xl backdrop-blur-xl text-center overflow-hidden">
                                  <div>
                                    <div className="flex items-center justify-between gap-1 mb-1.5">
                                      <span className="bg-amber-700/20 text-amber-400 border border-amber-700/30 text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                        🥉 #3 TERCER LUGAR
                                      </span>
                                      <span
                                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                          podiumAlbums[2].status === 'INDIVIDUAL'
                                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        }`}
                                      >
                                        {podiumAlbums[2].status === 'INDIVIDUAL'
                                          ? '📌 Indiv.'
                                          : '🎰 Pool'}
                                      </span>
                                    </div>

                                    <h4
                                      className="text-white font-bold text-xs sm:text-sm line-clamp-1 mt-1 leading-tight"
                                      title={podiumAlbums[2].album_name}
                                    >
                                      {podiumAlbums[2].album_name}
                                    </h4>
                                    <p
                                      className="text-white/70 text-[11px] sm:text-xs font-medium truncate mt-0.5"
                                      title={podiumAlbums[2].artist_name}
                                    >
                                      {podiumAlbums[2].artist_name}
                                    </p>
                                  </div>

                                  <div className="my-1 bg-black/40 rounded-xl p-2 sm:p-2.5 border border-amber-500/20">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <span className="text-amber-400 text-base sm:text-lg font-black">
                                        ★{' '}
                                        {formatRating(
                                          podiumAlbums[2].avg_rating || 0
                                        )}
                                      </span>
                                      {podiumAlbums[2].bonus > 0 && (
                                        <span className="text-[9px] bg-amber-600/20 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-500/30 font-medium">
                                          +{podiumAlbums[2].bonus.toFixed(1)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-1.5">
                                      {renderRatingBar(
                                        podiumAlbums[2].avg_rating || 0,
                                        getMaxForCategory(activeTab),
                                        200,
                                        'from-amber-600 to-amber-700'
                                      )}
                                    </div>
                                  </div>

                                  <div className="text-amber-300/60 text-[9px] sm:text-[10px] font-medium flex items-center justify-center gap-1">
                                    <span>🔄</span> Toca para volver a la portada
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* --- VISTA ESCRITORIO (>= lg): Podio Clásico de 3 Columnas --- */}
                      <div className="hidden lg:flex justify-center items-end gap-4 xl:gap-6 w-full">
                        {/* 2do Lugar - Izquierda */}
                        {podiumAlbums[1] && (
                          <div className="w-full max-w-[310px] xl:max-w-[330px] flex-1 order-1 transition-all duration-300 hover:-translate-y-2">
                            <div className="relative bg-gradient-to-b from-slate-300/20 via-slate-400/10 to-black/85 border-2 border-slate-300/40 rounded-3xl p-5 xl:p-6 text-center shadow-[0_0_30px_rgba(203,213,225,0.18)] flex flex-col items-center">
                              <div className="absolute -top-4 bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950 font-black text-xs xl:text-sm px-3.5 py-1 rounded-full shadow-xl border border-white/50 flex items-center gap-1.5 z-10">
                                <span>🥈</span> #2 SUB-CAMPEÓN
                              </div>
                              <div className="relative mt-2 w-36 h-36 xl:w-40 xl:h-40 mx-auto aspect-square">
                                <div className="absolute -inset-2 bg-slate-300/25 rounded-3xl blur-xl"></div>
                                <img
                                  src={podiumAlbums[1].image_url}
                                  alt={podiumAlbums[1].album_name}
                                  loading="lazy"
                                  decoding="async"
                                  className="relative w-full h-full object-cover rounded-2xl border-2 border-slate-200/60 shadow-2xl ring-2 ring-white/20"
                                  onError={(e) => {
                                    e.target.src =
                                      'https://via.placeholder.com/400/1a1a2e/ffffff?text=🎵';
                                  }}
                                />
                              </div>
                              <div className="mt-4 w-full">
                                <div className="mb-1.5">
                                  <span
                                    className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
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
                                  className="text-white font-bold text-base xl:text-lg truncate"
                                  title={podiumAlbums[1].album_name}
                                >
                                  {podiumAlbums[1].album_name}
                                </h4>
                                <p
                                  className="text-white/60 text-xs xl:text-sm truncate"
                                  title={podiumAlbums[1].artist_name}
                                >
                                  {podiumAlbums[1].artist_name}
                                </p>
                              </div>
                              <div className="mt-2.5 flex items-center gap-2">
                                <span className="text-slate-200 text-2xl font-black">
                                  ★{' '}
                                  {formatRating(
                                    podiumAlbums[1].avg_rating || 0
                                  )}
                                </span>
                              </div>
                              {podiumAlbums[1].bonus > 0 && (
                                <span className="mt-1 text-[10px] bg-slate-400/20 text-slate-200 px-2.5 py-0.5 rounded-full border border-slate-300/30 font-medium">
                                  ⚡ +{podiumAlbums[1].bonus.toFixed(2)} bonus (
                                  {podiumAlbums[1].review_count} reviews)
                                </span>
                              )}
                              <div className="mt-2.5 w-full px-2">
                                {renderRatingBar(
                                  podiumAlbums[1].avg_rating || 0,
                                  getMaxForCategory(activeTab),
                                  100,
                                  'from-slate-300 to-slate-400'
                                )}
                              </div>
                              <div className="text-white/40 text-xs mt-1.5 font-medium">
                                {podiumAlbums[1].review_count}{' '}
                                {podiumAlbums[1].review_count === 1
                                  ? 'review'
                                  : 'reviews'}
                              </div>
                              <div className="mt-4 w-full bg-gradient-to-r from-slate-400/20 via-slate-300/20 to-slate-400/20 border-t border-slate-300/30 text-slate-200 font-extrabold text-xs py-2 uppercase tracking-widest rounded-b-2xl">
                                🥈 SUB-CAMPEÓN #2
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 1er Lugar - Centro */}
                        {podiumAlbums[0] && (
                          <div className="w-full max-w-[360px] xl:max-w-[390px] flex-1 order-2 -translate-y-5 transition-all duration-300 hover:-translate-y-7">
                            <div className="relative bg-gradient-to-b from-amber-500/30 via-yellow-500/15 to-black/95 border-2 border-yellow-400/80 rounded-3xl p-6 xl:p-7 text-center shadow-[0_0_55px_rgba(234,179,8,0.38)] flex flex-col items-center">
                              <div className="absolute -top-5 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 font-black text-xs xl:text-sm px-5 py-2 rounded-full shadow-2xl border-2 border-yellow-200 flex items-center gap-1.5 z-10 animate-bounce">
                                👑 🥇 #1 CAMPEÓN
                              </div>
                              <div className="relative mt-3 w-48 h-48 xl:w-56 xl:h-56 mx-auto aspect-square">
                                <div className="absolute -inset-3 bg-gradient-to-r from-yellow-400/50 via-amber-500/50 to-yellow-400/50 rounded-3xl blur-2xl animate-pulse"></div>
                                <img
                                  src={podiumAlbums[0].image_url}
                                  alt={podiumAlbums[0].album_name}
                                  loading="lazy"
                                  decoding="async"
                                  className="relative w-full h-full object-cover rounded-2xl border-2 border-yellow-300 shadow-2xl ring-4 ring-yellow-400/40"
                                  onError={(e) => {
                                    e.target.src =
                                      'https://via.placeholder.com/500/1a1a2e/ffffff?text=🎵';
                                  }}
                                />
                              </div>
                              <div className="mt-4 w-full">
                                <div className="mb-1.5">
                                  <span
                                    className={`text-[10px] px-3 py-0.5 rounded-full font-black uppercase tracking-wider ${
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
                                  className="text-white font-black text-lg xl:text-xl truncate"
                                  title={podiumAlbums[0].album_name}
                                >
                                  {podiumAlbums[0].album_name}
                                </h4>
                                <p
                                  className="text-amber-200/80 text-sm xl:text-base font-medium truncate mt-0.5"
                                  title={podiumAlbums[0].artist_name}
                                >
                                  {podiumAlbums[0].artist_name}
                                </p>
                              </div>
                              <div className="mt-3 flex items-center gap-2">
                                <span className="text-yellow-400 text-3xl xl:text-4xl font-black tracking-tight">
                                  ★{' '}
                                  {formatRating(
                                    podiumAlbums[0].avg_rating || 0
                                  )}
                                </span>
                              </div>
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
                              <div className="text-yellow-200/60 text-xs mt-1.5 font-semibold">
                                {podiumAlbums[0].review_count}{' '}
                                {podiumAlbums[0].review_count === 1
                                  ? 'review'
                                  : 'reviews'}
                              </div>
                              <div className="mt-4 w-full bg-gradient-to-r from-yellow-500/30 via-amber-400/25 to-yellow-500/30 border-t border-yellow-400/40 text-yellow-300 font-black text-xs py-2.5 uppercase tracking-widest rounded-b-2xl shadow-inner">
                                🏆 PODIO #1 CAMPEÓN
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 3er Lugar - Derecha */}
                        {podiumAlbums[2] && (
                          <div className="w-full max-w-[290px] xl:max-w-[310px] flex-1 order-3 transition-all duration-300 hover:-translate-y-2">
                            <div className="relative bg-gradient-to-b from-amber-700/20 via-amber-800/10 to-black/85 border-2 border-amber-600/40 rounded-3xl p-5 xl:p-6 text-center shadow-[0_0_25px_rgba(217,119,6,0.2)] flex flex-col items-center">
                              <div className="absolute -top-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-black text-xs xl:text-sm px-3.5 py-1 rounded-full shadow-lg border border-amber-400/50 flex items-center gap-1.5 z-10">
                                <span>🥉</span> #3 LUGAR
                              </div>
                              <div className="relative mt-2 w-32 h-32 xl:w-36 xl:h-36 mx-auto aspect-square">
                                <div className="absolute -inset-2 bg-amber-600/25 rounded-3xl blur-xl"></div>
                                <img
                                  src={podiumAlbums[2].image_url}
                                  alt={podiumAlbums[2].album_name}
                                  loading="lazy"
                                  decoding="async"
                                  className="relative w-full h-full object-cover rounded-2xl border-2 border-amber-600/50 shadow-2xl ring-2 ring-amber-500/20"
                                  onError={(e) => {
                                    e.target.src =
                                      'https://via.placeholder.com/400/1a1a2e/ffffff?text=🎵';
                                  }}
                                />
                              </div>
                              <div className="mt-4 w-full">
                                <div className="mb-1.5">
                                  <span
                                    className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
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
                                  className="text-white font-bold text-base xl:text-lg truncate"
                                  title={podiumAlbums[2].album_name}
                                >
                                  {podiumAlbums[2].album_name}
                                </h4>
                                <p
                                  className="text-white/60 text-xs xl:text-sm truncate"
                                  title={podiumAlbums[2].artist_name}
                                >
                                  {podiumAlbums[2].artist_name}
                                </p>
                              </div>
                              <div className="mt-2.5 flex items-center gap-2">
                                <span className="text-amber-400 text-2xl font-black">
                                  ★{' '}
                                  {formatRating(
                                    podiumAlbums[2].avg_rating || 0
                                  )}
                                </span>
                              </div>
                              {podiumAlbums[2].bonus > 0 && (
                                <span className="mt-1 text-[10px] bg-amber-600/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-medium">
                                  ⚡ +{podiumAlbums[2].bonus.toFixed(2)} bonus (
                                  {podiumAlbums[2].review_count} reviews)
                                </span>
                              )}
                              <div className="mt-2.5 w-full px-2">
                                {renderRatingBar(
                                  podiumAlbums[2].avg_rating || 0,
                                  getMaxForCategory(activeTab),
                                  200,
                                  'from-amber-600 to-amber-700'
                                )}
                              </div>
                              <div className="text-white/40 text-xs mt-1.5 font-medium">
                                {podiumAlbums[2].review_count}{' '}
                                {podiumAlbums[2].review_count === 1
                                  ? 'review'
                                  : 'reviews'}
                              </div>
                              <div className="mt-4 w-full bg-gradient-to-r from-amber-700/30 via-amber-600/20 to-amber-700/30 border-t border-amber-600/30 text-amber-300 font-extrabold text-xs py-2 uppercase tracking-widest rounded-b-2xl">
                                🥉 3ER LUGAR #3
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ===== SLIDER PARA EL RESTO DE ÁLBUMES ===== */}
                  {restAlbums.length > 0 && (
                    <div className="border-t border-white/10 pt-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                        <p className="text-white/60 text-xs uppercase tracking-wider font-semibold flex items-center gap-2">
                          <span>🎵</span> Puestos #4 al #10 del Ranking{' '}
                          {albumType === 'pool'
                            ? '(Pool Club)'
                            : albumType === 'individual'
                              ? '(Individuales)'
                              : ''}
                        </p>
                        <span className="text-white/40 text-xs">
                          {restAlbums.length} álbumes destacados
                        </span>
                      </div>

                      {/* Slider Container */}
                      <div className="relative">
                        <button
                          onClick={() => scrollSlider(albumSliderRef, -1)}
                          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white/80 hover:text-white p-2 rounded-full border border-white/10 transition-all hover:scale-110"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>

                        <button
                          onClick={() => scrollSlider(albumSliderRef, 1)}
                          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white/80 hover:text-white p-2 rounded-full border border-white/10 transition-all hover:scale-110"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>

                        <div
                          ref={albumSliderRef}
                          className="flex overflow-x-auto gap-4 pb-4 pt-4 snap-x snap-mandatory scroll-smooth"
                          style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                          }}
                        >
                          <style>{`
                            .album-slider::-webkit-scrollbar {
                              display: none;
                            }
                          `}</style>
                          <div className="flex gap-3 px-2">
                            {restAlbums.map((album, idx) => {
                              const rating = album.avg_rating || 0;
                              const position = idx + 4;
                              const cardKey = `slider-album-${idx}`;
                              const isFlipped = !!flippedCards[cardKey];

                              return (
                                <div
                                  key={idx}
                                  onClick={() => toggleCardFlip(cardKey)}
                                  className="flip-card-container relative aspect-square w-[155px] xs:w-[170px] sm:w-[185px] md:w-[195px] shrink-0 snap-center cursor-pointer select-none group"
                                >
                                  <div
                                    className={`flip-card-inner ${
                                      isFlipped ? 'flipped' : ''
                                    }`}
                                  >
                                    {/* CARA FRONTAL: Portada Cuadrada Completa con Badges */}
                                    <div className="flip-card-front rounded-2xl overflow-hidden border border-white/15 shadow-lg p-2.5 sm:p-3 flex flex-col justify-between group-hover:border-white/30 group-hover:shadow-cyan-500/10 transition-all duration-300">
                                      {/* Imagen de fondo */}
                                      <img
                                        src={album.image_url}
                                        alt={album.album_name}
                                        loading="lazy"
                                        decoding="async"
                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                        onError={(e) => {
                                          e.target.src =
                                            'https://via.placeholder.com/400/1a1a2e/ffffff?text=🎵';
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/60 pointer-events-none"></div>

                                      {/* Encabezado Superior */}
                                      <div className="relative z-10 flex items-center justify-between gap-1">
                                        <span className="bg-black/75 backdrop-blur-md text-white font-black text-xs px-2.5 py-0.5 rounded-full border border-white/20 shadow-md">
                                          #{position}
                                        </span>
                                        <span
                                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold backdrop-blur-md shadow-md ${
                                            album.status === 'INDIVIDUAL'
                                              ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
                                              : 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                                          }`}
                                        >
                                          {album.status === 'INDIVIDUAL'
                                            ? '📌 Indiv.'
                                            : '🎰 Pool'}
                                        </span>
                                      </div>

                                      {/* Pie Frontal: Toca para info */}
                                      <div className="relative z-10 bg-black/75 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center justify-between shadow-lg">
                                        <div className="flex items-center gap-1">
                                          <span className="text-[#f5576c] text-xs sm:text-sm font-black">
                                            ★ {formatRating(rating)}
                                          </span>
                                          {album.bonus > 0 && (
                                            <span className="text-[8px] sm:text-[9px] text-[#f093fb] font-semibold">
                                              +{album.bonus.toFixed(1)}
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-white/60 text-[9px] font-semibold flex items-center gap-0.5">
                                          <span>ℹ️</span> Info
                                        </span>
                                      </div>
                                    </div>

                                    {/* CARA TRASERA: Toda la Información del Álbum Sin Desborde */}
                                    <div className="flip-card-back rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between bg-gradient-to-b from-slate-900/95 via-black/95 to-slate-900/95 border border-white/20 shadow-xl backdrop-blur-md text-left overflow-hidden">
                                      {/* Cabecera */}
                                      <div>
                                        <div className="flex items-center justify-between gap-1 mb-1">
                                          <span className="text-white/80 text-[10px] font-black bg-white/10 px-2 py-0.5 rounded-full">
                                            #{position}
                                          </span>
                                          <span className="text-[10px] text-[#f5576c] font-black">
                                            ★ {formatRating(rating)}
                                          </span>
                                        </div>
                                        <h5
                                          className="text-white font-bold text-[11px] sm:text-xs leading-tight line-clamp-1 mt-0.5"
                                          title={album.album_name}
                                        >
                                          {album.album_name}
                                        </h5>
                                        <p
                                          className="text-white/60 text-[10px] truncate mt-0.5"
                                          title={album.artist_name}
                                        >
                                          {album.artist_name}
                                        </p>
                                      </div>

                                      {/* Centro: Rating y Barra */}
                                      <div className="my-1 py-1 border-y border-white/10">
                                        <div className="flex items-center justify-between text-[9px]">
                                          <span className="text-white/50">
                                            Calificación
                                          </span>
                                          {album.bonus > 0 && (
                                            <span className="text-[#f093fb] font-semibold">
                                              +{album.bonus.toFixed(1)} bonus
                                            </span>
                                          )}
                                        </div>
                                        <div className="mt-1">
                                          {renderRatingBar(
                                            rating,
                                            getMaxForCategory(activeTab),
                                            0,
                                            'from-[#f5576c] to-[#f093fb]'
                                          )}
                                        </div>
                                      </div>

                                      {/* Pie Voltear */}
                                      <div className="text-center text-[9px] text-cyan-400 font-medium flex items-center justify-center gap-0.5">
                                        <span>🔄</span> Volver
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 text-center">
                        <Link
                          to="/albumes"
                          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500/15 via-yellow-500/15 to-amber-500/15 hover:from-amber-500/25 hover:to-yellow-500/25 text-amber-300 font-bold text-xs sm:text-sm rounded-full border border-amber-500/35 hover:border-amber-500/60 transition-all hover:scale-105 shadow-md shadow-black/30 active:scale-95"
                        >
                          <span>💿</span> Ver Catálogo Completo<span>→</span>
                        </Link>
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
                  {/* PODIO TOP 3 REVIEWERS CON AVATARES MÁS GRANDES */}
                  {top3Reviewers.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                      {top3Reviewers.map((reviewer, idx) => {
                        const orderClass =
                          idx === 0
                            ? 'lg:order-2 lg:-translate-y-2'
                            : idx === 1
                              ? 'lg:order-1'
                              : 'lg:order-3';

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

                              {/* Avatar más grande */}
                              <div className="flex items-center gap-4 my-2">
                                {renderUserAvatar(
                                  reviewer,
                                  'w-16 h-16',
                                  podiumTheme.avatarBorder
                                )}
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-white font-bold text-lg truncate">
                                    {reviewer.reviewer_name}
                                  </h5>
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

                  {/* ===== SLIDER PARA EL RESTO DE REVIEWERS ===== */}
                  {restReviewers.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-3">
                        Otros Críticos Destacados (#4 - #10)
                      </h5>

                      <div className="relative">
                        <button
                          onClick={() => scrollSlider(reviewerSliderRef, -1)}
                          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white/80 hover:text-white p-2 rounded-full border border-white/10 transition-all hover:scale-110"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>

                        <button
                          onClick={() => scrollSlider(reviewerSliderRef, 1)}
                          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white/80 hover:text-white p-2 rounded-full border border-white/10 transition-all hover:scale-110"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>

                        <div
                          ref={reviewerSliderRef}
                          className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scroll-smooth"
                          style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                          }}
                        >
                          <style>{`
                            .reviewer-slider::-webkit-scrollbar {
                              display: none;
                            }
                          `}</style>
                          <div className="flex gap-4 px-2">
                            {restReviewers.map((reviewer, idx) => {
                              const rank = idx + 4;
                              return (
                                <div
                                  key={reviewer.reviewer_name}
                                  className="min-w-[280px] sm:min-w-[300px] md:min-w-[320px] lg:min-w-[340px] snap-center bg-white/5 rounded-2xl p-5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-white/60 text-sm font-black bg-white/10 px-3 py-1 rounded-full">
                                      #{rank}
                                    </span>
                                    <span className="text-2xl">
                                      {rank === 4
                                        ? '🏅'
                                        : rank === 5
                                          ? '🌟'
                                          : '✨'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-4 my-3">
                                    {renderUserAvatar(
                                      reviewer,
                                      'w-14 h-14',
                                      'border-white/20'
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <h5 className="text-white font-bold text-lg truncate">
                                        {reviewer.reviewer_name}
                                      </h5>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-3 my-4 bg-black/30 rounded-xl p-3 text-center border border-white/5">
                                    <div>
                                      <p className="text-[10px] text-white/40 uppercase tracking-wider">
                                        Reviews
                                      </p>
                                      <p className="text-base font-bold text-white">
                                        {reviewer.review_count}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-white/40 uppercase tracking-wider">
                                        Álbumes
                                      </p>
                                      <p className="text-base font-bold text-white">
                                        {reviewer.album_count}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-white/40 uppercase tracking-wider">
                                        Promedio
                                      </p>
                                      <p className="text-base font-bold text-[#f5576c]">
                                        ★ {formatRating(reviewer.avg_rating)}
                                      </p>
                                    </div>
                                  </div>

                                  <div>
                                    {renderRatingBar(
                                      reviewer.avg_rating || 0,
                                      10,
                                      0,
                                      'from-[#f5576c] to-[#f093fb]'
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="mt-6 text-center">
                <Link
                  to="/leaderboard"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500/15 via-yellow-500/15 to-amber-500/15 hover:from-amber-500/25 hover:to-yellow-500/25 text-amber-300 font-bold text-xs sm:text-sm rounded-full border border-amber-500/35 hover:border-amber-500/60 transition-all hover:scale-105 shadow-md shadow-black/30 active:scale-95"
                >
                  <span>🏆</span> Ver Leaderboard Completo<span>→</span>
                </Link>
              </div>
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
        
        .album-slider::-webkit-scrollbar,
        .reviewer-slider::-webkit-scrollbar {
          display: none;
        }
        
        .album-slider, .reviewer-slider {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>
    </div>
  );
}
