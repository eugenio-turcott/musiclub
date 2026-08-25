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
  const [showTrackReviews, setShowTrackReviews] = useState(false); // 👈 NUEVO ESTADO LOCAL

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
      const result = await searchAlbum(searchQuery);
      if (result.success) {
        setSearchResults(result.albums);
      } else {
        setError(result.error || 'Error al buscar');
      }
    } catch (error) {
      setError('Error de conexión. Intenta de nuevo.');
    }
    setLoading(false);
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
      const artistName = album.artists[0];
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

      const details = await getAlbumDetails(album.id);
      if (details.success) {
        setAlbumDetails(details.album);
        setSearchResults([]);
      } else {
        setError(details.error || 'Error al obtener detalles');
      }
    } catch (error) {
      setError('Error al obtener detalles del álbum');
    }
    setLoading(false);
  };

  const handleCreateAlbum = async () => {
    if (!albumDetails) return;

    setCreating(true);
    setError(null);

    try {
      const tracks = (albumDetails.tracks || []).map((track) => ({
        id: track.id,
        name: track.name,
        duration_ms: track.duration_ms,
        track_number: track.track_number,
      }));

      const albumData = {
        albumName: albumDetails.name,
        artistName: albumDetails.artists[0],
        imageUrl: albumDetails.image,
        spotifyLink: albumDetails.external_urls?.spotify || null,
        addedBy: user?.name || 'Sistema',
        addedByEmail: user?.email || 'sistema@maquinamusical.com',
        status: 'INDIVIDUAL',
        tracks: tracks,
        releaseDate: albumDetails.releaseDate || null,
        reviews_enabled: true, // 👈 POR DEFECTO TRUE PARA INDIVIDUALES
      };

      const newAlbum = await supabaseService.createAlbum(albumData);

      setSavedAlbum({
        id: newAlbum.id,
        album: newAlbum.album_name,
        artista: newAlbum.artist_name,
        imagen: newAlbum.image_url,
        spotifyLink: newAlbum.spotify_link,
        tracks: tracks,
        status: 'INDIVIDUAL',
        spotify_verified: true,
        reviews_enabled: true, // 👈 AGREGAR
      });

      setAlbumDetails(null);
      setSearchResults([]);
      setSearchQuery('');
      if (onAlbumCreated) onAlbumCreated();

      // 👈 AUTOMÁTICAMENTE MOSTRAR LAS CANCIONES
      setShowTrackReviews(true);
    } catch (error) {
      setError(error.message || 'Error al crear el álbum');
    }
    setCreating(false);
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
                Búscalo directamente en Spotify y agrégalo como álbum individual
                al club.
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
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#f5576c] to-[#f093fb] flex items-center justify-center text-sm shadow-md flex-shrink-0">
              🔍
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-black text-sm sm:text-base truncate">
                Proponer Álbum en Spotify
              </h3>
              <p className="text-white/40 text-xs truncate">
                Busca en el catálogo de Spotify para agregar tu álbum
                individual.
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
              ? 'Buscando...'
              : 'Verificando en el pool...'}
          </div>
        )}

        {/* Resultados de búsqueda */}
        {searchResults.length > 0 && !albumDetails && !existingAlbum && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {searchResults.map((album) => (
              <div
                key={album.id}
                onClick={() => handleSelectAlbum(album)}
                className="bg-white/5 rounded-xl p-3 border border-white/5 hover:bg-white/10 hover:border-[#f5576c]/30 transition-all cursor-pointer group"
              >
                <img
                  src={album.image}
                  alt={album.name}
                  className="w-full aspect-square object-cover rounded-lg mb-2 group-hover:scale-105 transition-transform duration-300"
                />
                <p className="text-white/80 text-sm truncate font-medium">
                  {album.name}
                </p>
                <p className="text-white/30 text-xs truncate">
                  {album.artists.join(', ')}
                </p>
              </div>
            ))}
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
          <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-4 border border-white/10">
            <div className="flex flex-col sm:flex-row gap-4">
              <img
                src={albumDetails.image}
                alt={albumDetails.name}
                className="w-full sm:w-48 aspect-square object-cover rounded-xl shadow-xl"
              />
              <div className="flex-1">
                <h4 className="text-white text-xl font-bold">
                  {albumDetails.name}
                </h4>
                <p className="text-white/50 text-sm">
                  {albumDetails.artists.join(', ')}
                </p>
                <p className="text-white/30 text-xs mt-1">
                  {albumDetails.totalTracks} canciones ·{' '}
                  {albumDetails.releaseDate}
                </p>

                <div className="mt-3 max-h-32 overflow-y-auto custom-scrollbar">
                  <p className="text-white/40 text-xs mb-1 flex items-center gap-2">
                    <span>🎵</span> Canciones:
                  </p>
                  <ul className="text-white/20 text-xs space-y-0.5">
                    {albumDetails.tracks.map((track) => (
                      <li key={track.id} className="flex items-center gap-2">
                        <span className="text-white/10">
                          {track.track_number}.
                        </span>
                        <span className="text-white/30">{track.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={handleCreateAlbum}
                    disabled={creating}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white rounded-xl text-sm font-bold hover:scale-[1.02] transition-all disabled:opacity-50 shadow-lg shadow-[#f5576c]/20"
                  >
                    {creating ? '🔄 Creando...' : '✅ Agregar como Individual'}
                  </button>

                  <button
                    onClick={() => {
                      setAlbumDetails(null);
                      setSearchResults([]);
                    }}
                    className="px-4 py-2.5 bg-white/5 border border-white/10 text-white/40 rounded-xl text-sm hover:bg-white/10 transition-all"
                  >
                    ✕ Cancelar
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
                {savedAlbum.spotifyLink && (
                  <a
                    href={savedAlbum.spotifyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/30 hover:text-white/60 text-xs flex items-center gap-1 mt-1 transition-colors"
                  >
                    🎵 Escuchar en Spotify
                  </a>
                )}
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
                y no participa en la máquina musical. Puedes dejar tu review
                aquí.
                {savedAlbum.tracks && savedAlbum.tracks.length > 0 && (
                  <span className="text-white/30">
                    · {savedAlbum.tracks.length} canciones disponibles para
                    review
                  </span>
                )}
              </p>
            </div>

            {/* 👈 REVIEW SYSTEM CON showTrackReviews SIEMPRE TRUE PARA INDIVIDUALES */}
            <div className="mt-4">
              <ReviewSystem
                album={savedAlbum}
                isFromSpotify={true}
                isIndividual={true}
                tracks={savedAlbum.tracks || []}
                user={user}
                showTrackReviews={true} // 👈 SIEMPRE TRUE PARA INDIVIDUALES
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
