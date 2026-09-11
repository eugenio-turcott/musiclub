import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArtistLinks } from '../common/ArtistLinks';
import { PLACEHOLDER_COVER } from '../TierListMaker';
import { getFamousGenresCatalog } from '../../services/trendingService';
import { getReleaseUrl } from '../../utils/ratingUtils';

/**
 * Vista de Géneros Más Famosos con Releases del Club y Recomendaciones Fallback (V.8.5)
 * Si un género tiene menos de 5 lanzamientos (<5), muestra álbumes esenciales recomendados.
 */
export function CatalogGenresView({
  albums = [],
  onQuickPropose,
  proposingId = null,
}) {
  const [selectedGenreId, setSelectedGenreId] = useState('ALL');
  const [genrePages, setGenrePages] = useState({});

  const getGenrePage = (genreId) => genrePages[genreId] || 1;
  const setGenrePage = (genreId, page) => {
    setGenrePages((prev) => ({
      ...prev,
      [genreId]: page,
    }));
  };

  // Obtener catálogo enriquecido de géneros con fallback de recomendaciones
  const genresCatalog = useMemo(() => {
    return getFamousGenresCatalog(albums);
  }, [albums]);

  const displayedGenres = useMemo(() => {
    if (selectedGenreId === 'ALL') return genresCatalog;
    return genresCatalog.filter((g) => g.id === selectedGenreId);
  }, [genresCatalog, selectedGenreId]);

  return (
    <div className="space-y-8 my-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-500/15 via-pink-500/10 to-cyan-500/10 border border-purple-500/20 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-wider">
            <span>🏷️</span>
            <span>Exploración por Géneros</span>
            <span className="text-white/40">•</span>
            <span className="text-pink-300">10 Géneros Legendarios</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
            Los Géneros Más Famosos de la Música
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Descubre los álbumes calificados en Musiclub agrupados por sus vertientes sonoras.
            En géneros emergentes o con menos de 5 registros en la base de datos, te presentamos
            recomendaciones esenciales para explorar y añadir al Club.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-4 py-2.5 rounded-2xl text-purple-300">
          <span className="text-lg">✨</span>
          <span className="text-xs font-bold">Curaduría Expandida</span>
        </div>
      </div>

      {/* Genre Filter Pills */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button
          type="button"
          onClick={() => setSelectedGenreId('ALL')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border flex items-center gap-1.5 ${
            selectedGenreId === 'ALL'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-400 shadow-md shadow-purple-500/25 scale-105'
              : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
          }`}
        >
          <span>🌐</span>
          <span>Todos los Géneros</span>
        </button>

        {genresCatalog.map((genre) => {
          const isSelected = selectedGenreId === genre.id;
          return (
            <button
              key={genre.id}
              type="button"
              onClick={() => setSelectedGenreId(genre.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-400 shadow-md shadow-purple-500/25 scale-105'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
              }`}
            >
              <span>{genre.icon}</span>
              <span>{genre.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-purple-200 font-black">
                {genre.clubReleases.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Genre Sections */}
      <div className="space-y-10">
        {displayedGenres.map((genre) => {
          const hasClub = genre.clubReleases.length > 0;
          const hasRecs = genre.recommendations.length > 0;

          // Paginación inteligente por género (10 por página en vista Todos, 15 en individual)
          const isAllView = selectedGenreId === 'ALL';
          const pageSize = isAllView ? 10 : 15;
          const totalReleases = genre.clubReleases.length;
          const currentPage = getGenrePage(genre.id);
          const totalPages = Math.ceil(totalReleases / pageSize);
          const startIndex = (currentPage - 1) * pageSize;
          const pagedReleases = genre.clubReleases.slice(
            startIndex,
            startIndex + pageSize
          );

          return (
            <section
              key={genre.id}
              className="bg-[#11131E]/80 border border-white/10 rounded-3xl p-5 sm:p-6 space-y-6 shadow-xl"
            >
              {/* Genre Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{genre.icon}</span>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      {genre.name}
                    </h3>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-slate-300">
                      {genre.clubReleases.length} en el Club
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                    {genre.description}
                  </p>
                </div>

                {genre.hasFewReleases && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold self-start sm:self-auto">
                    <span>💡</span>
                    <span>Menos de 5 registros • Recomendaciones activas</span>
                  </div>
                )}
              </div>

              {/* Releases from the Club */}
              {hasClub && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <span>🎧</span>
                      <span>Álbumes Registrados en Musiclub ({totalReleases})</span>
                    </h4>
                    {totalPages > 1 && (
                      <span className="text-[11px] font-mono text-purple-300 bg-purple-500/15 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                        Página {currentPage} de {totalPages}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                    {pagedReleases.map((album) => {
                      const score = Number(album.final_rating || album.weighted_score || album.puntuacion || 0);
                      const targetUrl = getReleaseUrl(album, album.release_type);

                      return (
                        <div
                          key={album.id}
                          className="bg-black/40 rounded-2xl overflow-hidden border border-white/10 hover:border-cyan-400/50 transition-all duration-300 flex flex-col group relative"
                        >
                          <div className="relative aspect-square overflow-hidden bg-black/60">
                            <img
                              src={album.image_url || PLACEHOLDER_COVER}
                              alt={album.album_name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                e.target.src = PLACEHOLDER_COVER;
                              }}
                            />
                            {score > 0 && (
                              <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-black/80 backdrop-blur-md border border-amber-500/40 px-2 py-0.5 rounded-lg">
                                <span className="text-amber-400 text-xs font-black">
                                  {score.toFixed(2)}
                                </span>
                                <span className="text-[10px]">⭐</span>
                              </div>
                            )}
                          </div>

                          <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                            <div>
                              <Link
                                to={targetUrl}
                                className="font-bold text-white text-xs sm:text-sm line-clamp-1 hover:text-cyan-300 transition-colors block"
                                title={album.album_name}
                              >
                                {album.album_name}
                              </Link>
                              <div className="mt-1">
                                <ArtistLinks
                                  artistName={album.artist_name}
                                  className="text-xs text-slate-400 line-clamp-1"
                                  linkClassName="hover:text-cyan-300 transition-colors"
                                />
                              </div>
                            </div>

                            <div className="pt-2 border-t border-white/5 mt-auto">
                              <Link
                                to={targetUrl}
                                className="w-full py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-bold text-center block transition-all"
                              >
                                Ver Álbum
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Paginación de Álbumes del Género */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/5">
                      <span className="text-xs text-slate-400">
                        Mostrando{' '}
                        <strong className="text-white">
                          {startIndex + 1}
                        </strong>{' '}
                        -{' '}
                        <strong className="text-white">
                          {Math.min(startIndex + pageSize, totalReleases)}
                        </strong>{' '}
                        de{' '}
                        <strong className="text-white">
                          {totalReleases}
                        </strong>{' '}
                        álbumes en {genre.name}
                      </span>

                      <div className="flex items-center gap-1.5 flex-wrap justify-center">
                        <button
                          type="button"
                          onClick={() => setGenrePage(genre.id, 1)}
                          disabled={currentPage === 1}
                          className="p-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-white/5 text-xs font-bold transition-all border border-white/5 cursor-pointer disabled:cursor-not-allowed"
                          title="Primera página"
                        >
                          ««
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setGenrePage(genre.id, Math.max(1, currentPage - 1))
                          }
                          disabled={currentPage === 1}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-white/5 text-xs font-bold transition-all border border-white/5 cursor-pointer disabled:cursor-not-allowed"
                        >
                          ◀ Anterior
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((page) => {
                            if (totalPages <= 7) return true;
                            if (page === 1 || page === totalPages) return true;
                            return Math.abs(page - currentPage) <= 1;
                          })
                          .map((page, idx, arr) => {
                            const prevPage = arr[idx - 1];
                            const hasGap = prevPage && page - prevPage > 1;

                            return (
                              <React.Fragment key={page}>
                                {hasGap && (
                                  <span className="text-xs text-slate-600 px-1">
                                    ...
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setGenrePage(genre.id, page)}
                                  className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                                    currentPage === page
                                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-400 shadow-md shadow-purple-500/25 scale-105'
                                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5 hover:border-white/10'
                                  }`}
                                >
                                  {page}
                                </button>
                              </React.Fragment>
                            );
                          })}

                        <button
                          type="button"
                          onClick={() =>
                            setGenrePage(
                              genre.id,
                              Math.min(totalPages, currentPage + 1)
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-white/5 text-xs font-bold transition-all border border-white/5 cursor-pointer disabled:cursor-not-allowed"
                        >
                          Siguiente ▶
                        </button>

                        <button
                          type="button"
                          onClick={() => setGenrePage(genre.id, totalPages)}
                          disabled={currentPage === totalPages}
                          className="p-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-white/5 text-xs font-bold transition-all border border-white/5 cursor-pointer disabled:cursor-not-allowed"
                          title="Última página"
                        >
                          »»
                        </button>

                        {isAllView && totalReleases > pageSize && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedGenreId(genre.id);
                              setGenrePage(genre.id, 1);
                            }}
                            className="ml-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-500/15 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 cursor-pointer transition-all"
                          >
                            Ver solo {genre.name} ➔
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Curated Recommendations Fallback (when < 5 releases in DB) */}
              {hasRecs && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                      <span>⭐</span>
                      <span>Recomendaciones Esenciales para descubrir {genre.name}</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Discos aclamados no registrados aún • Listos para reseñar
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                    {genre.recommendations.map((rec, i) => {
                      const isProposing = proposingId === rec.album_name;

                      return (
                        <div
                          key={i}
                          className="bg-black/30 rounded-2xl overflow-hidden border border-amber-500/25 hover:border-amber-400/60 transition-all duration-300 flex flex-col group relative"
                        >
                          <div className="relative aspect-square overflow-hidden bg-black/60">
                            <img
                              src={rec.image_url || PLACEHOLDER_COVER}
                              alt={rec.album_name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                e.target.src = PLACEHOLDER_COVER;
                              }}
                            />
                            <div className="absolute top-2 left-2 z-10">
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg bg-amber-500/90 text-black shadow-md">
                                Esencial
                              </span>
                            </div>
                            <div className="absolute bottom-2 right-2 z-10">
                              <span className="text-[10px] font-mono text-slate-300 bg-black/70 px-1.5 py-0.5 rounded border border-white/10">
                                {rec.release_year}
                              </span>
                            </div>
                          </div>

                          <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                            <div>
                              <h5
                                className="font-bold text-white text-xs sm:text-sm line-clamp-1"
                                title={rec.album_name}
                              >
                                {rec.album_name}
                              </h5>
                              <div className="mt-1">
                                <ArtistLinks
                                  artistName={rec.artist_name}
                                  separator=" & "
                                  className="text-xs text-slate-400 line-clamp-1"
                                  linkClassName="hover:text-amber-200 transition-colors"
                                />
                              </div>
                            </div>

                            <div className="pt-2 border-t border-white/5 mt-auto">
                              {onQuickPropose ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onQuickPropose({
                                      album_name: rec.album_name,
                                      artist_name: rec.artist_name,
                                      image_url: rec.image_url,
                                      release_date: `${rec.release_year}-01-01`,
                                      release_type: 'ALBUM',
                                      genres: [genre.id],
                                    });
                                  }}
                                  disabled={isProposing}
                                  className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60 ${
                                    isProposing
                                      ? 'bg-amber-500/30 text-amber-200 border border-amber-400/50'
                                      : 'bg-amber-500/15 hover:bg-amber-500 hover:text-black text-amber-300 border border-amber-500/30'
                                  }`}
                                >
                                  {isProposing ? (
                                    <svg
                                      className="animate-spin h-3.5 w-3.5 text-amber-300"
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
                                <div className="text-[10px] text-center text-slate-500 py-1">
                                  Clásico sugerido
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
