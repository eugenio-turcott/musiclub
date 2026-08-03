// src/components/AlbumGrid.jsx
import React from 'react';

export function AlbumGrid({ albums, loading, error, winner }) {
  // Filtrar el ganador del catálogo
  const filteredAlbums = albums.filter((album) => {
    // Si hay un ganador, excluirlo del catálogo
    if (
      winner &&
      winner.album === album.album &&
      winner.artista === album.artista
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="mt-8 pt-6 border-t border-white/5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white/90 uppercase tracking-tight">
          Catálogo completo
        </h3>
        <span className="text-xs sm:text-sm text-white/70 bg-white/10 px-3 py-1 rounded-full border border-white/5 whitespace-nowrap">
          {filteredAlbums.length} álbumes
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
          {filteredAlbums.map((album, idx) => (
            <div
              key={idx}
              className="relative aspect-square rounded-xl overflow-hidden border-2 border-white/5 hover:border-white/10 hover:scale-105 transition-all duration-300 group"
            >
              <img
                src={album.imagen}
                alt={album.album}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              {/* Overlay con información al hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                <div className="w-full">
                  <p className="text-white text-xs font-bold truncate">
                    {album.album}
                  </p>
                  <p className="text-white/50 text-[10px] truncate">
                    {album.artista}
                  </p>
                </div>
              </div>
            </div>
          ))}
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
