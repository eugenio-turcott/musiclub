import React from "react";

export function AlbumGrid({ albums, loading, error, winner }) {
  return (
    <div className="mt-8 pt-6 border-t border-white/5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white/90 uppercase tracking-tight">
          Catálogo completo
        </h3>
        <span className="text-xs sm:text-sm text-white/70 bg-white/10 px-3 py-1 rounded-full border border-white/5 whitespace-nowrap">
          {albums.length} álbumes
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center items-center gap-3 py-8 text-white/20">
          <span className="w-2 h-2 bg-[#f5576c] rounded-full animate-pulse"></span>
          <span className="w-2 h-2 bg-[#f5576c] rounded-full animate-pulse delay-75"></span>
          <span className="w-2 h-2 bg-[#f5576c] rounded-full animate-pulse delay-150"></span>
          <span className="text-sm ml-2">Cargando...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
          {albums.map((album, idx) => {
            const isWinner = winner && winner.album === album.album;
            return (
              <div
                key={idx}
                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                  isWinner
                    ? "border-[#f5576c] shadow-[0_0_30px_rgba(245,87,108,0.2)] scale-105"
                    : "border-white/5 hover:border-white/10 hover:scale-105"
                }`}
              >
                <img
                  src={album.imagen}
                  alt={album.album}
                  className="w-full h-full object-cover"
                />
                {isWinner && (
                  <div className="absolute top-1 right-1 text-sm sm:text-base drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                    🏆
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="mt-3 text-center text-[#f5576c] text-xs bg-[#f5576c]/10 px-4 py-2 rounded-lg border border-[#f5576c]/10">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
