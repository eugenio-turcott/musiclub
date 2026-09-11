import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArtistLinks } from '../common/ArtistLinks';
import { PLACEHOLDER_COVER } from '../TierListMaker';

/**
 * Sección de Trending Releases Semanales (Musiclub Style - Popularity This Week)
 * Sincronizado 1:1 con https://record.club/releases?sortBy=popularity-week
 * Incluye los 84 lanzamientos completos de la semana con artworks CDN de alta resolución.
 */
export function TrendingMonthlySection({
  trendingData,
  loading = false,
  onQuickPropose,
  proposingId = null,
}) {
  const releases = trendingData?.releases || [];
  const monthLabel = trendingData?.monthLabel || 'Tendencias de la Semana';
  const lastFridayStr = trendingData?.lastFridayStr || 'Viernes';

  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Máximo puntaje de popularidad para la escala relativa de la barra
  const maxPopularity = useMemo(() => {
    if (!releases.length) return 450;
    const firstPop = releases[0]?.popularity_raw;
    return typeof firstPop === 'number' && firstPop > 0 ? firstPop : 450;
  }, [releases]);

  // Filtrado reactivo por texto y categoría
  const filteredReleases = useMemo(() => {
    let list = releases;

    if (selectedCategory !== 'ALL') {
      list = list.filter((item) => {
        const cat = (item.genre_category || '').toUpperCase();
        if (selectedCategory === 'POP') return cat.includes('POP') || cat.includes('HYPERPOP');
        if (selectedCategory === 'ROCK') return cat.includes('ROCK') || cat.includes('PUNK') || cat.includes('INDIE') || cat.includes('SLUDGE');
        if (selectedCategory === 'HIPHOP') return cat.includes('HIP-HOP') || cat.includes('RAP') || cat.includes('SOUL');
        if (selectedCategory === 'ELECTRONIC') return cat.includes('ELECTRO') || cat.includes('HOUSE') || cat.includes('AMBIENT') || cat.includes('IDM');
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

  // Si no está buscando ni filtrando y no ha activado 'showAll', mostrar 25 iniciales
  const isFiltering = searchQuery.trim().length > 0 || selectedCategory !== 'ALL';
  const visibleReleases = useMemo(() => {
    if (showAll || isFiltering) return filteredReleases;
    return filteredReleases.slice(0, 25);
  }, [filteredReleases, showAll, isFiltering]);

  return (
    <section className="space-y-4 my-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-pink-500/20 via-purple-500/15 to-orange-500/15 border border-pink-500/30 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-black uppercase tracking-wider">
            <span>🔥</span>
            <span>Tendencias de la Semana</span>
            <span className="text-white/40">•</span>
            <span className="text-amber-300">Ranking Global ({releases.length})</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>{monthLabel}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Los {releases.length} lanzamientos más populares y destacados de la semana ordenados por rotación, reproducciones e impacto global.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-auto bg-black/40 border border-white/10 px-4 py-2.5 rounded-2xl">
          <span className="text-sm">🗓️</span>
          <div className="text-left">
            <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Ciclo Semanal
            </span>
            <span className="text-xs font-black text-pink-300">
              Corte: {lastFridayStr}
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
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Buscar entre los ${releases.length} lanzamientos de la semana...`}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 pl-9 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-pink-500/60 focus:ring-1 focus:ring-pink-500/40 transition-all"
            />
            <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
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
                onClick={() => setSelectedCategory(tab.id)}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
            {visibleReleases.map((item, index) => {
              const rank = item.trending_rank || index + 1;
              const targetUrl = `/albumes/${item.slug}`;
              const isProposing =
                proposingId === item.id ||
                proposingId === item.spotify_id ||
                proposingId === item.album_name;

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

                    {item.is_new && (
                      <div className="absolute top-2 right-2 z-10">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-400 text-black shadow-lg tracking-wider animate-pulse">
                          NEW
                        </span>
                      </div>
                    )}

                    {/* Tracks & Live Rotation indicator */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-2 flex items-end justify-between text-[10px] text-slate-300">
                      <span className="font-mono bg-black/60 px-1.5 py-0.5 rounded border border-white/10">
                        {item.total_tracks ? `${item.total_tracks} tracks` : (item.release_type || 'LP')}
                      </span>
                      <span className="text-pink-300 font-bold flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded border border-pink-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                        Sonando
                      </span>
                    </div>
                  </Link>

                  {/* Body info */}
                  <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <Link
                        to={targetUrl}
                        className="font-bold text-white text-xs sm:text-sm line-clamp-1 hover:text-pink-400 transition-colors block"
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

                      {item.hit_track && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px] text-pink-300/90 font-medium">
                          <span className="text-[10px] flex-shrink-0">🎵</span>
                          <span className="truncate" title={item.hit_track}>
                            {item.hit_track}
                          </span>
                        </div>
                      )}

                      {/* Popularity this week (Musiclub feature) */}
                      <div className="pt-2 mt-1 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-semibold tracking-tight">Popularity this week</span>
                          <span className="font-mono text-pink-400 font-bold">
                            {item.popularity_this_week || `${rawPop.toLocaleString()} pts`}
                          </span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 rounded-full transition-all duration-500"
                            style={{
                              width: `${popPercent}%`,
                            }}
                          />
                        </div>
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
                          <span>{isProposing ? 'Abriendo...' : 'Reseñar en Club'}</span>
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

          {/* Botón Expansible para ver los 84 lanzamientos completos */}
          {!isFiltering && filteredReleases.length > 25 && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={() => setShowAll((prev) => !prev)}
                className="px-6 py-3 rounded-2xl bg-[#11131E] hover:bg-pink-500/20 text-pink-300 hover:text-white border border-pink-500/30 hover:border-pink-500/60 font-black text-xs sm:text-sm shadow-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>{showAll ? '🔼' : '🔽'}</span>
                <span>
                  {showAll
                    ? 'Mostrar menos (Top 25)'
                    : `Ver todos los ${filteredReleases.length} lanzamientos de la semana`}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300">
                  {showAll ? 'Top 25' : `${filteredReleases.length} de ${filteredReleases.length}`}
                </span>
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
