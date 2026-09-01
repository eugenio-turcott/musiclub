// src/components/WinnerDisplay.jsx
import React, { useState, useEffect } from 'react';
import { ReviewSystem } from './ReviewSystem';
import { supabase } from '../services/supabaseClient';

export function WinnerDisplay({
  winner,
  isAdmin = false,
  user = null,
  reviewedAlbumIds = new Set(),
  onAlbumUpdated,
}) {
  const [showReview, setShowReview] = useState(false);
  const [reviewsEnabled, setReviewsEnabled] = useState(
    winner?.reviews_enabled || false // 👈 CARGAR DESDE PROPS
  );
  const [toggling, setToggling] = useState(false);

  const isReviewed = winner?.id && reviewedAlbumIds && (
    reviewedAlbumIds instanceof Set ? reviewedAlbumIds.has(winner.id) : Array.isArray(reviewedAlbumIds) && reviewedAlbumIds.includes(winner.id)
  );

  // 👈 ACTUALIZAR CUANDO CAMBIE EL WINNER
  useEffect(() => {
    if (winner) {
      setReviewsEnabled(winner.reviews_enabled || false);
    }
  }, [winner]);

  if (!winner) return null;

  const toggleReviews = async () => {
    if (!isAdmin || !winner) return;
    setToggling(true);
    try {
      const newValue = !reviewsEnabled;
      const { error } = await supabase
        .from('albums')
        .update({ reviews_enabled: newValue })
        .eq('id', winner.id);

      if (!error) {
        setReviewsEnabled(newValue);
        // 👈 ACTUALIZAR EL WINNER LOCALMENTE
        winner.reviews_enabled = newValue;
        if (onAlbumUpdated) onAlbumUpdated();
      }
    } catch (error) {
      console.error('Error toggling reviews:', error);
    }
    setToggling(false);
  };

  return (
    <div className="mb-8 relative">
      {/* Fondo con glow animado */}
      <div className="absolute -inset-4 bg-gradient-to-r from-[#f5576c] via-[#f093fb] to-[#f5576c] rounded-3xl blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute -inset-2 bg-gradient-to-r from-[#f5576c]/20 via-[#f093fb]/20 to-[#f5576c]/20 rounded-2xl blur-xl"></div>

      {/* Partículas de confeti estáticas */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 6 + 3 + 'px',
              height: Math.random() * 6 + 3 + 'px',
              background: [
                '#f5576c',
                '#f093fb',
                '#ffd93d',
                '#6bcb77',
                '#4d96ff',
              ][Math.floor(Math.random() * 5)],
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              opacity: Math.random() * 0.5 + 0.2,
              animation: `float ${Math.random() * 4 + 3}s ease-in-out infinite`,
              animationDelay: Math.random() * 2 + 's',
            }}
          />
        ))}
      </div>

      <div className="relative bg-gradient-to-br from-[#f5576c]/10 via-black/80 to-[#f093fb]/10 rounded-2xl border-2 border-[#f5576c]/30 p-6 sm:p-8 backdrop-blur-xl overflow-hidden">
        {/* Líneas decorativas animadas */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#f5576c] to-transparent opacity-60 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#f093fb] to-transparent opacity-60 animate-pulse"></div>

        {/* Esquinas decorativas */}
        <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-[#f5576c]/20 rounded-tl-lg"></div>
        <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-[#f5576c]/20 rounded-tr-lg"></div>
        <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-[#f5576c]/20 rounded-bl-lg"></div>
        <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-[#f5576c]/20 rounded-br-lg"></div>

        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 relative z-10">
          {/* Imagen del álbum */}
          <div className="relative flex-shrink-0 group">
            <div className="absolute -inset-6 bg-gradient-to-r from-[#f5576c] to-[#f093fb] rounded-2xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
            <div className="absolute -inset-3 bg-gradient-to-r from-[#f5576c] to-[#f093fb] rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>

            <img
              src={winner.imagen}
              alt={winner.album}
              className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-72 md:h-72 object-cover rounded-xl border-4 border-[#f5576c]/40 shadow-2xl shadow-[#f5576c]/30 group-hover:scale-105 transition-transform duration-500"
            />

            {/* Palomita si el usuario ya dio review */}
            {isReviewed && (
              <div
                className="absolute bottom-2 right-2 z-20 flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-500 text-white shadow-[0_0_16px_rgba(16,185,129,0.9)] border-2 border-emerald-200 backdrop-blur-md transform transition-all duration-300 hover:scale-110"
                title="Ya diste tu review a este álbum ✓"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}

            {/* Badge de ganador superpuesto */}
            <div className="absolute -top-4 -right-4 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-[#f5576c]/30 animate-bounce border-2 border-white/20">
              🏆 GANADOR
            </div>

            {/* Estrella decorativa */}
            <div className="absolute -bottom-3 -left-3 text-3xl animate-pulse drop-shadow-lg">
              ⭐
            </div>
          </div>

          {/* Info del ganador */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start mb-3">
              <span className="text-[#f5576c] text-xs font-bold tracking-[0.2em] uppercase bg-[#f5576c]/20 px-4 py-1.5 rounded-full border border-[#f5576c]/30 shadow-lg shadow-[#f5576c]/10">
                🎉 SELECCIONADO POR LA MÁQUINA
              </span>
              <span className="text-white/30 text-xs bg-white/5 px-3 py-1 rounded-full border border-white/5">
                {new Date().toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>

            <h2
              translate="no"
              className="notranslate text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight"
            >
              {winner.album}
            </h2>

            <p
              translate="no"
              className="notranslate text-xl sm:text-2xl md:text-3xl text-white/60 mt-1 font-light"
            >
              {winner.artista}
            </p>

            {/* Divisor decorativo */}
            <div className="w-24 h-0.5 bg-gradient-to-r from-[#f5576c] to-transparent mx-auto md:mx-0 my-3"></div>

            <div className="flex flex-wrap items-center gap-3 mt-3 justify-center md:justify-start">
              {winner.added_by && (
                <span className="text-white/40 text-xs flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                  <span className="text-[#f5576c]">💡</span>
                  <span>Sugerido por:</span>{' '}
                  <span
                    translate="no"
                    className="notranslate username-tag text-white/70 font-medium"
                  >
                    {winner.added_by}
                  </span>
                </span>
              )}
              {winner.spotifyLink && (
                <a
                  href={winner.spotifyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/30 hover:text-white/70 transition-all text-xs flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 hover:bg-white/10 hover:border-[#f5576c]/20"
                >
                  🎵 Spotify
                </a>
              )}
              {winner.youtubeLink && (
                <a
                  href={winner.youtubeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/30 hover:text-white/70 transition-all text-xs flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 hover:bg-white/10 hover:border-[#f5576c]/20"
                >
                  ▶️ YouTube
                </a>
              )}
            </div>

            {/* Badge de estado y Acciones de Review */}
            <div className="mt-5 flex flex-wrap items-center gap-3 justify-center md:justify-start">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-[#f5576c]/20 to-[#f093fb]/20 border border-[#f5576c]/30 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f5576c] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f5576c]"></span>
                </span>
                <span className="text-[10px] text-white/80 tracking-wider font-semibold">
                  ÁLBUM DEL CLUB · SELECCIÓN ALEATORIA
                </span>
              </div>

              {isAdmin && (
                <button
                  onClick={toggleReviews}
                  disabled={toggling}
                  className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all ${
                    reviewsEnabled
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 shadow-md shadow-green-500/10'
                      : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {toggling
                    ? '🔄'
                    : reviewsEnabled
                      ? '✅ Reviews habilitados'
                      : '🔒 Habilitar reviews'}
                </button>
              )}

              {reviewsEnabled && (
                <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
                  {isReviewed && (
                    <span className="text-xs text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1.5 rounded-full font-medium flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                      <span>✓</span> Ya calificaste este álbum
                    </span>
                  )}
                  <button
                    onClick={() => setShowReview((prev) => !prev)}
                    className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-[#f5576c] to-[#f093fb] hover:from-[#f5576c]/90 hover:to-[#f093fb]/90 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-[#f5576c]/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-white/20"
                  >
                    <span>
                      {showReview
                        ? '✕ Cerrar Reseña'
                        : isReviewed
                          ? '✏️ Modificar Mi Reseña'
                          : '⭐ Calificar y Reseñar'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 👈 REVIEW SYSTEM - Solo visible si está habilitado */}
        {showReview && reviewsEnabled && (
          <div className="mt-6 rounded-3xl bg-[#0e101d] border border-[#f5576c]/30 sm:border-[#f5576c]/40 p-3 sm:p-5 md:p-7 shadow-2xl animate-fadeIn space-y-3 sm:space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <span className="text-xl sm:text-2xl">⭐</span>
                <h3 className="text-base sm:text-xl font-black text-white truncate">
                  {isReviewed ? 'Actualizar tu Reseña' : 'Escribir Reseña'}
                </h3>
              </div>
              <button
                onClick={() => setShowReview(false)}
                className="text-slate-400 hover:text-white text-xs sm:text-sm bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition-all font-medium flex items-center gap-1 flex-shrink-0"
              >
                <span>Cerrar</span>
                <span>✕</span>
              </button>
            </div>

            <ReviewSystem
              album={winner}
              isFromSpotify={false}
              isIndividual={false}
              tracks={winner.tracks || []}
              user={user}
              onReviewSubmitted={() => {
                setShowReview(false);
                if (onAlbumUpdated) onAlbumUpdated();
              }}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
        }
      `}</style>
    </div>
  );
}
