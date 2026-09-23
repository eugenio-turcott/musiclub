import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArtistLinks } from '../common/ArtistLinks';
import { PLACEHOLDER_COVER } from '../TierListMaker';
import { getReleaseUrl } from '../../utils/ratingUtils';
import { registerUntranslatableEntities } from '../../utils/translateCrashGuard';

/**
 * Sección de Releases Más Recomendados por los Usuarios del Club (V.9.4)
 * Formato Slider continuo estilo En Rotación cuando hay más de 4 releases, ordenados estrictamente de mayor a menor.
 */
export function RecommendedSection({ albums = [] }) {
  const [isSliderPaused, setIsSliderPaused] = useState(false);

  // Filtrar los álbumes que tienen calificación comunitaria y ordenarlos estrictamente de mayor a menor
  const topRecommended = useMemo(() => {
    return (albums || [])
      .filter((a) => {
        const rating = Number(a.final_rating || a.weighted_score || a.puntuacion || 0);
        const reviewsCount = Number(a.review_count || (a.reviews && a.reviews.length) || 0);
        return rating > 0 && reviewsCount > 0;
      })
      .sort((a, b) => {
        const scoreA = Number(a.final_rating || a.weighted_score || a.puntuacion || 0);
        const scoreB = Number(b.final_rating || b.weighted_score || b.puntuacion || 0);
        if (scoreB !== scoreA) {
          return scoreB - scoreA; // Orden estricto de mayor a menor puntuación
        }
        const reviewsA = Number(a.review_count || (a.reviews && a.reviews.length) || 0);
        const reviewsB = Number(b.review_count || (b.reviews && b.reviews.length) || 0);
        return reviewsB - reviewsA;
      })
      .slice(0, 15);
  }, [albums]);

  const isSliderActive = topRecommended.length > 4;

  const marqueeItems = useMemo(() => {
    if (!isSliderActive) return [];
    let base = [...topRecommended];
    while (base.length < 8) {
      base = [...base, ...topRecommended];
    }
    return [...base, ...base];
  }, [isSliderActive, topRecommended]);

  const sliderDuration = useMemo(() => {
    const baseCount = marqueeItems.length / 2;
    return `${Math.max(25, Math.round(baseCount * 4.5))}s`;
  }, [marqueeItems.length]);

  // Blindaje universal contra traducción (V.8.11)
  useEffect(() => {
    if (!topRecommended.length) return;
    const rels = [];
    const arts = [];
    topRecommended.forEach((a) => {
      if (a.album_name) rels.push(a.album_name);
      if (a.artist_name) arts.push(a.artist_name);
      if (a.best_track?.name) rels.push(a.best_track.name);
    });
    registerUntranslatableEntities({ releases: rels, artists: arts });
  }, [topRecommended]);

  if (topRecommended.length === 0) return null;

  const renderRecommendedCard = (album, key, isSliderMode = false) => {
    const score = Number(album.final_rating || album.weighted_score || album.puntuacion || 0);
    const targetUrl = getReleaseUrl(album, album.release_type);

    return (
      <div
        key={key}
        className={`bg-[#11131E]/95 rounded-2xl overflow-hidden border border-amber-500/30 hover:border-amber-400 shadow-lg hover:shadow-amber-500/15 transition-all duration-300 flex flex-col group relative ${
          isSliderMode
            ? 'w-[200px] sm:w-[230px] md:w-[260px] flex-shrink-0'
            : 'w-full'
        }`}
      >
        {/* Artwork */}
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

          {/* Top Badge: Score */}
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-black/85 backdrop-blur-md border border-amber-500/40 px-2 py-0.5 rounded-lg shadow-md">
            <span className="text-amber-300 text-xs font-black">
              {score.toFixed(2)}
            </span>
            <span className="text-[10px]">⭐</span>
          </div>

          {/* Bottom Overlay: Reviews count */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 flex items-end justify-between text-[10px] text-slate-300">
            <span className="bg-black/60 px-1.5 py-0.5 rounded border border-white/10">
              📝 {album.review_count || (album.reviews && album.reviews.length) || 0} reseñas
            </span>
            {album.release_year && (
              <span className="font-mono text-slate-300 font-bold">
                {album.release_year}
              </span>
            )}
          </div>
        </div>

        {/* Info Body */}
        <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
          <div>
            <Link
              to={targetUrl}
              translate="no"
              className="notranslate music-title font-bold text-white text-xs sm:text-sm line-clamp-1 hover:text-amber-300 transition-colors block"
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

          {album.best_track && (
            <div className="bg-white/5 border border-white/5 rounded-xl p-1.5 text-[10px] flex items-center justify-between text-slate-300">
              <span className="truncate pr-1">👑 <span translate="no" className="notranslate track-name">{album.best_track.name}</span></span>
              <span className="text-amber-300 font-bold whitespace-nowrap">
                {album.best_track.avg_rating} ⭐
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-white/5 mt-auto">
            <Link
              to={targetUrl}
              className="w-full py-1.5 px-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 hover:text-black text-amber-300 border border-amber-500/30 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
            >
              <span>🎧</span>
              <span>Ver Reseñas</span>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-4 my-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 border border-amber-500/20 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-wider">
            <span>⭐</span>
            <span>Aclamación del Club</span>
            <span className="text-white/40">•</span>
            <span className="text-amber-200">Recomendaciones</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Más Recomendados por la Comunidad</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Las obras maestras mejor evaluadas y con mayor consenso entre las reseñas de los miembros de Musiclub, ordenadas de mayor a menor puntuación.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-4 py-2.5 rounded-2xl text-amber-300">
          <span className="text-lg">🏆</span>
          <span className="text-xs font-bold">Top Puntuaciones Verificadas</span>
        </div>
      </div>

      {/* Grid or Slider of Recommended */}
      {!isSliderActive ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4.5">
          {topRecommended.map((album, idx) =>
            renderRecommendedCard(album, album.id || idx, false)
          )}
        </div>
      ) : (
        <div
          className="relative w-full overflow-hidden py-2 group/recommended-slider"
          onMouseEnter={() => setIsSliderPaused(true)}
          onMouseLeave={() => setIsSliderPaused(false)}
        >
          {/* Gradientes laterales de desvanecimiento estético */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-[#0a0a12] via-[#0a0a12]/80 to-transparent opacity-70 z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-[#0a0a12] via-[#0a0a12]/80 to-transparent opacity-70 z-10" />

          {/* Pista del slider infinito en traslación perpetua */}
          <div
            className={`mb-6 animate-continuous-slider flex gap-3 sm:gap-5 w-max will-change-transform ${
              isSliderPaused ? 'slider-paused' : ''
            }`}
            style={{
              '--slider-duration': sliderDuration,
            }}
          >
            {marqueeItems.map((album, idx) =>
              renderRecommendedCard(album, `rec-marquee-${album.id || idx}-${idx}`, true)
            )}
          </div>
        </div>
      )}
    </section>
  );
}
