import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArtistLinks } from '../common/ArtistLinks';
import { PLACEHOLDER_COVER } from '../TierListMaker';
import { registerUntranslatableEntities } from '../../utils/translateCrashGuard';
import { SpotifyLogo } from '../common/PlatformLogos';

const ITEMS_PER_PAGE = 10;

/**
 * Sección de Releases Anticipados (Musiclub style)
 * Lanzamientos anunciados que aún no salen; no se pueden calificar pero sí indexar y consultar (V.8.5).
 * Paginación de 10 en 10 con navegación rápida.
 */
export function AnticipatedSection({
  anticipatedReleases = [],
  loading = false,
}) {
  const sectionRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const totalCount = anticipatedReleases.length;

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const displayedReleases = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return anticipatedReleases.slice(start, start + ITEMS_PER_PAGE);
  }, [anticipatedReleases, safeCurrentPage]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Blindaje universal contra traducción (V.8.11)
  useEffect(() => {
    if (!anticipatedReleases.length) return;
    const rels = [];
    const arts = [];
    anticipatedReleases.forEach((r) => {
      if (r.album_name) rels.push(r.album_name);
      if (r.artist_name) arts.push(r.artist_name);
    });
    registerUntranslatableEntities({ releases: rels, artists: arts });
  }, [anticipatedReleases]);

  return (
    <section ref={sectionRef} className="space-y-4 my-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-yellow-500/10 border border-amber-500/30 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider">
            <span>⏳</span>
            <span>Releases Anticipados</span>
            <span className="text-white/40">•</span>
            <span className="text-amber-200">
              {totalCount} Próximos Estrenos
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Lanzamientos Próximos a Salir</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Álbumes y EPs anunciados oficialmente por los artistas ordenados por
            expectativa y popularidad. Puedes indexarlos en el club, explorar
            sus detalles y compartir su ficha técnica; la calificación y reseñas
            se habilitan el día oficial de su estreno.
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

              const rawTracksCount =
                item.total_tracks ??
                item.expected_tracks ??
                item.totalTracks ??
                (Array.isArray(item.tracks) && item.tracks.length > 0
                  ? item.tracks.length
                  : null) ??
                (Array.isArray(item.track_stats) && item.track_stats.length > 0
                  ? item.track_stats.length
                  : null);

              const hasTracks =
                rawTracksCount !== null &&
                rawTracksCount !== undefined &&
                Number(rawTracksCount) > 0;

              const cleanArtist = item.artist_name || 'Artista';
              const cleanAlbum = item.album_name || 'Lanzamiento';

              const spotifyUrl =
                item.spotify_link ||
                item.spotify_url ||
                (item.spotify_id
                  ? `https://open.spotify.com/album/${item.spotify_id}`
                  : null) ||
                `https://open.spotify.com/search/${encodeURIComponent(
                  `${cleanArtist} ${cleanAlbum}`
                )}`;

              return (
                <div
                  key={item.id || item.slug}
                  className="bg-[#12131F]/95 rounded-2xl overflow-hidden border border-amber-500/25 hover:border-amber-400/60 shadow-lg hover:shadow-amber-500/15 transition-all duration-300 flex flex-col group relative"
                >
                  {/* Artwork - Link directo a la ficha del release */}
                  <Link
                    to={targetUrl}
                    className="relative aspect-square overflow-hidden bg-black/60 block group/cover cursor-pointer"
                    title={`Ver ${item.album_name}`}
                  >
                    <img
                      src={item.image_url || PLACEHOLDER_COVER}
                      alt={item.album_name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover/cover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = PLACEHOLDER_COVER;
                      }}
                    />

                    {/* Anticipated Badge */}
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-amber-500 text-black border border-amber-400 shadow-md">
                        ⏳ Próximo
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-black/85 border border-amber-500/40 text-amber-300 backdrop-blur-md">
                        #{rank}
                      </span>
                    </div>

                    {/* Estreno Date Badge Overlay */}
                    <div className="absolute bottom-2 left-2 z-10">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-amber-200 bg-amber-800/70 px-2 py-0.5 rounded border border-amber-500/40">
                          📅{' '}
                          {item.release_date
                            ? new Date(
                                `${item.release_date}T00:00:00`
                              ).toLocaleDateString('en-US', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Próximamente'}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <Link
                        to={targetUrl}
                        translate="no"
                        className="notranslate music-title font-black text-white text-sm line-clamp-1 hover:text-amber-300 transition-colors block"
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
                    </div>

                    {/* Locked Rating notice, Tracks info & Spotify / Ver Actions */}
                    <div className="pt-2 border-t border-white/5 mt-auto space-y-2">
                      <div className="flex items-center justify-between gap-2 text-[10px]">
                        <div className="text-amber-300/80 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1.5 flex-1 min-w-0">
                          <span>🔒</span>
                          <span className="truncate">Estreno oficial</span>
                        </div>
                        <div className="bg-black/50 border border-white/10 px-2 py-1 rounded-lg text-slate-300 font-mono whitespace-nowrap">
                          <span className="text-slate-400">Tracks:</span>{' '}
                          <strong
                            className={
                              hasTracks
                                ? 'text-white font-bold'
                                : 'text-amber-300 font-bold'
                            }
                          >
                            {hasTracks ? rawTracksCount : 'Por anunciar'}
                          </strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to={targetUrl}
                          className={`py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                            spotifyUrl ? 'flex-1' : 'w-full'
                          }`}
                        >
                          <span>🔍</span>
                          <span>Ver Release</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginación interactiva de 10 en 10 */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-white/10 mt-6 px-1">
              <span className="text-xs text-slate-400 font-medium text-center sm:text-left">
                Página{' '}
                <span className="text-amber-300 font-bold">
                  {safeCurrentPage}
                </span>{' '}
                de <span className="text-white font-bold">{totalPages}</span> ·{' '}
                <span className="text-amber-300 font-bold">{totalCount}</span>{' '}
                próximos estrenos
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
                      : 'bg-[#171926] hover:bg-white/10 text-slate-300 hover:text-white border-white/15 shadow-md hover:border-amber-500/40 cursor-pointer'
                  }`}
                >
                  <span>←</span>
                  <span>Anterior</span>
                </button>

                {/* Números de página en pantallas medianas/grandes */}
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
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/30 scale-105 border border-amber-300 font-black'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Indicador de página central en móvil */}
                <div className="sm:hidden px-3 py-1 bg-white/5 rounded-xl border border-white/10 text-xs font-bold text-amber-300">
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
                      : 'bg-[#171926] hover:bg-white/10 text-slate-300 hover:text-white border-white/15 shadow-md hover:border-amber-500/40 cursor-pointer'
                  }`}
                >
                  <span>Siguiente</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
