// src/components/HeaderAlbumSearch.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { supabaseService } from '../services/supabaseClient';
import { ReviewSystem } from './ReviewSystem';

export function HeaderAlbumSearch({ user, isMobileMode = false, onAlbumReviewed }) {
  const [query, setQuery] = useState('');
  const [allAlbums, setAllAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAlbumForReview, setSelectedAlbumForReview] = useState(null);
  const [poolNoticeAlbum, setPoolNoticeAlbum] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Cargar álbumes del club al enfocar o escribir
  const loadClubAlbums = async () => {
    if (allAlbums.length > 0) return;
    setLoading(true);
    try {
      const data = await supabaseService.getAllAlbumsWithFullStats();
      setAllAlbums(data || []);
    } catch (err) {
      console.error('Error cargando álbumes para búsqueda en header:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrado reactivo en tiempo real
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return allAlbums
      .filter((a) => {
        const name = (a.album_name || a.album || '').toLowerCase();
        const artist = (a.artist_name || a.artista || '').toLowerCase();
        const addedBy = (a.added_by || '').toLowerCase();
        return name.includes(q) || artist.includes(q) || addedBy.includes(q);
      })
      .slice(0, 10);
  }, [allAlbums, query]);

  // Manejador de clic fuera para cerrar el menú desplegable
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(Boolean(val.trim()));
    setHighlightedIndex(-1);
    loadClubAlbums();
  };

  const handleFocus = () => {
    loadClubAlbums();
    if (query.trim()) {
      setIsOpen(true);
    }
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleSelectAlbum = (album) => {
    setIsOpen(false);
    setQuery('');

    if (album.status === 'ACTIVO' || album.status === 'GANADOR') {
      setPoolNoticeAlbum(album);
    } else {
      setSelectedAlbumForReview(album);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : searchResults.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < searchResults.length) {
        handleSelectAlbum(searchResults[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Contenedor del buscador en el Header */}
      <div
        ref={containerRef}
        className={`relative ${
          isMobileMode ? 'w-full' : 'w-36 xs:w-44 sm:w-48 md:w-56 lg:w-64'
        }`}
      >
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder="Buscar álbum..."
            className="w-full pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 bg-black/40 hover:bg-black/60 focus:bg-[#0c0e1e] border border-white/15 focus:border-[#f5576c]/60 rounded-full text-white text-xs sm:text-sm placeholder-white/40 focus:outline-none transition-all duration-200 shadow-inner"
          />

          {/* Ícono de búsqueda */}
          <span className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-white/50 text-xs sm:text-sm pointer-events-none">
            {loading ? '⏳' : '🔍'}
          </span>

          {/* Botón limpiar */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/10 hover:bg-white/25 text-white/60 hover:text-white flex items-center justify-center text-[10px] transition-all"
              title="Borrar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdown flotante con los resultados en vivo */}
        {isOpen && query.trim() && (
          <div className="absolute right-0 sm:right-auto sm:left-0 w-[calc(100vw-2rem)] xs:w-80 sm:w-88 md:w-96 max-w-[95vw] top-full mt-2 bg-[#0c0e1e]/98 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-2xl z-[150] overflow-hidden animate-fadeIn max-h-[420px] overflow-y-auto">
            {loading && allAlbums.length === 0 ? (
              <div className="p-4 text-center text-white/50 text-xs flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-[#f5576c] rounded-full animate-pulse"></span>
                <span>Cargando catálogo del club...</span>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center text-white/40 text-xs">
                <p>No se encontraron álbumes para "{query}"</p>
                <p className="text-[10px] text-white/30 mt-1">
                  Verifica el nombre del artista o álbum.
                </p>
              </div>
            ) : (
              <div className="p-1.5 space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40 flex items-center justify-between border-b border-white/5">
                  <span>Resultados ({searchResults.length})</span>
                  <span>Click para calificar</span>
                </div>

                {searchResults.map((album, idx) => {
                  const isHighlighted = highlightedIndex === idx;
                  const isRatable =
                    album.status === 'INDIVIDUAL' ||
                    album.status === 'INACTIVO';

                  return (
                    <div
                      key={album.id || idx}
                      onClick={() => handleSelectAlbum(album)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl transition-all cursor-pointer group ${
                        isHighlighted
                          ? 'bg-gradient-to-r from-[#f5576c]/20 to-[#f093fb]/20 border border-[#f5576c]/40'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      {/* Portada */}
                      <img
                        src={
                          album.image_url ||
                          album.imagen ||
                          'https://via.placeholder.com/100/1a1a2e/ffffff?text=🎵'
                        }
                        alt={album.album_name || album.album}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-white/10"
                      />

                      {/* Info */}
                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-white font-bold text-xs truncate group-hover:text-pink-300 transition-colors">
                            {album.album_name || album.album}
                          </p>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold border leading-none ${
                              album.status === 'INDIVIDUAL'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : album.status === 'INACTIVO'
                                  ? 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                                  : album.status === 'GANADOR'
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            }`}
                          >
                            {album.status === 'INDIVIDUAL'
                              ? 'Individual'
                              : album.status === 'INACTIVO'
                                ? 'Inactivo'
                                : album.status === 'GANADOR'
                                  ? 'Ganador'
                                  : 'Pool'}
                          </span>
                        </div>
                        <p className="text-white/60 text-[11px] truncate">
                          {album.artist_name || album.artista}
                        </p>
                        <p className="text-white/40 text-[9px] truncate">
                          Añadido por: {album.added_by || 'Club'}
                        </p>
                      </div>

                      {/* Acción / Calificación */}
                      <div className="flex-shrink-0 text-right">
                        {isRatable ? (
                          <span className="px-2 py-1 rounded-lg bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white text-[10px] font-bold shadow-sm inline-block group-hover:scale-105 transition-transform">
                            ✍️ Ratear
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50 text-[10px] font-medium inline-block">
                            {album.status === 'GANADOR' ? '👑 Ganador' : '🎰 Pool'}
                          </span>
                        )}
                        {album.final_rating !== null &&
                          album.final_rating !== undefined && (
                            <p className="text-[9px] text-amber-300 font-bold mt-0.5">
                              ⭐ {album.final_rating.toFixed(1)}
                            </p>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      {selectedAlbumForReview &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
            onClick={() => setSelectedAlbumForReview(null)}
          >
            <div
              className="bg-gradient-to-br from-[#0e1124] via-[#14162e] to-[#0a0c1a] border border-pink-500/30 rounded-3xl max-w-4xl w-full p-4 sm:p-8 space-y-6 shadow-2xl relative max-h-[92vh] overflow-y-auto text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del álbum */}
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                  <img
                    src={
                      selectedAlbumForReview.image_url ||
                      selectedAlbumForReview.imagen ||
                      'https://via.placeholder.com/150/1a1a2e/ffffff?text=🎵'
                    }
                    alt={
                      selectedAlbumForReview.album_name ||
                      selectedAlbumForReview.album
                    }
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-pink-500/40 shadow-xl flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-black text-lg sm:text-2xl truncate">
                        {selectedAlbumForReview.album_name ||
                          selectedAlbumForReview.album}
                      </h3>
                      <span
                        className={`text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          selectedAlbumForReview.status === 'INDIVIDUAL'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                            : 'bg-gray-500/20 text-gray-300 border-gray-500/40'
                        }`}
                      >
                        {selectedAlbumForReview.status === 'INDIVIDUAL'
                          ? '💿 Álbum Individual'
                          : '💤 Álbum Inactivo'}
                      </span>
                    </div>
                    <p className="text-pink-300 text-sm sm:text-base font-semibold truncate">
                      {selectedAlbumForReview.artist_name ||
                        selectedAlbumForReview.artista}
                    </p>
                    <p className="text-white/40 text-xs mt-0.5">
                      Añadido por:{' '}
                      <span className="text-white/80 font-medium">
                        {selectedAlbumForReview.added_by || 'Club'}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedAlbumForReview(null)}
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center transition-all flex-shrink-0 text-base"
                  title="Cerrar"
                >
                  ✕
                </button>
              </div>

              {/* Sistema completo de review con criterios y canciones */}
              <div>
                <ReviewSystem
                  album={{
                    id: selectedAlbumForReview.id,
                    album:
                      selectedAlbumForReview.album_name ||
                      selectedAlbumForReview.album,
                    album_name:
                      selectedAlbumForReview.album_name ||
                      selectedAlbumForReview.album,
                    artista:
                      selectedAlbumForReview.artist_name ||
                      selectedAlbumForReview.artista,
                    artist_name:
                      selectedAlbumForReview.artist_name ||
                      selectedAlbumForReview.artista,
                    imagen:
                      selectedAlbumForReview.image_url ||
                      selectedAlbumForReview.imagen,
                    image_url:
                      selectedAlbumForReview.image_url ||
                      selectedAlbumForReview.imagen,
                    status: selectedAlbumForReview.status,
                    spotify_link: selectedAlbumForReview.spotify_link,
                    tracks: selectedAlbumForReview.tracks || [],
                  }}
                  isFromSpotify={Boolean(
                    selectedAlbumForReview.spotify_link ||
                      (selectedAlbumForReview.tracks &&
                        selectedAlbumForReview.tracks.length > 0)
                  )}
                  isIndividual={true}
                  tracks={selectedAlbumForReview.tracks || []}
                  user={user}
                  showTrackReviews={true}
                  onToggleTrackReviews={() => {}}
                  onReviewSubmitted={() => {
                    if (onAlbumReviewed) onAlbumReviewed();
                  }}
                />
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* AVISO PARA ÁLBUMES DEL POOL ACTIVO O GANADORES */}
      {poolNoticeAlbum &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
            onClick={() => setPoolNoticeAlbum(null)}
          >
            <div
              className="bg-[#121426] border border-amber-500/30 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-3xl mx-auto border border-amber-500/30">
                🎰
              </div>
              <h3 className="text-white font-black text-lg">
                Álbum en dinámica de Ruleta / Ganador
              </h3>
              <p className="text-white/70 text-xs sm:text-sm leading-relaxed">
                <strong className="text-white">
                  "{poolNoticeAlbum.album_name || poolNoticeAlbum.album}"
                </strong>{' '}
                es un álbum del{' '}
                <span className="text-amber-300 font-bold">
                  {poolNoticeAlbum.status === 'GANADOR'
                    ? 'Ganador de la ronda'
                    : 'Pool Activo'}
                </span>
                . Las calificaciones para este álbum se realizan directamente
                desde la máquina musical en la pantalla principal.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setPoolNoticeAlbum(null)}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
