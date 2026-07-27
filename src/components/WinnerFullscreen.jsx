import React, { useEffect } from "react";

export function WinnerFullscreen({ winner, onClose, isOpen = true }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose, isOpen]);

  if (!winner || !isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#f5576c]/20 via-[#f093fb]/20 to-[#f5576c]/20 animate-pulse"></div>

      <div
        className="relative w-full max-w-[95vw] sm:max-w-[500px] md:max-w-[600px] flex flex-col items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="inline-block bg-gradient-to-r from-[#f5576c] to-[#f093fb] px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.3em] text-white mb-4 sm:mb-6 shadow-[0_0_30px_rgba(245,87,108,0.3)]">
          🏆 ÁLBUM GANADOR
        </div>

        <div className="relative w-full max-w-[280px] sm:max-w-[400px] mx-auto">
          <div className="absolute -inset-4 bg-gradient-to-r from-[#f5576c] to-[#f093fb] rounded-3xl blur-xl opacity-20 animate-spin-slow"></div>
          <div className="absolute -inset-2 bg-gradient-to-r from-[#f5576c]/20 to-[#f093fb]/20 rounded-3xl blur-lg"></div>

          <img
            src={winner.imagen}
            alt={winner.album}
            className="relative w-full h-full object-cover rounded-3xl border-4 border-[#f5576c]/30 shadow-[0_0_80px_rgba(245,87,108,0.2)]"
          />
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mt-4 sm:mt-6 cyber-text text-center px-2">
          {winner.album}
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-white/50 mt-1 sm:mt-2">
          {winner.artista}
        </p>

        <button
          onClick={onClose}
          className="mt-6 sm:mt-8 px-6 sm:px-8 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-full text-white/80 hover:bg-white/10 hover:text-white transition-all duration-300 text-xs sm:text-sm tracking-wider"
        >
          ✕ CERRAR
        </button>
      </div>
    </div>
  );
}
