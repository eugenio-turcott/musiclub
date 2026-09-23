import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArtistLinks } from '../common/ArtistLinks';
import { PLACEHOLDER_COVER } from '../TierListMaker';
import { registerUntranslatableEntities } from '../../utils/translateCrashGuard';

const ITEMS_PER_PAGE = 20;

/**
 * Sección de Trending Releases Semanales (Musiclub Style - Popularity This Week)
 * Sincronizado 1:1 con https://record.club/releases?sortBy=popularity-week
 * Incluye los 100 lanzamientos completos de la semana paginados de 20 en 20.
 */
export function TrendingMonthlySection({
  trendingData,
  clubAlbums = [],
  loading = false,
  onQuickPropose,
  proposingId = null,
}) {
  const releases = trendingData?.releases || [];
  const monthLabel = trendingData?.monthLabel || 'Tendencias de la Semana';

  const sectionRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Detección reactiva de vista móvil (< 640px)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Límite responsivo: 10 en celular, 20 en pantallas medianas y grandes
  const itemsPerPage = isMobile ? 10 : 20;

  // Mapa de álbumes del club para emparejar calificaciones existentes
  const clubAlbumMap = useMemo(() => {
    const map = new Map();
    (clubAlbums || []).forEach((alb) => {
      if (alb.slug) map.set(alb.slug, alb);
      const kExact = `${(alb.artist_name || '').toLowerCase().trim()}:::${(alb.album_name || '').toLowerCase().trim()}`;
      map.set(kExact, alb);
      const cleanAlb = (alb.album_name || '').replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').trim().toLowerCase();
      const kClean = `${(alb.artist_name || '').toLowerCase().trim()}:::${cleanAlb}`;
      map.set(kClean, alb);
    });
    return map;
  }, [clubAlbums]);

  // Reiniciar a la página 1 cuando el usuario busca o cambia categoría
  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Máximo puntaje de popularidad para la escala relativa de la barra
  const maxPopularity = useMemo(() => {
    if (!releases.length) return 450;
    const firstPop = releases[0]?.popularity_raw;
    return typeof firstPop === 'number' && firstPop > 0 ? firstPop : 450;
  }, [releases]);

  // Blindaje universal contra traducción (V.8.11)
  useEffect(() => {
    if (!releases.length) return;
    const rels = [];
    const arts = [];
    releases.forEach((r) => {
      if (r.album_name) rels.push(r.album_name);
      if (r.artist_name) arts.push(r.artist_name);
      if (r.hit_track) rels.push(r.hit_track);
    });
    registerUntranslatableEntities({ releases: rels, artists: arts });
  }, [releases]);

  // Filtrado reactivo por texto y categoría
  const filteredReleases = useMemo(() => {
    let list = releases;

    if (selectedCategory !== 'ALL') {
      list = list.filter((item) => {
        const cat = (item.genre_category || '').toUpperCase();
        if (selectedCategory === 'POP')
          return cat.includes('POP') || cat.includes('HYPERPOP');
        if (selectedCategory === 'ROCK')
          return (
            cat.includes('ROCK') ||
            cat.includes('PUNK') ||
            cat.includes('INDIE') ||
            cat.includes('SLUDGE')
          );
        if (selectedCategory === 'HIPHOP')
          return (
            cat.includes('HIP-HOP') ||
            cat.includes('RAP') ||
            cat.includes('SOUL')
          );
        if (selectedCategory === 'ELECTRONIC')
          return (
            cat.includes('ELECTRO') ||
            cat.includes('HOUSE') ||
            cat.includes('AMBIENT') ||
            cat.includes('IDM')
          );
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.album_name.toLowerCase().includes(q) ||
          item.artist_name.toLowerCase().includes(q) ||
          (item.genre_category && item.genre_category.toLowerCase().includes(q))
      );
    }

    return list;
  }, [releases, selectedCategory, searchQuery]);

  // Paginación dinámica: 10 en celular, 20 en pantallas medianas y grandes
  const totalPages = Math.max(
    1,
    Math.ceil(filteredReleases.length / itemsPerPage)
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const visibleReleases = useMemo(() => {
    const start = (safeCurrentPage - 1) * itemsPerPage;
    return filteredReleases.slice(start, start + itemsPerPage);
  }, [filteredReleases, safeCurrentPage, itemsPerPage]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section ref={sectionRef} className="space-y-4 my-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-pink-500/20 via-purple-500/15 to-orange-500/15 border border-pink-500/30 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-black uppercase tracking-wider">
            <span>🔥</span>
            <span>Tendencias de la Semana</span>
            <span className="text-white/40">•</span>
            <span className="text-amber-300">Top 100</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>{monthLabel}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Los {releases.length} lanzamientos más populares y destacados de la
            semana ordenados por rotación, reproducciones e impacto global.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-auto bg-black/40 border border-white/10 px-4 py-2.5 rounded-2xl">
          <span className="text-sm">🗓️</span>
          <div className="text-left">
            <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Ciclo Semanal
            </span>
          </div>
        </div>
      </div>

      {/* Controles y Filtros rápidos de Tendencias */}
      {!loading && releases.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#11131E]/80 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
          {/* Buscador dentro del chart */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={`Buscar entre los ${releases.length} lanzamientos de la semana...`}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 pl-9 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-pink-500/60 focus:ring-1 focus:ring-pink-500/40 transition-all"
            />
            <span className="absolute left-3 top-2.5 text-xs text-slate-400">
              🔍
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtros de Categoría */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'ALL', label: `Todos (${releases.length})` },
              { id: 'POP', label: 'Pop / Club' },
              { id: 'ROCK', label: 'Rock / Indie' },
              { id: 'HIPHOP', label: 'Hip-Hop / Soul' },
              { id: 'ELECTRONIC', label: 'Electrónica' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleCategoryChange(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === tab.id
                    ? 'bg-pink-500 text-black shadow-md shadow-pink-500/20'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid of items */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 animate-pulse">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="bg-white/5 rounded-2xl aspect-[3/4] border border-white/5"
            />
          ))}
        </div>
      ) : visibleReleases.length === 0 ? (
        <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10 text-slate-400 text-sm">
          No se encontraron lanzamientos con el filtro actual.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4.5">
            {visibleReleases.map((item, index) => {
              const rank = item.trending_rank || index + 1;
              const targetUrl = `/albumes/${item.slug}`;
              const isProposing =
                Boolean(proposingId) &&
                ((item.id && proposingId === item.id) ||
                  (item.spotify_id && proposingId === item.spotify_id) ||
                  (item.album_name && proposingId === item.album_name));

              // Match con álbum en el club para calificacion
              const clubMatch =
                clubAlbumMap.get(item.slug) ||
                clubAlbumMap.get(
                  `${(item.artist_name || '').toLowerCase().trim()}:::${(item.album_name || '').toLowerCase().trim()}`
                ) ||
                clubAlbumMap.get(
                  `${(item.artist_name || '').toLowerCase().trim()}:::${(item.album_name || '').replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').trim().toLowerCase()}`
                );

              const finalScore =
                clubMatch?.final_rating ??
                clubMatch?.rating ??
                clubMatch?.score ??
                null;
              const reviewCount =
                clubMatch?.review_count ??
                (Array.isArray(clubMatch?.reviews) ? clubMatch.reviews.length : 0);
              const hasClubRating =
                (finalScore !== null &&
                  finalScore !== undefined &&
                  !isNaN(Number(finalScore)) &&
                  Number(finalScore) > 0) ||
                reviewCount > 0;

              // Cálculo relativo de la barra de popularidad según el puntaje de la semana
              const rawPop = item.popularity_raw || 50;
              const popPercent = Math.min(
                100,
                Math.max(16, Math.round((rawPop / maxPopularity) * 100))
              );

              return (
                <div
                  key={item.id || item.slug}
                  className={`bg-[#11131E]/95 rounded-2xl overflow-hidden border shadow-lg transition-all duration-300 flex flex-col group relative ${
                    isProposing
                      ? 'border-pink-500 ring-2 ring-pink-500/40 shadow-pink-500/20'
                      : 'border-white/10 hover:border-pink-500/50 hover:shadow-pink-500/10'
                  }`}
                >
                  {/* Album artwork con enlace directo */}
                  <Link
                    to={targetUrl}
                    className="block relative aspect-square overflow-hidden bg-black/60 group/art focus:outline-none"
                    title={`Ver detalles de ${item.album_name}`}
                  >
                    <img
                      src={item.image_url || PLACEHOLDER_COVER}
                      alt={item.album_name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src = PLACEHOLDER_COVER;
                      }}
                    />

                    {/* Rank & Genre Badges */}
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 flex-wrap max-w-[85%]">
                      <span
                        className={`text-[11px] font-black px-2 py-0.5 rounded-lg shadow-md border backdrop-blur-md ${
                          rank === 1
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-black border-amber-300 ring-2 ring-amber-400/50'
                            : rank <= 3
                              ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-black border-pink-300 shadow-pink-500/30'
                              : 'bg-black/80 text-white border-white/20'
                        }`}
                      >
                        #{rank}
                      </span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg bg-pink-500/80 border border-pink-400 text-white backdrop-blur-md truncate max-w-[120px]">
                        {item.genre_category || 'POP'}
                      </span>
                    </div>

                    {/* Calificación del Club en la esquina superior derecha o Distintivo NEW (solo si aún no tiene reviews) */}
                    {hasClubRating ? (
                      <div className="absolute top-2 right-2 z-10">
                        <span className="bg-[#12131F]/90 text-amber-300 font-black text-xs px-2 py-0.5 rounded-lg border border-amber-400/50 shadow-xl flex items-center gap-1 backdrop-blur-md">
                          <span>⭐</span>
                          <span>{Number(finalScore).toFixed(1)}</span>
                        </span>
                      </div>
                    ) : item.is_new ? (
                      <div className="absolute top-2 right-2 z-10">
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-400 text-black shadow-md tracking-wider">
                          NEW
                        </span>
                      </div>
                    ) : null}

                    {/* Tracks & Live Rotation indicator */}
                    <div className="absolute bottom-2 right-2 z-10">
                      <span className="text-[10px] font-mono bg-black/60 px-1.5 py-0.5 rounded border border-white/10 text-slate-200">
                        {(() => {
                          const count =
                            item.total_tracks ??
                            item.totalTracks ??
                            (Array.isArray(item.tracks)
                              ? item.tracks.length
                              : null);
                          if (count) {
                            return `${count} ${count === 1 ? 'track' : 'tracks'}`;
                          }
                          const relType = (
                            item.release_type || ''
                          ).toUpperCase();
                          if (relType === 'SENCILLO' || relType === 'SINGLE')
                            return '1 track';
                          if (relType === 'EP') return 'EP';
                          return 'Álbum';
                        })()}
                      </span>
                    </div>
                  </Link>

                  {/* Body info */}
                  <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between relative">
                    <div>
                      <Link
                        to={targetUrl}
                        translate="no"
                        className="notranslate music-title font-bold text-white text-xs sm:text-sm line-clamp-1 hover:text-pink-400 transition-colors block"
                        title={item.album_name}
                      >
                        {item.album_name}
                      </Link>

                      <div className="mt-1">
                        <ArtistLinks
                          artistName={item.artist_name}
                          separator=" & "
                          className="text-xs text-slate-300 line-clamp-1"
                          linkClassName="hover:text-cyan-300 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Action */}
                    <div className="pt-2 border-t border-white/5 mt-auto">
                      {onQuickPropose ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onQuickPropose(item);
                          }}
                          disabled={isProposing}
                          className={`w-full py-1.5 px-2.5 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 ${
                            isProposing
                              ? 'bg-pink-500/25 text-pink-200 border border-pink-400/50'
                              : 'bg-pink-500/15 hover:bg-pink-500 hover:text-black text-pink-300 border border-pink-500/30'
                          }`}
                        >
                          {isProposing ? (
                            <svg
                              className="animate-spin h-3.5 w-3.5 text-pink-300"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                              />
                            </svg>
                          ) : (
                            <span>✍️</span>
                          )}
                          <span>
                            {isProposing ? 'Abriendo...' : 'Reseñar en Club'}
                          </span>
                        </button>
                      ) : (
                        <Link
                          to={targetUrl}
                          className="w-full py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                        >
                          <span>🎧</span>
                          <span>Ver Ficha</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginación interactiva */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-white/10 mt-6 px-1">
              <span className="text-xs text-slate-400 font-medium text-center sm:text-left">
                Página{' '}
                <span className="text-white font-bold">{safeCurrentPage}</span>{' '}
                de <span className="text-white font-bold">{totalPages}</span> ·{' '}
                <span className="text-pink-400 font-bold">
                  {filteredReleases.length}
                </span>{' '}
                lanzamientos
              </span>

              <div className="flex items-center justify-center gap-1.5 w-full sm:w-auto">
                {/* Botón Anterior */}
                <button
                  type="button"
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  disabled={safeCurrentPage === 1}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                    safeCurrentPage === 1
                      ? 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed'
                      : 'bg-[#11131E] hover:bg-white/10 text-slate-300 hover:text-white border-white/15 shadow-md hover:border-pink-500/40 cursor-pointer'
                  }`}
                >
                  <span>←</span>
                  <span>Anterior</span>
                </button>

                {/* Números de página en pantallas medianas y grandes */}
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    const isActive = pageNum === safeCurrentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 rounded-xl text-xs font-black transition-all flex items-center justify-center ${
                          isActive
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30 scale-105 border border-pink-400'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Indicador de página central en celular */}
                <div className="sm:hidden px-3 py-1 bg-white/5 rounded-xl border border-white/10 text-xs font-bold text-pink-400">
                  {safeCurrentPage} / {totalPages}
                </div>

                {/* Botón Siguiente */}
                <button
                  type="button"
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  disabled={safeCurrentPage === totalPages}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                    safeCurrentPage === totalPages
                      ? 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed'
                      : 'bg-[#11131E] hover:bg-white/10 text-slate-300 hover:text-white border-white/15 shadow-md hover:border-pink-500/40 cursor-pointer'
                  }`}
                >
                  <span>Siguiente</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
