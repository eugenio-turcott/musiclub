// src/components/AlbumSearch.jsx
import React, { useState } from 'react';
import { searchAlbum, getAlbumDetails } from '../services/spotifyApi';
import { supabaseService } from '../services/supabaseClient';
import { ReviewSystem } from './ReviewSystem';

export function AlbumSearch({ onAlbumCreated, user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [albumDetails, setAlbumDetails] = useState(null);
  const [creating, setCreating] = useState(false);
  const [savedAlbum, setSavedAlbum] = useState(null);
  const [existingAlbum, setExistingAlbum] = useState(null);
  const [showTrackReviews, setShowTrackReviews] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  if (!user) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setSearchResults([]);
    setAlbumDetails(null);
    setSavedAlbum(null);
    setExistingAlbum(null);

    try {
      const res = await searchAlbum(searchQuery);
      if (res?.success && Array.isArray(res.albums) && res.albums.length > 0) {
        setSearchResults(res.albums);
      } else {
        setError('No se encontraron álbumes en Spotify para esta búsqueda.');
      }
    } catch (err) {
      setError('Error de conexión con Spotify. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setAlbumDetails(null);
    setExistingAlbum(null);
    setSavedAlbum(null);
    setError(null);
  };

  const handleSelectAlbum = async (album) => {
    setLoading(true);
    setError(null);
    setExistingAlbum(null);

    try {
      const artistName = Array.isArray(album.artists)
        ? album.artists.join(', ')
        : album.artists?.[0] || album.artist || 'Artista';
      const existing = await supabaseService.findAlbum(album.name, artistName);

      if (existing) {
        setExistingAlbum({
          id: existing.id,
          album: existing.album_name,
          artista: existing.artist_name,
          imagen: existing.image_url,
          status: existing.status,
          spotifyLink: existing.spotify_link,
        });
        setAlbumDetails(null);
        setSearchResults([]);
        setLoading(false);
        return;
      }

      const detailsRes = await getAlbumDetails(album.id);
      if (detailsRes?.success && detailsRes.album) {
        setAlbumDetails(detailsRes.album);
        setSearchResults([]);
      } else {
        setAlbumDetails(album);
        setSearchResults([]);
      }
    } catch (err) {
      setError('Error al obtener los detalles del álbum desde Spotify.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlbum = async () => {
    if (!albumDetails) return;

    setCreating(true);
    setError(null);

    try {
      const tracks = (albumDetails.tracks || []).map((track, idx) => ({
        id: track.id || `track-${idx + 1}`,
        name: track.name,
        duration_ms: track.duration_ms || 0,
        track_number: track.track_number || idx + 1,
      }));

      const finalType =
        selectedType ||
        albumDetails.release_type ||
        albumDetails.releaseType ||
        'ALBUM';

      const artistName = Array.isArray(albumDetails.artists)
        ? albumDetails.artists.join(', ')
        : albumDetails.artist || 'Artista';

      const albumData = {
        albumName: albumDetails.name,
        artistName: artistName,
        imageUrl: albumDetails.image,
        spotifyLink:
          albumDetails.external_urls?.spotify ||
          `https://open.spotify.com/album/${albumDetails.id}`,
        youtubeLink: null,
        appleMusicLink: null,
        label: albumDetails.label || null,
        country: null,
        barcode: null,
        totalTracks: albumDetails.totalTracks || tracks.length || null,
        tracks: tracks,
        releaseDate: albumDetails.releaseDate || null,
        releaseYear: albumDetails.releaseYear || null,
        releaseType: finalType,
        genres: albumDetails.genres || [],
        reviews_enabled: true,
      };

      const newAlbum = await supabaseService.createAlbum(albumData);

      setSavedAlbum({
        id: newAlbum.id,
        album: newAlbum.album_name,
        artista: newAlbum.artist_name,
        imagen: newAlbum.image_url,
        spotifyLink: newAlbum.spotify_link,
        youtubeLink: newAlbum.youtube_link,
        appleMusicLink: newAlbum.apple_music_link,
        tracks: tracks,
        release_type: finalType,
        release_year: albumDetails.releaseYear,
        reviews_enabled: true,
      });

      setAlbumDetails(null);
      setSelectedType(null);
      setSearchResults([]);
      setSearchQuery('');
      if (onAlbumCreated) onAlbumCreated();

      setShowTrackReviews(true);
    } catch (err) {
      setError(err.message || 'Error al crear el álbum');
    } finally {
      setCreating(false);
    }
  };

  // Si no está expandido, mostramos el botón estético "Proponer Álbum"
  if (!isOpen) {
    return (
      <div className="mt-8 pt-6 border-t border-white/5">
        <div className="bg-gradient-to-r from-[#17192f]/95 via-[#1e1b38]/95 to-[#121426]/95 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 sm:gap-4 shadow-xl hover:border-pink-500/30 transition-all">
          <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#f5576c] to-[#f093fb] flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-[#f5576c]/30 flex-shrink-0 mt-0.5 sm:mt-0">
              💿
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-white font-black text-sm sm:text-base leading-tight">
                  ¿Tienes un álbum en mente?
                </h4>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 whitespace-nowrap">
                  +50 XP
                </span>
              </div>
              <p className="text-white/60 text-xs mt-1 leading-relaxed">
                Búscalo en Spotify y agrégalo para reseñar en el club.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="w-full md:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#f5576c] via-[#f093fb] to-pink-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl sm:rounded-2xl shadow-lg shadow-[#f5576c]/25 hover:shadow-[#f5576c]/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 flex-shrink-0"
          >
            <span className="text-base">➕</span>
            <span>Proponer Álbum</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 pt-6 border-t border-white/5 animate-fadeIn">
      <div className="bg-[#121428] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/15 shadow-2xl space-y-4">
        {/* Cabecera cuando está expandido */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1DB954] to-[#1ed760] flex items-center justify-center text-sm shadow-md flex-shrink-0">
              🎵
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-black text-sm sm:text-base truncate">
                Proponer Álbum desde Spotify
              </h3>
              <p className="text-white/40 text-xs truncate">
                Busca en el catálogo oficial de Spotify.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0"
          >
            <span>✕</span>
            <span className="hidden sm:inline">Cerrar</span>
          </button>
        </div>

        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar álbum por nombre o artista en Spotify..."
            className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#f5576c] transition-colors"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white rounded-2xl text-sm font-bold hover:scale-[1.02] transition-all disabled:opacity-50 whitespace-nowrap shadow-lg shadow-[#f5576c]/20"
          >
            {loading ? '🔍 Buscando...' : '🔍 Buscar'}
          </button>
        </form>

        {error && (
          <div className="text-[#f5576c] text-xs mb-3 bg-[#f5576c]/10 px-3 py-2 rounded-lg border border-[#f5576c]/10">
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div className="text-white/20 text-sm py-4 text-center">
            <span className="w-2 h-2 bg-[#f5576c] rounded-full animate-pulse inline-block mr-2"></span>
            {searchResults.length === 0
              ? 'Consultando catálogo oficial de Spotify...'
              : 'Verificando en el club...'}
          </div>
        )}

        {/* Resultados de búsqueda */}
        {searchResults.length > 0 && !albumDetails && !existingAlbum && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {searchResults.map((album) => {
              const relType = album.release_type || album.releaseType || 'ALBUM';
              const typeBadge =
                relType === 'EP'
                  ? { label: 'EP', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' }
                  : relType === 'SENCILLO'
                  ? { label: 'Sencillo', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' }
                  : relType === 'COMPILACION'
                  ? { label: 'Compilación', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' }
                  : { label: 'Álbum', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };

              const artistDisplay = Array.isArray(album.artists)
                ? album.artists.join(', ')
                : album.artists?.[0] || album.artist || '';

              return (
                <div
                  key={album.id}
                  onClick={() => handleSelectAlbum(album)}
                  className="bg-white/5 rounded-xl p-3 border border-white/5 hover:bg-white/10 hover:border-[#f5576c]/30 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="relative w-full aspect-square rounded-lg mb-2 overflow-hidden bg-black/40">
                    <img
                      src={album.image || 'https://via.placeholder.com/200/1a1a2e/ffffff?text=🎵'}
                      alt={album.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/200/1a1a2e/ffffff?text=🎵';
                      }}
                    />
                    <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 items-end">
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md border backdrop-blur-md shadow-sm ${typeBadge.color}`}>
                        {typeBadge.label}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-white/90 text-sm truncate font-semibold">
                      {album.name}
                    </p>
                    <p className="text-white/40 text-xs truncate mt-0.5">
                      {artistDisplay}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-white/30 mt-1">
                      <span>{album.releaseYear || ''}</span>
                      <span>🟢 Spotify</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Álbum ya existe */}
        {existingAlbum && (
          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl p-4 border border-yellow-500/30">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-shrink-0">
                <img
                  src={existingAlbum.imagen}
                  alt={existingAlbum.album}
                  className="w-24 h-24 object-cover rounded-xl shadow-lg border-2 border-yellow-500/30"
                />
                <div className="absolute -top-2 -right-2 text-xl">⚠️</div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h4 className="text-white text-lg font-bold flex items-center gap-2 justify-center sm:justify-start">
                  {existingAlbum.album}
                  <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
                    Ya existe
                  </span>
                </h4>
                <p className="text-white/50 text-sm">{existingAlbum.artista}</p>
                <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      existingAlbum.status === 'ACTIVO'
                        ? 'text-green-400 bg-green-400/10 border-green-400/20'
                        : existingAlbum.status === 'GANADOR'
                          ? 'text-[#f5576c] bg-[#f5576c]/10 border-[#f5576c]/20'
                          : existingAlbum.status === 'INDIVIDUAL'
                            ? 'text-blue-400 bg-blue-400/10 border-blue-400/20'
                            : 'text-gray-400 bg-gray-400/10 border-gray-400/20'
                    }`}
                  >
                    {existingAlbum.status || 'ACTIVO'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setExistingAlbum(null);
                  setSearchResults([]);
                  setSearchQuery('');
                }}
                className="text-white/30 hover:text-white/60 text-sm transition-colors flex-shrink-0"
              >
                ✕ Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Detalles del álbum seleccionado */}
        {albumDetails && !savedAlbum && (
          <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-4 sm:p-5 border border-white/10">
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="relative w-full sm:w-48 aspect-square flex-shrink-0">
                <img
                  src={albumDetails.image || 'https://via.placeholder.com/300/1a1a2e/ffffff?text=🎵'}
                  alt={albumDetails.name}
                  className="w-full h-full object-cover rounded-2xl shadow-xl border border-white/10"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#1DB954]/20 text-[#1ed760] border border-[#1DB954]/30">
                    🟢 Spotify
                  </span>
                  {albumDetails.releaseYear && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10">
                      📅 {albumDetails.releaseYear}
                    </span>
                  )}
                </div>

                <h4 className="text-white text-xl font-black leading-tight">
                  {albumDetails.name}
                </h4>
                <p className="text-white/60 text-sm font-semibold mt-0.5">
                  {Array.isArray(albumDetails.artists)
                    ? albumDetails.artists.join(', ')
                    : albumDetails.artist || ''}
                </p>

                {/* Selector de Tipo de Lanzamiento (Álbum / EP / Sencillo) */}
                <div className="mt-3 p-3 bg-black/40 rounded-xl border border-white/10 space-y-2">
                  <label className="text-[11px] font-bold text-white/70 block uppercase tracking-wider">
                    Tipo de Lanzamiento:
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { id: 'ALBUM', label: '✨ Álbum', desc: 'LP / Disco completo' },
                      { id: 'EP', label: '💿 EP', desc: 'Extended Play' },
                      { id: 'SENCILLO', label: '🎵 Sencillo', desc: 'Single / Canción' },
                      { id: 'COMPILACION', label: '📦 Compilación', desc: 'Grandes Éxitos / Varios' },
                    ].map((t) => {
                      const isCurrent = (selectedType || albumDetails.releaseType) === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedType(t.id)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                            isCurrent
                              ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white border-transparent shadow-md scale-105'
                              : 'bg-white/5 hover:bg-white/10 text-white/60 border-white/10'
                          }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Géneros */}
                {albumDetails.genres && albumDetails.genres.length > 0 && (
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                      Géneros:
                    </span>
                    {albumDetails.genres.slice(0, 4).map((g) => (
                      <span
                        key={g}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-cyan-300/80 capitalize"
                      >
                        #{g}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-white/40 text-xs mt-2">
                  {albumDetails.tracks?.length || albumDetails.totalTracks || 0} canciones · {albumDetails.releaseDate || ''}
                </p>

                {albumDetails.tracks && albumDetails.tracks.length > 0 && (
                  <div className="mt-3 max-h-32 overflow-y-auto custom-scrollbar bg-black/20 p-2.5 rounded-xl border border-white/5">
                    <p className="text-white/50 text-xs mb-1 font-semibold flex items-center gap-1.5">
                      <span>🎵</span> Lista de Canciones:
                    </p>
                    <ul className="text-white/30 text-xs space-y-1">
                      {albumDetails.tracks.map((track, idx) => (
                        <li key={track.id || idx} className="flex items-center gap-2">
                          <span className="text-white/20 font-mono text-[11px] w-5">
                            {track.track_number || idx + 1}.
                          </span>
                          <span className="text-white/60 truncate">{track.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2.5">
                  <button
                    onClick={handleCreateAlbum}
                    disabled={creating}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white rounded-xl text-sm font-bold hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-[#f5576c]/20 flex items-center gap-2"
                  >
                    <span>{creating ? '🔄 Guardando...' : '✅ Confirmar y Proponer'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setAlbumDetails(null);
                      setSelectedType(null);
                      setSearchResults([]);
                    }}
                    className="px-4 py-2.5 bg-white/5 border border-white/10 text-white/50 rounded-xl text-sm hover:bg-white/10 hover:text-white transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Álbum creado exitosamente */}
        {savedAlbum && (
          <div className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-2xl p-4 border border-blue-500/20">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <img
                src={savedAlbum.imagen}
                alt={savedAlbum.album}
                className="w-24 h-24 object-cover rounded-xl shadow-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-white text-lg font-bold flex items-center gap-2">
                  ✅ {savedAlbum.album}
                  <span className="text-[10px] text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full border border-blue-400/20">
                    Individual
                  </span>
                </h4>
                <p className="text-white/50 text-sm">{savedAlbum.artista}</p>
              </div>
              <button
                onClick={() => {
                  setSavedAlbum(null);
                  setSearchResults([]);
                  if (onAlbumCreated) onAlbumCreated();
                }}
                className="text-white/30 hover:text-white/60 text-sm transition-colors flex-shrink-0"
              >
                ✕ Cerrar
              </button>
            </div>

            <div className="mt-3 bg-blue-500/5 border border-blue-500/10 rounded-xl p-3">
              <p className="text-white/40 text-xs flex items-center gap-2">
                <span className="text-blue-400">📌</span>
                Este álbum es <span className="text-white/60">
                  Individual
                </span>{' '}
                y está listo en el catálogo universal. Puedes dejar tu review aquí.
                {savedAlbum.tracks && savedAlbum.tracks.length > 0 && (
                  <span className="text-white/30">
                    · {savedAlbum.tracks.length} canciones disponibles para review
                  </span>
                )}
              </p>
            </div>

            {/* REVIEW SYSTEM */}
            <div className="mt-4">
              <ReviewSystem
                album={savedAlbum}
                isFromSpotify={false}
                isIndividual={true}
                tracks={savedAlbum.tracks || []}
                user={user}
                showTrackReviews={true}
                onToggleTrackReviews={() =>
                  setShowTrackReviews(!showTrackReviews)
                }
                onReviewSubmitted={() => {}}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
