// src/components/HourlyRecommendedRelease.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ReviewSystem } from './ReviewSystem';
import { getReleaseUrl, getWeightedReviewScore } from '../utils/ratingUtils';
import {
  SpotifyLogo,
  AppleMusicLogo,
  YouTubeLogo,
  DeezerLogo,
} from './common/PlatformLogos';

/**
 * Generador pseudo-aleatorio determinista para una semilla entera (por ejemplo, hora actual).
 */
function getDeterministicIndex(seed, length) {
  if (length <= 1) return 0;
  // Algoritmo mulberry32 para pseudo-aleatoriedad determinista
  let a = (seed ^ 0x6d2b79f5) >>> 0;
  a = Math.imul(a ^ (a >>> 15), a | 1);
  a ^= a + Math.imul(a ^ (a >>> 7), a | 61);
  const rand = ((a ^ (a >>> 14)) >>> 0) / 4294967296;
  return Math.floor(rand * length);
}

export function HourlyRecommendedRelease({
  albums = [],
  allReviews = [],
  topAlbums = [],
  user = null,
  onLogin = () => {},
  onAlbumUpdated = () => {},
}) {
  const [now, setNow] = useState(Date.now());
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Timer para actualizar cada segundo y reflejar el countdown de la hora actual
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calcular segundos restantes en la hora en curso
  const { minutesLeft, secondsLeft, currentHourSeed } = useMemo(() => {
    const d = new Date(now);
    const mins = 59 - d.getMinutes();
    const secs = 59 - d.getSeconds();
    // Semilla horaria: año * 1000000 + mes * 10000 + día * 100 + hora
    const seed =
      d.getFullYear() * 1000000 +
      (d.getMonth() + 1) * 10000 +
      d.getDate() * 100 +
      d.getHours();
    return {
      minutesLeft: String(mins).padStart(2, '0'),
      secondsLeft: String(secs).padStart(2, '0'),
      currentHourSeed: seed,
    };
  }, [now]);

  // Agrupar reseñas por album_id y ordenar para que la más completa/reciente aparezca primero
  const reviewsByAlbumId = useMemo(() => {
    const map = new Map();
    (allReviews || []).forEach((rev) => {
      if (!rev.album_id) return;
      if (!map.has(rev.album_id)) {
        map.set(rev.album_id, []);
      }
      map.get(rev.album_id).push(rev);
    });

    map.forEach((revList) => {
      revList.sort((a, b) => {
        // Priorizar opiniones que incluyan comentario de texto
        const aHasText =
          a.opinion || a.comentario || a.comment || a.review ? 1 : 0;
        const bHasText =
          b.opinion || b.comentario || b.comment || b.review ? 1 : 0;
        if (aHasText !== bHasText) return bHasText - aHasText;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
    });

    return map;
  }, [allReviews]);

  // Filtrar ÚNICAMENTE lanzamientos que tengan de 1 a 3 reseñas para fomentar el engagement
  const recommendedCandidates = useMemo(() => {
    if (!albums || albums.length === 0) return [];

    const list = [];
    const seenIds = new Set();

    // 1. Prioridad: Buscar en allReviews aquellos álbumes con entre 1 y 3 reseñas
    albums.forEach((album) => {
      const revs = reviewsByAlbumId.get(album.id);
      if (revs && revs.length >= 1 && revs.length <= 3) {
        list.push({
          album,
          reviews: revs,
          reviewCount: revs.length,
          review: revs[0],
          source: 'allReviews',
        });
        seenIds.add(album.id);
      }
    });

    // 2. Si topAlbums tiene algún álbum con review_count entre 1 y 3 que no esté en list
    if (topAlbums && topAlbums.length > 0) {
      topAlbums.forEach((t) => {
        const count = t.review_count ?? t.reviews_count ?? 0;
        if (count >= 1 && count <= 3 && !seenIds.has(t.id)) {
          const match = albums.find((a) => a.id === t.id);
          const fullAlbum = match || {
            id: t.id,
            album: t.album_name,
            album_name: t.album_name,
            artista: t.artist_name,
            artist_name: t.artist_name,
            imagen: t.image_url,
            image_url: t.image_url,
            spotify_link: t.spotify_link,
            apple_music_link: t.apple_music_link,
            youtube_link: t.youtube_link,
            other_link: t.other_link,
            release_type: t.release_type || 'ALBUM',
            release_year: t.release_year,
            status: 'ACTIVO',
          };
          const revs = reviewsByAlbumId.get(t.id) || [];
          list.push({
            album: fullAlbum,
            reviews: revs,
            reviewCount: count || (revs.length > 0 ? revs.length : 1),
            review:
              revs && revs.length > 0
                ? revs[0]
                : {
                    rating_general: t.avg_rating,
                    reviewer_name: 'Crítico del Club',
                  },
            source: 'topAlbums',
          });
          seenIds.add(t.id);
        }
      });
    }

    // Ordenar alfabéticamente por id para que el shuffle determinista sea idéntico entre navegadores
    return list.sort((a, b) =>
      String(a.album.id).localeCompare(String(b.album.id))
    );
  }, [albums, reviewsByAlbumId, topAlbums]);

  // Fallback si no hubiera álbumes con 1 a 3 reseñas
  const effectiveCandidates = useMemo(() => {
    if (recommendedCandidates.length > 0) return recommendedCandidates;
    // Si no hay de 1 a 3 reseñas, tomar de la lista general
    return albums.slice(0, 10).map((a) => {
      const revs = reviewsByAlbumId.get(a.id) || [];
      return {
        album: a,
        reviews: revs,
        reviewCount: revs.length,
        review: revs[0] || null,
        source: 'fallback',
      };
    });
  }, [recommendedCandidates, albums, reviewsByAlbumId]);

  // Selección del índice oficial de la hora (determinista)
  const officialHourlyIndex = useMemo(() => {
    if (effectiveCandidates.length === 0) return 0;
    return getDeterministicIndex(currentHourSeed, effectiveCandidates.length);
  }, [currentHourSeed, effectiveCandidates.length]);

  const currentCandidate = effectiveCandidates[officialHourlyIndex] || null;

  if (!currentCandidate || !currentCandidate.album) {
    return null;
  }

  const {
    album,
    review,
    reviews: candidateReviews = [],
    reviewCount = candidateReviews.length || (review ? 1 : 0),
  } = currentCandidate;

  const albumTitle = album.album_name || album.album || 'Lanzamiento';
  const artistName = album.artist_name || album.artista || 'Artista';
  const coverUrl = album.image_url || album.imagen;
  const releaseUrl = getReleaseUrl(album);
  const releaseType = album.release_type || 'ALBUM';

  // URLs de plataformas de streaming disponibles
  const spotifyUrl = album.spotify_link || album.spotifyLink || null;
  const appleMusicUrl = album.apple_music_link || album.appleMusicLink || null;
  const youtubeUrl = album.youtube_link || album.youtubeLink || null;
  const otherUrl =
    album.other_link ||
    album.otherLink ||
    (album.artist_name && album.album_name
      ? `https://www.deezer.com/search/${encodeURIComponent(album.artist_name + ' ' + album.album_name)}`
      : null);

  // Información de la reseña destacada
  const firstReviewScore = review
    ? getWeightedReviewScore(review) ||
      review.rating_general ||
      review.rating ||
      null
    : null;
  const reviewerName =
    review?.reviewer_name ||
    review?.author_name ||
    (review?.reviewer_email
      ? review.reviewer_email.split('@')[0]
      : 'Crítico de Musiclub');
  const reviewerAvatar = review?.reviewer_avatar || null;
  const reviewComment =
    review?.opinion ||
    review?.comentario ||
    review?.comment ||
    review?.review ||
    '';

  // Promedio actual de las reseñas existentes (si hay más de 1)
  const currentAverageScore =
    candidateReviews.length > 0
      ? (
          candidateReviews.reduce(
            (acc, r) =>
              acc +
              Number(
                getWeightedReviewScore(r) || r.rating_general || r.rating || 0
              ),
            0
          ) / candidateReviews.length
        ).toFixed(1)
      : null;

  // Verificar si el usuario actual ya reseñó este álbum
  const isCurrentUserReviewer = Boolean(
    user &&
    candidateReviews.some(
      (rev) =>
        (rev.user_id && user.id && rev.user_id === user.id) ||
        (rev.reviewer_email &&
          user.email &&
          rev.reviewer_email.toLowerCase() === user.email.toLowerCase())
    )
  );

  return (
    <section className="mb-10 sm:mb-14 relative text-left">
      {/* Ambient Glows */}
      <div className="absolute -top-12 -left-12 w-72 h-72 bg-gradient-to-tr from-amber-500/15 via-pink-500/15 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute -bottom-12 -right-12 w-80 h-80 bg-gradient-to-bl from-purple-600/15 via-rose-500/15 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#16172d]/95 via-[#0e1022]/95 to-[#070814]/98 border-2 border-amber-500/30 p-5 sm:p-8 md:p-10 shadow-2xl backdrop-blur-2xl">
        {/* Subtle background circuit texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none"></div>

        {/* Top Header Bar */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-white/10">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Hour Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-pink-500/20 border border-amber-400/40 text-amber-200 text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span>⏰ Release Recomendado de la Hora</span>
            </div>

            {/* Reseñas Registradas badge (1 a 3) */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-[11px] sm:text-xs font-bold">
              <span>⚖️</span>
              <span>
                {reviewCount === 1
                  ? 'Solo 1 Reseña Registrada'
                  : `${reviewCount} Reseñas Registradas`}
              </span>
            </div>
          </div>

          {/* Countdown timer */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white/80 text-xs font-mono">
              <span className="text-amber-400 font-bold">⏳ Rota en:</span>
              <span className="font-black text-amber-300">
                {minutesLeft}m {secondsLeft}s
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Left Column: Big Cover Artwork */}
          <div className="lg:col-span-5 flex flex-col items-center sm:items-start">
            <div className="relative group w-full max-w-[300px] sm:max-w-[480px] aspect-square">
              {/* Outer Glow */}
              <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/25 via-pink-500/25 to-purple-500/25 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition-opacity"></div>

              {/* Cover Container */}
              <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-[#111322]">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={albumTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 text-white/40">
                    <span className="text-5xl mb-2">💿</span>
                    <span className="text-xs font-bold">Sin Carátula</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none"></div>

                {/* Badge Release Type */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-wider text-white">
                  {releaseType === 'EP'
                    ? '💽 EP'
                    : releaseType === 'SENCILLO' || releaseType === 'SINGLE'
                      ? '🎵 Sencillo'
                      : '💿 Álbum'}
                </div>

                {/* Cover Rating Shortcut Link */}
                <Link
                  to={`/portadas?id=${album.id}`}
                  className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-pink-500/80 hover:bg-pink-500 backdrop-blur-md text-white text-[11px] font-bold shadow-lg transition-transform hover:scale-105 flex items-center gap-1.5"
                  title="Calificar la portada de este disco en la nueva Galería de Arte"
                >
                  <span>🖼️</span>
                  <span>Calificar Portada</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Review Spotlight & Action Buttons */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <span>🎯</span>
                <span className="uppercase tracking-wider">
                  {reviewCount === 1
                    ? '¡Se busca segundo voto para desempatar!'
                    : reviewCount === 2
                      ? '¡Faltan opiniones para desempatar el promedio!'
                      : '¡Tu voto definirá la posición de este release!'}
                </span>
              </div>
              <h3
                translate="no"
                className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight notranslate music-title"
              >
                {albumTitle}
              </h3>
              <p
                translate="no"
                className="text-base sm:text-lg text-white/80 font-medium notranslate artist-name"
              >
                {artistName}
                {album.release_year ? (
                  <span className="text-white/40 ml-2">
                    ({album.release_year})
                  </span>
                ) : null}
              </p>
            </div>

            {/* Spotlight on the Community Review */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {reviewerAvatar ? (
                    <img
                      src={reviewerAvatar}
                      alt={reviewerName}
                      className="w-8 h-8 rounded-full object-cover border border-amber-400/50 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-pink-500 flex items-center justify-center text-xs font-black text-white flex-shrink-0">
                      {reviewerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="truncate">
                    <span className="text-[10px] text-white/40 block font-semibold uppercase">
                      {reviewCount === 1
                        ? 'Única Reseña Comunitaria'
                        : 'Reseña Destacada de la Comunidad'}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white truncate">
                      {reviewerName}
                    </span>
                  </div>
                </div>

                {firstReviewScore !== null && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-black text-sm shadow-sm flex-shrink-0">
                    <span>⭐</span>
                    <span>{Number(firstReviewScore).toFixed(1)}</span>
                    <span className="text-[10px] text-amber-200/60 font-normal">
                      / 10
                    </span>
                  </div>
                )}
              </div>

              {reviewComment ? (
                <p className="text-xs sm:text-sm text-white/80 italic leading-relaxed line-clamp-3 bg-black/20 p-3 rounded-xl border border-white/5">
                  "{reviewComment}"
                </p>
              ) : (
                <p className="text-xs text-white/50 italic bg-black/20 p-2.5 rounded-xl border border-white/5">
                  El crítico otorgó su calificación sin comentarios escritos.
                  ¡Sé quien aporte una reseña más detallada!
                </p>
              )}

              {/* Promedio global si hay más de 1 reseña */}
              {reviewCount > 1 && currentAverageScore && (
                <div className="pt-1 flex items-center gap-2 text-xs text-amber-200/90 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 w-fit">
                  <span>📊 Promedio actual de las {reviewCount} reseñas:</span>
                  <span className="font-black text-amber-300">
                    ⭐ {currentAverageScore}
                  </span>
                  <span className="text-[10px] text-amber-200/50">/ 10</span>
                </div>
              )}
            </div>

            {/* Context Notice / Instructions */}
            {isCurrentUserReviewer ? (
              <div className="p-3 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-200 text-xs flex items-center gap-2">
                <span>🎖️</span>
                <span>
                  {reviewCount === 1 ? (
                    <>
                      <strong>
                        ¡Tú eres el único crítico registrado de este disco!
                      </strong>{' '}
                      Puedes editar tu opinión o compartir el enlace con tus
                      amigos del club para que dejen la segunda reseña.
                    </>
                  ) : (
                    <>
                      <strong>¡Ya has calificado este release!</strong> Puedes
                      editar tu opinión o compartir el enlace con tus amigos del
                      club para que sigan votando.
                    </>
                  )}
                </span>
              </div>
            ) : (
              <p className="text-xs text-white/70 leading-relaxed">
                {reviewCount === 1
                  ? 'Cada hora elegimos un lanzamiento del club que espera una segunda opinión. Tu voto ponderará el promedio y determinará su posición final en el ranking.'
                  : 'Cada hora elegimos un lanzamiento del club con pocas calificaciones (1 a 3 reseñas). Tu opinión es clave para consolidar su puntuación comunitaria en el ranking.'}
              </p>
            )}

            {/* Primary Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    onLogin();
                  } else {
                    setShowReviewForm((prev) => !prev);
                  }
                }}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#f5576c] via-[#e11d48] to-[#f093fb] hover:from-[#f5576c]/90 hover:to-[#f093fb]/90 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-pink-500/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>✍️</span>
                <span>
                  {showReviewForm
                    ? 'Ocultar Formulario de Calificación'
                    : isCurrentUserReviewer
                      ? 'Modificar Mi Reseña'
                      : reviewCount === 1
                        ? '¡Calificar Ahora y Desempatar!'
                        : '¡Calificar Este Release!'}
                </span>
              </button>

              <Link
                to={releaseUrl}
                className="w-full sm:w-auto px-5 py-3 bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm rounded-2xl border border-white/15 hover:border-white/30 transition-all flex items-center justify-center gap-2"
              >
                <span>💿</span>
                <span>Ver Ficha Completa</span>
              </Link>
            </div>

            {/* Streaming Listening Links */}
            {(spotifyUrl || appleMusicUrl || youtubeUrl || otherUrl) && (
              <div className="pt-2">
                <div className="text-[11px] text-white/50 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>🎧</span>
                  <span>Escuchar en streaming:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {spotifyUrl && (
                    <a
                      href={spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#1DB954]/15 hover:bg-[#1DB954]/25 text-[#1DB954] hover:text-white font-bold text-xs rounded-xl border border-[#1DB954]/30 hover:border-[#1DB954]/60 transition-all group shadow-sm cursor-pointer"
                      title="Escuchar en Spotify"
                    >
                      <SpotifyLogo className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                      <span>Spotify</span>
                    </a>
                  )}

                  {appleMusicUrl && (
                    <a
                      href={appleMusicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#fc3c44]/15 hover:bg-[#fc3c44]/25 text-[#fc3c44] hover:text-white font-bold text-xs rounded-xl border border-[#fc3c44]/30 hover:border-[#fc3c44]/60 transition-all group shadow-sm cursor-pointer"
                      title="Escuchar en Apple Music"
                    >
                      <AppleMusicLogo className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                      <span>Apple Music</span>
                    </a>
                  )}

                  {youtubeUrl && (
                    <a
                      href={youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-white font-bold text-xs rounded-xl border border-red-500/30 hover:border-red-500/60 transition-all group shadow-sm cursor-pointer"
                      title="Escuchar en YouTube"
                    >
                      <YouTubeLogo className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                      <span>YouTube</span>
                    </a>
                  )}

                  {otherUrl && (
                    <a
                      href={otherUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#a238ff]/15 hover:bg-[#a238ff]/25 text-[#c77dff] hover:text-white font-bold text-xs rounded-xl border border-[#a238ff]/30 hover:border-[#a238ff]/60 transition-all group shadow-sm cursor-pointer"
                      title={
                        otherUrl.includes('deezer')
                          ? 'Escuchar en Deezer'
                          : otherUrl.includes('bandcamp')
                            ? 'Escuchar en Bandcamp'
                            : 'Escuchar en plataforma externa'
                      }
                    >
                      <DeezerLogo className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                      <span>
                        {otherUrl.includes('deezer')
                          ? 'Deezer'
                          : otherUrl.includes('bandcamp')
                            ? 'Bandcamp'
                            : 'Deezer'}
                      </span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Expandable Review System */}
        {showReviewForm && (
          <div className="mt-8 pt-6 border-t border-white/10 animate-fadeIn">
            <div className="flex items-center justify-between pb-4">
              <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>✍️</span>
                <span>
                  Calificar "{albumTitle}" ({artistName})
                </span>
              </h4>
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="text-xs text-white/50 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                ✕ Cerrar
              </button>
            </div>

            <ReviewSystem
              album={album}
              isFromSpotify={album.spotify_verified || false}
              isIndividual={album.status !== 'GANADOR'}
              tracks={album.tracks || []}
              user={user}
              onReviewSubmitted={() => {
                setShowReviewForm(false);
                if (onAlbumUpdated) onAlbumUpdated();
              }}
              onReviewAdded={() => {
                setShowReviewForm(false);
                if (onAlbumUpdated) onAlbumUpdated();
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}

export default HourlyRecommendedRelease;
