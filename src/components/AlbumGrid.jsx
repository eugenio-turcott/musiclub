// src/components/AlbumGrid.jsx
import React, { useState, useMemo } from 'react';
import { ReviewSystem } from './ReviewSystem';
import { getAlbumTracksById, searchAlbum } from '../services/spotifyApi';
import { supabaseService, supabase } from '../services/supabaseClient';

export function AlbumGrid({
  albums,
  loading,
  error,
  winner,
  user,
  isAdmin = false,
  reviewedAlbumIds = new Set(),
  onAlbumUpdated,
}) {
  const [selectedIndividual, setSelectedIndividual] = useState(null);
  const [syncingAlbum, setSyncingAlbum] = useState(null);
  const [syncMessage, setSyncMessage] = useState(null);
  const [showTrackReviews, setShowTrackReviews] = useState(true);

  const ITEMS_PER_PAGE = 15;
  const [activePage, setActivePage] = useState(1);
  const [individualPage, setIndividualPage] = useState(1);
  const [inactivePage, setInactivePage] = useState(1);

  const isAlbumReviewed = (albumId) => {
    if (!albumId || !reviewedAlbumIds) return false;
    return reviewedAlbumIds instanceof Set
      ? reviewedAlbumIds.has(albumId)
      : Array.isArray(reviewedAlbumIds)
        ? reviewedAlbumIds.includes(albumId)
        : false;
  };

  const isUserAlbum = (album) => {
    if (!user || !album) return false;
    const userEmail = (user.email || '').toLowerCase().trim();
    const albumEmail = (album.added_by_email || '').toLowerCase().trim();
    if (albumEmail && userEmail && albumEmail === userEmail) return true;
    if (album.user_id && user.id && String(album.user_id) === String(user.id))
      return true;
    const userName = (user.name || '').toLowerCase().trim();
    const albumAuthor = (album.added_by || '').toLowerCase().trim();
    if (albumAuthor && userName && albumAuthor === userName) return true;
    return false;
  };

  // Separar álbumes por categoría usando useMemo
  const activeAlbums = useMemo(
    () =>
      albums.filter(
        (album) => album.status === 'ACTIVO' || album.status === 'GANADOR'
      ),
    [albums]
  );

  const individualAlbums = useMemo(
    () => albums.filter((album) => album.status === 'INDIVIDUAL'),
    [albums]
  );

  const inactiveAlbums = useMemo(
    () => albums.filter((album) => album.status === 'INACTIVO'),
    [albums]
  );

  // Filtrar el ganador del catálogo activo
  const filteredActiveAlbums = useMemo(() => {
    return activeAlbums.filter((album) => {
      if (
        winner &&
        winner.album === album.album &&
        winner.artista === album.artista
      ) {
        return false;
      }
      return true;
    });
  }, [activeAlbums, winner]);

  // Paginación de 20 para todas las categorías
  const totalActivePages = useMemo(
    () => Math.ceil(filteredActiveAlbums.length / ITEMS_PER_PAGE) || 1,
    [filteredActiveAlbums.length]
  );
  const paginatedActiveAlbums = useMemo(
    () =>
      filteredActiveAlbums.slice(
        (activePage - 1) * ITEMS_PER_PAGE,
        activePage * ITEMS_PER_PAGE
      ),
    [filteredActiveAlbums, activePage]
  );

  const totalIndividualPages = useMemo(
    () => Math.ceil(individualAlbums.length / ITEMS_PER_PAGE) || 1,
    [individualAlbums.length]
  );
  const paginatedIndividualAlbums = useMemo(
    () =>
      individualAlbums.slice(
        (individualPage - 1) * ITEMS_PER_PAGE,
        individualPage * ITEMS_PER_PAGE
      ),
    [individualAlbums, individualPage]
  );

  const totalInactivePages = useMemo(
    () => Math.ceil(inactiveAlbums.length / ITEMS_PER_PAGE) || 1,
    [inactiveAlbums.length]
  );
  const paginatedInactiveAlbums = useMemo(
    () =>
      inactiveAlbums.slice(
        (inactivePage - 1) * ITEMS_PER_PAGE,
        inactivePage * ITEMS_PER_PAGE
      ),
    [inactiveAlbums, inactivePage]
  );

  // Función para sincronizar tracks con Spotify
  const syncAlbumTracks = async (album) => {
    console.log(
      '🔍 Iniciando sincronización para:',
      album.album,
      album.artista
    );
    console.log('📎 Spotify Link:', album.spotifyLink);

    setSyncingAlbum(album.id);
    setSyncMessage(null);

    try {
      let tracks = null;
      let spotifyId = null;

      // ===== PASO 1: Intentar extraer ID del enlace existente =====
      if (album.spotifyLink) {
        if (album.spotifyLink.includes('spotify.com/album/')) {
          spotifyId = album.spotifyLink
            .split('/album/')[1]
            ?.split('?')[0]
            ?.split('&')[0];
        } else if (album.spotifyLink.includes('spotify.com/track/')) {
          console.warn(
            '⚠️ Es un enlace de canción, intentando buscar el álbum...'
          );
          const searchResult = await searchAlbum(
            `${album.album} ${album.artista}`
          );
          if (searchResult.success && searchResult.albums.length > 0) {
            const foundAlbum = searchResult.albums[0];
            spotifyId = foundAlbum.id;
          }
        } else if (album.spotifyLink.length === 22) {
          spotifyId = album.spotifyLink;
        }
      }

      // ===== PASO 2: Si no hay ID, buscar en Spotify =====
      if (!spotifyId) {
        console.log(
          '🔍 No hay ID de Spotify, buscando por nombre y artista...'
        );
        setSyncMessage({ type: 'info', text: '🔍 Buscando en Spotify...' });

        const searchResult = await searchAlbum(
          `${album.album} ${album.artista}`
        );
        console.log('📊 Resultado de búsqueda:', searchResult);

        if (searchResult.success && searchResult.albums.length > 0) {
          let bestMatch = null;
          let bestScore = 0;

          for (const result of searchResult.albums) {
            let score = 0;
            if (result.name.toLowerCase() === album.album.toLowerCase())
              score += 10;
            else if (
              result.name.toLowerCase().includes(album.album.toLowerCase()) ||
              album.album.toLowerCase().includes(result.name.toLowerCase())
            )
              score += 5;

            const artistMatch = result.artists.some(
              (a) =>
                a.toLowerCase() === album.artista.toLowerCase() ||
                album.artista.toLowerCase().includes(a.toLowerCase()) ||
                a.toLowerCase().includes(album.artista.toLowerCase())
            );
            if (artistMatch) score += 8;

            if (score > bestScore) {
              bestScore = score;
              bestMatch = result;
            }
          }

          if (bestMatch && bestScore >= 5) {
            spotifyId = bestMatch.id;
            console.log(
              `✅ Encontrado: ${bestMatch.name} (score: ${bestScore})`
            );

            try {
              const { error: updateError } = await supabase
                .from('albums')
                .update({
                  spotify_link: `https://open.spotify.com/album/${bestMatch.id}`,
                })
                .eq('id', album.id);

              if (!updateError) {
                console.log('✅ Enlace de Spotify actualizado en la BD');
              }
            } catch (err) {
              console.warn('⚠️ No se pudo actualizar el enlace:', err);
            }
          } else {
            setSyncMessage({
              type: 'error',
              text: '❌ No se encontró el álbum en Spotify. Verifica el nombre y artista.',
            });
            setTimeout(() => setSyncingAlbum(null), 2000);
            setTimeout(() => setSyncMessage(null), 5000);
            return;
          }
        } else {
          setSyncMessage({
            type: 'error',
            text: '❌ No se encontró el álbum en Spotify. Intenta con otro nombre.',
          });
          setTimeout(() => setSyncingAlbum(null), 2000);
          setTimeout(() => setSyncMessage(null), 5000);
          return;
        }
      }

      // ===== PASO 3: Obtener los tracks =====
      if (!spotifyId) {
        setSyncMessage({
          type: 'error',
          text: '❌ No se pudo obtener el ID de Spotify',
        });
        setTimeout(() => setSyncingAlbum(null), 2000);
        setTimeout(() => setSyncMessage(null), 5000);
        return;
      }

      console.log(`🎵 ID de Spotify: ${spotifyId}`);
      setSyncMessage({ type: 'info', text: '🎵 Obteniendo canciones...' });

      const result = await getAlbumTracksById(spotifyId);
      console.log('📥 Resultado:', result);

      if (result.success && result.tracks && result.tracks.length > 0) {
        tracks = result.tracks.map((track) => ({
          id: track.id,
          name: track.name,
          duration_ms: track.duration_ms,
          track_number: track.track_number,
        }));

        console.log(`✅ ${tracks.length} canciones encontradas`);

        await supabaseService.updateAlbumTracks(album.id, tracks);

        setSyncMessage({
          type: 'success',
          text: `✅ ${tracks.length} canciones sincronizadas`,
        });

        if (
          album.spotifyLink !== `https://open.spotify.com/album/${spotifyId}`
        ) {
          try {
            await supabase
              .from('albums')
              .update({
                spotify_link: `https://open.spotify.com/album/${spotifyId}`,
              })
              .eq('id', album.id);
          } catch (err) {
            console.warn('⚠️ No se pudo actualizar el enlace:', err);
          }
        }

        if (onAlbumUpdated) onAlbumUpdated();
      } else {
        setSyncMessage({
          type: 'error',
          text: '❌ No se encontraron canciones en Spotify',
        });
      }
    } catch (error) {
      console.error('❌ Error en syncAlbumTracks:', error);
      setSyncMessage({
        type: 'error',
        text: '❌ Error: ' + (error.message || 'Error desconocido'),
      });
    }

    setTimeout(() => setSyncingAlbum(null), 2000);
    setTimeout(() => setSyncMessage(null), 5000);
  };

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
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                {paginatedActiveAlbums.map((album, idx) => (
                  <div
                    key={idx}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 group ${
                      album.status === 'GANADOR'
                        ? isUserAlbum(album)
                          ? 'border-yellow-400 ring-2 ring-yellow-400/50 shadow-[0_0_25px_rgba(250,204,21,0.4)]'
                          : 'border-[#f5576c] shadow-[0_0_30px_rgba(245,87,108,0.2)]'
                        : isUserAlbum(album)
                          ? 'border-yellow-400 ring-2 ring-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.35)] hover:scale-105'
                          : 'border-white/5 hover:border-white/10 hover:scale-105'
                    }`}
                  >
                    <img
                      src={album.imagen}
                      alt={album.album}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src =
                          'https://via.placeholder.com/200/1a1a2e/ffffff?text=🎵';
                      }}
                    />
                    {/* Palomita si el usuario ya dio review */}
                    {isAlbumReviewed(album.id) && (
                      <div
                        className="absolute bottom-1.5 right-1.5 z-20 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.9)] border-2 border-emerald-200 backdrop-blur-md transform transition-all duration-300 hover:scale-110"
                        title="Ya diste tu review a este álbum ✓"
                      >
                        <svg
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]"
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

                    {album.status === 'GANADOR' && (
                      <div className="absolute top-1 right-1 text-sm sm:text-base drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                        🏆
                      </div>
                    )}

                    {isAdmin && (
                      <div className="absolute top-1 left-1 z-10">
                        {album.spotify_verified &&
                        album.tracks &&
                        album.tracks.length > 0 ? (
                          <span className="text-[8px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full border border-green-500/20">
                            ✓
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              syncAlbumTracks(album);
                            }}
                            disabled={syncingAlbum === album.id}
                            className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full border border-blue-500/20 hover:bg-blue-500/30 transition-all disabled:opacity-50 whitespace-nowrap"
                          >
                            {syncingAlbum === album.id ? '🔄' : '🔍 Verificar'}
                          </button>
                        )}
                      </div>
                    )}

                    {syncMessage && syncingAlbum === album.id && (
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
                        <span
                          className={`text-xs ${
                            syncMessage.type === 'success'
                              ? 'text-green-400'
                              : syncMessage.type === 'error'
                                ? 'text-red-400'
                                : 'text-blue-400'
                          }`}
                        >
                          {syncMessage.text}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2.5">
                      <div className="w-full min-w-0">
                        <p
                          className="text-white text-xs font-bold leading-tight break-words line-clamp-2"
                          title={album.album}
                        >
                          {album.album}
                        </p>
                        <p
                          className="text-white/60 text-[10px] leading-tight break-words line-clamp-1 mt-0.5"
                          title={album.artista}
                        >
                          {album.artista}
                        </p>
                        {album.status === 'GANADOR' && (
                          <span className="text-[8px] text-[#f5576c] font-bold block mt-0.5">
                            🏆 GANADOR
                          </span>
                        )}
                        {album.spotify_verified &&
                          album.tracks &&
                          album.tracks.length > 0 && (
                            <span className="text-[8px] text-white/40 block mt-0.5">
                              🎵 {album.tracks.length} canciones
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalActivePages > 1 && (
                <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-white/5 text-xs">
                  <span className="text-slate-400">
                    Página <b className="text-white">{activePage}</b> de{' '}
                    <b className="text-white">{totalActivePages}</b>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                      disabled={activePage === 1}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 border border-white/10 font-medium transition-all"
                    >
                      ← Ant
                    </button>
                    <button
                      onClick={() =>
                        setActivePage((p) => Math.min(totalActivePages, p + 1))
                      }
                      disabled={activePage === totalActivePages}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 border border-white/10 font-medium transition-all"
                    >
                      Sig →
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-white/20 text-sm">
              No hay álbumes activos en el catálogo
            </div>
          )}
        </>
      )}

      {/* ÁLBUMES INDIVIDUALES CON BOTÓN REVIEW */}
      {individualAlbums.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-2 mb-3 mt-6 flex-wrap">
            <div className="flex items-center gap-2">
              <h3 className="text-sm uppercase tracking-wider text-white/40 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Álbumes Individuales ({individualAlbums.length})
              </h3>
              <span className="text-xs text-white/20">
                · Califica y guarda tus reviews
              </span>
            </div>
            {totalIndividualPages > 1 && (
              <span className="text-xs text-slate-400">
                Pág. <b className="text-white">{individualPage}</b> de{' '}
                <b className="text-white">{totalIndividualPages}</b>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {paginatedIndividualAlbums.map((album, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedIndividual(album)}
                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 group cursor-pointer ${
                  isUserAlbum(album)
                    ? 'border-yellow-400 ring-2 ring-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.35)] hover:scale-105'
                    : 'border-blue-500/20 hover:border-blue-500/40'
                }`}
              >
                <img
                  src={album.imagen}
                  alt={album.album}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src =
                      'https://via.placeholder.com/200/1a1a2e/ffffff?text=🎵';
                  }}
                />

                {/* Palomita si el usuario ya dio review */}
                {isAlbumReviewed(album.id) && (
                  <div
                    className="absolute bottom-1.5 right-1.5 z-20 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.9)] border-2 border-emerald-200 backdrop-blur-md transform transition-all duration-300 hover:scale-110"
                    title="Ya diste tu review a este álbum ✓"
                  >
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]"
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

                {isAdmin && (
                  <div className="absolute top-1 left-1 z-10">
                    {album.spotify_verified &&
                    album.tracks &&
                    album.tracks.length > 0 ? (
                      <span className="text-[8px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full border border-green-500/20">
                        ✓
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          syncAlbumTracks(album);
                        }}
                        disabled={syncingAlbum === album.id}
                        className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full border border-blue-500/20 hover:bg-blue-500/30 transition-all disabled:opacity-50 whitespace-nowrap"
                      >
                        {syncingAlbum === album.id ? '🔄' : '🔍 Verificar'}
                      </button>
                    )}
                  </div>
                )}

                {syncMessage && syncingAlbum === album.id && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
                    <span
                      className={`text-xs ${
                        syncMessage.type === 'success'
                          ? 'text-green-400'
                          : syncMessage.type === 'error'
                            ? 'text-red-400'
                            : 'text-blue-400'
                      }`}
                    >
                      {syncMessage.text}
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-3 text-center">
                  <div className="w-full max-w-full min-w-0 flex flex-col items-center">
                    <p
                      className="text-white font-bold text-xs sm:text-sm leading-snug break-words line-clamp-2 mb-1"
                      title={album.album}
                    >
                      {album.album}
                    </p>
                    <p
                      className="text-white/60 text-[10px] sm:text-xs leading-snug break-words line-clamp-1 mb-2"
                      title={album.artista}
                    >
                      {album.artista}
                    </p>

                    {album.spotify_verified &&
                      album.tracks &&
                      album.tracks.length > 0 && (
                        <p className="text-white/40 text-[9px] sm:text-[10px] mb-2">
                          🎵 {album.tracks.length} canciones
                        </p>
                      )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIndividual(album);
                      }}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 text-white text-[11px] sm:text-xs font-bold rounded-full hover:scale-105 transition-all shadow-lg ${
                        isAlbumReviewed(album.id)
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-500 shadow-emerald-500/20'
                          : 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-blue-500/20'
                      }`}
                    >
                      {isAlbumReviewed(album.id)
                        ? '✓ Ver mi Review'
                        : '✍️ Dar Review'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalIndividualPages > 1 && (
            <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-white/5 text-xs">
              <span className="text-slate-400">
                Mostrando{' '}
                <b className="text-white">
                  {(individualPage - 1) * ITEMS_PER_PAGE + 1}
                </b>{' '}
                a{' '}
                <b className="text-white">
                  {Math.min(
                    individualPage * ITEMS_PER_PAGE,
                    individualAlbums.length
                  )}
                </b>{' '}
                de <b className="text-cyan-400">{individualAlbums.length}</b>{' '}
                individuales
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIndividualPage((p) => Math.max(1, p - 1))}
                  disabled={individualPage === 1}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 border border-white/10 font-medium transition-all"
                >
                  ← Ant
                </button>
                <button
                  onClick={() =>
                    setIndividualPage((p) =>
                      Math.min(totalIndividualPages, p + 1)
                    )
                  }
                  disabled={individualPage === totalIndividualPages}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 border border-white/10 font-medium transition-all"
                >
                  Sig →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ÁLBUMES INACTIVOS (para rankings) */}
      {inactiveAlbums.length > 0 && (
        <div className="mt-8 pt-6 border-t border-white/5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <h3 className="text-xl sm:text-2xl md:text-3xl text-gray-400/80 uppercase tracking-normal flex items-center gap-2">
              <span className="text-2xl">💤</span>
              Álbumes Inactivos
              <span className="text-xs font-normal text-white/30 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                Disponibles para reviews
              </span>
            </h3>
            <span className="text-xs sm:text-sm text-white/70 bg-white/10 px-3 py-1 rounded-full border border-white/5 whitespace-nowrap">
              {inactiveAlbums.length} inactivos
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {paginatedInactiveAlbums.map((album, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedIndividual(album)}
                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 group cursor-pointer ${
                  isUserAlbum(album)
                    ? 'border-yellow-400 ring-2 ring-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.35)] hover:scale-105'
                    : 'border-gray-500/20 hover:border-gray-500/40'
                }`}
              >
                <img
                  src={album.imagen}
                  alt={album.album}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src =
                      'https://via.placeholder.com/200/1a1a2e/ffffff?text=🎵';
                  }}
                />

                {/* Palomita si el usuario ya dio review */}
                {isAlbumReviewed(album.id) && (
                  <div
                    className="absolute bottom-1.5 right-1.5 z-20 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.9)] border-2 border-emerald-200 backdrop-blur-md transform transition-all duration-300 hover:scale-110"
                    title="Ya diste tu review a este álbum ✓"
                  >
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]"
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

                {isAdmin && (
                  <div className="absolute top-1 left-1 z-10">
                    {album.spotify_verified &&
                    album.tracks &&
                    album.tracks.length > 0 ? (
                      <span className="text-[8px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full border border-green-500/20">
                        ✓
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          syncAlbumTracks(album);
                        }}
                        disabled={syncingAlbum === album.id}
                        className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full border border-blue-500/20 hover:bg-blue-500/30 transition-all disabled:opacity-50 whitespace-nowrap"
                      >
                        {syncingAlbum === album.id ? '🔄' : '🔍 Verificar'}
                      </button>
                    )}
                  </div>
                )}

                {syncMessage && syncingAlbum === album.id && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
                    <span
                      className={`text-xs ${
                        syncMessage.type === 'success'
                          ? 'text-green-400'
                          : syncMessage.type === 'error'
                            ? 'text-red-400'
                            : 'text-blue-400'
                      }`}
                    >
                      {syncMessage.text}
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-3 text-center">
                  <div className="w-full max-w-full min-w-0 flex flex-col items-center">
                    <p
                      className="text-white font-bold text-xs sm:text-sm leading-snug break-words line-clamp-2 mb-1"
                      title={album.album}
                    >
                      {album.album}
                    </p>
                    <p
                      className="text-white/60 text-[10px] sm:text-xs leading-snug break-words line-clamp-1 mb-2"
                      title={album.artista}
                    >
                      {album.artista}
                    </p>

                    {album.spotify_verified &&
                      album.tracks &&
                      album.tracks.length > 0 && (
                        <p className="text-white/40 text-[9px] sm:text-[10px] mb-2">
                          🎵 {album.tracks.length} canciones
                        </p>
                      )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIndividual(album);
                      }}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 text-white text-[11px] sm:text-xs font-bold rounded-full hover:scale-105 transition-all shadow-lg ${
                        isAlbumReviewed(album.id)
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-500 shadow-emerald-500/20'
                          : 'bg-gradient-to-r from-gray-500 to-gray-600 shadow-gray-500/20'
                      }`}
                    >
                      {isAlbumReviewed(album.id)
                        ? '✓ Ver mi Review'
                        : '✍️ Dar Review'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalInactivePages > 1 && (
            <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-white/5 text-xs">
              <span className="text-slate-400">
                Página <b className="text-white">{inactivePage}</b> de{' '}
                <b className="text-white">{totalInactivePages}</b>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setInactivePage((p) => Math.max(1, p - 1))}
                  disabled={inactivePage === 1}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 border border-white/10 font-medium transition-all"
                >
                  ← Ant
                </button>
                <button
                  onClick={() =>
                    setInactivePage((p) => Math.min(totalInactivePages, p + 1))
                  }
                  disabled={inactivePage === totalInactivePages}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 border border-white/10 font-medium transition-all"
                >
                  Sig →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 👈 MODAL PARA REVIEW - INCLUYE INDIVIDUALES E INACTIVOS */}
      {selectedIndividual && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[99999] overflow-y-auto p-4 sm:p-6">
          <div className="max-w-4xl mx-auto my-6 sm:my-10">
            <div className="relative">
              {/* Luces cibernéticas traseras */}
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/30 via-cyan-500/30 to-blue-600/30 rounded-[2.5rem] blur-3xl opacity-70"></div>

              <div className="relative bg-gradient-to-br from-[#0c1322] via-[#0f1b33] to-[#070d1a] border border-blue-500/40 rounded-[2rem] p-6 sm:p-8 backdrop-blur-2xl shadow-[0_0_60px_rgba(59,130,246,0.2)] overflow-hidden">
                {/* Header del modal */}
                <div className="flex justify-between items-start gap-4 mb-8 relative z-10 border-b border-blue-500/20 pb-5">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-3xl sm:text-4xl">📌</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                            {selectedIndividual.album}
                          </h2>
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full border shadow-md ${
                              selectedIndividual.status === 'INACTIVO'
                                ? 'text-gray-400 bg-gray-500/20 border-gray-500/30'
                                : 'text-cyan-300 bg-cyan-500/20 border-cyan-400/30 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                            }`}
                          >
                            {selectedIndividual.status === 'INACTIVO'
                              ? 'Inactivo'
                              : 'Álbum Individual'}
                          </span>
                        </div>
                        <p className="text-blue-200/70 text-base sm:text-lg font-medium mt-1">
                          {selectedIndividual.artista}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedIndividual(null)}
                    className="text-white/40 hover:text-white bg-white/5 hover:bg-white/10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 text-lg hover:scale-110 border border-white/10"
                    title="Cerrar"
                  >
                    ✕
                  </button>
                </div>

                {/* Info del álbum */}
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8 relative z-10">
                  <div className="flex-shrink-0 mx-auto md:mx-0">
                    <div className="relative group">
                      <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-3xl blur-2xl opacity-60 group-hover:opacity-90 transition-opacity duration-500"></div>
                      <img
                        src={selectedIndividual.imagen}
                        alt={selectedIndividual.album}
                        className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-60 md:h-64 object-cover rounded-2xl shadow-2xl border-2 border-blue-400/30 group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src =
                            'https://via.placeholder.com/400/1a1a2e/ffffff?text=🎵';
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-black/40 rounded-2xl p-3.5 border border-blue-500/20 backdrop-blur-md">
                        <p className="text-blue-300/50 text-[10px] uppercase tracking-wider font-semibold">
                          Colección
                        </p>
                        <p className="font-semibold text-sm text-cyan-300 flex items-center gap-2 mt-0.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                          Álbum Individual
                        </p>
                      </div>
                      <div className="bg-black/40 rounded-2xl p-3.5 border border-blue-500/20 backdrop-blur-md">
                        <p className="text-blue-300/50 text-[10px] uppercase tracking-wider font-semibold">
                          Agregado por
                        </p>
                        <p className="text-white font-medium text-sm truncate mt-0.5">
                          {selectedIndividual.added_by || 'Usuario de Musiclub'}
                        </p>
                      </div>
                    </div>

                    {/* Botones de Streaming de Marcas Oficiales */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedIndividual.spotifyLink && (
                        <a
                          href={selectedIndividual.spotifyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs text-black font-bold bg-[#1DB954] hover:bg-[#1ed760] px-4 py-2 rounded-xl transition-all duration-300 shadow-lg shadow-[#1DB954]/20 hover:scale-105"
                        >
                          <span className="text-sm">🎵</span>
                          Escuchar en Spotify
                        </a>
                      )}
                      {selectedIndividual.youtubeLink && (
                        <a
                          href={selectedIndividual.youtubeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs text-white font-bold bg-[#FF0000] hover:bg-[#cc0000] px-4 py-2 rounded-xl transition-all duration-300 shadow-lg shadow-[#FF0000]/20 hover:scale-105"
                        >
                          <span className="text-sm">▶️</span>
                          YouTube
                        </a>
                      )}
                    </div>

                    {/* Vista previa de Pistas */}
                    {selectedIndividual.spotify_verified &&
                      selectedIndividual.tracks &&
                      selectedIndividual.tracks.length > 0 && (
                        <div className="bg-black/40 rounded-2xl p-3.5 border border-blue-500/20">
                          <p className="text-cyan-300/80 text-xs flex items-center gap-2 font-medium">
                            <span>🎵</span>
                            <span>
                              {selectedIndividual.tracks.length} canciones en
                              este álbum
                            </span>
                          </p>
                          <div className="mt-2.5 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                            {selectedIndividual.tracks.map((track, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] text-blue-200/80 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 font-mono"
                              >
                                #{idx + 1} {track.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* Separador */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-blue-500/20"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-[#0c1322] px-4 text-blue-400/40 text-xs font-mono">
                      ✦ REVIEWS ✦
                    </span>
                  </div>
                </div>

                {/* SISTEMA DE REVIEWS PARA INDIVIDUAL */}
                <div className="bg-black/40 rounded-2xl p-4 sm:p-6 border border-blue-500/20 shadow-inner relative z-10">
                  <ReviewSystem
                    album={selectedIndividual}
                    isFromSpotify={true}
                    isIndividual={selectedIndividual.status === 'INDIVIDUAL'}
                    tracks={selectedIndividual.tracks || []}
                    user={user}
                    showTrackReviews={true}
                    onToggleTrackReviews={() =>
                      setShowTrackReviews(!showTrackReviews)
                    }
                    onReviewSubmitted={() => {
                      if (onAlbumUpdated) onAlbumUpdated();
                    }}
                  />
                </div>

                <div className="mt-6 text-center">
                  <p className="text-blue-300/30 text-xs tracking-wider font-mono">
                    🎧 Las reviews individuales forman parte de tu colección
                    personal
                  </p>
                </div>
              </div>
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
