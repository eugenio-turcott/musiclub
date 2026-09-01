// src/components/HeaderAlbumSearch.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { searchAlbum, getAlbumDetails } from '../services/spotifyApi';
import { supabaseService } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { slugifyAlbum } from '../utils/ratingUtils';

export function HeaderAlbumSearch({
  user: propUser,
  isMobileMode = false,
  onAlbumReviewed,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const user = propUser || auth.user;

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [clubAlbums, setClubAlbums] = useState([]);
  const [spotifyResults, setSpotifyResults] = useState([]);
  const [loadingClub, setLoadingClub] = useState(false);
  const [loadingSpotify, setLoadingSpotify] = useState(false);
  const [selectingAlbumId, setSelectingAlbumId] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Cerrar buscador al navegar entre rutas
  useEffect(() => {
    setIsOpen(false);
    setQuery('');
    setHighlightedIndex(-1);
    setStatusMessage(null);
  }, [location.pathname]);

  // Cargar álbumes del club de Supabase en memoria
  const loadClubAlbums = useCallback(async () => {
    if (clubAlbums.length > 0) return;
    setLoadingClub(true);
    try {
      const data = await supabaseService.getAllAlbumsWithFullStats();
      setClubAlbums(data || []);
    } catch (err) {
      console.error('Error cargando catálogo para buscador global:', err);
    } finally {
      setLoadingClub(false);
    }
  }, [clubAlbums.length]);

  // Filtrar álbumes locales del club que coincidan con la búsqueda
  const clubMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return clubAlbums.filter((a) => {
      const name = (a.album_name || a.album || '').toLowerCase();
      const artist = (a.artist_name || a.artista || '').toLowerCase();
      return name.includes(q) || artist.includes(q);
    });
  }, [clubAlbums, query]);

  // Búsqueda en vivo en la API de Spotify con Debounce
  useEffect(() => {
    const cleanQ = query.trim();
    if (!cleanQ || cleanQ.length < 2) {
      setSpotifyResults([]);
      setLoadingSpotify(false);
      return;
    }

    setLoadingSpotify(true);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchAlbum(cleanQ);
        if (res && res.success && Array.isArray(res.albums)) {
          setSpotifyResults(res.albums);
        } else {
          setSpotifyResults([]);
        }
      } catch (err) {
        console.warn('Error buscando en Spotify:', err);
        setSpotifyResults([]);
      } finally {
        setLoadingSpotify(false);
      }
    }, 260);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  // Manejador para clics fuera del contenedor
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      if (containerRef.current && containerRef.current.contains(e.target)) {
        return;
      }
      setIsOpen(false);
    };

    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handlePointerDown);
      document.addEventListener('mousedown', handlePointerDown);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen]);

  // Lista unificada y enriquecida de resultados
  const combinedResults = useMemo(() => {
    const results = [];
    const seenKeys = new Set();

    // 1. Coincidencias del club
    clubMatches.forEach((ca) => {
      const normName = (ca.album_name || ca.album || '').trim().toLowerCase();
      const normArtist = (ca.artist_name || ca.artista || '')
        .trim()
        .toLowerCase();
      const key = `${normName}:::${normArtist}`;
      seenKeys.add(key);

      results.push({
        type: 'CLUB',
        id: ca.id,
        name: ca.album_name || ca.album,
        artist: ca.artist_name || ca.artista,
        image: ca.image_url || ca.imagen,
        status: ca.status,
        rating: ca.final_rating,
        rawClubAlbum: ca,
      });
    });

    // 2. Resultados de Spotify
    spotifyResults.forEach((sa) => {
      const normName = (sa.name || '').trim().toLowerCase();
      const artistName = sa.artists && sa.artists[0] ? sa.artists[0] : '';
      const normArtist = artistName.trim().toLowerCase();
      const key = `${normName}:::${normArtist}`;

      if (seenKeys.has(key)) return;

      const existingClub = clubAlbums.find((ca) => {
        const cName = (ca.album_name || ca.album || '').trim().toLowerCase();
        const cArtist = (ca.artist_name || ca.artista || '')
          .trim()
          .toLowerCase();
        return (
          (cName === normName && cArtist === normArtist) ||
          (cName === normName && (!cArtist || !normArtist))
        );
      });

      if (existingClub) {
        seenKeys.add(key);
        results.push({
          type: 'CLUB',
          id: existingClub.id,
          name: existingClub.album_name || existingClub.album,
          artist: existingClub.artist_name || existingClub.artista,
          image: existingClub.image_url || existingClub.imagen || sa.image,
          status: existingClub.status,
          rating: existingClub.final_rating,
          rawClubAlbum: existingClub,
        });
      } else {
        seenKeys.add(key);
        results.push({
          type: 'SPOTIFY',
          id: sa.id,
          name: sa.name,
          artist: artistName,
          image: sa.image,
          releaseDate: sa.releaseDate,
          rawSpotifyAlbum: sa,
        });
      }
    });

    return results.slice(0, 15);
  }, [clubMatches, spotifyResults, clubAlbums]);

  const handleOpenSearch = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsOpen(true);
    loadClubAlbums();

    setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
  };

  const handleCloseSearch = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsOpen(false);
    setQuery('');
    setHighlightedIndex(-1);
    setStatusMessage(null);
  };

  const handleToggleSearch = (e) => {
    if (isOpen) {
      handleCloseSearch(e);
    } else {
      handleOpenSearch(e);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setHighlightedIndex(-1);
    loadClubAlbums();
  };

  const handleClear = () => {
    setQuery('');
    setHighlightedIndex(-1);
    setStatusMessage(null);
    inputRef.current?.focus();
  };

  // Manejador al seleccionar un álbum
  const handleSelectAlbum = async (item) => {
    if (selectingAlbumId) return;

    setSelectingAlbumId(item.id);
    setStatusMessage('Cargando álbum...');

    try {
      if (item.type === 'CLUB' && item.rawClubAlbum) {
        const target = item.rawClubAlbum;
        const albumName = target.album_name || target.album || item.name;
        const slug = slugifyAlbum(albumName);

        setIsOpen(false);
        setQuery('');
        if (onAlbumReviewed) onAlbumReviewed();
        navigate(`/albumes/${slug}`);
        return;
      }

      if (item.type === 'SPOTIFY' && item.rawSpotifyAlbum) {
        setStatusMessage('Proponiendo como álbum individual...');

        const details = await getAlbumDetails(item.rawSpotifyAlbum.id);
        const spotifyData = details?.success
          ? details.album
          : item.rawSpotifyAlbum;

        const tracks = (spotifyData.tracks || []).map((t) => ({
          id: t.id,
          name: t.name,
          duration_ms: t.duration_ms,
          track_number: t.track_number,
        }));

        const artistName =
          spotifyData.artists && spotifyData.artists[0]
            ? spotifyData.artists[0]
            : item.artist || 'Artista';

        const existing = await supabaseService.findAlbum(
          spotifyData.name,
          artistName
        );
        let finalAlbum = existing;

        if (!finalAlbum) {
          const albumData = {
            albumName: spotifyData.name,
            artistName: artistName,
            imageUrl: spotifyData.image,
            spotifyLink:
              spotifyData.external_urls?.spotify ||
              `https://open.spotify.com/album/${spotifyData.id}`,
            addedBy:
              user?.name || user?.email?.split('@')[0] || 'Miembro Musiclub',
            addedByEmail: user?.email || '',
            status: 'INDIVIDUAL',
            tracks: tracks,
            releaseDate: spotifyData.releaseDate || spotifyData.release_date || null,
            releaseYear: spotifyData.releaseYear || null,
            releaseType: spotifyData.release_type || 'ALBUM',
            genres: spotifyData.genres || [],
            reviews_enabled: true,
          };
          finalAlbum = await supabaseService.createAlbum(albumData);
        }

        const slug = slugifyAlbum(finalAlbum?.album_name || spotifyData.name);
        setIsOpen(false);
        setQuery('');
        if (onAlbumReviewed) onAlbumReviewed();
        navigate(`/albumes/${slug}`);
      }
    } catch (err) {
      console.error('Error al seleccionar y proponer álbum:', err);
      setStatusMessage('Error al abrir el álbum. Intenta de nuevo.');
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setSelectingAlbumId(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (query.trim()) {
        setQuery('');
      } else {
        handleCloseSearch();
      }
      return;
    }

    if (!isOpen || combinedResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < combinedResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : combinedResults.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < combinedResults.length) {
        handleSelectAlbum(combinedResults[highlightedIndex]);
      }
    }
  };

  const isSearching = loadingClub || loadingSpotify;

  // Render para dentro del Mobile Navigation Drawer (si se usa allí)
  if (isMobileMode) {
    return (
      <div ref={containerRef} className="w-full space-y-2">
        <button
          type="button"
          onClick={handleToggleSearch}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-all group active:scale-[0.98] cursor-pointer"
        >
          <span className="flex items-center gap-2.5 text-white/80 group-hover:text-white">
            <span className="text-pink-400 text-sm">🔍</span>
            <span>Buscar álbum...</span>
          </span>
          <span className="text-[10px] text-pink-300 bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/20 font-bold">
            {isOpen ? '▲ Ocultar' : '▾ Abrir'}
          </span>
        </button>

        {isOpen && (
          <div className="space-y-2 animate-fadeIn bg-black/40 border border-white/15 p-2.5 rounded-2xl">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Escribe el álbum o artista..."
                className="w-full pl-8 pr-8 py-2 bg-[#0c0e1e] border border-white/15 focus:border-[#f5576c]/60 rounded-xl text-white text-xs placeholder-white/40 focus:outline-none shadow-inner"
                autoFocus
              />

              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/50 text-xs pointer-events-none">
                {isSearching ? (
                  <span className="inline-block w-3 h-3 border-2 border-[#f5576c] border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  '🔍'
                )}
              </span>

              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/10 hover:bg-white/25 text-white/60 hover:text-white flex items-center justify-center text-[10px] cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {statusMessage && (
              <div className="bg-gradient-to-r from-pink-600/90 to-purple-600/90 text-white text-[11px] font-bold py-1.5 px-3 rounded-xl shadow-lg flex items-center justify-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>{statusMessage}</span>
              </div>
            )}

            {query.trim() && (
              <div className="max-h-[300px] overflow-y-auto space-y-1 custom-scrollbar pt-1">
                {isSearching && combinedResults.length === 0 ? (
                  <div className="p-3 text-center text-white/50 text-xs flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-[#f5576c] rounded-full animate-pulse"></span>
                    <span>Buscando álbumes...</span>
                  </div>
                ) : combinedResults.length === 0 ? (
                  <div className="p-3 text-center text-white/40 text-xs">
                    No se encontraron álbumes para "{query}"
                  </div>
                ) : (
                  combinedResults.map((item, idx) => {
                    const isSelectingThis = selectingAlbumId === item.id;
                    const isClubAlbum = item.type === 'CLUB';

                    return (
                      <div
                        key={item.id || idx}
                        onClick={() => handleSelectAlbum(item)}
                        className={`flex items-center gap-2 p-2 rounded-xl transition-all cursor-pointer ${
                          isSelectingThis
                            ? 'bg-pink-500/20 border border-pink-500/50 opacity-80 pointer-events-none'
                            : 'hover:bg-white/5 bg-white/[0.02] border border-white/5'
                        }`}
                      >
                        <img
                          src={
                            item.image ||
                            'https://via.placeholder.com/100/1a1a2e/ffffff?text=🎵'
                          }
                          alt={item.name}
                          className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-white/10"
                        />
                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-white font-bold text-xs truncate">
                            {item.name}
                          </p>
                          <p className="text-white/60 text-[10px] truncate">
                            {item.artist}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-lg font-bold ${
                              isClubAlbum
                                ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white'
                                : 'bg-gradient-to-r from-purple-600 to-pink-500 text-white'
                            }`}
                          >
                            {isClubAlbum ? 'Ver ➔' : '+ Proponer ➔'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Render en el Header Superior (Botón con Icono y Dropdown desplegable hacia abajo)
  return (
    <div ref={containerRef} className="relative">
      {/* Botón Lupa en el Header (estilo idéntico al botón de Notificaciones) */}
      <button
        type="button"
        onClick={handleToggleSearch}
        className={`relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full border transition-all duration-200 cursor-pointer select-none ${
          isOpen
            ? 'bg-[#181a2f] border-pink-500/60 ring-2 ring-pink-500/30 text-white shadow-[0_0_15px_rgba(245,87,108,0.3)]'
            : 'bg-[#121324]/80 hover:bg-[#1a1b32] border-white/15 hover:border-pink-500/40 text-white/80 hover:text-white shadow-md hover:scale-105 active:scale-95'
        }`}
        title="Buscar álbumes en el Club o Spotify"
        aria-label="Buscar álbum"
        aria-expanded={isOpen}
      >
        <svg
          className="w-4 h-4 sm:w-4.5 sm:h-4.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>

      {/* Popover / Menú Desplegable hacia abajo (al estilo de NotificationsDropdown) */}
      {isOpen && (
        <div
          className="fixed left-2 right-2 top-[58px] z-[160] sm:fixed-none sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2.5 sm:w-[460px] md:w-[500px] bg-[#0c0e1c]/95 backdrop-blur-2xl border border-pink-500/30 sm:border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-left animate-fadeIn max-h-[85vh] sm:max-h-[580px]"
          role="dialog"
          aria-label="Buscador de Álbumes"
        >
          {/* Cabecera del Dropdown */}
          <div className="p-3.5 sm:p-4 border-b border-white/10 bg-white/[0.03] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-400 flex items-center justify-center text-sm flex-shrink-0 shadow-inner">
                🔍
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide truncate">
                  Buscar Álbumes
                </h3>
                <p className="text-[11px] text-white/40 truncate">
                  Catálogo del Club y millones de discos en Spotify
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseSearch}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white flex items-center justify-center text-xs transition-all border border-white/10 cursor-pointer"
              title="Cerrar buscador"
            >
              ✕
            </button>
          </div>

          {/* Campo de Texto de Búsqueda */}
          <div className="p-3 border-b border-white/10 bg-black/40">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Escribe el nombre del álbum o artista..."
                className="w-full pl-9 pr-8 py-2.5 bg-[#121324] border border-white/15 focus:border-[#f5576c] focus:ring-1 focus:ring-[#f5576c]/40 rounded-xl text-white text-xs sm:text-sm placeholder-white/40 focus:outline-none transition-all shadow-inner"
                autoFocus
              />

              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-xs pointer-events-none">
                {isSearching ? (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-[#f5576c] border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  '🔍'
                )}
              </span>

              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center text-xs transition-all cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Notificación de acción / proceso de proposición */}
          {statusMessage && (
            <div className="mx-3 mt-2.5 bg-gradient-to-r from-pink-600/95 to-purple-600/95 text-white text-[11px] font-bold py-2 px-3 rounded-xl shadow-lg flex items-center justify-center gap-2 animate-fadeIn border border-white/20">
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Resultados de búsqueda */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 max-h-[360px]">
            {!query.trim() ? (
              <div className="py-8 px-4 text-center space-y-2">
                <div className="text-3xl">🎧</div>
                <p className="text-white font-bold text-xs">
                  Empieza a escribir para buscar
                </p>
                <p className="text-white/40 text-[11px] max-w-xs mx-auto leading-relaxed">
                  Busca cualquier álbum del club para ver sus reviews o encuentra cualquier disco en Spotify para proponerlo.
                </p>
              </div>
            ) : isSearching && combinedResults.length === 0 ? (
              <div className="py-10 text-center text-white/50 text-xs flex flex-col items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-[#f5576c] border-t-transparent rounded-full animate-spin"></span>
                <span>Buscando en catálogo y Spotify...</span>
              </div>
            ) : combinedResults.length === 0 ? (
              <div className="py-8 text-center text-white/40 text-xs">
                <p className="font-semibold text-white/70">No se encontraron álbumes para "{query}"</p>
                <p className="text-[11px] text-white/30 mt-1">
                  Verifica que el título o artista estén bien escritos.
                </p>
              </div>
            ) : (
              <>
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40 flex items-center justify-between border-b border-white/5">
                  <span>Resultados ({combinedResults.length})</span>
                  <span className="text-pink-300 font-normal">Click para abrir / calificar</span>
                </div>

                {combinedResults.map((item, idx) => {
                  const isHighlighted = highlightedIndex === idx;
                  const isSelectingThis = selectingAlbumId === item.id;
                  const isClubAlbum = item.type === 'CLUB';

                  return (
                    <div
                      key={item.id || idx}
                      onClick={() => handleSelectAlbum(item)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl transition-all cursor-pointer group ${
                        isSelectingThis
                          ? 'bg-pink-500/20 border border-pink-500/50 opacity-80 pointer-events-none'
                          : isHighlighted
                            ? 'bg-gradient-to-r from-[#f5576c]/20 to-[#f093fb]/20 border border-[#f5576c]/40'
                            : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="relative w-11 h-11 flex-shrink-0">
                        <img
                          src={
                            item.image ||
                            'https://via.placeholder.com/100/1a1a2e/ffffff?text=🎵'
                          }
                          alt={item.name}
                          className="w-11 h-11 rounded-lg object-cover border border-white/10"
                          onError={(e) => {
                            e.target.src =
                              'https://via.placeholder.com/100/1a1a2e/ffffff?text=🎵';
                          }}
                        />
                        {isSelectingThis && (
                          <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p
                            translate="no"
                            className="notranslate text-white font-bold text-xs truncate group-hover:text-pink-300 transition-colors"
                          >
                            {item.name}
                          </p>
                        </div>

                        <p
                          translate="no"
                          className="notranslate text-white/60 text-[11px] truncate"
                        >
                          {item.artist}
                        </p>

                        <p className="text-white/40 text-[9px] truncate">
                          {isClubAlbum
                            ? `En el Club • Añadido por: ${item.rawClubAlbum?.added_by || 'Club'}`
                            : `Spotify • ${item.releaseDate ? item.releaseDate.split('-')[0] : 'Álbum'}`}
                        </p>
                      </div>

                      <div className="flex-shrink-0 text-right">
                        {isClubAlbum ? (
                          <>
                            <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white text-[10px] font-bold shadow-sm inline-block group-hover:scale-105 transition-transform">
                              Ver Álbum ➔
                            </span>
                            {item.rating !== null && item.rating !== undefined && (
                              <p className="text-[9px] text-amber-300 font-bold mt-0.5">
                                ⭐ {Number(item.rating).toFixed(1)}
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 text-white text-[10px] font-bold shadow-sm inline-block group-hover:scale-105 transition-transform">
                            + Proponer ➔
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Pie de dropdown */}
          <div className="p-2.5 px-4 bg-white/[0.02] border-t border-white/10 text-[10px] text-white/40 flex items-center justify-between">
            <span>Presiona <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white/70 font-mono">Esc</kbd> para salir</span>
            <span className="text-pink-400/80 font-medium">Musiclub Search</span>
          </div>
        </div>
      )}
    </div>
  );
}
