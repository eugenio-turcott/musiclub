// src/components/AlbumSearch.jsx
import React, { useState } from "react";
import { searchAlbum, getAlbumDetails } from "../services/spotifyApi";
import { supabaseService } from "../services/supabaseClient";

export function AlbumSearch({ onAlbumCreated }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [albumDetails, setAlbumDetails] = useState(null);
  const [creating, setCreating] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      const result = await searchAlbum(searchQuery);
      if (result.success) {
        setSearchResults(result.albums);
      } else {
        setError(result.error || "Error al buscar");
      }
    } catch (error) {
      setError("Error de conexión. Intenta de nuevo.");
    }
    setLoading(false);
  };

  const handleSelectAlbum = async (album) => {
    setLoading(true);
    setError(null);

    try {
      const details = await getAlbumDetails(album.id);
      if (details.success) {
        setAlbumDetails(details.album);
        setSearchResults([]);
      } else {
        setError(details.error || "Error al obtener detalles");
      }
    } catch (error) {
      setError("Error al obtener detalles del álbum");
    }
    setLoading(false);
  };

  const handleCreateAlbum = async () => {
    if (!albumDetails) return;

    setCreating(true);
    setError(null);

    try {
      const albumData = {
        albumName: albumDetails.name,
        artistName: albumDetails.artists[0],
        imageUrl: albumDetails.image,
        spotifyLink: albumDetails.external_urls?.spotify || null,
        addedBy: "Sistema",
        addedByEmail: "sistema@maquinamusical.com",
      };

      await supabaseService.createAlbum(albumData);

      setAlbumDetails(null);
      setSearchResults([]);
      setSearchQuery("");
      if (onAlbumCreated) onAlbumCreated();
      alert("✅ ¡Álbum creado exitosamente! Ahora aparece en el pool.");
    } catch (error) {
      setError(error.message || "Error al crear el álbum");
    }
    setCreating(false);
  };

  return (
    <div className="mt-8 pt-6 border-t border-white/5">
      <h3 className="text-white/60 text-xs tracking-[0.2em] uppercase mb-4">
        🔍 Buscar Álbum en Spotify
      </h3>

      <form
        onSubmit={handleSearch}
        className="flex flex-col sm:flex-row gap-2 mb-4"
      >
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar álbum por nombre o artista..."
          className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#f5576c]/50"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white rounded-xl text-sm font-bold hover:scale-[1.02] transition-all disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? "🔍 Buscando..." : "🔍 Buscar"}
        </button>
      </form>

      {error && (
        <div className="text-[#f5576c] text-xs mb-3 bg-[#f5576c]/10 px-3 py-2 rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div className="text-white/20 text-sm py-4 text-center">
          <span className="w-2 h-2 bg-[#f5576c] rounded-full animate-pulse inline-block mr-2"></span>
          {searchResults.length === 0 ? "Buscando..." : "Cargando detalles..."}
        </div>
      )}

      {/* Resultados de búsqueda */}
      {searchResults.length > 0 && !albumDetails && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {searchResults.map((album) => (
            <div
              key={album.id}
              onClick={() => handleSelectAlbum(album)}
              className="bg-white/5 rounded-xl p-3 border border-white/5 hover:bg-white/10 hover:border-[#f5576c]/30 transition-all cursor-pointer"
            >
              <img
                src={album.image}
                alt={album.name}
                className="w-full aspect-square object-cover rounded-lg mb-2"
              />
              <p className="text-white/80 text-sm truncate">{album.name}</p>
              <p className="text-white/30 text-xs truncate">
                {album.artists.join(", ")}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Detalles del álbum seleccionado */}
      {albumDetails && (
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <div className="flex flex-col sm:flex-row gap-4">
            <img
              src={albumDetails.image}
              alt={albumDetails.name}
              className="w-full sm:w-48 aspect-square object-cover rounded-xl"
            />
            <div className="flex-1">
              <h4 className="text-white text-xl font-bold">
                {albumDetails.name}
              </h4>
              <p className="text-white/50 text-sm">
                {albumDetails.artists.join(", ")}
              </p>
              <p className="text-white/30 text-xs mt-1">
                {albumDetails.totalTracks} canciones ·{" "}
                {albumDetails.releaseDate}
              </p>

              <div className="mt-3 max-h-32 overflow-y-auto">
                <p className="text-white/40 text-xs mb-1">Canciones:</p>
                <ul className="text-white/20 text-xs space-y-0.5">
                  {albumDetails.tracks.map((track) => (
                    <li key={track.id}>
                      {track.track_number}. {track.name}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={handleCreateAlbum}
                  disabled={creating}
                  className="px-6 py-2 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white rounded-xl text-sm font-bold hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  {creating ? "🔄 Creando..." : "✅ Crear Álbum en el Pool"}
                </button>

                <button
                  onClick={() => {
                    setAlbumDetails(null);
                    setSearchResults([]);
                  }}
                  className="px-4 py-2 bg-white/5 border border-white/10 text-white/40 rounded-xl text-sm hover:bg-white/10 transition-all"
                >
                  ✕ Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
