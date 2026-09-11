import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { splitArtists, slugifyArtist } from '../../utils/ratingUtils';
import { supabaseService } from '../../services/supabaseClient';

const ALPHABET = [
  'TODOS',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  '#',
];

/**
 * Vista de Directorio de Artistas de Musiclub / Musiclub (V.8.5)
 * Desglosa individualmente a cada artista en colaboraciones y registra clics en la tabla artists.
 */
export function CatalogArtistsView({ albums = [] }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('TODOS');
  const [dbArtists, setDbArtists] = useState([]);
  const [loadingDb, setLoadingDb] = useState(true);

  // Cargar artistas registrados en Supabase
  useEffect(() => {
    let isMounted = true;
    async function fetchDbArtists() {
      try {
        const artists = await supabaseService.getAllArtists();
        if (isMounted && artists) {
          setDbArtists(artists);
        }
      } catch (err) {
        console.warn('No se pudieron consultar artistas de Supabase:', err);
      } finally {
        if (isMounted) setLoadingDb(false);
      }
    }
    fetchDbArtists();
    return () => {
      isMounted = false;
    };
  }, []);

  // Construir catálogo unificado de artistas desglosando multi-artistas
  const artistsList = useMemo(() => {
    const artistMap = new Map();

    // 1. Integrar artistas desde la base de datos de Supabase
    dbArtists.forEach((da) => {
      if (!da || !da.name) return;
      const slug = da.slug || slugifyArtist(da.name);
      artistMap.set(slug, {
        name: da.name,
        slug,
        image_url: da.image_url || null,
        genres: da.genres || [],
        click_count: da.click_count || 0,
        clubReleases: [],
        followers: da.followers || null,
      });
    });

    // 2. Extraer artistas de todos los álbumes del club aplicando splitArtists
    albums.forEach((album) => {
      const rawArtist = album.artist_name || album.artista || '';
      if (!rawArtist) return;

      const individualArtists = splitArtists(rawArtist);
      individualArtists.forEach((art) => {
        const slug = slugifyArtist(art.name);
        if (!artistMap.has(slug)) {
          artistMap.set(slug, {
            name: art.name,
            slug,
            image_url: null,
            genres: album.genres || [],
            click_count: 0,
            clubReleases: [],
            followers: null,
          });
        }

        const entry = artistMap.get(slug);
        // Si no tiene imagen y el álbum sí, usarla provisionalmente
        if (!entry.image_url && album.image_url) {
          entry.image_url = album.image_url;
        }
        if (album.genres && album.genres.length > 0) {
          entry.genres = Array.from(new Set([...entry.genres, ...album.genres]));
        }
        if (!entry.clubReleases.some((r) => r.id === album.id)) {
          entry.clubReleases.push(album);
        }
      });
    });

    return Array.from(artistMap.values()).sort((a, b) => {
      // Ordenar primero por cantidad de lanzamientos en club, luego por clics, luego alfabéticamente
      if (b.clubReleases.length !== a.clubReleases.length) {
        return b.clubReleases.length - a.clubReleases.length;
      }
      if (b.click_count !== a.click_count) {
        return b.click_count - a.click_count;
      }
      return a.name.localeCompare(b.name);
    });
  }, [albums, dbArtists]);

  // Filtrado por buscador y letra
  const filteredArtists = useMemo(() => {
    return artistsList.filter((art) => {
      // Filtro de texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = art.name.toLowerCase().includes(q);
        const matchesGenre = art.genres.some((g) =>
          String(g).toLowerCase().includes(q)
        );
        if (!matchesName && !matchesGenre) return false;
      }

      // Filtro de letra inicial
      if (selectedLetter !== 'TODOS') {
        const firstChar = art.name.trim().charAt(0).toUpperCase();
        if (selectedLetter === '#') {
          if (/^[A-ZÁÉÍÓÚÑ]/.test(firstChar)) return false;
        } else {
          if (firstChar !== selectedLetter) return false;
        }
      }

      return true;
    });
  }, [artistsList, searchQuery, selectedLetter]);

  const handleArtistClick = (artist) => {
    // Registrar clic en base de datos para estadísticas y sincronización de popularidad
    supabaseService.recordArtistClick(artist.name);
    navigate(`/artista/${artist.slug}`);
  };

  return (
    <div className="space-y-6 my-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-indigo-500/10 border border-cyan-500/20 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-black uppercase tracking-wider">
            <span>🎤</span>
            <span>Directorio de Artistas</span>
            <span className="text-white/40">•</span>
            <span className="text-cyan-200">{artistsList.length} Artistas Registrados</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
            Explora Artistas y Colaboradores
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Cada artista cuenta con su perfil discográfico independiente. En lanzamientos colaborativos,
            cada integrante posee su propia página y estadísticas oficiales en el Club.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-4 py-2.5 rounded-2xl text-cyan-300">
          <span className="text-lg">✨</span>
          <span className="text-xs font-bold">Desambiguación Precisa</span>
        </div>
      </div>

      {/* Search & Letter Filter */}
      <div className="bg-[#12141F]/90 border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Buscar artista por nombre o género..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/70 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* A-Z Bar */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs font-bold scrollbar-thin">
          {ALPHABET.map((letter) => {
            const isSelected = selectedLetter === letter;
            return (
              <button
                key={letter}
                type="button"
                onClick={() => setSelectedLetter(letter)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap border ${
                  isSelected
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/25 scale-105'
                    : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/5'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Artists */}
      {filteredArtists.length === 0 ? (
        <div className="p-12 text-center bg-white/5 rounded-2xl border border-white/10 text-slate-400 text-sm">
          No se encontraron artistas con ese criterio de búsqueda.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4.5">
          {filteredArtists.map((artist) => {
            const releasesCount = artist.clubReleases.length;

            return (
              <div
                key={artist.slug}
                onClick={() => handleArtistClick(artist)}
                className="bg-[#11131E]/95 hover:bg-[#161928] border border-white/10 hover:border-cyan-400/50 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 cursor-pointer flex flex-col items-center text-center group select-none"
              >
                {/* Circular Avatar */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-gradient-to-tr from-cyan-600 to-purple-600 mb-3 shadow-lg border-2 border-white/10 group-hover:border-cyan-400 transition-all flex items-center justify-center">
                  {artist.image_url ? (
                    <img
                      src={artist.image_url}
                      alt={artist.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-2xl font-black text-white/80 uppercase">
                      {artist.name.substring(0, 2)}
                    </span>
                  )}
                </div>

                {/* Name */}
                <h3
                  translate="no"
                  className="notranslate font-bold text-white text-sm sm:text-base group-hover:text-cyan-300 transition-colors line-clamp-1 w-full"
                  title={artist.name}
                >
                  {artist.name}
                </h3>

                {/* Badges */}
                <div className="mt-1 flex items-center gap-1 text-[11px] text-cyan-400 font-semibold">
                  <span>💿</span>
                  <span>
                    {releasesCount > 0
                      ? `${releasesCount} en el Club`
                      : 'Ver discografía'}
                  </span>
                </div>

                {/* Genres */}
                {artist.genres && artist.genres.length > 0 && (
                  <div className="mt-2 flex items-center justify-center gap-1 flex-wrap w-full">
                    {artist.genres.slice(0, 2).map((g, i) => (
                      <span
                        key={i}
                        className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-slate-400 truncate max-w-[90px]"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
