import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArtistLinks } from '../common/ArtistLinks';
import { PLACEHOLDER_COVER } from '../TierListMaker';

/**
 * Sección de Releases Anticipados (Musiclub style)
 * Lanzamientos anunciados que aún no salen; no se pueden calificar pero sí indexar y consultar (V.8.5).
 */
export function AnticipatedSection({ anticipatedReleases = [], loading = false }) {
  const [showAll, setShowAll] = useState(false);
  const displayedReleases = showAll ? anticipatedReleases : anticipatedReleases.slice(0, 10);
  const totalCount = anticipatedReleases.length;

  return (
    <section className="space-y-4 my-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-yellow-500/10 border border-amber-500/30 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider">
            <span>⏳</span>
            <span>Releases Anticipados</span>
            <span className="text-white/40">•</span>
            <span className="text-amber-200">{totalCount} Próximos Estrenos</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Lanzamientos Próximos a Salir</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Álbumes y EPs anunciados oficialmente por los artistas ordenados por expectativa y popularidad. Puedes indexarlos en el club,
            explorar sus detalles y compartir su ficha técnica; la calificación y reseñas se habilitan
            el día oficial de su estreno.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-auto bg-amber-500/10 border border-amber-500/25 px-4 py-2.5 rounded-2xl text-amber-200">
          <span className="text-base">🔒</span>
          <div className="text-left">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-amber-400">
              Norma de Comunidad
            </span>
            <span className="text-xs font-black">
              Calificaciones bloqueadas hasta el estreno
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Anticipated Releases */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-white/5 rounded-2xl aspect-[3/4] border border-white/5"
            />
          ))}
        </div>
      ) : anticipatedReleases.length === 0 ? (
        <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10 text-slate-400 text-sm">
          No hay lanzamientos anticipados registrados en este momento.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {displayedReleases.map((item, index) => {
              const targetUrl = `/albumes/${item.slug}`;
              const rank = item.popularity_rank || index + 1;

              return (
                <div
                  key={item.id || item.slug}
                  className="bg-[#12131F]/95 rounded-2xl overflow-hidden border border-amber-500/25 hover:border-amber-400/60 shadow-lg hover:shadow-amber-500/15 transition-all duration-300 flex flex-col group relative"
                >
                  {/* Artwork */}
                  <div className="relative aspect-square overflow-hidden bg-black/60">
                    <img
                      src={item.image_url || PLACEHOLDER_COVER}
                      alt={item.album_name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = PLACEHOLDER_COVER;
                      }}
                    />

                    {/* Anticipated Badge */}
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-amber-500 text-black border border-amber-400 shadow-md">
                        ⏳ Próximo
                      </span>
                    </div>

                    {/* Hype Rank Badge */}
                    <div className="absolute top-2 right-2 z-10">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-black/85 border border-amber-500/40 text-amber-300 backdrop-blur-md">
                        #{rank} Hype
                      </span>
                    </div>

                    {/* Estreno Date Badge Overlay */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-2.5 flex items-end justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
                          📅 {item.release_date || 'Próximamente'}
                        </span>
                      </div>
                      {item.popularity_raw > 0 && (
                        <span className="text-[9px] font-bold text-amber-200/80 bg-black/60 px-1.5 py-0.5 rounded">
                          {item.popularity_raw} pts
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <Link
                        to={targetUrl}
                        className="font-black text-white text-sm line-clamp-1 hover:text-amber-300 transition-colors block"
                        title={item.album_name}
                      >
                        {item.album_name}
                      </Link>

                      <div className="mt-1">
                        <ArtistLinks
                          artistName={item.artist_name}
                          className="text-xs text-slate-400 line-clamp-1"
                          linkClassName="hover:text-amber-200 transition-colors"
                        />
                      </div>

                      {item.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Locked Rating notice & CTA */}
                    <div className="pt-2 border-t border-white/5 mt-auto space-y-2">
                      <div className="text-[10px] text-amber-300/80 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1.5">
                        <span>🔒</span>
                        <span>Calificación en su estreno</span>
                      </div>

                      <Link
                        to={targetUrl}
                        className="w-full py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>🔍</span>
                        <span>Ver Ficha Técnica</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Toggle Expand / Collapse Button */}
          {totalCount > 10 && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAll((prev) => !prev)}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-[#171926] hover:bg-[#202336] text-amber-300 border border-amber-500/30 hover:border-amber-400/60 font-black text-xs sm:text-sm tracking-wide transition-all shadow-lg hover:shadow-amber-500/10 active:scale-95 cursor-pointer"
              >
                <span>{showAll ? '🔼' : '🔽'}</span>
                <span>
                  {showAll
                    ? 'Mostrar solo los primeros 10'
                    : `Ver todos los ${totalCount} próximos estrenos`}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30">
                  {showAll ? '10' : `${totalCount}`}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
