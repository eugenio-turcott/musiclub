'use client';
import {ArtistHero} from './ArtistHero';
import {ArtworkAtmosphere,artworkPageClass} from './ArtworkAtmosphere';
import {verifiedArtistProfile} from '../utils/verifiedDiscography.mjs';
import {NavigationLoading} from './NavigationLoading';
import {DetailLoading} from './DetailLoading';
import { InterfaceText } from './UiIcon';
import { ListenLaterButton } from './ListenLaterButton';
import { MusiclubVinyl } from './MusiclubVinyl';
import { GenreLabel } from './GenreLabel';
// src/components/ArtistDetail.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import {AdsterraAdvertising} from './AdsterraAdvertising';
import { Footer } from './Footer';
import { SEO } from './SEO';
import { useAuth } from '../hooks/useAuth';
import { supabaseService } from '../services/supabaseClient';
import {
  getAlbumDetails,
} from '../services/spotifyApi';
import { getMusicBrainzReleaseGroupDetails } from '../services/musicBrainzService';
import releaseIdentity from '../utils/releaseIdentity.cjs';
import { findAlbumsByArtist, getReleaseUrl, slugifyArtist } from '../utils/ratingUtils';


export function ArtistDetail({ initialProfileData, initialClubAlbums, initialSlug } = {}) {
  const params = useParams();
  const slug = initialSlug || params?.slug;
  const navigate = useNavigate();
  const { user, isAdmin, loginWithGoogle, logout } = useAuth();

  const [profileData, setProfileData] = useState(() => verifiedArtistProfile(initialProfileData) || null);
  const [clubAlbums, setClubAlbums] = useState(() => initialClubAlbums || []);
  const [loading, setLoading] = useState(() => !initialProfileData);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'ALBUM' | 'EP' | 'SENCILLO' | 'COMPILACION'
  const [searchFilter, setSearchFilter] = useState('');
  const [visibleReleases,setVisibleReleases]=useState(48);
  useEffect(()=>setVisibleReleases(48),[slug,activeTab,searchFilter]);
  const [proposingId, setProposingId] = useState(null);
  const [proposeMessage, setProposeMessage] = useState(null);

  // Cargar datos de Supabase y Spotify
  const loadArtistData = useCallback(async () => {
    if (!initialProfileData) setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/artists/${encodeURIComponent(slug)}`);
      if (!response.ok) throw new Error('No se pudo recuperar la discografía');
      const data = await response.json();
      setProfileData(verifiedArtistProfile(data.profile));
      setClubAlbums(data.albums || []);
    } catch (err) {
      console.error('Error cargando página de artista:', err);
      if (!initialProfileData) setError('Error al cargar la información del artista');
    } finally {
      setLoading(false);
    }
  }, [slug, initialProfileData]);

  useEffect(() => {
    if (!initialProfileData) loadArtistData();
  }, [loadArtistData]);

  // A first visit renders the local catalogue immediately while the official copy is prepared.
  useEffect(() => {
    if (profileData?.source === 'OFFICIAL') return;
    let cancelled=false, timer, attempts=0;
    const poll=async()=>{
      if (document.visibilityState !== 'visible') return;
      try {
        const response=await fetch(`/api/artists/${encodeURIComponent(slug)}`,{cache:'no-store'});
        if(response.ok) {
          const data=await response.json();
          if(!cancelled && data.profile?.source==='OFFICIAL') {setProfileData(verifiedArtistProfile(data.profile));setClubAlbums(data.albums||[]);return;}
        }
      } catch { /* Keep the local releases visible. */ }
      if(!cancelled && ++attempts<3) timer=setTimeout(poll,10000 * 2**attempts);
    };
    timer=setTimeout(poll,10000);
    return()=>{cancelled=true;clearTimeout(timer);};
  },[slug,profileData?.source]);

  // Mapa de álbumes del club indexados por nombre normalizado
  const clubAlbumMap = useMemo(() => {
    const map = new Map();
    clubAlbums.forEach((ca) => {
      const normName = releaseIdentity.slugify(ca.album_name || ca.album || '', true);
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
    if (release.clubUrl) { navigate(release.clubUrl); return; }
    if (release.releaseDate && release.releaseDate > new Date().toLocaleDateString('en-CA')) { setProposeMessage('Este lanzamiento estará disponible para reseñar después de su estreno.'); return; }
    if (!user) { loginWithGoogle(); return; }
    setProposingId(release.id);
    setProposeMessage(null);

    try {
      // 1. Obtener detalles de canciones desde Spotify
      const mb = release.mbid ? await getMusicBrainzReleaseGroupDetails(release.mbid) : null;
      const details = release.mbid ? null : await getAlbumDetails(release.id);
      const spotifyAlbum = mb ? { ...release, ...mb } : details?.success ? details.album : release;

      const tracks = (spotifyAlbum.tracks || []).map((t) => ({
        id: t.id,
        name: t.name,
        duration_ms: t.duration_ms,
        track_number: t.track_number,
        disc_number: t.disc_number,
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
        genres: mb?.genres?.length ? mb.genres : profileData?.artist?.genres || [],
        mbid: release.mbid || null,
        reviews_enabled: true,
      };

      const created = await supabaseService.createAlbum(albumPayload);
      const targetUrl = getReleaseUrl(created || { album_name: spotifyAlbum.name, artist_name: artistName, release_type: release.release_type });

      navigate(targetUrl);
    } catch (err) {
      console.error('Error al preparar álbum para reseña:', err);
      setProposeMessage(
        `Error: ${err.message || 'No se pudo preparar el lanzamiento para reseña'}`
      );
      setTimeout(() => setProposeMessage(null), 3500);
    } finally {
      setProposingId(null);
    }
  };

  const artist = profileData?.artist;

  // Structured JSON-LD Schema for Artist
  const artistSchema = useMemo(() => {
    if (!artist) return null;
    const canonicalUrl = `https://www.musiclub.org/artista/${slug}`;
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

  const formattedArtistName = useMemo(() => {
    if (artist?.name) return artist.name;
    if (!slug) return 'Artista';
    try {
      return decodeURIComponent(slug).replace(/-/g, ' ');
    } catch (e) {
      return slug.replace(/-/g, ' ');
    }
  }, [artist?.name, slug]);

  const artistKeywords = `${formattedArtistName}, discografia ${formattedArtistName}, albumes ${formattedArtistName}, reviews ${formattedArtistName}, reseñas ${formattedArtistName}, canciones ${formattedArtistName}, musiclub`;

  if(loading)return <NavigationLoading label='Abriendo perfil y discografía del artista…'/>;
  return (
    <div className={`${artworkPageClass} min-h-screen cyber-grid p-3 sm:p-6 w-full max-w-full overflow-x-hidden`}>
      <ArtworkAtmosphere colors={artist?.dominant_colors || []} entity="artist" id={slug} imageUrl={artist?.image}/>
      <SEO
        title={`${formattedArtistName} - Discografía, Álbumes y Reviews | Musiclub`}
        description={`Explora la discografía, álbumes, EPs, sencillos, opiniones y calificaciones de la comunidad para ${formattedArtistName} en Musiclub.`}
        image={artist?.image}
        url={`https://www.musiclub.org/artista/${slug}`}
        keywords={artistKeywords}
        schemaData={artistSchema}
      />

      <div className="max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
        <AppHeader
          showAdvertising={!loading && !error}
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

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 text-center max-w-2xl mx-auto space-y-4">
            <div className="text-4xl"><InterfaceText>{"⚠️"}</InterfaceText></div>
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

        {/* Barra superior de carga sutil y no invasiva */}
        {proposingId && (
          <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-linear-to-r from-cyan-400 via-blue-500 to-purple-500 animate-pulse shadow-[0_0_12px_rgba(6,182,212,0.7)]" />
        )}

        {/* Notificación discreta de error (solo en caso de fallo real) */}
        {proposeMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#121428]/95 border border-rose-500/40 text-rose-200 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2 text-xs">
            <span><InterfaceText>{"⚠️"}</InterfaceText></span>
            <span>{proposeMessage}</span>
            <button
              type="button"
              onClick={() => setProposeMessage(null)}
              className="ml-2 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* ARTIST HERO BANNER (Spotify Aesthetic) */}
        {!loading && profileData && artist && (
          <div className="space-y-8">
            <ArtistHero artist={artist} stats={clubStats} releaseCount={profileData.discography.length}/>

            {/* DISCOGRAPHY SECTION (Spotify Tabs: Álbumes, EPs, Sencillos, Compilaciones) */}
            <AdsterraAdvertising variant="inline" slot="artist-discography" />
            <div className="space-y-5">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-white font-black text-xl sm:text-2xl flex items-center gap-2">
                    <span><InterfaceText>{"💿"}</InterfaceText></span>
                    <span>Discografía</span>
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                    Álbumes, EPs, sencillos y otras ediciones de{' '}
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
                <InterfaceText>{[
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
                          ? 'bg-linear-to-r from-cyan-500 to-blue-600 text-black border-transparent shadow-lg shadow-cyan-500/20 scale-105'
                          : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/10'
                      }`}
                    >
                      <span><InterfaceText>{tab.icon}</InterfaceText></span>
                      <span><InterfaceText>{tab.label}</InterfaceText></span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-slate-300'}`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}</InterfaceText>
              </div>

              {/* Discography Grid */}
              {filteredDiscography.length === 0 ? (
                <div className="bg-[#121424] border border-white/10 rounded-3xl p-10 text-center space-y-2">
                  <p className="text-slate-400 text-sm font-semibold">
                    {profileData.discography?.length ? 'No se encontraron lanzamientos en esta categoría.' : 'Estamos preparando la discografía de este artista. Las reseñas del club se conservan.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
                  {filteredDiscography.slice(0,visibleReleases).map((release) => {
                    const normReleaseName = releaseIdentity.slugify(release.name, true);

                    const existingInClub = release.clubAlbumId
                      ? clubAlbums.find(album=>album.id===release.clubAlbumId)
                      : profileData.source==='OFFICIAL' && release.sources?.length ? null : clubAlbumMap.get(normReleaseName);

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

                    const targetClubUrl = getReleaseUrl(
                      existingInClub || { album_name: release.name, artist_name: profileData.artist.name, release_type: release.release_type }
                    );

                    const handleCardClick = () => {
                      if (proposingId) return;
                      if (existingInClub) {
                        navigate(targetClubUrl);
                      } else {
                        handleQuickPropose(release);
                      }
                    };

                    return (
                      <div
                        key={release.id}
                        onClick={handleCardClick}
                        className="bg-linear-to-b from-[#131526] to-[#0c0e1a] border border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex flex-col justify-between group hover:border-cyan-400/50 hover:shadow-[0_10px_25px_rgba(6,182,212,0.15)] hover:scale-[1.02] cursor-pointer transition-all shadow-xl select-none"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleCardClick();
                          }
                        }}
                      >
                        <div>
                          {/* Cover Image Container */}
                          <div className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-black/60 mb-3 border border-white/10 shadow-lg">
                            <img
                              src={
                                release.image ||
                                '/musiclub_logo_corchea.png'
                              }
                              onError={event => { if (!event.currentTarget.src.endsWith('/musiclub_logo_corchea.png')) event.currentTarget.src = '/musiclub_logo_corchea.png'; }}
                              alt={release.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />

                            {/* Release Type Badge */}
                            <div className="absolute top-2 left-2 z-10">
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border backdrop-blur-md shadow-sm ${typeBadge.color}`}
                              >
                                <InterfaceText>{typeBadge.label}</InterfaceText>
                              </span>
                            </div>

                            {/* Musiclub Score or Status Badge */}
                            {existingInClub && (
                              <div className="absolute top-2 right-2 z-10">
                                {existingInClub.final_rating ? (
                                  <span className="bg-amber-300/80 text-amber-800 font-black text-[10px] px-2 py-0.5 rounded-full shadow-lg border border-amber-700/50 flex items-center gap-0.5"><InterfaceText>{" 🎶"}</InterfaceText>{' '}
                                    {Number(
                                      existingInClub.final_rating
                                    ).toFixed(1)}
                                  </span>
                                ) : (
                                  <span className="bg-cyan-300/80 text-cyan-800 font-black text-[9px] px-2 py-0.5 rounded-full shadow-lg border border-cyan-700/50">
                                    EN MUSICLUB
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

                          {existingInClub && <div className="mb-2 flex flex-wrap gap-1.5 text-[10px] font-bold"><span className="rounded-full bg-cyan-400/15 px-2 py-1 text-cyan-200">EN MUSICLUB</span>{existingInClub.review_count > 0 && <span className="rounded-full bg-white/5 px-2 py-1 text-slate-300">{existingInClub.review_count} reseñas</span>}</div>}
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
                        <div className="release-card-actions pt-3 mt-2 border-t border-white/5 grid grid-cols-2 gap-2">
                          {existingInClub ? (
                            <Link
                              to={targetClubUrl}
                              onClick={(e) => e.stopPropagation()}
                              className="release-action-tile w-full py-2 px-3 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 text-black font-black text-[11px] text-center flex items-center justify-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition-all"
                            >
                              <span><InterfaceText>{"🎧"}</InterfaceText></span>
                              <span>Ver release</span>
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickPropose(release);
                              }}
                              disabled={Boolean(proposingId) && release.id && proposingId === release.id}
                              className={`release-action-tile w-full py-2 px-3 rounded-xl font-bold text-[11px] text-center flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-60 ${
                                Boolean(proposingId) && release.id && proposingId === release.id
                                  ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40'
                                  : 'bg-white/5 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-white/10 hover:border-cyan-400/30'
                              }`}
                            >
                              {Boolean(proposingId) && release.id && proposingId === release.id ? (
                                <svg
                                  className="animate-spin h-3.5 w-3.5 text-cyan-300"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v8H4z"
                                  />
                                </svg>
                              ) : (
                                <span><InterfaceText>{"✍️"}</InterfaceText></span>
                              )}
                              <span>
                                {Boolean(proposingId) && release.id && proposingId === release.id
                                  ? 'Abriendo...'
                                  : release.clubUrl ? 'Ver lanzamiento' : release.releaseDate > new Date().toLocaleDateString('en-CA') ? 'Próximo estreno' : 'Reseñar'}
                              </span>
                            </button>
                          )}
                          <ListenLaterButton album={{ ...release, artist_name: artist?.name || formattedArtistName }} tile className="w-full" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {filteredDiscography.length > visibleReleases && <div className="flex justify-center pt-4"><button type="button" onClick={()=>setVisibleReleases(count=>count+48)} className="cursor-pointer rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-cyan-200 hover:bg-white/10">Ver más releases ({visibleReleases}/{filteredDiscography.length})</button></div>}
            </div>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}
