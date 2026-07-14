import React, { useEffect } from 'react';

export function WinnerFullscreen({ winner, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!winner) return null;

  return (
    <div
      className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      {/* Marco de neón animado - más sutil */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#f5576c]/20 via-[#f093fb]/20 to-[#f5576c]/20 animate-pulse"></div>

      <div
        className="relative w-full h-full flex flex-col items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Badge Cyberpunk */}
        <div className="inline-block bg-gradient-to-r from-[#f5576c] to-[#f093fb] px-6 py-2 rounded-full text-xs tracking-[0.3em] text-white mb-6 shadow-[0_0_30px_rgba(245,87,108,0.3)]">
          🏆 ÁLBUM GANADOR
        </div>

        {/* Imagen con efecto de disco - ahora tipo tarjeta */}
        <div className="relative w-full max-w-[500px] mx-auto">
          {/* Glow de fondo */}
          <div className="absolute -inset-4 bg-gradient-to-r from-[#f5576c] to-[#f093fb] rounded-3xl blur-xl opacity-20 animate-spin-slow"></div>

          <div className="absolute -inset-2 bg-gradient-to-r from-[#f5576c]/20 to-[#f093fb]/20 rounded-3xl blur-lg"></div>

          <img
            src={winner.imagen}
            alt={winner.album}
            className="relative w-full h-full object-cover rounded-3xl border-4 border-[#f5576c]/30 shadow-[0_0_80px_rgba(245,87,108,0.2)]"
          />
        </div>

        {/* Información */}
        <h2 className="text-4xl md:text-6xl font-black text-white mt-6 cyber-text text-center">
          {winner.album}
        </h2>
        <p className="text-xl md:text-2xl text-white/50 mt-2">
          {winner.artista}
        </p>

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="mt-8 px-8 py-3 bg-white/5 border border-white/10 rounded-full text-white/80 hover:bg-white/10 hover:text-white transition-all duration-300 text-sm tracking-wider"
        >
          ✕ CERRAR
        </button>
      </div>
    </div>
  );
}
