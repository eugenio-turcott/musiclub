// src/components/AlbumGrid.jsx
import React, { useState } from 'react';
import { ReviewSystem } from './ReviewSystem';

export function AlbumGrid({ albums, loading, error, winner, user }) {
  // 👈 AGREGAR user
  const [selectedIndividual, setSelectedIndividual] = useState(null); // 👈 Estado para el álbum individual seleccionado

  // Separar álbumes por categoría
  const activeAlbums = albums.filter(
    (album) => album.status === 'ACTIVO' || album.status === 'GANADOR'
  );

  const individualAlbums = albums.filter(
    (album) => album.status === 'INDIVIDUAL'
  );

  // Filtrar el ganador del catálogo activo
  const filteredActiveAlbums = activeAlbums.filter((album) => {
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
      {/* Catálogo completo (ACTIVOS + GANADOR) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white/90 uppercase tracking-tight">
          Catálogo completo
        </h3>
        <span className="text-xs sm:text-sm text-white/70 bg-white/10 px-3 py-1 rounded-full border border-white/5 whitespace-nowrap">
          {filteredActiveAlbums.length} álbumes
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
        <>
          {/* Álbumes ACTIVOS y GANADORES */}
          {filteredActiveAlbums.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
              {filteredActiveAlbums.map((album, idx) => (
                <div
                  key={idx}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 group ${
                    album.status === 'GANADOR'
                      ? 'border-[#f5576c] shadow-[0_0_30px_rgba(245,87,108,0.2)]'
                      : 'border-white/5 hover:border-white/10 hover:scale-105'
                  }`}
                >
                  <img
                    src={album.imagen}
                    alt={album.album}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {album.status === 'GANADOR' && (
                    <div className="absolute top-1 right-1 text-sm sm:text-base drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                      🏆
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                    <div className="w-full">
                      <p className="text-white text-xs font-bold truncate">
                        {album.album}
                      </p>
                      <p className="text-white/50 text-[10px] truncate">
                        {album.artista}
                      </p>
                      {album.status === 'GANADOR' && (
                        <span className="text-[8px] text-[#f5576c] font-bold">
                          🏆 GANADOR
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/20 text-sm">
              No hay álbumes activos en el catálogo
            </div>
          )}
        </>
      )}

      {/* ÁLBUMES INDIVIDUALES CON BOTÓN REVIEW */}
      {individualAlbums.length > 0 && (
        <div className="mt-8 pt-6 border-t border-white/5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <h3 className="text-xl sm:text-2xl md:text-3xl text-blue-400/80 uppercase tracking-tight flex items-center gap-2">
              <span className="text-2xl">📌</span>
              Álbumes Individuales
              <span className="text-xs font-normal text-white/30 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                No participan en la máquina
              </span>
            </h3>
            <span className="text-xs sm:text-sm text-white/70 bg-white/10 px-3 py-1 rounded-full border border-white/5 whitespace-nowrap">
              {individualAlbums.length} individuales
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
            {individualAlbums.map((album, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-xl overflow-hidden border-2 border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 group cursor-pointer"
              >
                <img
                  src={album.imagen}
                  alt={album.album}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />

                {/* Badge "Individual" */}
                <div className="absolute top-1 right-1 text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full border border-blue-500/20">
                  📌
                </div>

                {/* 👈 OVERLAY CON BOTÓN REVIEW AL HOVER */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4">
                  <div className="text-center">
                    <p className="text-white font-bold text-sm truncate mb-1">
                      {album.album}
                    </p>
                    <p className="text-white/50 text-xs truncate mb-3">
                      {album.artista}
                    </p>

                    {/* Botón Review */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIndividual(album);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold rounded-full hover:scale-105 transition-all shadow-lg shadow-blue-500/20"
                    >
                      📝 Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 👈 MODAL PARA REVIEW DE ÁLBUM INDIVIDUAL */}
      {selectedIndividual && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[99999] overflow-y-auto p-4">
          <div className="max-w-3xl mx-auto mt-8 mb-16">
            <div className="bg-black/90 border border-blue-500/30 rounded-2xl p-6">
              {/* Header del modal */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <span className="text-3xl">📌</span>
                    {selectedIndividual.album}
                    <span className="text-sm font-normal text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                      Individual
                    </span>
                  </h2>
                  <p className="text-white/40 text-sm mt-1">
                    {selectedIndividual.artista}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedIndividual(null)}
                  className="text-white/40 hover:text-white/70 transition-colors text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Info del álbum */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <img
                  src={selectedIndividual.imagen}
                  alt={selectedIndividual.album}
                  className="w-32 h-32 object-cover rounded-xl shadow-lg flex-shrink-0"
                  onError={(e) => {
                    e.target.src =
                      'https://via.placeholder.com/200/1a1a2e/ffffff?text=🎵';
                  }}
                />
                <div>
                  <p className="text-white/40 text-sm">
                    <span className="text-white/60">Estado:</span>{' '}
                    <span className="text-blue-400">Individual</span>
                  </p>
                  <p className="text-white/40 text-sm">
                    <span className="text-white/60">Agregado por:</span>{' '}
                    {selectedIndividual.added_by || 'Sistema'}
                  </p>
                  {selectedIndividual.spotifyLink && (
                    <a
                      href={selectedIndividual.spotifyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/30 hover:text-white/60 text-sm flex items-center gap-1 mt-2 transition-colors"
                    >
                      🎵 Escuchar en Spotify
                    </a>
                  )}
                </div>
              </div>

              {/* Review System */}
              <ReviewSystem
                album={selectedIndividual}
                isFromSpotify={true}
                isIndividual={true}
                tracks={[]} // Si quieres tracks, puedes pasarlos
                user={user}
                onReviewSubmitted={() => {
                  // Recargar datos si es necesario
                }}
              />
            </div>
          </div>
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
