'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';
import { supabaseService, supabase } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { slugifyArtist, getReleaseUrl } from '../utils/ratingUtils';
import { PLACEHOLDER_COVER } from './TierListMaker';
import { fetchAlbumReleaseYear, getAlbumDetails } from '../services/spotifyApi';
import {
  getTrendingReleases,
  getMonthlyTrendingReleases,
  getAnticipatedReleases,
} from '../services/trendingService.js';
import { notifyContentLoaded } from '../utils/translateCrashGuard';
import { ArtistLinks } from './common/ArtistLinks';
import { TrendingMonthlySection } from './catalog/TrendingMonthlySection';
import { AnticipatedSection } from './catalog/AnticipatedSection';
import { RecommendedSection } from './catalog/RecommendedSection';
import { CatalogArtistsView } from './catalog/CatalogArtistsView';
import { CatalogGenresView } from './catalog/CatalogGenresView';

const ITEMS_PER_PAGE = 20;
const SPOTIFY_YEARS_CACHE_KEY = 'musiclub_spotify_years_cache_v1';

const getInitialSpotifyYearsCache = () => {
  try {
    const saved = localStorage.getItem(SPOTIFY_YEARS_CACHE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

// Helper para extraer el año de lanzamiento oficial de un álbum de Spotify
export function getAlbumYear(album, spotifyCache = {}) {
  if (!album) return null;
  // 1. release_year de la base de datos (entero)
  if (album.release_year) {
    const y = parseInt(album.release_year, 10);
    if (!isNaN(y) && y >= 1900 && y <= 2100) return y;
  }
  // 2. release_date de la base de datos (e.g. "1997-06-16")
  if (album.release_date) {
    const y = parseInt(String(album.release_date).substring(0, 4), 10);
    if (!isNaN(y) && y >= 1900 && y <= 2100) return y;
  }
  // 3. fecha_lanzamiento
  if (album.fecha_lanzamiento) {
    const y = parseInt(String(album.fecha_lanzamiento).substring(0, 4), 10);
    if (!isNaN(y) && y >= 1900 && y <= 2100) return y;
  }
  // 4. Cache local de Spotify
  if (spotifyCache) {
    if (album.id && spotifyCache[album.id]) {
      return spotifyCache[album.id];
    }
    const key = `${album.album_name}-${album.artist_name}`.toLowerCase();
    if (spotifyCache[key]) {
      return spotifyCache[key];
    }
  }
  return null;
}

const DECADES = [
  '2020s',
  '2010s',
  '2000s',
  '1990s',
  '1980s',
  '1970s',
  '1960s',
  '1950s',
];

export function AlbumsCatalog({ isPage = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [spotifyYearsCache, setSpotifyYearsCache] = useState({});

  useEffect(() => {
    setSpotifyYearsCache(getInitialSpotifyYearsCache());
  }, []);

  // Pestañas principales inspiradas en Musiclub: 'releases' | 'artists' | 'genres' (V.8.5)
  // Inicializado de forma determinista para evitar hydration mismatch entre SSR y cliente
  const [activeMainTab, setActiveMainTab] = useState('releases');

  // Sincronizar pestaña activa desde la URL en el cliente tras la hidratación inicial
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const tab = p.get('tab') || p.get('seccion');
      if (tab === 'artistas' || tab === 'artists') {
        setActiveMainTab('artists');
      } else if (tab === 'generos' || tab === 'genres') {
        setActiveMainTab('genres');
      } else if (tab === 'releases') {
        setActiveMainTab('releases');
      }
    }
  }, [location.search]);

  const [monthlyTrending, setMonthlyTrending] = useState({
    releases: [],
    monthLabel: 'Tendencias del Mes',
    lastFridayStr: 'Viernes',
  });
  const [anticipatedReleases, setAnticipatedReleases] = useState([]);

  const handleTabChange = (tabKey) => {
    setActiveMainTab(tabKey);
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', tabKey);
    const path = location.pathname || '/catalogo';
    const qs = searchParams.toString();
    navigate(`${path}?${qs}`, { replace: true });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [releaseTypeFilter, setReleaseTypeFilter] = useState('ALL'); // ALL | ALBUM | EP | SENCILLO | COMPILACION
  const [selectedDecade, setSelectedDecade] = useState('2020s');
  const [selectedYearFilter, setSelectedYearFilter] = useState('ALL'); // ALL | '2020s' | 2024 | etc.
  const [sortBy, setSortBy] = useState('rating_desc'); // rating_desc | rating_asc | reviews_desc | newest | name_asc | artist_asc
  const [currentPage, setCurrentPage] = useState(1);

  // Filtro de exploración híbrida estilo Musiclub: ALL | TRENDING | REVIEWED
  const [browseFilter, setBrowseFilter] = useState('ALL');
  const [trendingReleases, setTrendingReleases] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [proposingId, setProposingId] = useState(null);
  const [proposeError, setProposeError] = useState(null);

  // Ingesta On-Demand al vuelo al hacer click en cualquier release en tendencia
  const handleQuickPropose = async (release) => {
    // 1. Si ya existe en la lista de álbumes del club, navegar de inmediato sin esperar
    const existingAlbum = (albums || []).find((a) => {
      const matchName =
        a.album_name?.trim().toLowerCase() === release.album_name?.trim().toLowerCase();
      const matchArtist =
        a.artist_name?.trim().toLowerCase() === release.artist_name?.trim().toLowerCase();
      return matchName && matchArtist;
    });

    if (existingAlbum) {
      const targetUrl = getReleaseUrl(
        existingAlbum.album_name,
        existingAlbum.release_type || 'ALBUM',
        existingAlbum.artist_name
      );
      navigate(targetUrl);
      return;
    }

    const rawId =
      release.spotify_id ||
      (typeof release.id === 'string' && release.id.startsWith('trend_')
        ? release.id.replace('trend_', '')
        : release.id);

    if (proposingId) return;
    setProposingId(rawId || release.album_name);
    setProposeError(null);

    try {
      const details = await getAlbumDetails(rawId);
      const spotifyAlbum = details?.success ? details.album : release;

      const tracks = (spotifyAlbum.tracks || []).map((t) => ({
        id: t.id,
        name: t.name,
        duration_ms: t.duration_ms,
        track_number: t.track_number,
      }));

      const albumPayload = {
        albumName: spotifyAlbum.name || release.album_name,
        artistName: release.artist_name || 'Artista',
        imageUrl: spotifyAlbum.image || release.image_url,
        spotifyLink:
          release.spotify_link ||
          release.spotify_url ||
          spotifyAlbum.external_urls?.spotify,
        addedBy:
          user?.name || user?.email?.split('@')[0] || 'Miembro Musiclub',
        addedByEmail: user?.email || '',
        status: 'INDIVIDUAL',
        tracks: tracks,
        releaseDate: release.release_date || spotifyAlbum.releaseDate || null,
        releaseYear: release.release_date
          ? parseInt(release.release_date.substring(0, 4), 10)
          : null,
        releaseType: release.release_type || 'ALBUM',
        genres: release.genres || [],
        reviews_enabled: true,
      };

      const created = await supabaseService.createAlbum(albumPayload);
      const targetUrl = getReleaseUrl(
        created?.album_name || release.album_name,
        release.release_type || 'ALBUM',
        created?.artist_name || release.artist_name
      );

      navigate(targetUrl);
    } catch (err) {
      console.error('Error al preparar álbum para reseña:', err);
      setProposeError(
        err.message || 'No se pudo abrir el lanzamiento para reseña'
      );
      setTimeout(() => setProposeError(null), 4000);
    } finally {
      setProposingId(null);
    }
  };

  // Sync with URL query param ?tipo=... and ?tab=...
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tipo =
      params.get('tipo') || params.get('type') || params.get('formato');
    if (tipo) {
      const upper = tipo.toUpperCase();
      if (
        [
          'EP',
          'SENCILLO',
          'COMPILACION',
          'EN_VIVO',
          'SOUNDTRACK',
          'REMIX',
          'ALBUM',
          'ALL',
        ].includes(upper)
      ) {
        setReleaseTypeFilter(upper);
      }
    }

    const tab = params.get('tab') || params.get('seccion');
    if (tab === 'artistas' || tab === 'artists') {
      setActiveMainTab('artists');
    } else if (tab === 'generos' || tab === 'genres') {
      setActiveMainTab('genres');
    } else if (tab === 'releases' || tab === 'lanzamientos') {
      setActiveMainTab('releases');
    }
  }, [location.search]);

  // Carga simultánea y unificada: Álbumes en BD de Supabase + Novedades + Tendencias del Mes + Anticipados
  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      setError(null);
      setLoadingTrending(true);
      try {
        const [clubData, trendingData, monthlyData] = await Promise.allSettled([
          supabaseService.getAllAlbumsWithFullStats(),
          getTrendingReleases({ limit: 50 }),
          getMonthlyTrendingReleases(),
        ]);

        let clubList = [];
        if (clubData.status === 'fulfilled' && clubData.value) {
          clubList = clubData.value || [];
          setAlbums(clubList);
        }
        if (trendingData.status === 'fulfilled' && trendingData.value?.releases) {
          setTrendingReleases(trendingData.value.releases);
        }
        if (monthlyData.status === 'fulfilled' && monthlyData.value) {
          setMonthlyTrending(monthlyData.value);
        }

        // Obtener lanzamientos anticipados vinculando los de BD y la curaduría
        const anticipated = await getAnticipatedReleases(clubList);
        setAnticipatedReleases(anticipated);
      } catch (err) {
        console.error('Error loading albums catalog:', err);
        setError('No se pudieron cargar los álbumes.');
      } finally {
        setLoading(false);
        setLoadingTrending(false);
        notifyContentLoaded('catalog');
      }
    }
    loadCatalog();
  }, []);

  // Resolver en background los años de lanzamiento oficiales desde Spotify para álbumes que no lo tengan
  useEffect(() => {
    if (!albums || albums.length === 0) return;

    let isCancelled = false;

    const resolveMissingYears = async () => {
      // Solo intentar resolver para un máximo de 2 álbumes por sesión para proteger cuotas de API
      const missing = albums
        .filter((alb) => !getAlbumYear(alb, spotifyYearsCache))
        .slice(0, 2);
      if (missing.length === 0) return;

      let updatedCache = { ...spotifyYearsCache };
      let hasChanges = false;

      for (const alb of missing) {
        if (isCancelled) break;
        try {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          if (isCancelled) break;

          const res = await fetchAlbumReleaseYear(
            alb.album_name,
            alb.artist_name,
            alb.spotify_link
          );
          if (res && res.releaseYear) {
            const key = `${alb.album_name}-${alb.artist_name}`.toLowerCase();
            if (alb.id) updatedCache[alb.id] = res.releaseYear;
            updatedCache[key] = res.releaseYear;
            hasChanges = true;

            // Si Supabase tiene las columnas habilitadas, actualizamos en background
            if (alb.id) {
              supabase
                .from('albums')
                .update({
                  release_date: res.releaseDate,
                  release_year: res.releaseYear,
                })
                .eq('id', alb.id)
                .then(() => {})
                .catch(() => {});
            }
          }
        } catch {
          // Fallback silencioso sin saturar la consola
        }
      }

      if (hasChanges && !isCancelled) {
        setSpotifyYearsCache(updatedCache);
        try {
          localStorage.setItem(
            SPOTIFY_YEARS_CACHE_KEY,
            JSON.stringify(updatedCache)
          );
        } catch (err) {
          // Ignorar silenciosamente si quota de localStorage está llena
        }
      }
    };

    resolveMissingYears();

    return () => {
      isCancelled = true;
    };
  }, [albums, spotifyYearsCache]);

  // Reset pagination on filter or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, releaseTypeFilter, selectedYearFilter, sortBy, browseFilter]);

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

  // Fusión híbrida de lanzamientos estilo Musiclub (BD Club + Novedades de Spotify)
  const unifiedAlbums = useMemo(() => {
    const list = [];
    const seenMap = new Map();

    // 1. Añadir álbumes oficiales del Club
    (albums || []).forEach((alb) => {
      const key = `${(alb.album_name || '').toLowerCase().trim()}|${(alb.artist_name || '').toLowerCase().trim()}`;
      const decorated = {
        ...alb,
        is_in_club: true,
        is_reviewed:
          (alb.review_count || 0) > 0 ||
          (alb.final_rating !== null && alb.final_rating !== undefined),
        is_trending: false,
      };
      seenMap.set(key, decorated);
      list.push(decorated);
    });

    // 2. Fusionar novedades y tendencias en vivo
    (trendingReleases || []).forEach((trend) => {
      const key = `${(trend.album_name || '').toLowerCase().trim()}|${(trend.artist_name || '').toLowerCase().trim()}`;
      if (seenMap.has(key)) {
        const existing = seenMap.get(key);
        existing.is_trending = true;
      } else {
        list.push({
          id: `trend_${trend.id}`,
          spotify_id: trend.id,
          album_name: trend.album_name,
          artist_name: trend.artist_name,
          image_url: trend.image_url,
          spotify_link: trend.spotify_url,
          release_date: trend.release_date,
          release_year: trend.release_date
            ? parseInt(trend.release_date.substring(0, 4), 10)
            : null,
          release_type: trend.release_type || 'ALBUM',
          total_tracks: trend.total_tracks || 1,
          is_trending: true,
          is_in_club: false,
          is_reviewed: false,
          review_count: 0,
          final_rating: null,
          created_at: trend.updated_at || new Date().toISOString(),
          genres: trend.genres || [],
        });
      }
    });

    return list;
  }, [albums, trendingReleases]);

  // Conteo de lanzamientos por tipo de formato (Álbum, EP, Sencillo, Compilación, En Vivo, Soundtrack, Remix)
  const releaseTypeCounts = useMemo(() => {
    const counts = {
      ALL: unifiedAlbums.length,
      ALBUM: 0,
      EP: 0,
      SENCILLO: 0,
      COMPILACION: 0,
      EN_VIVO: 0,
      SOUNDTRACK: 0,
      REMIX: 0,
    };
    unifiedAlbums.forEach((alb) => {
      const raw = (
        alb.release_type ||
        alb.releaseType ||
        'ALBUM'
      ).toUpperCase();
      if (raw === 'EP' || raw === 'SINGLE_EP') {
        counts.EP++;
      } else if (
        raw === 'SENCILLO' ||
        raw === 'SINGLE' ||
        raw === 'TRACK' ||
        raw === 'CANCIÓN' ||
        raw === 'CANCION'
      ) {
        counts.SENCILLO++;
      } else if (raw === 'COMPILACION' || raw === 'COMPILATION') {
        counts.COMPILACION++;
      } else if (raw === 'EN VIVO' || raw === 'LIVE') {
        counts.EN_VIVO++;
      } else if (raw === 'SOUNDTRACK' || raw === 'BSO') {
        counts.SOUNDTRACK++;
      } else if (raw === 'REMIX') {
        counts.REMIX++;
      } else {
        counts.ALBUM++;
      }
    });
    return counts;
  }, [unifiedAlbums]);

  // Conteo de álbumes por año y década
  const yearCounts = useMemo(() => {
    const counts = { ALL: unifiedAlbums.length };
    unifiedAlbums.forEach((alb) => {
      const y = getAlbumYear(alb, spotifyYearsCache);
      if (y) {
        counts[y] = (counts[y] || 0) + 1;
        const dec = `${Math.floor(y / 10) * 10}s`;
        counts[dec] = (counts[dec] || 0) + 1;
      }
    });
    return counts;
  }, [unifiedAlbums, spotifyYearsCache]);

  // Navegación de décadas estilo AlbumOfTheYear (< 2020s 2020 2021 ... >)
  const currentDecadeIndex = DECADES.indexOf(selectedDecade);
  const canGoOlder = currentDecadeIndex < DECADES.length - 1;
  const canGoNewer = currentDecadeIndex > 0;

  const handlePrevDecade = () => {
    if (canGoOlder) {
      setSelectedDecade(DECADES[currentDecadeIndex + 1]);
    }
  };

  const handleNextDecade = () => {
    if (canGoNewer) {
      setSelectedDecade(DECADES[currentDecadeIndex - 1]);
    }
  };

  const selectYearOrDecade = (val) => {
    setSelectedYearFilter(val);
    if (typeof val === 'number') {
      const dec = `${Math.floor(val / 10) * 10}s`;
      if (DECADES.includes(dec) && dec !== selectedDecade) {
        setSelectedDecade(dec);
      }
    } else if (typeof val === 'string' && val.endsWith('s')) {
      if (DECADES.includes(val)) {
        setSelectedDecade(val);
      }
    }
  };

  // Generar lista de años para la década seleccionada en orden cronológico
  const currentDecadeStart = parseInt(selectedDecade.slice(0, 4), 10);
  const decadeYears = useMemo(() => {
    const maxYear = selectedDecade === '2020s' ? 2026 : currentDecadeStart + 9;
    const list = [];
    for (let y = currentDecadeStart; y <= maxYear; y++) {
      list.push(y);
    }
    return list;
  }, [selectedDecade, currentDecadeStart]);

  // Estadísticas globales unificadas
  const globalStats = useMemo(() => {
    if (!unifiedAlbums || unifiedAlbums.length === 0) {
      return {
        totalAlbums: 0,
        totalClub: 0,
        totalTrending: 0,
        totalReviews: 0,
        topRatedAlbum: null,
        mostReviewedAlbum: null,
        avgClubScore: '0.0',
      };
    }
    const totalAlbums = unifiedAlbums.length;
    const totalClub = albums.length;
    const totalTrending = trendingReleases.length;
    const totalReviews = albums.reduce(
      (sum, a) => sum + (a.review_count || 0),
      0
    );

    const albumsWithRatings = albums.filter(
      (a) => a.final_rating !== null && a.review_count > 0
    );
    const topRatedAlbum =
      albumsWithRatings.length > 0
        ? [...albumsWithRatings].sort(
            (a, b) => b.final_rating - a.final_rating
          )[0]
        : null;

    const mostReviewedAlbum =
      [...albums].sort((a, b) => b.review_count - a.review_count)[0] || null;

    const scoreSum = albumsWithRatings.reduce(
      (sum, a) => sum + (a.final_rating || 0),
      0
    );
    const avgClubScore =
      albumsWithRatings.length > 0
        ? (scoreSum / albumsWithRatings.length).toFixed(1)
        : '0.0';

    return {
      totalAlbums,
      totalClub,
      totalTrending,
      totalReviews,
      topRatedAlbum,
      mostReviewedAlbum,
      avgClubScore,
    };
  }, [unifiedAlbums, albums, trendingReleases]);

  // Álbumes filtrados y ordenados (Musiclub Hybrid Browse)
  const filteredAlbums = useMemo(() => {
    let result = [...unifiedAlbums];

    // Musiclub Collection Filter (ALL | TRENDING | REVIEWED)
    if (browseFilter === 'TRENDING') {
      result = result.filter((a) => a.is_trending);
    } else if (browseFilter === 'REVIEWED') {
      result = result.filter((a) => a.is_in_club || a.is_reviewed);
    }

    // Release Type Filter (Álbumes, EPs, Sencillos/Canciones, Compilaciones, En Vivo, Bandas Sonoras, Remixes)
    if (releaseTypeFilter !== 'ALL') {
      result = result.filter((a) => {
        const raw = (a.release_type || a.releaseType || 'ALBUM').toUpperCase();
        if (releaseTypeFilter === 'ALBUM') {
          return raw === 'ALBUM' || (!a.release_type && !a.releaseType);
        }
        if (releaseTypeFilter === 'EP') {
          return raw === 'EP' || raw === 'SINGLE_EP';
        }
        if (releaseTypeFilter === 'SENCILLO') {
          return (
            raw === 'SENCILLO' ||
            raw === 'SINGLE' ||
            raw === 'TRACK' ||
            raw === 'CANCIÓN' ||
            raw === 'CANCION'
          );
        }
        if (releaseTypeFilter === 'COMPILACION') {
          return raw === 'COMPILACION' || raw === 'COMPILATION';
        }
        if (releaseTypeFilter === 'EN_VIVO') {
          return raw === 'EN VIVO' || raw === 'LIVE';
        }
        if (releaseTypeFilter === 'SOUNDTRACK') {
          return raw === 'SOUNDTRACK' || raw === 'BSO';
        }
        if (releaseTypeFilter === 'REMIX') {
          return raw === 'REMIX';
        }
        return true;
      });
    }

    // Year Filter (Año o Década)
    if (selectedYearFilter !== 'ALL') {
      if (
        typeof selectedYearFilter === 'string' &&
        selectedYearFilter.endsWith('s')
      ) {
        const decadeStart = parseInt(selectedYearFilter.slice(0, 4), 10);
        const decadeEnd = decadeStart + 9;
        result = result.filter((a) => {
          const y = getAlbumYear(a, spotifyYearsCache);
          return y !== null && y >= decadeStart && y <= decadeEnd;
        });
      } else {
        const targetYear = parseInt(selectedYearFilter, 10);
        result = result.filter((a) => {
          const y = getAlbumYear(a, spotifyYearsCache);
          return y === targetYear;
        });
      }
    }

    // Search Query (Buscador universal tanto en club como en novedades)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.album_name?.toLowerCase().includes(q) ||
          a.artist_name?.toLowerCase().includes(q) ||
          a.added_by?.toLowerCase().includes(q) ||
          a.added_by_email?.toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'rating_desc') {
        if (a.final_rating === null && b.final_rating !== null) return 1;
        if (b.final_rating === null && a.final_rating !== null) return -1;
        return (
          (b.final_rating || 0) - (a.final_rating || 0) ||
          (b.review_count || 0) - (a.review_count || 0)
        );
      }
      if (sortBy === 'rating_asc') {
        if (a.final_rating === null && b.final_rating !== null) return 1;
        if (b.final_rating === null && a.final_rating !== null) return -1;
        return (
          (a.final_rating || 0) - (b.final_rating || 0) ||
          (a.review_count || 0) - (b.review_count || 0)
        );
      }
      if (sortBy === 'reviews_desc') {
        return (
          (b.review_count || 0) - (a.review_count || 0) ||
          (b.final_rating || 0) - (a.final_rating || 0)
        );
      }
      if (sortBy === 'newest') {
        return (
          new Date(b.created_at || b.release_date || 0) -
          new Date(a.created_at || a.release_date || 0)
        );
      }
      if (sortBy === 'name_asc') {
        return (a.album_name || '').localeCompare(b.album_name || '');
      }
      if (sortBy === 'artist_asc') {
        return (a.artist_name || '').localeCompare(b.artist_name || '');
      }
      return 0;
    });

    return result;
  }, [
    unifiedAlbums,
    browseFilter,
    releaseTypeFilter,
    selectedYearFilter,
    searchQuery,
    sortBy,
    spotifyYearsCache,
  ]);

  const totalPages = Math.ceil(filteredAlbums.length / ITEMS_PER_PAGE) || 1;
  const paginatedAlbums = useMemo(() => {
    return filteredAlbums.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredAlbums, currentPage]);

  return (
    <div className="min-h-screen cyber-grid p-3 sm:p-6 w-full max-w-full overflow-x-hidden text-white font-sans">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 w-full">
        {/* Universal Standard App Header */}
        <AppHeader showTitle={false} />

        {/* Header Title & Musiclub Aesthetics */}
        <div className="text-center space-y-3 pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 via-cyan-500/20 to-blue-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
            <span>🌐</span>
            <span>Explorador Híbrido · Música en Tiempo Real</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-200">
            Catálogo Musical
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Explora discografías completas, lanzamientos en tendencia e indaga en los álbumes calificados por los miembros del club con desglose de reseñas y canciones.
          </p>
        </div>

        {/* Barra superior de carga no invasiva al abrir o procesar un álbum */}
        {proposingId && (
          <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 animate-pulse shadow-[0_0_12px_rgba(236,72,153,0.7)]" />
        )}

        {/* Notificación discreta de error (solo si ocurre una falla real, sin popups intrusivos) */}
        {proposeError && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#161828]/95 border border-rose-500/40 text-rose-200 text-xs font-medium px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2.5">
            <span className="text-sm">⚠️</span>
            <span>{proposeError}</span>
            <button
              type="button"
              onClick={() => setProposeError(null)}
              className="ml-2 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Musiclub Style Stats Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#12141F]/80 border border-white/10 p-4 sm:p-5 rounded-2xl backdrop-blur-md relative overflow-hidden group hover:border-cyan-500/40 transition-all shadow-lg">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400">
              Releases Disponibles
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">
                4,113,018+
              </span>
            </div>
            <p className="text-[11px] text-cyan-300 font-medium mt-1">
              {globalStats.totalClub} en Club · Base discográfica global
            </p>
          </div>

          <div className="bg-[#12141F]/80 border border-white/10 p-4 sm:p-5 rounded-2xl backdrop-blur-md relative overflow-hidden group hover:border-pink-500/40 transition-all shadow-lg">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400">
              Artistas & Discografías
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">
                2,988,705+
              </span>
            </div>
            <p className="text-[11px] text-pink-300 font-medium mt-1">
              Discografías oficiales y perfiles completos
            </p>
          </div>

          <div className="bg-[#12141F]/80 border border-white/10 p-4 sm:p-5 rounded-2xl backdrop-blur-md relative overflow-hidden group hover:border-amber-500/40 transition-all shadow-lg">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400">
              Reseñas en Club
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-400">
                {loading && globalStats.totalReviews === 0 ? '...' : globalStats.totalReviews}
              </span>
            </div>
            <p className="text-[11px] text-amber-300/80 font-medium mt-1">
              Promedio: {globalStats.avgClubScore} ⭐ por álbum
            </p>
          </div>

          <div className="bg-[#12141F]/80 border border-white/10 p-4 sm:p-5 rounded-2xl backdrop-blur-md relative overflow-hidden group hover:border-yellow-500/40 transition-all shadow-lg">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400">
              Top del Club
            </span>
            <div className="mt-1">
              <p className="text-sm sm:text-base font-black text-yellow-300 truncate">
                {globalStats.topRatedAlbum ? globalStats.topRatedAlbum.album_name : '—'}
              </p>
            </div>
            <p className="text-[11px] text-yellow-200/80 font-semibold mt-1">
              {globalStats.topRatedAlbum ? `${globalStats.topRatedAlbum.final_rating} ⭐ · ${globalStats.topRatedAlbum.artist_name}` : 'Sin calificar'}
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MUSICLUB BROWSE MAIN TABS: Releases | Artistas | Géneros (V.8.5)      */}
        {/* ========================================================================= */}
        <div className="bg-[#12141F]/95 border border-white/10 rounded-2xl p-2 sm:p-2.5 backdrop-blur-xl shadow-2xl flex items-center justify-center gap-2 sm:gap-4 flex-wrap sticky top-16 z-30">
          <button
            type="button"
            onClick={() => handleTabChange('releases')}
            className={`px-5 sm:px-8 py-3 rounded-xl text-xs sm:text-sm md:text-base font-black transition-all flex items-center gap-2.5 cursor-pointer border ${
              activeMainTab === 'releases'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black border-cyan-400 shadow-lg shadow-cyan-500/25 scale-[1.02]'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/5'
            }`}
          >
            <span className="text-base sm:text-lg">💿</span>
            <span>Releases</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('artists')}
            className={`px-5 sm:px-8 py-3 rounded-xl text-xs sm:text-sm md:text-base font-black transition-all flex items-center gap-2.5 cursor-pointer border ${
              activeMainTab === 'artists'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-400 shadow-lg shadow-pink-500/25 scale-[1.02]'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/5'
            }`}
          >
            <span className="text-base sm:text-lg">🎤</span>
            <span>Artistas</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('genres')}
            className={`px-5 sm:px-8 py-3 rounded-xl text-xs sm:text-sm md:text-base font-black transition-all flex items-center gap-2.5 cursor-pointer border ${
              activeMainTab === 'genres'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-purple-400 shadow-lg shadow-purple-500/25 scale-[1.02]'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/5'
            }`}
          >
            <span className="text-base sm:text-lg">🏷️</span>
            <span>Géneros</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* VISTAS CONDICIONALES ESTILO MUSICLUB                                   */}
        {/* ========================================================================= */}
        {activeMainTab === 'artists' ? (
          <CatalogArtistsView albums={albums} />
        ) : activeMainTab === 'genres' ? (
          <CatalogGenresView
            albums={albums}
            onQuickPropose={handleQuickPropose}
            proposingId={proposingId}
          />
        ) : (
          <>
            {/* 1. SECCIÓN DE TRENDING RELEASES MENSUALES (Top 20, mayoría POP, corte semanal viernes) */}
            <TrendingMonthlySection
              trendingData={monthlyTrending}
              loading={loadingTrending}
              onQuickPropose={handleQuickPropose}
              proposingId={proposingId}
            />

            {/* 2. SECCIÓN DE RELEASES ANTICIPADOS (No calificables hasta estreno, indexables) */}
            <AnticipatedSection
              anticipatedReleases={anticipatedReleases}
              loading={loading}
            />

            {/* 3. SECCIÓN DE MÁS RECOMENDADOS POR LOS USUARIOS DEL CLUB */}
            <RecommendedSection albums={albums} />

            {/* 4. SECCIÓN DE CATÁLOGO COMPLETO Y EXPLORADOR */}
            <div className="flex items-center gap-3 pt-6 border-t border-white/10">
              <span className="text-2xl">📚</span>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Explorador de Catálogo y Colección
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Filtra por formato, década y año o busca en los {unifiedAlbums.length} lanzamientos disponibles
                </p>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* BARRA DE AÑOS Y DÉCADAS (ESTILO ALBUMOFTHEYEAR.ORG)                        */}
            {/* ========================================================================= */}
            <div className="bg-[#151722]/95 border border-white/10 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md shadow-xl relative space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm">📅</span>
              <span className="text-xs sm:text-sm font-black text-white tracking-wide uppercase">
                Años y Décadas
              </span>

              {selectedYearFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedYearFilter('ALL')}
                  className="text-[11px] text-pink-300 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 px-2.5 py-0.5 rounded-full font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Restablecer filtro de año"
                >
                  <span>
                    Filtro:{' '}
                    <strong className="text-white">
                      {typeof selectedYearFilter === 'number'
                        ? selectedYearFilter
                        : selectedYearFilter}
                    </strong>{' '}
                    (
                    <span
                      translate="no"
                      className="notranslate"
                      data-stat="number"
                    >
                      {filteredAlbums.length}
                    </span>{' '}
                    {filteredAlbums.length === 1 ? 'álbum' : 'álbumes'})
                  </span>
                  <span className="text-pink-400 font-black">✕</span>
                </button>
              )}
            </div>

            {/* Selector rápido de Décadas */}
            <div className="flex items-center gap-1 overflow-x-auto max-w-full scrollbar-none py-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 hidden sm:inline">
                Década:
              </span>
              {DECADES.map((dec) => {
                const count = yearCounts[dec] || 0;
                const isCurrentDecade = selectedDecade === dec;
                return (
                  <button
                    key={dec}
                    type="button"
                    onClick={() => {
                      setSelectedDecade(dec);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      isCurrentDecade
                        ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400 font-black'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {dec}
                    {count > 0 && (
                      <span className="ml-1 text-[9px] opacity-70">
                        ({count})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Carril Principal Estilo AlbumOfTheYear: < 2020s 2020 2021 2022 2023 2024 2025 2026 > */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 scrollbar-none w-full">
            {/* Botón TODOS */}
            <button
              type="button"
              onClick={() => setSelectedYearFilter('ALL')}
              className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer select-none ${
                selectedYearFilter === 'ALL'
                  ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-lg shadow-pink-500/25 ring-2 ring-pink-400/50 font-black scale-105'
                  : 'bg-black/40 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              <span>Todos</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  selectedYearFilter === 'ALL'
                    ? 'bg-black/30 text-white'
                    : 'bg-white/10 text-slate-400'
                }`}
              >
                {yearCounts.ALL || 0}
              </span>
            </button>

            {/* Flechita Izquierda: Década Anterior */}
            <button
              type="button"
              onClick={handlePrevDecade}
              disabled={!canGoOlder}
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-black transition-all text-sm flex-shrink-0 cursor-pointer border ${
                canGoOlder
                  ? 'bg-white/10 hover:bg-white/20 text-white border-white/20 hover:scale-105 shadow'
                  : 'bg-white/5 text-slate-600 border-white/5 cursor-not-allowed opacity-40'
              }`}
              title={
                canGoOlder
                  ? `Ir a década anterior (${DECADES[currentDecadeIndex + 1]})`
                  : 'No hay décadas anteriores'
              }
            >
              ‹
            </button>

            {/* Botón de la Década Activa (ej: 2020s) */}
            <button
              type="button"
              onClick={() => selectYearOrDecade(selectedDecade)}
              className={`px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer select-none border ${
                selectedYearFilter === selectedDecade
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 ring-2 ring-purple-400 scale-105 border-purple-400'
                  : 'bg-purple-950/50 hover:bg-purple-900/70 text-purple-200 border-purple-500/40 hover:border-purple-400'
              }`}
              title={`Filtrar toda la década ${selectedDecade}`}
            >
              <span>{selectedDecade}</span>
              {(yearCounts[selectedDecade] || 0) > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    selectedYearFilter === selectedDecade
                      ? 'bg-black/40 text-white'
                      : 'bg-purple-500/25 text-purple-200'
                  }`}
                >
                  {yearCounts[selectedDecade]}
                </span>
              )}
            </button>

            {/* Años de la Década Activa en orden cronológico (2020, 2021, 2022...) */}
            {decadeYears.map((yr) => {
              const count = yearCounts[yr] || 0;
              const isSelected =
                selectedYearFilter === yr || selectedYearFilter === String(yr);

              return (
                <button
                  key={yr}
                  type="button"
                  onClick={() => selectYearOrDecade(yr)}
                  className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer select-none border ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-lg shadow-pink-500/25 ring-2 ring-pink-400/50 font-black scale-105 border-pink-400'
                      : count > 0
                        ? 'bg-black/50 text-slate-200 hover:bg-white/15 hover:text-white border-white/10'
                        : 'bg-black/20 text-slate-500 hover:text-slate-300 border-white/5 opacity-60'
                  }`}
                >
                  <span>{yr}</span>
                  {count > 0 && (
                    <span
                      className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        isSelected
                          ? 'bg-black/30 text-white'
                          : 'bg-white/10 text-cyan-300'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Flechita Derecha: Siguiente Década */}
            <button
              type="button"
              onClick={handleNextDecade}
              disabled={!canGoNewer}
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-black transition-all text-sm flex-shrink-0 cursor-pointer border ${
                canGoNewer
                  ? 'bg-white/10 hover:bg-white/20 text-white border-white/20 hover:scale-105 shadow'
                  : 'bg-white/5 text-slate-600 border-white/5 cursor-not-allowed opacity-40'
              }`}
              title={
                canGoNewer
                  ? `Ir a siguiente década (${DECADES[currentDecadeIndex - 1]})`
                  : 'No hay décadas más recientes'
              }
            >
              ›
            </button>
          </div>
        </div>

        {/* Format / Tipo de Lanzamiento Bar */}
        <div className="bg-[#151722]/90 border border-white/5 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">💽</span>
            <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              Formato
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {[
              {
                id: 'ALL',
                label: 'Todos',
                icon: '🎧',
                count: releaseTypeCounts.ALL,
              },
              {
                id: 'ALBUM',
                label: 'Álbumes',
                icon: '💿',
                count: releaseTypeCounts.ALBUM,
              },
              {
                id: 'EP',
                label: 'EPs',
                icon: '💽',
                count: releaseTypeCounts.EP,
              },
              {
                id: 'SENCILLO',
                label: 'Sencillos',
                icon: '🎵',
                count: releaseTypeCounts.SENCILLO,
              },
              {
                id: 'COMPILACION',
                label: 'Compilaciones',
                icon: '📦',
                count: releaseTypeCounts.COMPILACION,
              },
              ...(releaseTypeCounts.EN_VIVO > 0
                ? [
                    {
                      id: 'EN_VIVO',
                      label: 'En Vivo',
                      icon: '🎤',
                      count: releaseTypeCounts.EN_VIVO,
                    },
                  ]
                : []),
              ...(releaseTypeCounts.SOUNDTRACK > 0
                ? [
                    {
                      id: 'SOUNDTRACK',
                      label: 'Soundtracks',
                      icon: '🎬',
                      count: releaseTypeCounts.SOUNDTRACK,
                    },
                  ]
                : []),
              ...(releaseTypeCounts.REMIX > 0
                ? [
                    {
                      id: 'REMIX',
                      label: 'Remixes',
                      icon: '🎛️',
                      count: releaseTypeCounts.REMIX,
                    },
                  ]
                : []),
            ].map((fmt) => {
              const isSelected = releaseTypeFilter === fmt.id;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setReleaseTypeFilter(fmt.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black border-cyan-400 font-black shadow-lg shadow-cyan-500/20 scale-105'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                  }`}
                >
                  <span>{fmt.icon}</span>
                  <span>{fmt.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected
                        ? 'bg-black/30 text-black font-black'
                        : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {fmt.count || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Musiclub Hybrid Browse & Filter Bar */}
        <div className="bg-[#12141F]/90 border border-white/10 rounded-2xl p-3.5 sm:p-5 flex flex-col lg:flex-row gap-3 sm:gap-4 justify-between items-stretch lg:items-center shadow-xl">
          {/* Musiclub Hybrid Browse Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {[
              { id: 'ALL', label: 'Todo el Catálogo', count: unifiedAlbums.length, icon: '🌐' },
              { id: 'REVIEWED', label: 'Calificados en Club', count: albums.length, icon: '⭐' },
            ].map((tab) => {
              const active = browseFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setBrowseFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    active
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black border-cyan-400 shadow-md shadow-cyan-500/25 scale-[1.02]'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      active ? 'bg-black/30 text-black' : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 w-full min-w-[200px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Buscar álbum, artista o curador en el catálogo..."
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

          {/* Quick Pool Shortcut */}
          <Link
            to="/pool"
            className="px-4 py-2 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-300 hover:text-white text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0"
          >
            <span>🗳️</span>
            <span>Pool Musical</span>
          </Link>

          {/* Sorting */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <label className="text-xs text-slate-400 whitespace-nowrap">
              Ordenar:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto bg-black/60 border border-white/10 rounded-xl text-xs text-white px-3 py-2.5 focus:outline-none focus:border-cyan-400/70 cursor-pointer font-medium"
            >
              <option value="rating_desc">🌟 Mayor Calificación</option>
              <option value="rating_asc">📉 Menor Calificación</option>
              <option value="reviews_desc">📝 Más Reseñas</option>
              <option value="newest">🕒 Más Recientes</option>
              <option value="name_asc">🔤 Álbum (A-Z)</option>
              <option value="artist_asc">🎤 Artista (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Albums Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="inline-block w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">
              Cargando catálogo de álbumes y estadísticas...
            </p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center text-red-400">
            {error}
          </div>
        ) : filteredAlbums.length === 0 ? (
          <div className="p-12 bg-white/5 border border-white/5 rounded-3xl text-center space-y-3">
            <span className="text-4xl">🎵</span>
            <h3 className="text-lg font-bold text-white">
              No se encontraron álbumes
            </h3>
            <p className="text-slate-400 text-xs">
              {selectedYearFilter !== 'ALL'
                ? `No hay álbumes registrados para el año/década ${selectedYearFilter}.`
                : 'Intenta cambiar los filtros o el término de búsqueda.'}
            </p>
            {selectedYearFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedYearFilter('ALL')}
                className="mt-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-xl transition-all shadow-md inline-block"
              >
                Ver todos los años
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-4">
              {paginatedAlbums.map((album) => {
                const isMine = isUserAlbum(album);
                const score =
                  album.final_rating !== null &&
                  album.final_rating !== undefined &&
                  !isNaN(Number(album.final_rating))
                    ? Number(album.final_rating)
                    : null;
                const albumYear = getAlbumYear(album, spotifyYearsCache);
                const isCardInClub = album.is_in_club;
                const clubUrl = isCardInClub ? getReleaseUrl(album) : null;
                const isProposing =
                  Boolean(proposingId) &&
                  (proposingId === (album.spotify_id || album.id) ||
                    proposingId === album.album_name);

                const handleCardClick = (e) => {
                  if (isProposing) return;
                  if (isCardInClub && clubUrl) {
                    navigate(clubUrl);
                  } else {
                    handleQuickPropose(album);
                  }
                };

                return (
                  <div
                    key={album.id}
                    onClick={handleCardClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardClick(e);
                      }
                    }}
                    className={`bg-[#11131E]/95 rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl cursor-pointer flex flex-col group relative select-none ${
                      isMine
                        ? 'border-yellow-400 ring-2 ring-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.25)] hover:border-yellow-300'
                        : album.status === 'GANADOR'
                          ? 'border-[#f5576c] shadow-[0_0_20px_rgba(245,87,108,0.2)]'
                          : album.is_trending && !isCardInClub
                            ? 'border-orange-500/30 hover:border-orange-400/80 shadow-[0_4px_25px_rgba(249,115,22,0.15)]'
                            : 'border-white/10 hover:border-cyan-400/50 shadow-[0_4px_25px_rgba(6,182,212,0.1)]'
                    }`}
                  >
                    {/* Artwork Container */}
                    <div className="relative aspect-square overflow-hidden bg-black/50">
                      <img
                        src={album.image_url || PLACEHOLDER_COVER}
                        alt={album.album_name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = PLACEHOLDER_COVER;
                        }}
                      />

                      {/* Top Badges (Musiclub style floating badges) */}
                      <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
                        {album.release_type && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border backdrop-blur-md shadow-sm bg-black/80 text-cyan-300 border-cyan-500/40">
                            {album.release_type}
                          </span>
                        )}
                      </div>

                      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                        {album.is_trending && !isCardInClub && (
                          <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-[9px] px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 border border-amber-300/40">
                            🔥 Tendencia 2026
                          </span>
                        )}
                        {score !== null && (
                          <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md border border-amber-500/40 px-2 py-0.5 rounded-lg shadow-sm">
                            <span className="text-amber-400 text-xs font-black">
                              {score.toFixed(2)}
                            </span>
                            <span className="text-[10px]">⭐</span>
                          </div>
                        )}
                      </div>

                      {/* Bottom overlay: Year & Status */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2.5 sm:p-3 flex items-end justify-between">
                        <div className="flex items-center gap-1.5">
                          {albumYear ? (
                            <span className="text-[10px] font-mono font-bold text-slate-300 bg-black/60 backdrop-blur-md border border-white/10 px-1.5 py-0.5 rounded">
                              {albumYear}
                            </span>
                          ) : null}
                          {Number(album.bonus) > 0 && (
                            <span className="text-[9px] text-cyan-300 font-bold bg-cyan-500/20 px-1 py-0.2 rounded border border-cyan-500/30">
                              +{Number(album.bonus).toFixed(2)}
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] sm:text-[11px] text-slate-300 bg-black/70 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-lg font-medium">
                          {isCardInClub
                            ? `📝 ${album.review_count || 0}`
                            : '⚡ En vivo'}
                        </div>
                      </div>
                    </div>

                    {/* Info Body */}
                    <div className="p-3 sm:p-4 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <h3
                          translate="no"
                          className="notranslate font-bold text-white text-sm sm:text-base group-hover:text-cyan-300 transition-colors line-clamp-1"
                          title={album.album_name}
                        >
                          {album.album_name}
                        </h3>
                        <div className="mt-1">
                          <ArtistLinks
                            artistName={album.artist_name}
                            className="text-xs text-slate-400 line-clamp-1"
                            linkClassName="hover:text-cyan-400 hover:underline transition-colors notranslate"
                          />
                        </div>
                      </div>

                      {/* Best Track Highlight if available */}
                      {album.best_track && (
                        <div className="bg-white/5 border border-white/5 rounded-xl p-2 text-xs flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-1 min-w-0 pr-1">
                            <span className="text-amber-400 text-[10px]">
                              👑
                            </span>
                            <span
                              translate="no"
                              className="notranslate track-name text-slate-300 truncate text-[10px] sm:text-[11px]"
                            >
                              {album.best_track.name}
                            </span>
                          </div>
                          <span className="text-amber-300 font-bold text-[10px] sm:text-[11px] whitespace-nowrap">
                            {album.best_track.avg_rating} ⭐
                          </span>
                        </div>
                      )}

                      {/* Action Button at bottom of card */}
                      <div className="pt-2 border-t border-white/5 mt-auto">
                        {isCardInClub ? (
                          <div className="w-full py-1.5 px-3 rounded-xl bg-white/5 group-hover:bg-cyan-500/20 text-slate-300 group-hover:text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-transparent group-hover:border-cyan-500/30">
                            <span>🎧</span>
                            <span>Ver Álbum</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleQuickPropose(album);
                            }}
                            disabled={isProposing}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 shadow-sm ${
                              isProposing
                                ? 'bg-orange-500/30 text-orange-200 border border-orange-400/50'
                                : 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 hover:from-orange-500 hover:to-amber-500 text-orange-300 hover:text-black border border-orange-500/40 hover:border-amber-400'
                            }`}
                          >
                            {isProposing ? (
                              <svg
                                className="animate-spin h-3.5 w-3.5 text-orange-300"
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
                              <span>✍️</span>
                            )}
                            <span>
                              {isProposing
                                ? 'Abriendo...'
                                : 'Reseñar en Club'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-6 pb-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
                <div className="text-xs text-slate-400">
                  Mostrando{' '}
                  <span
                    translate="no"
                    className="notranslate text-white font-bold"
                    data-stat="number"
                  >
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>{' '}
                  a{' '}
                  <span
                    translate="no"
                    className="notranslate text-white font-bold"
                    data-stat="number"
                  >
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredAlbums.length
                    )}
                  </span>{' '}
                  de{' '}
                  <span
                    translate="no"
                    className="notranslate text-cyan-400 font-bold"
                    data-stat="number"
                  >
                    {filteredAlbums.length}
                  </span>{' '}
                  álbumes
                </div>

                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  <button
                    onClick={() => {
                      setCurrentPage(1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 border border-white/10 transition-all"
                    title="Primera Página"
                  >
                    «
                  </button>

                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 border border-white/10 transition-all flex items-center gap-1"
                  >
                    <span>←</span> Anterior
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 2
                      );
                    })
                    .map((page, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && page - prev > 1;

                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && (
                            <span className="text-slate-600 px-1 text-xs">
                              ...
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setCurrentPage(page);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`min-w-[32px] h-8 rounded-xl text-xs font-bold transition-all border ${
                              currentPage === page
                                ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/20'
                                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 border border-white/10 transition-all flex items-center gap-1"
                  >
                    Siguiente <span>→</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentPage(totalPages);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 border border-white/10 transition-all"
                    title="Última Página"
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </>
        )}
          </>
        )}

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
