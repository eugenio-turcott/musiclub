// src/components/AlbumsCatalog.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { supabaseService, supabase } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { slugifyAlbum } from '../utils/ratingUtils';
import { PLACEHOLDER_COVER } from './TierListMaker';
import { fetchAlbumReleaseYear } from '../services/spotifyApi';

const ITEMS_PER_PAGE = 15;
const SPOTIFY_YEARS_CACHE_KEY = 'musiclub_spotify_years_cache_v1';

const getInitialSpotifyYearsCache = () => {
  try {
    const saved = localStorage.getItem(SPOTIFY_YEARS_CACHE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

// Helper para extraer el año de lanzamiento oficial de un álbum de Spotify
export function getAlbumYear(album, spotifyCache = {}) {
  if (!album) return null;
  // 1. release_year de la base de datos (entero)
  if (album.release_year) {
    const y = parseInt(album.release_year, 10);
    if (!isNaN(y) && y >= 1900 && y <= 2100) return y;
  }
  // 2. release_date de la base de datos (e.g. "1997-06-16")
  if (album.release_date) {
    const y = parseInt(String(album.release_date).substring(0, 4), 10);
    if (!isNaN(y) && y >= 1900 && y <= 2100) return y;
  }
  // 3. fecha_lanzamiento
  if (album.fecha_lanzamiento) {
    const y = parseInt(String(album.fecha_lanzamiento).substring(0, 4), 10);
    if (!isNaN(y) && y >= 1900 && y <= 2100) return y;
  }
  // 4. Cache local de Spotify
  if (spotifyCache) {
    if (album.id && spotifyCache[album.id]) {
      return spotifyCache[album.id];
    }
    const key = `${album.album_name}-${album.artist_name}`.toLowerCase();
    if (spotifyCache[key]) {
      return spotifyCache[key];
    }
  }
  return null;
}

const DECADES = [
  '2020s',
  '2010s',
  '2000s',
  '1990s',
  '1980s',
  '1970s',
  '1960s',
  '1950s',
];

export function AlbumsCatalog({ isPage = false }) {
  const { user } = useAuth();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [spotifyYearsCache, setSpotifyYearsCache] = useState(
    getInitialSpotifyYearsCache
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ACTIVO | INDIVIDUAL | INACTIVO | GANADOR
  const [selectedDecade, setSelectedDecade] = useState('2020s');
  const [selectedYearFilter, setSelectedYearFilter] = useState('ALL'); // ALL | '2020s' | 2024 | etc.
  const [sortBy, setSortBy] = useState('rating_desc'); // rating_desc | rating_asc | reviews_desc | newest | name_asc | artist_asc
  const [currentPage, setCurrentPage] = useState(1);

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

  // Resolver en background los años de lanzamiento oficiales desde Spotify para álbumes que no lo tengan
  useEffect(() => {
    if (!albums || albums.length === 0) return;

    let isCancelled = false;

    const resolveMissingYears = async () => {
      const missing = albums.filter(
        (alb) => !getAlbumYear(alb, spotifyYearsCache)
      );
      if (missing.length === 0) return;

      let updatedCache = { ...spotifyYearsCache };
      let hasChanges = false;

      for (const alb of missing) {
        if (isCancelled) break;
        try {
          const res = await fetchAlbumReleaseYear(
            alb.album_name,
            alb.artist_name,
            alb.spotify_link
          );
          if (res && res.releaseYear) {
            const key = `${alb.album_name}-${alb.artist_name}`.toLowerCase();
            if (alb.id) updatedCache[alb.id] = res.releaseYear;
            updatedCache[key] = res.releaseYear;
            hasChanges = true;

            // Si Supabase tiene las columnas habilitadas, actualizamos en background
            if (alb.id) {
              supabase
                .from('albums')
                .update({
                  release_date: res.releaseDate,
                  release_year: res.releaseYear,
                })
                .eq('id', alb.id)
                .then(() => {})
                .catch(() => {});
            }
          }
        } catch (e) {
          console.warn(
            'Error al resolver año de Spotify para:',
            alb.album_name,
            e
          );
        }
      }

      if (hasChanges && !isCancelled) {
        setSpotifyYearsCache(updatedCache);
        try {
          localStorage.setItem(
            SPOTIFY_YEARS_CACHE_KEY,
            JSON.stringify(updatedCache)
          );
        } catch (err) {
          console.warn('Error guardando cache de años de Spotify:', err);
        }
      }
    };

    resolveMissingYears();

    return () => {
      isCancelled = true;
    };
  }, [albums, spotifyYearsCache]);

  // Reset pagination on filter or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, selectedYearFilter, sortBy]);

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

  // Conteo de álbumes por año y década
  const yearCounts = useMemo(() => {
    const counts = { ALL: albums.length };
    albums.forEach((alb) => {
      const y = getAlbumYear(alb, spotifyYearsCache);
      if (y) {
        counts[y] = (counts[y] || 0) + 1;
        const dec = `${Math.floor(y / 10) * 10}s`;
        counts[dec] = (counts[dec] || 0) + 1;
      }
    });
    return counts;
  }, [albums, spotifyYearsCache]);

  // Navegación de décadas estilo AlbumOfTheYear (< 2020s 2020 2021 ... >)
  const currentDecadeIndex = DECADES.indexOf(selectedDecade);
  const canGoOlder = currentDecadeIndex < DECADES.length - 1;
  const canGoNewer = currentDecadeIndex > 0;

  const handlePrevDecade = () => {
    if (canGoOlder) {
      setSelectedDecade(DECADES[currentDecadeIndex + 1]);
    }
  };

  const handleNextDecade = () => {
    if (canGoNewer) {
      setSelectedDecade(DECADES[currentDecadeIndex - 1]);
    }
  };

  const selectYearOrDecade = (val) => {
    setSelectedYearFilter(val);
    if (typeof val === 'number') {
      const dec = `${Math.floor(val / 10) * 10}s`;
      if (DECADES.includes(dec) && dec !== selectedDecade) {
        setSelectedDecade(dec);
      }
    } else if (typeof val === 'string' && val.endsWith('s')) {
      if (DECADES.includes(val)) {
        setSelectedDecade(val);
      }
    }
  };

  // Generar lista de años para la década seleccionada en orden cronológico
  const currentDecadeStart = parseInt(selectedDecade.slice(0, 4), 10);
  const decadeYears = useMemo(() => {
    const maxYear = selectedDecade === '2020s' ? 2026 : currentDecadeStart + 9;
    const list = [];
    for (let y = currentDecadeStart; y <= maxYear; y++) {
      list.push(y);
    }
    return list;
  }, [selectedDecade, currentDecadeStart]);

  // Estadísticas globales
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

  // Álbumes filtrados y ordenados
  const filteredAlbums = useMemo(() => {
    let result = [...albums];

    // Status Filter
    if (statusFilter !== 'ALL') {
      result = result.filter((a) => a.status === statusFilter);
    }

    // Year Filter (Año o Década)
    if (selectedYearFilter !== 'ALL') {
      if (
        typeof selectedYearFilter === 'string' &&
        selectedYearFilter.endsWith('s')
      ) {
        const decadeStart = parseInt(selectedYearFilter.slice(0, 4), 10);
        const decadeEnd = decadeStart + 9;
        result = result.filter((a) => {
          const y = getAlbumYear(a, spotifyYearsCache);
          return y !== null && y >= decadeStart && y <= decadeEnd;
        });
      } else {
        const targetYear = parseInt(selectedYearFilter, 10);
        result = result.filter((a) => {
          const y = getAlbumYear(a, spotifyYearsCache);
          return y === targetYear;
        });
      }
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
  }, [albums, statusFilter, selectedYearFilter, searchQuery, sortBy, spotifyYearsCache]);

  const totalPages = Math.ceil(filteredAlbums.length / ITEMS_PER_PAGE) || 1;
  const paginatedAlbums = useMemo(() => {
    return filteredAlbums.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredAlbums, currentPage]);

  return (
    <div className="min-h-screen bg-[#0d0e15] text-white py-6 sm:py-8 px-4 sm:px-6 lg:px-8 font-['Stack_Sans_Notch',sans-serif]">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Universal Standard App Header */}
        <AppHeader showTitle={false} />

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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

        {/* ========================================================================= */}
        {/* BARRA DE AÑOS Y DÉCADAS (ESTILO ALBUMOFTHEYEAR.ORG)                        */}
        {/* ========================================================================= */}
        <div className="bg-[#151722]/95 border border-white/10 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md shadow-xl relative space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm">📅</span>
              <span className="text-xs sm:text-sm font-black text-white tracking-wide uppercase">
                Años y Décadas
              </span>

              {selectedYearFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedYearFilter('ALL')}
                  className="text-[11px] text-pink-300 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 px-2.5 py-0.5 rounded-full font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Restablecer filtro de año"
                >
                  <span>
                    Filtro:{' '}
                    <strong className="text-white">
                      {typeof selectedYearFilter === 'number'
                        ? selectedYearFilter
                        : selectedYearFilter}
                    </strong>{' '}
                    ({filteredAlbums.length}{' '}
                    {filteredAlbums.length === 1 ? 'álbum' : 'álbumes'})
                  </span>
                  <span className="text-pink-400 font-black">✕</span>
                </button>
              )}
            </div>

            {/* Selector rápido de Décadas */}
            <div className="flex items-center gap-1 overflow-x-auto max-w-full scrollbar-none py-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 hidden sm:inline">
                Década:
              </span>
              {DECADES.map((dec) => {
                const count = yearCounts[dec] || 0;
                const isCurrentDecade = selectedDecade === dec;
                return (
                  <button
                    key={dec}
                    type="button"
                    onClick={() => {
                      setSelectedDecade(dec);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      isCurrentDecade
                        ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400 font-black'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {dec}
                    {count > 0 && (
                      <span className="ml-1 text-[9px] opacity-70">({count})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Carril Principal Estilo AlbumOfTheYear: < 2020s 2020 2021 2022 2023 2024 2025 2026 > */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 scrollbar-none w-full">
            {/* Botón TODOS */}
            <button
              type="button"
              onClick={() => setSelectedYearFilter('ALL')}
              className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer select-none ${
                selectedYearFilter === 'ALL'
                  ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-lg shadow-pink-500/25 ring-2 ring-pink-400/50 font-black scale-105'
                  : 'bg-black/40 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              <span>Todos</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  selectedYearFilter === 'ALL'
                    ? 'bg-black/30 text-white'
                    : 'bg-white/10 text-slate-400'
                }`}
              >
                {yearCounts.ALL || 0}
              </span>
            </button>

            {/* Flechita Izquierda: Década Anterior */}
            <button
              type="button"
              onClick={handlePrevDecade}
              disabled={!canGoOlder}
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-black transition-all text-sm flex-shrink-0 cursor-pointer border ${
                canGoOlder
                  ? 'bg-white/10 hover:bg-white/20 text-white border-white/20 hover:scale-105 shadow'
                  : 'bg-white/5 text-slate-600 border-white/5 cursor-not-allowed opacity-40'
              }`}
              title={
                canGoOlder
                  ? `Ir a década anterior (${DECADES[currentDecadeIndex + 1]})`
                  : 'No hay décadas anteriores'
              }
            >
              ‹
            </button>

            {/* Botón de la Década Activa (ej: 2020s) */}
            <button
              type="button"
              onClick={() => selectYearOrDecade(selectedDecade)}
              className={`px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer select-none border ${
                selectedYearFilter === selectedDecade
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 ring-2 ring-purple-400 scale-105 border-purple-400'
                  : 'bg-purple-950/50 hover:bg-purple-900/70 text-purple-200 border-purple-500/40 hover:border-purple-400'
              }`}
              title={`Filtrar toda la década ${selectedDecade}`}
            >
              <span>{selectedDecade}</span>
              {(yearCounts[selectedDecade] || 0) > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    selectedYearFilter === selectedDecade
                      ? 'bg-black/40 text-white'
                      : 'bg-purple-500/25 text-purple-200'
                  }`}
                >
                  {yearCounts[selectedDecade]}
                </span>
              )}
            </button>

            {/* Años de la Década Activa en orden cronológico (2020, 2021, 2022...) */}
            {decadeYears.map((yr) => {
              const count = yearCounts[yr] || 0;
              const isSelected =
                selectedYearFilter === yr || selectedYearFilter === String(yr);

              return (
                <button
                  key={yr}
                  type="button"
                  onClick={() => selectYearOrDecade(yr)}
                  className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer select-none border ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-lg shadow-pink-500/25 ring-2 ring-pink-400/50 font-black scale-105 border-pink-400'
                      : count > 0
                      ? 'bg-black/50 text-slate-200 hover:bg-white/15 hover:text-white border-white/10'
                      : 'bg-black/20 text-slate-500 hover:text-slate-300 border-white/5 opacity-60'
                  }`}
                >
                  <span>{yr}</span>
                  {count > 0 && (
                    <span
                      className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        isSelected
                          ? 'bg-black/30 text-white'
                          : 'bg-white/10 text-cyan-300'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Flechita Derecha: Siguiente Década */}
            <button
              type="button"
              onClick={handleNextDecade}
              disabled={!canGoNewer}
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-black transition-all text-sm flex-shrink-0 cursor-pointer border ${
                canGoNewer
                  ? 'bg-white/10 hover:bg-white/20 text-white border-white/20 hover:scale-105 shadow'
                  : 'bg-white/5 text-slate-600 border-white/5 cursor-not-allowed opacity-40'
              }`}
              title={
                canGoNewer
                  ? `Ir a siguiente década (${DECADES[currentDecadeIndex - 1]})`
                  : 'No hay décadas más recientes'
              }
            >
              ›
            </button>
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
                    ? 'bg-cyan-500 text-black shadow-md font-bold'
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
          <div className="p-12 bg-white/5 border border-white/5 rounded-3xl text-center space-y-3">
            <span className="text-4xl">🎵</span>
            <h3 className="text-lg font-bold text-white">
              No se encontraron álbumes
            </h3>
            <p className="text-slate-400 text-xs">
              {selectedYearFilter !== 'ALL'
                ? `No hay álbumes registrados para el año/década ${selectedYearFilter}.`
                : 'Intenta cambiar los filtros o el término de búsqueda.'}
            </p>
            {selectedYearFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedYearFilter('ALL')}
                className="mt-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-xl transition-all shadow-md inline-block"
              >
                Ver todos los años
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-4">
              {paginatedAlbums.map((album) => {
                const isMine = isUserAlbum(album);
                const score = album.final_rating;
                const albumSlug = slugifyAlbum(album.album_name);
                const albumYear = getAlbumYear(album, spotifyYearsCache);

                return (
                  <Link
                    key={album.id}
                    to={`/albumes/${albumSlug}`}
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
                        src={album.image_url || PLACEHOLDER_COVER}
                        alt={album.album_name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = PLACEHOLDER_COVER;
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
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2.5 sm:p-3 flex items-end justify-between">
                        {score !== null ? (
                          <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-lg">
                            <span className="text-amber-400 text-xs sm:text-sm font-black">
                              {score.toFixed(2)}
                            </span>
                            <span className="text-[10px] sm:text-xs">⭐</span>
                            {album.bonus > 0 && (
                              <span className="text-[9px] text-cyan-300 font-bold bg-cyan-500/20 px-1 py-0.2 rounded">
                                +{album.bonus.toFixed(2)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-[9px] text-slate-400 bg-black/70 px-1.5 py-0.5 rounded">
                            Sin calificar
                          </div>
                        )}

                        <div className="text-[10px] sm:text-[11px] text-slate-300 bg-black/70 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-lg font-medium">
                          📝 {album.review_count}
                        </div>
                      </div>
                    </div>

                    {/* Info Body */}
                    <div className="p-3 sm:p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-cyan-300 transition-colors line-clamp-1">
                          {album.album_name}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-slate-400 font-medium mt-0.5">
                          <p className="truncate flex-1">{album.artist_name}</p>
                          {albumYear && (
                            <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/5 border border-white/5 px-1.5 py-0.2 rounded ml-1.5 flex-shrink-0">
                              {albumYear}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-[10px] sm:text-[11px] mt-1 line-clamp-1">
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
                        <div className="bg-white/5 border border-white/5 rounded-xl p-2 text-xs flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-1 min-w-0 pr-1">
                            <span className="text-amber-400 text-[10px]">
                              👑
                            </span>
                            <span className="text-slate-300 truncate text-[10px] sm:text-[11px]">
                              {album.best_track.name}
                            </span>
                          </div>
                          <span className="text-amber-300 font-bold text-[10px] sm:text-[11px] whitespace-nowrap">
                            {album.best_track.avg_rating} ⭐
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-6 pb-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
                <div className="text-xs text-slate-400">
                  Mostrando{' '}
                  <span className="text-white font-bold">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>{' '}
                  a{' '}
                  <span className="text-white font-bold">
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredAlbums.length
                    )}
                  </span>{' '}
                  de{' '}
                  <span className="text-cyan-400 font-bold">
                    {filteredAlbums.length}
                  </span>{' '}
                  álbumes
                </div>

                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  <button
                    onClick={() => {
                      setCurrentPage(1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 border border-white/10 transition-all"
                    title="Primera Página"
                  >
                    «
                  </button>

                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 border border-white/10 transition-all flex items-center gap-1"
                  >
                    <span>←</span> Anterior
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 2
                      );
                    })
                    .map((page, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && page - prev > 1;

                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && (
                            <span className="text-slate-600 px-1 text-xs">
                              ...
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setCurrentPage(page);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`min-w-[32px] h-8 rounded-xl text-xs font-bold transition-all border ${
                              currentPage === page
                                ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/20'
                                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 border border-white/10 transition-all flex items-center gap-1"
                  >
                    Siguiente <span>→</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentPage(totalPages);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 border border-white/10 transition-all"
                    title="Última Página"
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
