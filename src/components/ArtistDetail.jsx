// src/components/ArtistDetail.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';
import { SEO } from './SEO';
import { useAuth } from '../hooks/useAuth';
import { supabaseService } from '../services/supabaseClient';
import {
  getArtistCompleteProfile,
  getAlbumDetails,
} from '../services/spotifyApi';
import { findAlbumsByArtist, getReleaseUrl } from '../utils/ratingUtils';

export function ArtistDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, loginWithGoogle, logout } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [clubAlbums, setClubAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'ALBUM' | 'EP' | 'SENCILLO' | 'COMPILACION'
  const [searchFilter, setSearchFilter] = useState('');
  const [proposingId, setProposingId] = useState(null);
  const [proposeMessage, setProposeMessage] = useState(null);

  // Cargar datos de Supabase y Spotify
  const loadArtistData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Obtener todos los álbumes de Musiclub para cruzar datos
      const allClubAlbums = await supabaseService.getAllAlbumsWithFullStats();
      const rawArtistName = slug ? slug.replace(/-/g, ' ') : '';
      const matchedClub = findAlbumsByArtist(
        allClubAlbums || [],
        rawArtistName || slug
      );
      setClubAlbums(matchedClub);

      // Usar el nombre exacto de la base de datos si existe, o el slug decodificado
      const targetQuery =
        matchedClub.length > 0
          ? matchedClub[0].artist_name || matchedClub[0].artista
          : decodeURIComponent(rawArtistName);

      // 2. Obtener perfil completo desde Spotify API
      const spotifyRes = await getArtistCompleteProfile(targetQuery);

      if (spotifyRes.success) {
        setProfileData(spotifyRes);

        // Si encontramos el nombre oficial del artista en Spotify, volvemos a filtrar los del club
        if (spotifyRes.artist?.name) {
          const refinedMatches = findAlbumsByArtist(
            allClubAlbums || [],
            spotifyRes.artist.name
          );
          setClubAlbums(refinedMatches);
        }
      } else {
        // Fallback si no está en Spotify pero sí en Musiclub
        if (matchedClub.length > 0) {
          const sample = matchedClub[0];
          setProfileData({
            success: true,
            artist: {
              id: null,
              name: sample.artist_name || sample.artista,
              image: sample.image_url || sample.imagen,
              genres: sample.genres || [],
              followers: null,
              popularity: null,
              spotifyUrl: sample.spotify_link || null,
            },
            topTracks: [],
            discography: matchedClub.map((ca) => ({
              id: ca.id,
              name: ca.album_name || ca.album,
              artists: [ca.artist_name || ca.artista],
              image: ca.image_url || ca.imagen,
              releaseYear: ca.release_year,
              releaseDate: ca.release_date,
              release_type: ca.release_type || 'ALBUM',
              totalTracks: ca.tracks?.length || 0,
              spotifyUrl: ca.spotify_link,
            })),
            albums: matchedClub.filter(
              (ca) => (ca.release_type || 'ALBUM') === 'ALBUM'
            ),
            eps: matchedClub.filter((ca) => ca.release_type === 'EP'),
            singles: matchedClub.filter((ca) => ca.release_type === 'SENCILLO'),
            compilations: matchedClub.filter(
              (ca) => ca.release_type === 'COMPILACION'
            ),
          });
        } else {
          setError(
            spotifyRes.error ||
              `No se encontró información del artista "${targetQuery}"`
          );
        }
      }
    } catch (err) {
      console.error('Error cargando página de artista:', err);
      setError('Error al cargar la información del artista');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadArtistData();
  }, [loadArtistData]);

  // Mapa de álbumes del club indexados por nombre normalizado
  const clubAlbumMap = useMemo(() => {
    const map = new Map();
    clubAlbums.forEach((ca) => {
      const normName = (ca.album_name || ca.album || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      if (normName) {
        map.set(normName, ca);
      }
    });
    return map;
  }, [clubAlbums]);

  // Estadísticas del artista en Musiclub
  const clubStats = useMemo(() => {
    if (!clubAlbums || clubAlbums.length === 0) {
      return { total: 0, ratedCount: 0, avgRating: null, totalReviews: 0 };
    }

    let totalScoreSum = 0;
    let ratedCount = 0;
    let totalReviews = 0;

    clubAlbums.forEach((a) => {
      const rCount =
        a.review_count || (Array.isArray(a.reviews) ? a.reviews.length : 0);
      totalReviews += rCount;
      if (a.final_rating && !isNaN(a.final_rating)) {
        totalScoreSum += Number(a.final_rating);
        ratedCount++;
      }
    });

    return {
      total: clubAlbums.length,
      ratedCount,
      avgRating:
        ratedCount > 0 ? (totalScoreSum / ratedCount).toFixed(2) : null,
      totalReviews,
    };
  }, [clubAlbums]);

  // Discografía filtrada según pestaña y buscador
  const filteredDiscography = useMemo(() => {
    if (!profileData) return [];

    let list = profileData.discography || [];

    if (activeTab === 'ALBUM') {
      list = profileData.albums || [];
    } else if (activeTab === 'EP') {
      list = profileData.eps || [];
    } else if (activeTab === 'SENCILLO') {
      list = profileData.singles || [];
    } else if (activeTab === 'COMPILACION') {
      list = profileData.compilations || [];
    }

    if (searchFilter.trim()) {
      const q = searchFilter.trim().toLowerCase();
      list = list.filter((item) => item.name.toLowerCase().includes(q));
    }

    return list;
  }, [profileData, activeTab, searchFilter]);

  // Acción rápida: Proponer álbum al club con 1 click
  const handleQuickPropose = async (release) => {
    if (proposingId) return;
    setProposingId(release.id);
    setProposeMessage(`Proponiendo "${release.name}" a Musiclub...`);

    try {
      // 1. Obtener detalles de canciones desde Spotify
      const details = await getAlbumDetails(release.id);
      const spotifyAlbum = details?.success ? details.album : release;

      const tracks = (spotifyAlbum.tracks || []).map((t) => ({
        id: t.id,
        name: t.name,
        duration_ms: t.duration_ms,
        track_number: t.track_number,
      }));

      const artistName =
        profileData?.artist?.name || release.artists?.[0] || 'Artista';

      const albumPayload = {
        albumName: spotifyAlbum.name,
        artistName: artistName,
        imageUrl: spotifyAlbum.image || release.image,
        spotifyLink: spotifyAlbum.external_urls?.spotify || release.spotifyUrl,
        addedBy: user?.name || user?.email?.split('@')[0] || 'Miembro Musiclub',
        addedByEmail: user?.email || '',
        status: 'INDIVIDUAL',
        tracks: tracks,
        releaseDate: spotifyAlbum.releaseDate || release.releaseDate || null,
        releaseYear: spotifyAlbum.releaseYear || release.releaseYear || null,
        releaseType: release.release_type || 'ALBUM',
        genres: profileData?.artist?.genres || [],
        reviews_enabled: true,
      };

      const created = await supabaseService.createAlbum(albumPayload);
      const targetUrl = getReleaseUrl(
        created?.album_name || spotifyAlbum.name,
        release.release_type || 'ALBUM'
      );

      setProposeMessage(
        `¡"${release.name}" agregado con éxito! Redirigiendo...`
      );
      setTimeout(() => {
        navigate(targetUrl);
      }, 700);
    } catch (err) {
      console.error('Error al proponer álbum:', err);
      setProposeMessage(
        `Error: ${err.message || 'No se pudo agregar el lanzamiento'}`
      );
      setTimeout(() => setProposeMessage(null), 3000);
    } finally {
      setProposingId(null);
    }
  };

  const artist = profileData?.artist;

  // Structured JSON-LD Schema for Artist
  const artistSchema = useMemo(() => {
    if (!artist) return null;
    const canonicalUrl = `https://musiclub.org/artista/${slug}`;
    return {
      '@context': 'https://schema.org',
      '@type': 'MusicGroup',
      '@id': `${canonicalUrl}#artist`,
      name: artist.name,
      url: canonicalUrl,
      image: artist.image,
      genre:
        artist.genres && artist.genres.length > 0 ? artist.genres : undefined,
      sameAs: artist.spotifyUrl ? [artist.spotifyUrl] : undefined,
      description: `Discografía completa, álbumes, EPs, sencillos y calificaciones de la comunidad para ${artist.name} en Musiclub.`,
    };
  }, [artist, slug]);

  return (
    <div className="min-h-screen cyber-grid p-3 sm:p-6 w-full max-w-full overflow-x-hidden">
      <SEO
        title={`${artist?.name || 'Artista'} - Discografía, Álbumes y Reviews | Musiclub`}
        description={`Explora los álbumes, EPs, sencillos y calificaciones de la comunidad para ${artist?.name || 'este artista'} en Musiclub.`}
        image={artist?.image}
        url={`https://musiclub.org/artista/${slug}`}
        schemaData={artistSchema}
      />

      <div className="max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
        <AppHeader
          user={user}
          isAdmin={isAdmin}
          onLogin={loginWithGoogle}
          onLogout={logout}
          showTitle={false}
        />

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link to="/" className="hover:text-white transition-colors">
            Inicio
          </Link>
          <span>/</span>
          <Link to="/catalogo" className="hover:text-white transition-colors">
            Catálogo
          </Link>
          <span>/</span>
          <span className="text-cyan-400 font-bold truncate">
            {artist?.name || decodeURIComponent(slug || '').replace(/-/g, ' ')}
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold tracking-wide animate-pulse">
              Cargando perfil y discografía de Spotify...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 text-center max-w-2xl mx-auto space-y-4">
            <div className="text-4xl">⚠️</div>
            <h2 className="text-2xl font-black text-white">
              No pudimos encontrar al artista
            </h2>
            <p className="text-slate-400 text-sm">{error}</p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={loadArtistData}
                className="px-5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold text-xs transition-all"
              >
                Reintentar
              </button>
              <Link
                to="/catalogo"
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-all"
              >
                Volver al Catálogo
              </Link>
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {proposeMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#121428] border border-cyan-400/40 text-cyan-200 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-bounce">
            <span className="text-lg">💿</span>
            <span className="text-xs sm:text-sm font-bold">
              {proposeMessage}
            </span>
          </div>
        )}

        {/* ARTIST HERO BANNER (Spotify Aesthetic) */}
        {!loading && profileData && artist && (
          <div className="space-y-8">
            <div className="relative rounded-3xl bg-gradient-to-br from-[#121626] via-[#0d101c] to-[#080912] border border-white/10 p-6 sm:p-8 md:p-10 shadow-2xl overflow-hidden backdrop-blur-xl">
              {/* Background ambient glow image */}
              {artist.image && (
                <div
                  className="absolute inset-0 opacity-15 bg-cover bg-center blur-3xl pointer-events-none scale-125"
                  style={{ backgroundImage: `url(${artist.image})` }}
                />
              )}
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-[#1db954]/20 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 lg:gap-10">
                {/* Artist Avatar */}
                <div className="relative flex-shrink-0 group">
                  <div className="w-40 h-40 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl bg-black/60 relative">
                    <img
                      src={
                        artist.image ||
                        'https://via.placeholder.com/300/1a1a2e/ffffff?text=🎤'
                      }
                      alt={artist.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>
                  {Boolean(artist.popularity && artist.popularity > 0) && (
                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#1db954] to-emerald-400 text-black font-black text-xs px-3 py-1 rounded-full shadow-lg border border-black/20 flex items-center gap-1">
                      <span>🔥 {artist.popularity}%</span>
                    </div>
                  )}
                </div>

                {/* Artist Info & Header */}
                <div className="flex-1 min-w-0 text-center md:text-left space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                    {clubStats.total > 0 && (
                      <span className="text-[11px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-0.5 rounded-full">
                        ✨ En Musiclub
                      </span>
                    )}
                  </div>

                  <h1
                    translate="no"
                    className="notranslate text-3xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-200 tracking-tight leading-tight"
                  >
                    {artist.name}
                  </h1>

                  {/* Monthly Followers / Popularity */}
                  <div className="flex items-center justify-center md:justify-start gap-4 text-xs sm:text-sm text-slate-300 flex-wrap font-medium">
                    {profileData.discography?.length > 0 && (
                      <>
                        <span>
                          <strong>{profileData.discography.length}</strong>{' '}
                          lanzamientos discográficos
                        </span>
                      </>
                    )}
                  </div>

                  {/* Genres */}
                  {artist.genres && artist.genres.length > 0 && (
                    <div className="flex items-center justify-center md:justify-start gap-1.5 flex-wrap pt-1">
                      {artist.genres.map((g) => (
                        <span
                          key={g}
                          className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-200 capitalize hover:bg-white/10 transition-colors"
                        >
                          #{g}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Club Quick Stats Bar */}
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3 pt-3 max-w-lg">
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-3 text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        En Musiclub
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block">
                        {clubStats.total} 💿
                      </span>
                    </div>

                    <div className="bg-black/40 border border-white/10 rounded-2xl p-3 text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Nota Promedio
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5 block">
                        {clubStats.avgRating
                          ? `${clubStats.avgRating} ⭐`
                          : 'N/A'}
                      </span>
                    </div>

                    <div className="bg-black/40 border border-white/10 rounded-2xl p-3 text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Total Reviews
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-cyan-400 mt-0.5 block">
                        {clubStats.totalReviews} ✍️
                      </span>
                    </div>
                  </div>

                  {/* Spotify Button */}
                  {artist.spotifyUrl && (
                    <div className="pt-2 flex items-center justify-center md:justify-start gap-3">
                      <a
                        href={artist.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#1db954] hover:bg-[#1ed760] text-black font-black text-xs sm:text-sm shadow-xl hover:scale-105 active:scale-95 transition-all"
                      >
                        <svg
                          className="w-4 h-4 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.306c-.216.353-.674.468-1.027.252-2.81-1.718-6.347-2.107-10.514-1.155-.403.092-.807-.16-.899-.563-.092-.403.16-.807.563-.899 4.568-1.044 8.49-.607 11.625 1.338.353.216.468.674.252 1.027zm1.47-3.268c-.272.443-.853.585-1.296.313-3.218-1.978-8.123-2.55-11.928-1.395-.499.151-1.03-.134-1.181-.633-.151-.499.134-1.03.633-1.181 4.354-1.322 9.775-.684 13.459 1.58.443.272.585.853.313 1.296zm.126-3.41c-3.858-2.29-10.222-2.502-13.886-1.39-.59.179-1.217-.156-1.396-.746-.179-.59.156-1.217.746-1.396 4.218-1.28 11.248-1.036 15.688 1.597.531.315.704 1.002.389 1.533-.315.531-1.002.704-1.541.402z" />
                        </svg>
                        <span>Abrir Perfil en Spotify</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* DISCOGRAPHY SECTION (Spotify Tabs: Álbumes, EPs, Sencillos, Compilaciones) */}
            <div className="space-y-5">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-white font-black text-xl sm:text-2xl flex items-center gap-2">
                    <span>💿</span>
                    <span>Discografía Completa</span>
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                    Álbumes, EPs y sencillos oficiales lanzados por{' '}
                    {artist.name}.
                  </p>
                </div>

                {/* Search in Discography */}
                <div className="w-full md:w-72">
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filtrar lanzamientos..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-2 text-white text-xs placeholder-white/30 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>

              {/* Category Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {[
                  {
                    id: 'ALL',
                    label: 'Todos',
                    count: profileData.discography?.length || 0,
                    icon: '🌟',
                  },
                  {
                    id: 'ALBUM',
                    label: 'Álbumes',
                    count: profileData.albums?.length || 0,
                    icon: '✨',
                  },
                  {
                    id: 'EP',
                    label: 'EPs',
                    count: profileData.eps?.length || 0,
                    icon: '💿',
                  },
                  {
                    id: 'SENCILLO',
                    label: 'Sencillos',
                    count: profileData.singles?.length || 0,
                    icon: '🎵',
                  },
                  {
                    id: 'COMPILACION',
                    label: 'Compilaciones',
                    count: profileData.compilations?.length || 0,
                    icon: '📦',
                  },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all flex items-center gap-2 border ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black border-transparent shadow-lg shadow-cyan-500/20 scale-105'
                          : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/10'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-slate-300'}`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Discography Grid */}
              {filteredDiscography.length === 0 ? (
                <div className="bg-[#121424] border border-white/10 rounded-3xl p-10 text-center space-y-2">
                  <p className="text-slate-400 text-sm font-semibold">
                    No se encontraron lanzamientos en esta categoría.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
                  {filteredDiscography.map((release) => {
                    const normReleaseName = release.name
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, '');

                    const existingInClub = clubAlbumMap.get(normReleaseName);

                    const typeBadge =
                      release.release_type === 'EP'
                        ? {
                            label: 'EP',
                            color:
                              'bg-cyan-300/80 text-cyan-800 border-cyan-700/50',
                          }
                        : release.release_type === 'SENCILLO'
                          ? {
                              label: 'Sencillo',
                              color:
                                'bg-pink-300/80 text-pink-800 border-pink-700/50',
                            }
                          : release.release_type === 'COMPILACION'
                            ? {
                                label: 'Compilación',
                                color:
                                  'bg-amber-300/80 text-amber-800 border-amber-700/50',
                              }
                            : release.release_type === 'EN VIVO'
                              ? {
                                  label: 'En Vivo',
                                  color:
                                    'bg-emerald-300/80 text-emerald-800 border-emerald-700/50',
                                }
                              : release.release_type === 'SOUNDTRACK'
                                ? {
                                    label: 'Soundtrack',
                                    color:
                                      'bg-indigo-300/80 text-indigo-800 border-indigo-700/50',
                                  }
                                : release.release_type === 'REMIX'
                                  ? {
                                      label: 'Remix',
                                      color:
                                        'bg-fuchsia-300/80 text-fuchsia-800 border-fuchsia-700/50',
                                    }
                                  : {
                                      label: 'Álbum',
                                      color:
                                        'bg-purple-300/80 text-purple-800 border-purple-700/50',
                                    };

                    return (
                      <div
                        key={release.id}
                        className="bg-gradient-to-b from-[#131526] to-[#0c0e1a] border border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex flex-col justify-between group hover:border-cyan-400/40 hover:scale-[1.02] transition-all shadow-xl"
                      >
                        <div>
                          {/* Cover Image Container */}
                          <div className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-black/60 mb-3 border border-white/10 shadow-lg">
                            <img
                              src={
                                release.image ||
                                'https://via.placeholder.com/300/1a1a2e/ffffff?text=🎵'
                              }
                              alt={release.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />

                            {/* Release Type Badge */}
                            <div className="absolute top-2 left-2 z-10">
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border backdrop-blur-md shadow-sm ${typeBadge.color}`}
                              >
                                {typeBadge.label}
                              </span>
                            </div>

                            {/* Musiclub Score or Status Badge */}
                            {existingInClub && (
                              <div className="absolute top-2 right-2 z-10">
                                {existingInClub.final_rating ? (
                                  <span className="bg-amber-300/80 text-amber-800 font-black text-[10px] px-2 py-0.5 rounded-full shadow-lg border border-amber-700/50 flex items-center gap-0.5">
                                    🎶{' '}
                                    {Number(
                                      existingInClub.final_rating
                                    ).toFixed(1)}
                                  </span>
                                ) : (
                                  <span className="bg-cyan-300/80 text-cyan-800 font-black text-[9px] px-2 py-0.5 rounded-full shadow-lg border border-cyan-700/50">
                                    Musiclub
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Year on hover/bottom */}
                            {Boolean(release.releaseYear) && (
                              <div className="absolute bottom-2 right-2 z-10">
                                <span className="bg-black/70 backdrop-blur-md text-white/80 font-mono text-[10px] px-2 py-0.5 rounded-md border border-white/10">
                                  {release.releaseYear}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Release Name & Details */}
                          <h4
                            translate="no"
                            className="notranslate text-white font-extrabold text-xs sm:text-sm line-clamp-2 leading-tight group-hover:text-cyan-300 transition-colors"
                            title={release.name}
                          >
                            {release.name}
                          </h4>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                            <span>{release.releaseYear || ''}</span>
                            {release.totalTracks > 0 && (
                              <span>
                                {release.totalTracks}{' '}
                                {release.totalTracks === 1 ? 'pista' : 'pistas'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-3 mt-2 border-t border-white/5 space-y-1.5">
                          {existingInClub ? (
                            <Link
                              to={getReleaseUrl(release.name, release.release_type || 'ALBUM')}
                              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black text-[11px] text-center flex items-center justify-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition-all"
                            >
                              <span>🎧</span>
                              <span>Ver en Club</span>
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleQuickPropose(release)}
                              disabled={proposingId === release.id}
                              className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-white/10 hover:border-cyan-400/30 font-bold text-[11px] text-center flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                            >
                              <span>➕</span>
                              <span>
                                {proposingId === release.id
                                  ? 'Agregando...'
                                  : 'Proponer al Club'}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}
