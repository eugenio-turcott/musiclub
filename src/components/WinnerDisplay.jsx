// src/components/WinnerDisplay.jsx
import React from 'react';

export function WinnerDisplay({ winner, onReset }) {
  if (!winner) return null;

  return (
    <div className="mb-6 relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-[#f5576c] via-[#f093fb] to-[#f5576c] rounded-2xl blur-xl opacity-60 animate-pulse"></div>

      <div className="relative bg-gradient-to-br from-[#f5576c]/20 via-black/80 to-[#f093fb]/20 rounded-2xl border-2 border-[#f5576c]/40 p-4 sm:p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          {/* Imagen del álbum */}
          <div className="relative flex-shrink-0">
            <div className="absolute -inset-2 bg-gradient-to-r from-[#f5576c] to-[#f093fb] rounded-xl blur-md opacity-30"></div>
            <img
              src={winner.imagen}
              alt={winner.album}
              className="relative w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl border-2 border-[#f5576c]/30 shadow-xl"
            />
            <div className="absolute -top-2 -right-2 text-2xl animate-bounce">
              🏆
            </div>
          </div>

          {/* Info del ganador */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <span className="text-[#f5576c] text-xs font-bold tracking-[0.2em] uppercase bg-[#f5576c]/20 px-3 py-1 rounded-full border border-[#f5576c]/30">
                🎉 GANADOR
              </span>
              <span className="text-white/30 text-xs">
                {new Date().toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mt-2">
              {winner.album}
            </h2>

            <p className="text-white/60 text-base sm:text-lg">
              {winner.artista}
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-2 justify-center sm:justify-start">
              {winner.added_by && (
                <span className="text-white/40 text-xs flex items-center gap-1">
                  <span className="text-[#f5576c]">💡</span>
                  Sugerido por:{' '}
                  <span className="text-white/60 font-medium">
                    {winner.added_by}
                  </span>
                </span>
              )}
              {winner.spotifyLink && (
                <a
                  href={winner.spotifyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/30 hover:text-white/60 transition-colors text-xs flex items-center gap-1"
                >
                  🎵 Spotify
                </a>
              )}
              {winner.youtubeLink && (
                <a
                  href={winner.youtubeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/30 hover:text-white/60 transition-colors text-xs flex items-center gap-1"
                >
                  ▶️ YouTube
                </a>
              )}
            </div>
          </div>

          {/* Botón de reset (solo admin) */}
          <button
            onClick={onReset}
            className="flex-shrink-0 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:bg-white/10 hover:text-white/70 transition-all text-sm"
          >
            ✕ Cerrar
          </button>
        </div>

        {/* Efecto de confeti sutil */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#f5576c] to-transparent opacity-50"></div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#f093fb] to-transparent opacity-50"></div>
      </div>
    </div>
  );
}
