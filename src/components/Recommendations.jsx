import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';
import { supabaseService } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useUserReviews } from '../hooks/useUserReviews';
import {
  getPersonalizedRecommendations,
  CRITERIA_DEFINITIONS,
} from '../utils/recommendationEngine';
import { getRecommendedAlbumsByTaste } from '../services/spotifyApi';
import { ReviewSystem } from './ReviewSystem';
import { notifyContentLoaded } from '../utils/translateCrashGuard';

export function Recommendations({ isPage = false, user: propUser = null }) {
  const { user: authUser, loginWithGoogle } = useAuth();
  const user = propUser || authUser;
  const { userReviews, refetchUserReviews } = useUserReviews(user);

  const [albumsWithStats, setAlbumsWithStats] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vistas y filtros
  const [activeSection, setActiveSection] = useState('club'); // 'club' | 'dna' | 'discoveries'
  const [filterCategory, setFilterCategory] = useState('top90'); // 'top90' | 'all' | 'critics' | 'twins' | 'criteria'
  const [discoveries, setDiscoveries] = useState([]);
  const [loadingDiscoveries, setLoadingDiscoveries] = useState(false);
  const [selectedAlbumForReview, setSelectedAlbumForReview] = useState(null);
  const [selectedAlbumForDetail, setSelectedAlbumForDetail] = useState(null);
  const [proposingAlbumId, setProposingAlbumId] = useState(null);
  const [proposalSuccess, setProposalSuccess] = useState(null);

  // Cargar datos completos del club para alimentar el algoritmo
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [albumsData, reviewsData, profilesData] = await Promise.all([
        supabaseService.getAllAlbumsWithFullStats(),
        supabaseService.getAllReviews(),
        supabaseService.getAllProfiles(),
      ]);

      setAlbumsWithStats(albumsData || []);
      setAllReviews(reviewsData || []);
      setAllProfiles(profilesData || []);
    } catch (err) {
      console.error('Error cargando datos para recomendaciones:', err);
      setError('No se pudieron cargar los datos para generar recomendaciones.');
    } finally {
      setLoading(false);
      notifyContentLoaded('recommendations');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Ejecutar el motor de recomendación matemática
  const recommendationData = useMemo(() => {
    if (!user) {
      return {
        tasteProfile: {
          hasHistory: false,
          totalReviews: 0,
          topRatedAlbums: [],
          topArtists: [],
        },
        tasteTwins: [],
        recommendations: [],
        highMatchPicks: [],
        topPicks: [],
        criticsTreasures: [],
        tasteTwinPicks: [],
        criteriaPicks: [],
        topCriterionDef: CRITERIA_DEFINITIONS[0],
        unreviewedCount: 0,
        reviewedCount: 0,
      };
    }

    return getPersonalizedRecommendations(
      user,
      userReviews,
      albumsWithStats,
      allReviews,
      allProfiles
    );
  }, [user, userReviews, albumsWithStats, allReviews, allProfiles]);

  const {
    tasteProfile,
    tasteTwins,
    recommendations,
    highMatchPicks = [],
    criticsTreasures = [],
    tasteTwinPicks = [],
    criteriaPicks = [],
    topCriterionDef = CRITERIA_DEFINITIONS[0],
  } = recommendationData;

  // Filtrado de la lista mostrada
  const displayedClubAlbums = useMemo(() => {
    if (filterCategory === 'top90') {
      // Mostrar prioritariamente sugerencias con >= 90% Match. Si hay menos de 3, mostrar las mejores puntuadas
      return highMatchPicks.length > 0
        ? highMatchPicks
        : recommendations.slice(0, 8);
    }
    if (filterCategory === 'critics') return criticsTreasures;
    if (filterCategory === 'twins') return tasteTwinPicks;
    if (filterCategory === 'criteria') return criteriaPicks;
    return recommendations;
  }, [
    filterCategory,
    highMatchPicks,
    recommendations,
    criticsTreasures,
    tasteTwinPicks,
    criteriaPicks,
  ]);

  // Cargar nuevos descubrimientos musicales fuera del catálogo
  const loadMusicalDiscoveries = useCallback(
    async (isRefresh = false) => {
      if (!tasteProfile || loadingDiscoveries) return;
      if (!isRefresh && discoveries.length > 0) return;

      setLoadingDiscoveries(true);
      try {
        const refreshSeed = isRefresh
          ? Date.now() + Math.random() * 1000
          : Date.now();
        const res = await getRecommendedAlbumsByTaste(
          tasteProfile,
          albumsWithStats,
          8,
          refreshSeed
        );
        if (res.success && res.albums) {
          setDiscoveries(res.albums);
        }
      } catch (err) {
        console.warn('Error cargando descubrimientos musicales:', err);
      } finally {
        setLoadingDiscoveries(false);
      }
    },
    [tasteProfile, loadingDiscoveries, discoveries.length, albumsWithStats]
  );

  useEffect(() => {
    if (activeSection === 'discoveries') {
      loadMusicalDiscoveries(false);
    }
  }, [activeSection, loadMusicalDiscoveries]);

  // Agregar un álbum descubierto a la lista de Escuchas Individuales
  const handleAddToIndividualList = async (discoveredAlbum) => {
    if (!user) return;
    setProposingAlbumId(discoveredAlbum.id);
    setProposalSuccess(null);

    try {
      const newAlbumData = {
        albumName: discoveredAlbum.name,
        artistName: discoveredAlbum.artists
          ? discoveredAlbum.artists.join(', ')
          : 'Artista',
        imageUrl: discoveredAlbum.image,
        spotifyLink:
          discoveredAlbum.external_urls?.spotify ||
          `https://open.spotify.com/album/${discoveredAlbum.id}`,
        status: 'INDIVIDUAL',
        addedBy: user.name || user.email?.split('@')[0] || 'Miembro',
        addedByEmail: user.email,
        tracks: discoveredAlbum.tracks || [],
        reviews_enabled: true,
      };

      await supabaseService.createAlbum(newAlbumData);
      setProposalSuccess(
        `¡"${discoveredAlbum.name}" añadido exitosamente a la lista de Escucha Individual!`
      );

      // Quitar de descubrimientos
      setDiscoveries((prev) => prev.filter((a) => a.id !== discoveredAlbum.id));

      // Recargar catálogo
      await loadData();
    } catch (err) {
      console.error('Error añadiendo álbum a escucha individual:', err);
      alert(`Error al añadir álbum: ${err.message}`);
    } finally {
      setProposingAlbumId(null);
    }
  };

  const handleReviewCompleted = () => {
    setSelectedAlbumForReview(null);
    if (refetchUserReviews) refetchUserReviews();
    loadData();
  };

  // Color de badge de compatibilidad
  const getCompatibilityColor = (score) => {
    if (score >= 90)
      return 'from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-black';
    if (score >= 80)
      return 'from-cyan-400 via-blue-400 to-indigo-500 text-white font-black';
    if (score >= 70) return 'from-purple-400 to-pink-500 text-white font-bold';
    return 'from-amber-400 to-yellow-500 text-slate-950 font-bold';
  };

  // Si el usuario no ha iniciado sesión
  if (!user) {
    return (
      <div className="w-full max-w-5xl mx-auto py-12 px-4 text-center space-y-6">
        {isPage && (
          <div className="flex items-center justify-start pb-4 border-b border-white/5 mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 transition-all font-semibold"
            >
              <span>←</span> Volver al Inicio
            </Link>
          </div>
        )}

        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-[#f5576c]/20 to-[#f093fb]/20 border border-[#f5576c]/30 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(245,87,108,0.2)]">
          ✨
        </div>
        <div className="space-y-2 max-w-lg mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Descubre Álbumes Hechos a tu Medida
          </h2>
          <p className="text-white/60 text-sm leading-relaxed">
            Inicia sesión para que el motor de recomendación analice tus mejores
            calificaciones, detecte tus criterios favoritos y te sugiera joyas
            del catálogo del club y nuevos hallazgos musicales.
          </p>
        </div>
        <button
          onClick={loginWithGoogle}
          className="px-6 py-3 bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white font-bold rounded-2xl shadow-lg shadow-[#f5576c]/25 hover:scale-105 active:scale-95 transition-all text-sm"
        >
          Iniciar Sesión con Google
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-16">
      {/* Universal Standard App Header */}
      {isPage && <AppHeader user={user} showTitle={false} />}

      {/* HEADER PRINCIPAL DE LA SECCIÓN DE RECOMENDACIONES */}
      <div className="relative rounded-2xl sm:rounded-3xl p-5 sm:p-8 bg-gradient-to-br from-[#14142b] via-[#0d1020] to-[#080913] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-80 sm:w-96 h-80 sm:h-96 bg-gradient-to-bl from-[#f5576c]/20 via-[#f093fb]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-72 sm:w-80 h-72 sm:h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="space-y-2.5 text-center md:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#f5576c]/20 to-[#f093fb]/20 border border-[#f5576c]/40 text-[#f5576c] text-xs font-bold">
              <span>🧠</span> Algoritmo de Afinidad Musical
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              Para Ti,{' '}
              <span
                translate="no"
                className="notranslate username-tag text-transparent bg-clip-text bg-gradient-to-r from-[#f5576c] to-[#f093fb]"
                data-username={user.name || 'Melómano'}
              >
                {user.name || 'Melómano'}
              </span>
            </h1>
            <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
              Álbumes seleccionados analizando tus calificaciones más altas,
              criterios técnicos preferidos y afinidad con la comunidad de
              Musiclub.
            </p>
          </div>

          {/* Tarjeta Resumen de Arquetipo Musical */}
          {tasteProfile.hasHistory ? (
            <div className="w-full md:w-auto flex-shrink-0 bg-black/40 border border-white/15 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xl text-center md:text-left min-w-[260px]">
              <div className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1">
                Tu ADN de Crítico
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2.5 mb-1.5">
                <span className="text-2xl sm:text-3xl">
                  {tasteProfile.tasteArchetype.emoji}
                </span>
                <div>
                  <h3 className="text-white font-extrabold text-sm sm:text-base leading-tight">
                    {tasteProfile.tasteArchetype.title}
                  </h3>
                  <span className="text-cyan-400 text-xs font-semibold">
                    Criterio Top: {topCriterionDef.label}
                  </span>
                </div>
              </div>
              <p className="text-white/50 text-xs line-clamp-2 leading-relaxed">
                {tasteProfile.tasteArchetype.description}
              </p>
            </div>
          ) : (
            <div className="w-full md:w-auto bg-black/40 border border-amber-500/20 rounded-2xl p-4 text-center md:text-left min-w-[260px]">
              <div className="text-amber-400 font-bold text-sm flex items-center justify-center md:justify-start gap-1.5 mb-1">
                <span>🌱</span> Historial Inicial
              </div>
              <p className="text-white/60 text-xs">
                Has calificado{' '}
                <span
                  translate="no"
                  className="notranslate font-bold text-white"
                  data-stat="number"
                >
                  {userReviews.length}
                </span>{' '}
                álbumes. Califica más discos para calibrar tu perfil con mayor
                precisión.
              </p>
            </div>
          )}
        </div>

        {/* NAVEGACIÓN ENTRE SECCIONES DE RECOMENDACIÓN */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-white/10 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSection('club')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
              activeSection === 'club'
                ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-lg shadow-[#f5576c]/25'
                : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
          >
            <span>💿</span> Para Ti{' '}
            <span translate="no" className="notranslate" data-stat="number">
              ({loading ? '...' : recommendations.length})
            </span>
          </button>

          <button
            onClick={() => setActiveSection('dna')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
              activeSection === 'dna'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
          >
            <span>🧬</span> Tu ADN Musical & Criterios
          </button>

          <button
            onClick={() => setActiveSection('discoveries')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
              activeSection === 'discoveries'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
          >
            <span>🚀</span> Nuevos Descubrimientos
          </button>
        </div>
      </div>

      {/* FEEDBACK DE PROPOSICIÓN */}
      {proposalSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center justify-between">
          <span>{proposalSuccess}</span>
          <button
            onClick={() => setProposalSuccess(null)}
            className="text-emerald-300 hover:text-white text-xs ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* FEEDBACK DE ERROR */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-sm font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-rose-300 hover:text-white text-xs ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* CONTENIDO 1: RECOMENDACIONES DEL CLUB */}
      {activeSection === 'club' && (
        <div className="space-y-6">
          {/* Barra de Filtros Rápidos */}
          <div className="flex items-center justify-between gap-3 flex-wrap bg-black/40 p-3 sm:p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
              <button
                onClick={() => setFilterCategory('top90')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  filterCategory === 'top90'
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black shadow-md'
                    : 'text-white/50 hover:text-white bg-white/5'
                }`}
              >
                🌟 Match ≥ 90%{' '}
                <span translate="no" className="notranslate" data-stat="number">
                  ({loading ? '...' : highMatchPicks.length})
                </span>
              </button>

              <button
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  filterCategory === 'all'
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'text-white/50 hover:text-white bg-white/5'
                }`}
              >
                ⚡ Todas las Sugerencias{' '}
                <span translate="no" className="notranslate" data-stat="number">
                  ({loading ? '...' : recommendations.length})
                </span>
              </button>

              {criticsTreasures.length > 0 && (
                <button
                  onClick={() => setFilterCategory('critics')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    filterCategory === 'critics'
                      ? 'bg-cyan-500 text-black font-black'
                      : 'text-white/50 hover:text-white bg-white/5'
                  }`}
                >
                  💎 Aclamados del Club{' '}
                  <span
                    translate="no"
                    className="notranslate"
                    data-stat="number"
                  >
                    ({criticsTreasures.length})
                  </span>
                </button>
              )}

              {tasteTwinPicks.length > 0 && (
                <button
                  onClick={() => setFilterCategory('twins')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    filterCategory === 'twins'
                      ? 'bg-indigo-500 text-white font-black'
                      : 'text-white/50 hover:text-white bg-white/5'
                  }`}
                >
                  🤝 Melómanos Afines{' '}
                  <span
                    translate="no"
                    className="notranslate"
                    data-stat="number"
                  >
                    ({tasteTwinPicks.length})
                  </span>
                </button>
              )}

              {criteriaPicks.length > 0 && (
                <button
                  onClick={() => setFilterCategory('criteria')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    filterCategory === 'criteria'
                      ? 'bg-amber-400 text-black font-black'
                      : 'text-white/50 hover:text-white bg-white/5'
                  }`}
                >
                  {topCriterionDef.emoji} Joyas en {topCriterionDef.label}{' '}
                  <span
                    translate="no"
                    className="notranslate"
                    data-stat="number"
                  >
                    ({criteriaPicks.length})
                  </span>
                </button>
              )}
            </div>

            <span className="text-white/40 text-xs font-mono hidden sm:inline">
              {filterCategory === 'top90' ? (
                <>
                  Mostrando{' '}
                  <span
                    translate="no"
                    className="notranslate font-bold text-cyan-300"
                    data-stat="number"
                  >
                    {loading ? '...' : displayedClubAlbums.length}
                  </span>{' '}
                  sugerencias con alta afinidad
                </>
              ) : (
                <>
                  <span
                    translate="no"
                    className="notranslate font-bold text-cyan-300"
                    data-stat="number"
                  >
                    {loading ? '...' : displayedClubAlbums.length}
                  </span>{' '}
                  sugerencias disponibles
                </>
              )}
            </span>
          </div>

          {/* Grilla de Álbumes Recomendados */}
          {loading ? (
            <div
              translate="no"
              className="notranslate py-20 text-center text-white/50"
            >
              <span className="w-3 h-3 bg-[#f5576c] rounded-full animate-ping inline-block mr-2"></span>
              Calculando afinidad con el catálogo...
            </div>
          ) : displayedClubAlbums.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {displayedClubAlbums.map((album) => {
                const compatScore = album.compatibilityScore || 75;
                const badges = album.matchBadges || [];

                return (
                  <div
                    key={album.id}
                    className="group relative rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-[#121424] to-[#0a0d18] border border-white/10 hover:border-white/25 transition-all duration-300 shadow-xl hover:shadow-2xl flex flex-col justify-between space-y-4"
                  >
                    {/* Badge de compatibilidad superior */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        translate="no"
                        className={`notranslate px-3 py-1 rounded-full text-xs bg-gradient-to-r ${getCompatibilityColor(
                          compatScore
                        )} shadow-md`}
                        data-stat="score"
                      >
                        ⚡ {compatScore}% Match
                      </span>

                      <span className="text-[11px] font-semibold text-white/50 bg-black/40 px-2.5 py-0.5 rounded-full border border-white/5">
                        {album.status === 'GANADOR'
                          ? '👑 Ganador'
                          : album.status === 'ACTIVO'
                            ? '🎰 En Máquina'
                            : album.status === 'INDIVIDUAL'
                              ? '🎧 Escucha Libre'
                              : '💿 Archivo'}
                      </span>
                    </div>

                    {/* Portada e Información Básica */}
                    <div className="flex items-start gap-4">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 border border-white/15 shadow-xl group-hover:scale-105 transition-transform duration-300">
                        <img
                          src={
                            album.image_url ||
                            album.imagen ||
                            'https://via.placeholder.com/200/1a1a2e/ffffff?text=🎵'
                          }
                          alt={album.album_name || album.album}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <h3
                          translate="no"
                          className="notranslate music-title text-white font-extrabold text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-cyan-300 transition-colors"
                          data-album={album.album_name || album.album}
                        >
                          {album.album_name || album.album}
                        </h3>
                        <p
                          translate="no"
                          className="notranslate artist-name text-white/60 text-xs font-medium truncate"
                          data-artist={album.artist_name || album.artista}
                        >
                          {album.artist_name || album.artista}
                        </p>

                        <div className="flex items-center gap-2 pt-1">
                          <span
                            translate="no"
                            className="notranslate text-amber-300 font-bold text-xs flex items-center gap-1"
                            data-stat="score"
                          >
                            ⭐{' '}
                            {(
                              album.final_rating ||
                              album.avg_rating ||
                              0
                            ).toFixed(1)}
                          </span>
                          <span className="text-white/30 text-[11px]">•</span>
                          <span
                            translate="no"
                            className="notranslate text-white/40 text-[11px]"
                            data-stat="count"
                          >
                            {album.review_count || 0} reviews
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Explicación algorítmica y Badges de afinidad */}
                    <div className="space-y-2 bg-black/30 p-3 rounded-2xl border border-white/5">
                      <p className="text-white/70 text-xs leading-relaxed line-clamp-2">
                        {album.primaryReason}
                      </p>

                      {badges.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {badges.map((b, idx) => (
                            <span
                              key={idx}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${b.color} text-white shadow-sm flex items-center gap-1`}
                            >
                              <span>{b.emoji}</span> {b.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                      <button
                        onClick={() => setSelectedAlbumForReview(album)}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        <span>⭐</span> Calificar
                      </button>

                      <button
                        onClick={() => setSelectedAlbumForDetail(album)}
                        className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-semibold border border-white/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>🔍</span> Detalle
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center space-y-4 bg-black/20 rounded-3xl border border-white/5 p-6">
              <div className="text-4xl">🎉</div>
              <h3 className="text-lg font-bold text-white">
                ¡Has calificado todo este segmento!
              </h3>
              <p className="text-white/50 text-xs sm:text-sm max-w-md mx-auto">
                No quedan álbumes pendientes en esta categoría. Puedes explorar
                la pestaña de nuevos descubrimientos o calificar más discos del
                catálogo.
              </p>
              <button
                onClick={() => setFilterCategory('all')}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all"
              >
                Ver Todas las Sugerencias{' '}
                <span translate="no" className="notranslate" data-stat="number">
                  ({recommendations.length})
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO 2: ADN MUSICAL Y CRITERIOS */}
      {activeSection === 'dna' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Desglose de Criterios Ponderados */}
          <div className="rounded-3xl p-6 bg-gradient-to-br from-[#121424] to-[#0a0d18] border border-white/10 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>📊</span> Ponderación de Criterios Técnicos
                </h3>
                <p className="text-white/50 text-xs">
                  Valores calculados analizando las notas técnicas de tus
                  álbumes mejor calificados.
                </p>
              </div>

              <span className="text-xs font-mono bg-white/5 px-3 py-1 rounded-full text-cyan-300 border border-white/10 self-start sm:self-auto">
                Basado en {tasteProfile.totalReviews} reseñas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CRITERIA_DEFINITIONS.map((crit) => {
                const weight = tasteProfile.criteriaWeights?.[crit.key] || 0.5;
                const percentage = Math.round(weight * 100);
                const isTop = tasteProfile.topCriteria?.includes(crit.key);

                return (
                  <div
                    key={crit.key}
                    className={`rounded-2xl p-4 border transition-all ${
                      isTop
                        ? 'bg-gradient-to-br from-white/10 to-white/5 border-amber-400/40 shadow-lg shadow-amber-400/10'
                        : 'bg-black/30 border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{crit.emoji}</span> {crit.label}
                      </span>
                      <span
                        className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                          isTop
                            ? 'bg-amber-400 text-black'
                            : 'bg-white/10 text-white/80'
                        }`}
                      >
                        {percentage}% Afinidad
                      </span>
                    </div>

                    {/* Barra de progreso */}
                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${
                          isTop
                            ? 'from-amber-400 to-yellow-500'
                            : 'from-cyan-400 to-blue-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>

                    <p className="text-white/40 text-[11px] leading-relaxed">
                      {crit.archetypeDesc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Artistas Pilares y Melómanos Afines */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Artistas con mayor afinidad */}
            <div className="rounded-3xl p-6 bg-gradient-to-br from-[#121424] to-[#0a0d18] border border-white/10 shadow-xl space-y-4">
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>👑</span> Tus Artistas de Mayor Calificación
              </h3>
              {tasteProfile.topArtists && tasteProfile.topArtists.length > 0 ? (
                <div className="space-y-2.5">
                  {tasteProfile.topArtists.slice(0, 6).map((art, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          translate="no"
                          className="notranslate w-6 h-6 rounded-full bg-white/10 text-white font-mono text-xs flex items-center justify-center font-bold"
                          data-stat="number"
                        >
                          {idx + 1}
                        </span>
                        <span
                          translate="no"
                          className="notranslate artist-name text-white font-bold text-sm"
                          data-artist={art.name}
                        >
                          {art.name}
                        </span>
                      </div>
                      <span
                        translate="no"
                        className="notranslate text-amber-300 font-bold text-xs"
                        data-stat="score"
                      >
                        ★ {art.avgScore.toFixed(1)} prom.
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-xs italic">
                  Aún no registras suficientes reseñas para listar artistas
                  destacados.
                </p>
              )}
            </div>

            {/* Melómanos Afines (Taste Twins) */}
            <div className="rounded-3xl p-6 bg-gradient-to-br from-[#121424] to-[#0a0d18] border border-white/10 shadow-xl space-y-4">
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>🤝</span> Melómanos Afines de Musiclub
              </h3>
              <p className="text-white/50 text-xs">
                Usuarios con quienes tienes la mayor correlación de
                calificaciones en discos compartidos.
              </p>

              {tasteTwins.length > 0 ? (
                <div className="space-y-3">
                  {tasteTwins.slice(0, 5).map((twin, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-black/40 border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        {twin.avatar_url ? (
                          <img
                            src={twin.avatar_url}
                            alt=""
                            translate="no"
                            className="notranslate w-10 h-10 rounded-full object-cover border border-white/20"
                          />
                        ) : (
                          <div
                            translate="no"
                            className="notranslate w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white font-black text-sm flex items-center justify-center"
                          >
                            {(twin.name || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4
                            translate="no"
                            className="notranslate username-tag user-name text-white font-bold text-sm"
                            data-username={twin.name}
                          >
                            @{twin.name}
                          </h4>
                          <span className="text-white/40 text-[11px]">
                            <span
                              translate="no"
                              className="notranslate font-semibold"
                              data-stat="count"
                            >
                              {twin.commonAlbumsCount}
                            </span>{' '}
                            álbumes evaluados en común
                          </span>
                        </div>
                      </div>

                      <span
                        translate="no"
                        className="notranslate px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black"
                        data-stat="percentage"
                      >
                        {twin.similarity}% Afinidad
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-white/40 text-xs space-y-2">
                  <p>
                    Califica más álbumes que otros miembros hayan calificado
                    para desbloquear a tus gemelos de gusto musical.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO 3: NUEVOS DESCUBRIMIENTOS MUSICALES */}
      {activeSection === 'discoveries' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/40 p-4 rounded-2xl border border-white/10">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>🚀</span> Nuevos Descubrimientos Musicales
              </h3>
              <p className="text-white/50 text-xs">
                Discos fuera del catálogo sugeridos según tu afinidad musical.
                Haz clic en "Escuchar Individual" para agregarlos a tu lista y
                comenzar a calificarlos.
              </p>
            </div>

            <button
              onClick={() => {
                setDiscoveries([]);
                loadMusicalDiscoveries(true);
              }}
              disabled={loadingDiscoveries}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50 active:scale-95 shadow-md"
            >
              <span>🔄</span> Refrescar Sugerencias
            </button>
          </div>

          {loadingDiscoveries ? (
            <div
              translate="no"
              className="notranslate py-20 text-center text-white/50"
            >
              <span className="w-3 h-3 bg-emerald-400 rounded-full animate-ping inline-block mr-2"></span>
              Explorando nuevos descubrimientos musicales...
            </div>
          ) : discoveries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {discoveries.map((alb) => {
                const isProposing = proposingAlbumId === alb.id;

                return (
                  <div
                    key={alb.id}
                    className="rounded-3xl p-4 bg-gradient-to-br from-[#121424] to-[#0a0d18] border border-white/10 hover:border-emerald-500/50 transition-all shadow-xl flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-3">
                      <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                        <img
                          src={
                            alb.image ||
                            'https://via.placeholder.com/300/1a1a2e/ffffff?text=🎵'
                          }
                          alt=""
                          translate="no"
                          className="notranslate w-full h-full object-cover"
                        />
                        <span className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-emerald-300 font-bold border border-emerald-400/30">
                          ✨ Radar Sonoro
                        </span>
                      </div>

                      <div>
                        <h4
                          translate="no"
                          className="notranslate music-title album-name text-white font-extrabold text-sm line-clamp-1"
                          data-album={alb.name}
                        >
                          {alb.name}
                        </h4>
                        <p
                          translate="no"
                          className="notranslate artist-name text-white/60 text-xs line-clamp-1 font-medium"
                          data-artist={alb.artists?.join(', ')}
                        >
                          {alb.artists?.join(', ')}
                        </p>
                      </div>

                      <div className="bg-white/5 p-2.5 rounded-xl text-[11px] text-white/70 leading-relaxed italic border border-white/5">
                        {alb.recommendedBecause}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10">
                      <button
                        onClick={() => handleAddToIndividualList(alb)}
                        disabled={isProposing}
                        className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-black rounded-xl hover:opacity-95 active:scale-95 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {isProposing ? (
                          <>
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin inline-block"></span>
                            <span>Agregando a la lista...</span>
                          </>
                        ) : (
                          <>
                            <span>🎧</span> Escuchar Individual
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-white/40 space-y-2 bg-black/20 rounded-3xl border border-white/5 p-6">
              <p>
                No se encontraron descubrimientos inmediatos. Pulsa en
                "Refrescar Sugerencias" para explorar nuevos horizontes sonoros.
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE RESEÑA RÁPIDA (REVIEW SYSTEM) VÍA CREATEPORTAL */}
      {selectedAlbumForReview &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
            onClick={() => setSelectedAlbumForReview(null)}
          >
            <div
              className="bg-[#121424] border border-white/15 rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto my-auto animate-scaleUp"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedAlbumForReview(null)}
                className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center text-sm z-10 transition-colors"
              >
                ✕
              </button>

              <div className="mb-4 pb-3 border-b border-white/10 flex items-center gap-3">
                <img
                  src={
                    selectedAlbumForReview.image_url ||
                    selectedAlbumForReview.imagen ||
                    'https://via.placeholder.com/100/1a1a2e/ffffff?text=🎵'
                  }
                  alt={
                    selectedAlbumForReview.album_name ||
                    selectedAlbumForReview.album
                  }
                  className="w-14 h-14 rounded-xl object-cover border border-white/15"
                />
                <div>
                  <h3
                    translate="no"
                    className="notranslate music-title album-name text-white font-extrabold text-base sm:text-lg"
                    data-album={
                      selectedAlbumForReview.album_name ||
                      selectedAlbumForReview.album
                    }
                  >
                    {selectedAlbumForReview.album_name ||
                      selectedAlbumForReview.album}
                  </h3>
                  <p
                    translate="no"
                    className="notranslate artist-name text-white/60 text-xs"
                    data-artist={
                      selectedAlbumForReview.artist_name ||
                      selectedAlbumForReview.artista
                    }
                  >
                    {selectedAlbumForReview.artist_name ||
                      selectedAlbumForReview.artista}
                  </p>
                </div>
              </div>

              <ReviewSystem
                album={selectedAlbumForReview}
                isIndividual={true}
                user={user}
                onReviewSubmitted={handleReviewCompleted}
              />
            </div>
          </div>,
          document.body
        )}

      {/* MODAL DE DETALLE Y ESTADÍSTICAS DEL ÁLBUM VÍA CREATEPORTAL */}
      {selectedAlbumForDetail &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
            onClick={() => setSelectedAlbumForDetail(null)}
          >
            <div
              className="bg-[#121424] border border-white/15 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[92vh] overflow-y-auto my-auto animate-scaleUp"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedAlbumForDetail(null)}
                className="absolute top-5 right-5 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 w-9 h-9 rounded-full flex items-center justify-center transition-colors text-lg z-10"
              >
                ✕
              </button>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-white/10 pb-6">
                <img
                  src={
                    selectedAlbumForDetail.image_url ||
                    selectedAlbumForDetail.imagen ||
                    'https://via.placeholder.com/200/1a1a2e/ffffff?text=🎵'
                  }
                  alt={
                    selectedAlbumForDetail.album_name ||
                    selectedAlbumForDetail.album
                  }
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover border-2 border-white/15 shadow-2xl flex-shrink-0"
                />

                <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                  <span
                    translate="no"
                    className={`notranslate px-3 py-1 rounded-full text-xs bg-gradient-to-r ${getCompatibilityColor(
                      selectedAlbumForDetail.compatibilityScore || 75
                    )} inline-block mb-1`}
                    data-stat="score"
                  >
                    ⚡ {selectedAlbumForDetail.compatibilityScore}% Compatible Contigo
                  </span>
                  <h3
                    translate="no"
                    className="notranslate music-title album-name text-xl sm:text-2xl font-black text-white"
                    data-album={
                      selectedAlbumForDetail.album_name ||
                      selectedAlbumForDetail.album
                    }
                  >
                    {selectedAlbumForDetail.album_name ||
                      selectedAlbumForDetail.album}
                  </h3>
                  <p
                    translate="no"
                    className="notranslate artist-name text-white/70 text-sm font-semibold"
                    data-artist={
                      selectedAlbumForDetail.artist_name ||
                      selectedAlbumForDetail.artista
                    }
                  >
                    {selectedAlbumForDetail.artist_name ||
                      selectedAlbumForDetail.artista}
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                    <span
                      translate="no"
                      className="notranslate text-amber-300 font-bold text-xs bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-full"
                      data-stat="score"
                    >
                      ⭐{' '}
                      {(
                        selectedAlbumForDetail.final_rating ||
                        selectedAlbumForDetail.avg_rating ||
                        0
                      ).toFixed(1)}{' '}
                      Promedio
                    </span>
                    <span
                      translate="no"
                      className="notranslate text-white/60 text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-full"
                      data-stat="count"
                    >
                      📝 {selectedAlbumForDetail.review_count || 0} Reviews
                    </span>
                  </div>
                </div>
              </div>

              {/* Motivos de compatibilidad */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-bold text-white/40 tracking-wider">
                  ¿Por qué te lo recomendamos?
                </h4>
                <div className="space-y-1.5">
                  {selectedAlbumForDetail.reasons?.map((reason, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-white/80 flex items-center gap-2"
                    >
                      <span className="text-cyan-400 font-bold">✓</span>{' '}
                      {reason}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tracks del Álbum si están disponibles */}
              {selectedAlbumForDetail.tracks &&
                selectedAlbumForDetail.tracks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs uppercase font-bold text-white/40 tracking-wider">
                      Lista de Canciones{' '}
                      <span
                        translate="no"
                        className="notranslate"
                        data-stat="count"
                      >
                        ({selectedAlbumForDetail.tracks.length})
                      </span>
                    </h4>
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                      {selectedAlbumForDetail.tracks.map((t, idx) => {
                        const tName =
                          typeof t === 'string'
                            ? t
                            : t.name || `Pista ${idx + 1}`;
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-white/5 text-xs text-white/70"
                          >
                            <span
                              translate="no"
                              className="notranslate track-name song-title truncate"
                              data-track={tName}
                            >
                              {idx + 1}. {tName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Acciones */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    const target = selectedAlbumForDetail;
                    setSelectedAlbumForDetail(null);
                    setSelectedAlbumForReview(target);
                  }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white font-bold text-xs hover:opacity-90 transition-all shadow-lg"
                >
                  ⭐ Calificar Este Álbum Ahora
                </button>

                {selectedAlbumForDetail.spotify_link && (
                  <a
                    href={selectedAlbumForDetail.spotify_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-5 rounded-xl bg-[#1DB954]/20 text-[#1DB954] hover:bg-[#1DB954]/30 border border-[#1DB954]/30 font-bold text-xs transition-all flex items-center gap-1.5"
                  >
                    <span>🎵</span> Spotify
                  </a>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Global Footer when rendered as a Page */}
      {isPage && <Footer />}
    </div>
  );
}

export default Recommendations;
