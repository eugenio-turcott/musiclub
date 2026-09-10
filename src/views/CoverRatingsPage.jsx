'use client';
// src/pages/CoverRatingsPage.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Link,
  useSearchParams,
  useParams,
  useLocation,
} from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';
import { LoginModal } from '../components/LoginModal';
import { useAuth } from '../hooks/useAuth';
import { useAlbums } from '../hooks/useAlbums';
import { useCoverRatings } from '../hooks/useCoverRatings';
import { supabaseService } from '../services/supabaseClient';
import { getReleaseUrl } from '../utils/ratingUtils';
import { notifyContentLoaded } from '../utils/translateCrashGuard';

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const AESTHETIC_TAGS = [
  {
    id: 'Fotografía',
    label: '📷 Fotografía',
    desc: 'Retrato, paisaje o captura fotográfica real',
  },
  {
    id: 'Ilustración',
    label: '🎨 Ilustración',
    desc: 'Dibujo tradicional o arte gráfico digital',
  },
  {
    id: 'Minimalista',
    label: '◽ Minimalista',
    desc: 'Diseño limpio, espacios negativos y sutileza',
  },
  {
    id: 'Psicodélico',
    label: '🌀 Psicodélico',
    desc: 'Patrones caleidoscópicos, colores intensos y distorsión',
  },
  {
    id: 'Surrealista',
    label: '👁️ Surrealista',
    desc: 'Conceptos oníricos, simbolismo y fantasía',
  },
  {
    id: 'Tipográfico',
    label: '🔤 Tipográfico',
    desc: 'El texto, letras o caligrafía son los protagonistas',
  },
  {
    id: 'Retro/Vintage',
    label: '📼 Retro / Vintage',
    desc: 'Nostalgia analógica, grano vinilo y estética de época',
  },
  {
    id: 'Cyberpunk',
    label: '⚡ Cyberpunk',
    desc: 'Futurismo, neones, distopía y alta tecnología',
  },
  {
    id: 'Oscuro/Gótico',
    label: '🌑 Oscuro / Gótico',
    desc: 'Sombras densas, misterio, drama y melancolía',
  },
  {
    id: 'Collage',
    label: '✂️ Collage',
    desc: 'Recortes, superposición de capas y técnicas mixtas',
  },
  {
    id: 'Abstracto',
    label: '🔶 Abstracto',
    desc: 'Formas geométricas, texturas y sinestesia visual',
  },
  {
    id: 'Pintura',
    label: '🖌️ Pintura al Óleo/Acrílico',
    desc: 'Trazos pictóricos clásicos o modernos',
  },
];

function getCoverScoreBadge(score) {
  const num = Number(score);
  if (isNaN(num) || num <= 0)
    return {
      label: 'Sin calificar',
      color: 'text-white/40 bg-white/5 border-white/10',
    };
  if (num === 10)
    return {
      label: '🖼️ Obra Maestra Suprema',
      color: 'text-amber-300 bg-amber-500/20 border-amber-500/40',
    };
  if (num >= 9.0)
    return {
      label: '✨ Icónica & Legendaria',
      color: 'text-pink-300 bg-pink-500/20 border-pink-500/40',
    };
  if (num >= 8.0)
    return {
      label: '🎨 Gran Dirección de Arte',
      color: 'text-purple-300 bg-purple-500/20 border-purple-500/40',
    };
  if (num >= 7.0)
    return {
      label: '🖌️ Agradable & Efectiva',
      color: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/40',
    };
  if (num >= 6.0)
    return {
      label: '📐 Cumple su Cometido',
      color: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40',
    };
  if (num >= 5.0)
    return {
      label: '😐 Genérica / Promedio',
      color: 'text-yellow-300 bg-yellow-500/20 border-yellow-500/40',
    };
  if (num >= 3.0)
    return {
      label: '❌ Pobre o Desacertada',
      color: 'text-orange-300 bg-orange-500/20 border-orange-500/40',
    };
  return {
    label: '🗑️ Desastre Visual',
    color: 'text-rose-400 bg-rose-500/20 border-rose-500/40',
  };
}

export function CoverRatingsPage() {
  const [searchParams] = useSearchParams();
  const { slug: routeSlug } = useParams();
  const location = useLocation();
  const { user, loading: authLoading, loginWithGoogle, logout } = useAuth();
  const { albums, loading: albumsLoading } = useAlbums();
  const { ratings, coverStats, userRatingsMap, submitRating, deleteRating } =
    useCoverRatings(user);

  // Estados de navegación y filtros
  const [activeTab, setActiveTab] = useState('curator'); // 'curator' | 'hall' | 'my-ratings'
  const [selectedAlbumIndex, setSelectedAlbumIndex] = useState(0);
  const [onlyUnrated, setOnlyUnrated] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [hallSortBy, setHallSortBy] = useState('score'); // 'score' | 'votes' | 'recent'
  const [hallTagFilter, setHallTagFilter] = useState('ALL');

  // IDs de álbumes que tienen al menos 1 reseña en la plataforma
  const [reviewedAlbumIds, setReviewedAlbumIds] = useState(null);
  const [loadingReviewedIds, setLoadingReviewedIds] = useState(true);

  // Lista aleatoria de álbumes (barajada para que el orden sea SIEMPRE aleatorio)
  const [shuffledAlbums, setShuffledAlbums] = useState([]);

  // Estados del formulario interactivo
  const [ratingInput, setRatingInput] = useState(8.0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState(null);

  // Modales
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isFullscreenMuseum, setIsFullscreenMuseum] = useState(false);

  // Cargar IDs de todos los álbumes con al menos 1 reseña registrada
  useEffect(() => {
    let isMounted = true;
    async function fetchReviewedIds() {
      try {
        setLoadingReviewedIds(true);
        const ids = await supabaseService.getAllReviewedAlbumIds();
        if (isMounted) {
          setReviewedAlbumIds(ids);
        }
      } catch (err) {
        console.error('Error al cargar IDs de álbumes con reseña:', err);
        if (isMounted) {
          setReviewedAlbumIds(new Set());
        }
      } finally {
        if (isMounted) {
          setLoadingReviewedIds(false);
        }
      }
    }
    fetchReviewedIds();
    return () => {
      isMounted = false;
    };
  }, []);

  // Lista de álbumes elegibles: con portada válida y que tengan AL MENOS 1 reseña
  const eligibleAlbums = useMemo(() => {
    if (!albums || albums.length === 0 || !reviewedAlbumIds) return [];

    const requestedId = searchParams.get('id');
    const requestedSlug = routeSlug || searchParams.get('album');

    return albums.filter((a) => {
      const img = a.image_url || a.imagen;
      const hasImage = img && typeof img === 'string' && img.trim().length > 5;
      if (!hasImage) return false;

      // Si fue solicitado directamente por URL o slug, permitirlo
      if (
        (requestedId && a.id === requestedId) ||
        (requestedSlug &&
          (a.album_name || a.album || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .includes(requestedSlug.toLowerCase()))
      ) {
        return true;
      }

      // Requisito estricto: todos los releases que tengan al menos 1 reseña
      const idStr = String(a.id || '').trim();
      const hasReview =
        (reviewedAlbumIds &&
          (reviewedAlbumIds.has(a.id) ||
            reviewedAlbumIds.has(idStr) ||
            reviewedAlbumIds.has(idStr.toLowerCase()))) ||
        (a.review_count && a.review_count > 0) ||
        (a.reviews_count && a.reviews_count > 0) ||
        (Array.isArray(a.reviews) && a.reviews.length > 0);

      return Boolean(hasReview);
    });
  }, [albums, reviewedAlbumIds, searchParams, routeSlug]);

  // Mantener el orden aleatorio SIEMPRE para Calificar Portadas
  useEffect(() => {
    if (eligibleAlbums.length > 0) {
      setShuffledAlbums((prev) => {
        // Si ya tenemos los mismos álbumes barajados, evitamos re-barajar innecesariamente durante la sesión
        if (prev.length === eligibleAlbums.length) {
          const prevIds = new Set(prev.map((a) => a.id));
          const allMatch = eligibleAlbums.every((a) => prevIds.has(a.id));
          if (allMatch) return prev;
        }
        return shuffleArray(eligibleAlbums);
      });
    } else {
      setShuffledAlbums([]);
    }
  }, [eligibleAlbums]);

  // Re-barajar aleatoriamente si el usuario navega a /portadas (nueva visita / cambio en location.key)
  const initialMountRef = useRef(true);
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }
    if (eligibleAlbums.length > 0) {
      setShuffledAlbums(shuffleArray(eligibleAlbums));
      setSelectedAlbumIndex(0);
    }
  }, [location.key, eligibleAlbums]);

  // Lista filtrada para el modo curador (siempre preservando el orden aleatorio)
  const curatorPool = useMemo(() => {
    let pool = [...shuffledAlbums];
    if (onlyUnrated && userRatingsMap.size > 0) {
      pool = pool.filter((a) => !userRatingsMap.has(a.id));
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      pool = pool.filter(
        (a) =>
          (a.album_name || a.album || '').toLowerCase().includes(q) ||
          (a.artist_name || a.artista || '').toLowerCase().includes(q)
      );
    }
    return pool;
  }, [shuffledAlbums, onlyUnrated, userRatingsMap, searchFilter]);

  // Clampear índice si la lista filtrada cambia de tamaño
  useEffect(() => {
    if (curatorPool.length > 0 && selectedAlbumIndex >= curatorPool.length) {
      setSelectedAlbumIndex(Math.max(0, curatorPool.length - 1));
    }
  }, [curatorPool.length, selectedAlbumIndex]);

  const currentDisplayIndex =
    curatorPool.length > 0
      ? Math.max(0, Math.min(selectedAlbumIndex, curatorPool.length - 1))
      : 0;

  // Álbum actualmente seleccionado
  const currentAlbum = useMemo(() => {
    if (curatorPool.length === 0) return null;
    return curatorPool[currentDisplayIndex];
  }, [curatorPool, currentDisplayIndex]);

  // Calificación del usuario para el álbum actual
  const currentUserRating = useMemo(() => {
    if (!currentAlbum) return null;
    return userRatingsMap.get(currentAlbum.id) || null;
  }, [currentAlbum, userRatingsMap]);

  // Estadísticas comunitarias del álbum actual
  const currentAlbumStats = useMemo(() => {
    if (!currentAlbum) return null;
    return coverStats.get(currentAlbum.id) || null;
  }, [currentAlbum, coverStats]);

  // Sincronizar inputs al cambiar de álbum
  useEffect(() => {
    if (currentUserRating) {
      setRatingInput(Number(currentUserRating.rating) || 8.0);
      setSelectedTags(
        Array.isArray(currentUserRating.aesthetic_tags)
          ? currentUserRating.aesthetic_tags
          : []
      );
      setCommentInput(currentUserRating.comment || '');
    } else {
      setRatingInput(8.0);
      setSelectedTags([]);
      setCommentInput('');
    }
    setSubmitFeedback(null);
  }, [currentUserRating, currentAlbum?.id]);

  // Detectar parámetro ?album=slug o ?id=... o /portada/:slug
  useEffect(() => {
    const requestedId = searchParams.get('id');
    const requestedSlug = routeSlug || searchParams.get('album');
    if ((requestedId || requestedSlug) && shuffledAlbums.length > 0) {
      const foundIdx = shuffledAlbums.findIndex(
        (a) =>
          (requestedId && a.id === requestedId) ||
          (requestedSlug &&
            (a.album_name || a.album || '')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .includes(requestedSlug.toLowerCase()))
      );
      if (foundIdx >= 0) {
        setSelectedAlbumIndex(foundIdx);
        setActiveTab('curator');
      }
    }
  }, [searchParams, routeSlug, shuffledAlbums]);

  useEffect(() => {
    notifyContentLoaded('cover-ratings');
  }, []);

  // Manejo de teclado para cambiar de portada (Flechas ← →)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignorar si el usuario está escribiendo en un input o textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedAlbumIndex((prev) =>
          curatorPool.length <= 1 ? prev : (prev + 1) % curatorPool.length
        );
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedAlbumIndex((prev) =>
          curatorPool.length <= 1
            ? prev
            : (prev - 1 + curatorPool.length) % curatorPool.length
        );
      } else if (e.key === 'Escape' && isFullscreenMuseum) {
        setIsFullscreenMuseum(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [curatorPool.length, isFullscreenMuseum]);

  // Navegación entre portadas
  const handleNextAlbum = () => {
    if (curatorPool.length <= 1) return;
    setSelectedAlbumIndex((prev) => (prev + 1) % curatorPool.length);
  };

  const handlePrevAlbum = () => {
    if (curatorPool.length <= 1) return;
    setSelectedAlbumIndex(
      (prev) => (prev - 1 + curatorPool.length) % curatorPool.length
    );
  };

  const handleRandomAlbum = () => {
    if (curatorPool.length <= 1) return;
    let rand = Math.floor(Math.random() * curatorPool.length);
    if (rand === selectedAlbumIndex && curatorPool.length > 1) {
      rand = (rand + 1) % curatorPool.length;
    }
    setSelectedAlbumIndex(rand);
  };

  const handleReshuffle = () => {
    if (eligibleAlbums.length <= 1) return;
    setShuffledAlbums(shuffleArray(eligibleAlbums));
    setSelectedAlbumIndex(0);
  };

  const isLoading = albumsLoading || (loadingReviewedIds && !reviewedAlbumIds);

  // Toggle de tags estéticos
  const toggleTag = (tagId) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((t) => t !== tagId);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), tagId]; // Máximo 4 tags
      }
      return [...prev, tagId];
    });
  };

  // Guardar calificación
  const handleSubmitRating = async (e) => {
    if (e) e.preventDefault();
    if (!currentAlbum) return;

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitFeedback(null);

      await submitRating({
        album_id: currentAlbum.id,
        rating: ratingInput,
        aesthetic_tags: selectedTags,
        comment: commentInput,
      });

      setSubmitFeedback({
        type: 'success',
        text: '¡Calificación de portada registrada con éxito!',
      });

      // Limpiar feedback tras 3.5 segundos
      setTimeout(() => setSubmitFeedback(null), 3500);
    } catch (err) {
      setSubmitFeedback({
        type: 'error',
        text: 'Hubo un error al guardar tu calificación.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar calificación
  const handleDeleteRating = async () => {
    if (!currentAlbum) return;
    if (!window.confirm('¿Deseas eliminar tu calificación para esta portada?'))
      return;

    try {
      setIsSubmitting(true);
      await deleteRating(currentAlbum.id);
      setSubmitFeedback({
        type: 'success',
        text: 'Calificación eliminada correctamente.',
      });
      setTimeout(() => setSubmitFeedback(null), 3000);
    } catch (err) {
      setSubmitFeedback({
        type: 'error',
        text: 'Error al eliminar la calificación.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Estadísticas globales de portadas
  const globalCoverMetrics = useMemo(() => {
    const totalRatedAlbums = coverStats.size;
    const totalVotes = ratings.length;
    let sum = 0;
    ratings.forEach((r) => {
      const num = Number(r.rating);
      if (!isNaN(num)) sum += num;
    });
    const avg = totalVotes > 0 ? (sum / totalVotes).toFixed(1) : '—';

    // Portada con mayor nota (mínimo 1 voto)
    let bestAlbum = null;
    let bestScore = -1;
    coverStats.forEach((st) => {
      if (st.avgRating > bestScore && st.totalVotes >= 1) {
        bestScore = st.avgRating;
        const alb = eligibleAlbums.find((a) => a.id === st.album_id);
        if (alb) {
          bestAlbum = {
            ...alb,
            avgRating: st.avgRating,
            totalVotes: st.totalVotes,
          };
        }
      }
    });

    return { totalRatedAlbums, totalVotes, avg, bestAlbum };
  }, [coverStats, ratings, eligibleAlbums]);

  // Lista para el Salón de la Fama
  const hallOfFameList = useMemo(() => {
    const list = [];
    coverStats.forEach((st, albId) => {
      const alb = eligibleAlbums.find((a) => a.id === albId);
      if (alb) {
        list.push({
          ...alb,
          ...st,
        });
      }
    });

    // Filtro por tag
    let filtered = list;
    if (hallTagFilter !== 'ALL') {
      filtered = filtered.filter(
        (item) =>
          item.topTags && item.topTags.some((t) => t.tag === hallTagFilter)
      );
    }

    // Ordenamiento
    if (hallSortBy === 'votes') {
      filtered.sort(
        (a, b) => b.totalVotes - a.totalVotes || b.avgRating - a.avgRating
      );
    } else if (hallSortBy === 'recent') {
      filtered.sort(
        (a, b) => new Date(b.lastRatedAt || 0) - new Date(a.lastRatedAt || 0)
      );
    } else {
      // Default: score
      filtered.sort(
        (a, b) => b.avgRating - a.avgRating || b.totalVotes - a.totalVotes
      );
    }

    return filtered;
  }, [coverStats, eligibleAlbums, hallSortBy, hallTagFilter]);

  // Lista para "Mis Portadas Calificadas"
  const myRatedCoversList = useMemo(() => {
    if (userRatingsMap.size === 0) return [];
    const list = [];
    userRatingsMap.forEach((userRating, albId) => {
      const alb = eligibleAlbums.find((a) => a.id === albId);
      if (alb) {
        list.push({
          album: alb,
          userRating,
        });
      }
    });
    return list.sort(
      (a, b) =>
        new Date(b.userRating.created_at || 0) -
        new Date(a.userRating.created_at || 0)
    );
  }, [userRatingsMap, eligibleAlbums]);

  const currentCoverUrl = currentAlbum?.image_url || currentAlbum?.imagen || '';
  const currentTitle =
    currentAlbum?.album_name || currentAlbum?.album || 'Lanzamiento';
  const currentArtist =
    currentAlbum?.artist_name || currentAlbum?.artista || 'Artista';

  return (
    <div className="min-h-screen cyber-grid p-3 sm:p-6 w-full max-w-full overflow-x-hidden flex flex-col justify-between">
      <SEO
        title="Calificar Portadas de Álbumes — Galería de Arte Visual | Musiclub"
        description="Aprecia y califica las mejores portadas de discos en gran formato. Evalúa dirección de arte, asigna tags visuales (#Minimalista, #Psicodélico, #Fotografía) y corona tus portadas favoritas en Musiclub."
        url="https://www.musiclub.org/portadas"
        keywords="portadas de albumes, cover art, portadas de discos, arte musical, mejores portadas de musica, calificar portadas"
      />

      <div className="max-w-7xl mx-auto w-full">
        {/* Navigation Header */}
        <AppHeader
          user={user}
          onLogin={() => setShowLoginModal(true)}
          onLogout={logout}
          loading={authLoading}
          showTitle={false}
        />

        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={loginWithGoogle}
          onGoogleLogin={loginWithGoogle}
          loading={authLoading}
        />

        {/* =========================================================================
            1. HERO & METRIC BAR
            ========================================================================= */}
        <section className="relative pt-4 sm:pt-8 pb-6 text-left">
          {/* Ambient Glows */}
          <div className="absolute top-10 -left-10 w-96 h-96 bg-gradient-to-tr from-pink-500/15 via-purple-600/15 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div className="absolute top-20 -right-10 w-96 h-96 bg-gradient-to-bl from-cyan-500/15 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>

          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 pb-6 border-b border-white/10">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs font-black uppercase tracking-wider">
                <span className="animate-pulse">🖼️</span>
                <span>Taller de Arte & Dirección Visual</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                Califica las Portadas de los{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-rose-400">
                  Releases
                </span>
              </h1>
              <p className="text-white/70 text-xs sm:text-sm md:text-base leading-relaxed">
                El arte visual define el alma de cada producción. Todos los
                releases que cuentan con al menos 1 reseña comunitaria se
                presentan en rotación aleatoria continua para calificar su
                carátula del 1 al 10 y clasificar su estilo estético.
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
              <div className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-center">
                <span className="block text-xl sm:text-2xl font-black text-cyan-300">
                  {loadingReviewedIds ? '...' : eligibleAlbums.length}
                </span>
                <span className="text-[10px] text-white/50 uppercase font-semibold tracking-wider">
                  Releases con Reseña
                </span>
              </div>

              <div className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-center">
                <span className="block text-xl sm:text-2xl font-black text-white">
                  {globalCoverMetrics.totalRatedAlbums}
                </span>
                <span className="text-[10px] text-white/50 uppercase font-semibold tracking-wider">
                  Portadas Votadas
                </span>
              </div>

              <div className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-center">
                <span className="block text-xl sm:text-2xl font-black text-pink-400">
                  {globalCoverMetrics.totalVotes}
                </span>
                <span className="text-[10px] text-white/50 uppercase font-semibold tracking-wider">
                  Votos Totales
                </span>
              </div>

              <div className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-center">
                <span className="block text-xl sm:text-2xl font-black text-amber-300">
                  ⭐ {globalCoverMetrics.avg}
                </span>
                <span className="text-[10px] text-white/50 uppercase font-semibold tracking-wider">
                  Promedio Visual
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation Switcher */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
              <button
                type="button"
                onClick={() => setActiveTab('curator')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'curator'
                    ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-lg shadow-pink-500/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>🎨</span>
                <span>Taller de Calificación</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('hall')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'hall'
                    ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-lg shadow-pink-500/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>🏆</span>
                <span>Salón de la Fama</span>
                {hallOfFameList.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-black">
                    {hallOfFameList.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('my-ratings')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'my-ratings'
                    ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-lg shadow-pink-500/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>👤</span>
                <span>Mis Calificaciones</span>
                {myRatedCoversList.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-black">
                    {myRatedCoversList.length}
                  </span>
                )}
              </button>
            </div>

            {/* Quick Controls in Curator Tab */}
            {activeTab === 'curator' && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setOnlyUnrated((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    onlyUnrated
                      ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                      : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                  }`}
                >
                  <span>{onlyUnrated ? '✓' : '○'}</span>
                  <span>Solo sin calificar ({curatorPool.length})</span>
                </button>

                <button
                  type="button"
                  onClick={handleReshuffle}
                  title="Rebarajar el orden de todas las portadas aleatoriamente"
                  className="px-3.5 py-1.5 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-200 text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>🔀</span>
                  <span>Rebarajar</span>
                </button>

                <button
                  type="button"
                  onClick={handleRandomAlbum}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>🎲</span>
                  <span>Portada Aleatoria</span>
                </button>

                <div className="relative">
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Buscar release..."
                    className="w-32 sm:w-40 px-2.5 py-1.5 pl-7 text-xs rounded-xl bg-black/40 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-pink-500/50"
                  />
                  <span className="absolute left-2 top-2 text-white/40 text-xs pointer-events-none">
                    🔍
                  </span>
                  {searchFilter && (
                    <button
                      type="button"
                      onClick={() => setSearchFilter('')}
                      className="absolute right-2 top-1.5 text-white/40 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* =========================================================================
            2. PESTAÑA A: TALLER DE CALIFICACIÓN (MODO CURADOR DE ARTE)
            ========================================================================= */}
        {activeTab === 'curator' && (
          <section className="my-6 text-left animate-fadeIn">
            {isLoading ? (
              <div className="p-16 text-center rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-4">
                <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin mx-auto"></div>
                <h3 className="text-lg font-bold text-white">
                  Cargando portadas aleatorias...
                </h3>
                <p className="text-white/50 text-xs max-w-sm mx-auto">
                  Seleccionando todos los releases con reseñas de la comunidad
                  para calificar su arte visual.
                </p>
              </div>
            ) : curatorPool.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-4">
                <span className="text-5xl block">🎉</span>
                <h3 className="text-xl font-bold text-white">
                  ¡No hay portadas en este filtro!
                </h3>
                <p className="text-white/60 text-sm max-w-md mx-auto">
                  {onlyUnrated
                    ? 'Has calificado todas las portadas disponibles en este criterio. ¡Desactiva el filtro para revisar las ya votadas!'
                    : 'No encontramos álbumes que coincidan con tu búsqueda.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOnlyUnrated(false);
                    setSearchFilter('');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white text-xs font-bold hover:scale-105 transition-all"
                >
                  Ver Todas las Portadas
                </button>
              </div>
            ) : currentAlbum ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                {/* COLUMNA IZQUIERDA: LA PORTADA EN GRANDE (PROTAGONISTA ABSOLUTA) */}
                <div className="lg:col-span-7 flex flex-col items-center">
                  <div className="relative w-full max-w-[540px] group">
                    {/* Dynamic Ambient Colored Glow behind artwork */}
                    <div className="absolute -inset-4 bg-gradient-to-tr from-pink-500/25 via-purple-600/20 to-cyan-500/25 rounded-3xl blur-3xl opacity-70 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                    {/* Contenedor Gigante de la Carátula */}
                    <div className="relative aspect-square w-full rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black/60 backdrop-blur-md group-hover:border-pink-500/40 transition-all duration-500 flex items-center justify-center">
                      <img
                        key={currentAlbum.id}
                        src={currentCoverUrl}
                        alt={currentTitle}
                        className="w-full h-full object-cover animate-fadeIn notranslate select-none"
                      />

                      {/* Subtle Sheen Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none"></div>

                      {/* Badges superiores sobre la portada */}
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-[11px] font-black uppercase tracking-wider shadow-lg">
                          {currentAlbum.release_type === 'EP'
                            ? '💽 EP'
                            : currentAlbum.release_type === 'SENCILLO' ||
                                currentAlbum.release_type === 'SINGLE'
                              ? '🎵 Sencillo'
                              : '💿 Álbum'}
                        </span>
                        {currentAlbum.release_year && (
                          <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-white/80 text-[11px] font-semibold">
                            {currentAlbum.release_year}
                          </span>
                        )}
                      </div>

                      {/* Botón Flotante para Modo Museo (Pantalla Completa) */}
                      <button
                        type="button"
                        onClick={() => setIsFullscreenMuseum(true)}
                        className="absolute bottom-4 right-4 px-3.5 py-2 rounded-xl bg-black/80 hover:bg-black/95 text-white/90 hover:text-white border border-white/20 backdrop-blur-md text-xs font-bold transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                        title="Ampliar a pantalla completa sin distracciones"
                      >
                        <span>🔍</span>
                        <span>Modo Museo</span>
                      </button>

                      {/* Badge si ya fue calificada por el usuario */}
                      {currentUserRating && (
                        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-black shadow-lg backdrop-blur-md flex items-center gap-1">
                          <span>✓</span>
                          <span>
                            Tu nota:{' '}
                            {Number(currentUserRating.rating).toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Barra de Navegación Rápida Debajo de la Portada */}
                  <div className="w-full max-w-[540px] mt-4 flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
                    <button
                      type="button"
                      onClick={handlePrevAlbum}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs sm:text-sm border border-white/10 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>←</span>
                      <span>Anterior</span>
                    </button>

                    <div className="text-center min-w-0">
                      <span className="text-[12px] text-white/40 hidden sm:inline">
                        Usa las flechas del teclado
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleNextAlbum}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs sm:text-sm border border-white/10 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Siguiente</span>
                      <span>→</span>
                    </button>
                  </div>

                  {/* Tira visual de portadas en la cola aleatoria */}
                  {curatorPool.length > 1 && (
                    <div className="w-full max-w-[540px] mt-3 p-2.5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
                      <div className="flex items-center justify-between px-1 pb-1.5 text-[10px] text-white/50 font-bold uppercase tracking-wider">
                        <span>🎲 Cola Aleatoria</span>
                        <span>{curatorPool.length} en rotación</span>
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
                        {curatorPool
                          .slice(
                            Math.max(0, currentDisplayIndex - 3),
                            currentDisplayIndex + 7
                          )
                          .map((item, relIdx) => {
                            const realIdx =
                              Math.max(0, currentDisplayIndex - 3) + relIdx;
                            const isSelected = realIdx === currentDisplayIndex;
                            const thumbUrl = item.image_url || item.imagen;
                            const title = item.album_name || item.album;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setSelectedAlbumIndex(realIdx)}
                                title={title}
                                className={`relative aspect-square w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 transition-all cursor-pointer border ${
                                  isSelected
                                    ? 'border-pink-500 scale-105 shadow-md shadow-pink-500/30 ring-2 ring-pink-500/40'
                                    : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/30'
                                }`}
                              >
                                <img
                                  src={thumbUrl}
                                  alt={title}
                                  className="w-full h-full object-cover notranslate"
                                />
                                {userRatingsMap.has(item.id) && (
                                  <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400"></span>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>

                {/* COLUMNA DERECHA: PANEL DE CALIFICACIÓN & ESTADÍSTICAS */}
                <div className="lg:col-span-5 space-y-5">
                  {/* Ficha del Álbum */}
                  <div className="p-5 rounded-3xl bg-[#111324]/90 border border-white/10 backdrop-blur-xl space-y-2 shadow-xl">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#f5576c] bg-[#f5576c]/15 px-3 py-0.5 rounded-full border border-[#f5576c]/30">
                        DIRECCIÓN VISUAL
                      </span>

                      <Link
                        to={getReleaseUrl(
                          currentTitle,
                          currentAlbum.release_type
                        )}
                        className="text-xs text-pink-400 hover:text-pink-300 transition-colors flex items-center gap-1 font-semibold"
                      >
                        <span>Ver en Musiclub</span>
                        <span>→</span>
                      </Link>
                    </div>

                    <h2
                      translate="no"
                      className="notranslate music-title text-xl sm:text-2xl font-black text-white leading-tight"
                    >
                      {currentTitle}
                    </h2>
                    <p
                      translate="no"
                      className="notranslate artist-name text-sm sm:text-base text-white/60 font-light"
                    >
                      {currentArtist}
                    </p>

                    {/* Promedio Comunitario de la Portada */}
                    <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 text-sm font-black shadow-sm">
                          <span>⭐</span>
                          <span>
                            {currentAlbumStats?.avgRating
                              ? Number(currentAlbumStats.avgRating).toFixed(1)
                              : '—'}
                          </span>
                          <span className="text-amber-200/50 text-xs font-normal">
                            / 10
                          </span>
                        </div>
                        <span className="text-white/50 text-xs">
                          ({currentAlbumStats?.totalVotes || 0}{' '}
                          {currentAlbumStats?.totalVotes === 1
                            ? 'voto visual'
                            : 'votos visuales'}
                          )
                        </span>
                      </div>

                      {currentAlbumStats?.topTags &&
                        currentAlbumStats.topTags.length > 0 && (
                          <span className="text-[11px] font-bold text-pink-300 bg-pink-500/15 px-2.5 py-0.5 rounded-lg border border-pink-500/20">
                            #{currentAlbumStats.topTags[0].tag}
                          </span>
                        )}
                    </div>
                  </div>

                  {/* Formulario de Calificación */}
                  <form
                    onSubmit={handleSubmitRating}
                    className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#161830]/95 via-[#101224]/90 to-[#0c0d1e]/95 border border-pink-500/30 backdrop-blur-2xl space-y-5 shadow-2xl"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                        <span>⭐</span>
                        <span>
                          {currentUserRating
                            ? 'Tu Calificación de Portada'
                            : 'Califica esta Portada'}
                        </span>
                      </h3>

                      {/* Badge dinámico con label emocional */}
                      {(() => {
                        const badge = getCoverScoreBadge(ratingInput);
                        return (
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Selector de Calificación (Botones 1 al 10 + Slider) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/70 font-semibold">
                          Puntaje Visual (1 al 10):
                        </span>
                        <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">
                          {Number(ratingInput).toFixed(1)}
                        </span>
                      </div>

                      {/* Botones numéricos rápidos */}
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                          const isSelected = Math.round(ratingInput) === num;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setRatingInput(num)}
                              className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white shadow-md scale-105'
                                  : 'bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/5'
                              }`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>

                      {/* Slider de precisión fina con paso de 0.1 */}
                      <div className="pt-1">
                        <input
                          type="range"
                          min="1.0"
                          max="10.0"
                          step="0.1"
                          value={ratingInput}
                          onChange={(e) =>
                            setRatingInput(parseFloat(e.target.value))
                          }
                          className="w-full accent-pink-500 cursor-pointer h-2 bg-white/10 rounded-lg"
                        />
                        <div className="flex justify-between text-[10px] text-white/30 pt-1">
                          <span>1.0 (Pésima)</span>
                          <span>5.0 (Promedio)</span>
                          <span>10.0 (Obra de Arte)</span>
                        </div>
                      </div>
                    </div>

                    {/* Selector de Tags Estéticos */}
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                          <span>🏷️</span>
                          <span>
                            Estilo Visual & Tags (Selecciona hasta 4):
                          </span>
                        </label>
                        <span className="text-[10px] text-white/40">
                          {selectedTags.length}/4
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {AESTHETIC_TAGS.map((tag) => {
                          const active = selectedTags.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => toggleTag(tag.id)}
                              title={tag.desc}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                active
                                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm border border-pink-400/50 scale-105'
                                  : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10'
                              }`}
                            >
                              <span>{tag.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Comentario / Micro-crítica visual */}
                    <div className="space-y-1.5 pt-2 border-t border-white/10">
                      <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                        <span>💬</span>
                        <span>Micro-Crítica Visual (Opcional):</span>
                      </label>
                      <textarea
                        rows={2}
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder="¿Qué te transmite esta portada? Iluminación, tipografía, composición..."
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-pink-500/50 resize-none"
                      />
                    </div>

                    {/* Feedback Toast */}
                    {submitFeedback && (
                      <div
                        className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn ${
                          submitFeedback.type === 'success'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        <span>
                          {submitFeedback.type === 'success' ? '✓' : '⚠️'}
                        </span>
                        <span>{submitFeedback.text}</span>
                      </div>
                    )}

                    {/* Botones de Acción */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-[#f5576c] to-[#f093fb] hover:from-[#f5576c]/90 hover:to-[#f093fb]/90 text-white font-black text-xs sm:text-sm shadow-xl shadow-pink-500/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <span>✨</span>
                        <span>
                          {isSubmitting
                            ? 'Guardando...'
                            : currentUserRating
                              ? 'Actualizar Mi Calificación'
                              : 'Guardar Calificación de Portada'}
                        </span>
                      </button>

                      {currentUserRating && (
                        <button
                          type="button"
                          onClick={handleDeleteRating}
                          disabled={isSubmitting}
                          className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            ) : null}
          </section>
        )}

        {/* =========================================================================
            3. PESTAÑA B: SALÓN DE LA FAMA DE PORTADAS (MUSEO & HALL OF FAME)
            ========================================================================= */}
        {activeTab === 'hall' && (
          <section className="my-6 text-left animate-fadeIn space-y-6">
            {/* Header del Hall */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span>🏆</span>
                  <span>Salón de la Fama de Portadas</span>
                </h2>
                <p className="text-xs sm:text-sm text-white/60">
                  Las obras de arte visual más aclamadas por la comunidad de
                  Musiclub.
                </p>
              </div>

              {/* Controles de Ordenamiento & Filtro por Tag */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={hallSortBy}
                  onChange={(e) => setHallSortBy(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs font-semibold focus:outline-none focus:border-pink-500"
                >
                  <option value="score">⭐ Mayor Calificación</option>
                  <option value="votes">🗳️ Más Votadas</option>
                  <option value="recent">⏱️ Calificadas Recientemente</option>
                </select>

                <select
                  value={hallTagFilter}
                  onChange={(e) => setHallTagFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs font-semibold focus:outline-none focus:border-pink-500"
                >
                  <option value="ALL">🏷️ Todos los Estilos</option>
                  {AESTHETIC_TAGS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid del Museo */}
            {isLoading ? (
              <div className="p-16 text-center rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-4">
                <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin mx-auto"></div>
                <h3 className="text-lg font-bold text-white">
                  Cargando Salón de la Fama...
                </h3>
              </div>
            ) : hallOfFameList.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-3">
                <span className="text-4xl block">🖼️</span>
                <h3 className="text-lg font-bold text-white">
                  Aún no hay portadas en este criterio
                </h3>
                <p className="text-white/60 text-xs max-w-sm mx-auto">
                  Sé de los primeros miembros en calificar portadas en el Taller
                  para inaugurar el Salón de la Fama.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('curator')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white text-xs font-bold"
                >
                  Ir al Taller de Calificación →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {hallOfFameList.map((item, idx) => {
                  const cover = item.image_url || item.imagen;
                  const title = item.album_name || item.album || 'Álbum';
                  const artist = item.artist_name || item.artista || 'Artista';

                  return (
                    <div
                      key={item.id || idx}
                      onClick={() => {
                        setOnlyUnrated(false);
                        setSearchFilter('');
                        const foundIdx = shuffledAlbums.findIndex(
                          (a) => a.id === item.id
                        );
                        if (foundIdx >= 0) setSelectedAlbumIndex(foundIdx);
                        setActiveTab('curator');
                      }}
                      className="group relative rounded-2xl bg-[#111322]/80 border border-white/10 hover:border-pink-500/40 p-3 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-pink-500/10 cursor-pointer flex flex-col justify-between"
                    >
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black/40 mb-2">
                        <img
                          src={cover}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 notranslate"
                          loading="lazy"
                        />
                        {/* Score Pill */}
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/85 backdrop-blur-md border border-amber-400/40 text-[11px] font-black text-amber-300 shadow-md flex items-center gap-1">
                          <span>⭐</span>
                          <span>{Number(item.avgRating).toFixed(1)}</span>
                        </div>
                        {/* Rank Badge */}
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-black text-white/90">
                          #{idx + 1}
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <h4
                          translate="no"
                          className="notranslate music-title text-xs font-bold text-white group-hover:text-pink-300 truncate"
                        >
                          {title}
                        </h4>
                        <p
                          translate="no"
                          className="notranslate artist-name text-[11px] text-white/50 truncate"
                        >
                          {artist}
                        </p>
                        <div className="pt-1 flex items-center justify-between text-[10px] text-white/40">
                          <span>
                            {item.totalVotes}{' '}
                            {item.totalVotes === 1 ? 'voto' : 'votos'}
                          </span>
                          {item.topTags && item.topTags.length > 0 && (
                            <span className="text-pink-400 font-semibold truncate max-w-[80px]">
                              #{item.topTags[0].tag}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* =========================================================================
            4. PESTAÑA C: MIS CALIFICACIONES
            ========================================================================= */}
        {activeTab === 'my-ratings' && (
          <section className="my-6 text-left animate-fadeIn space-y-6">
            {!user ? (
              <div className="p-12 text-center rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-4">
                <span className="text-5xl block">👤</span>
                <h3 className="text-xl font-bold text-white">
                  Inicia sesión para ver tu colección
                </h3>
                <p className="text-white/60 text-sm max-w-sm mx-auto">
                  Guarda tus calificaciones de portadas, consulta tu historial
                  estético y edita tus notas en cualquier momento.
                </p>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white text-xs font-black shadow-lg hover:scale-105 transition-all"
                >
                  Iniciar Sesión con Google
                </button>
              </div>
            ) : myRatedCoversList.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-3">
                <span className="text-4xl block">🎨</span>
                <h3 className="text-lg font-bold text-white">
                  Aún no has calificado ninguna portada
                </h3>
                <p className="text-white/60 text-xs max-w-sm mx-auto">
                  Entra al Taller de Calificación y otorga tu primer puntaje
                  visual a un disco.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('curator')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white text-xs font-bold"
                >
                  Comenzar a Calificar →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {myRatedCoversList.map(({ album, userRating }, idx) => {
                  const cover = album.image_url || album.imagen;
                  const title = album.album_name || album.album || 'Álbum';
                  const artist =
                    album.artist_name || album.artista || 'Artista';

                  return (
                    <div
                      key={album.id || idx}
                      onClick={() => {
                        setOnlyUnrated(false);
                        setSearchFilter('');
                        const foundIdx = shuffledAlbums.findIndex(
                          (a) => a.id === album.id
                        );
                        if (foundIdx >= 0) setSelectedAlbumIndex(foundIdx);
                        setActiveTab('curator');
                      }}
                      className="group relative rounded-2xl bg-[#111322]/80 border border-white/10 hover:border-pink-500/40 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={cover}
                          alt={title}
                          className="w-16 h-16 rounded-xl object-cover border border-white/15 flex-shrink-0 notranslate"
                        />
                        <div className="min-w-0 flex-1">
                          <h4
                            translate="no"
                            className="notranslate music-title text-xs font-bold text-white group-hover:text-pink-300 truncate"
                          >
                            {title}
                          </h4>
                          <p
                            translate="no"
                            className="notranslate artist-name text-[11px] text-white/50 truncate"
                          >
                            {artist}
                          </p>
                          <div className="pt-1 flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 text-xs font-black border border-pink-500/30">
                              ⭐ {Number(userRating.rating).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {Array.isArray(userRating.aesthetic_tags) &&
                        userRating.aesthetic_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {userRating.aesthetic_tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] text-white/60 bg-white/5 px-2 py-0.5 rounded-md border border-white/5"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                      {userRating.comment && (
                        <p className="text-[11px] text-white/70 italic line-clamp-2 border-t border-white/5 pt-2">
                          "{userRating.comment}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* =========================================================================
            5. MODAL MODO MUSEO (FULLSCREEN ARTWORK VIEW)
            ========================================================================= */}
        {isFullscreenMuseum && currentAlbum && (
          <div
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 sm:p-8 animate-fadeIn"
            onClick={() => setIsFullscreenMuseum(false)}
          >
            <button
              type="button"
              onClick={() => setIsFullscreenMuseum(false)}
              className="absolute top-5 right-5 text-white/60 hover:text-white text-2xl p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer z-10"
              aria-label="Cerrar Modo Museo"
            >
              ✕
            </button>

            <div
              className="relative max-w-3xl max-h-[85vh] aspect-square rounded-3xl overflow-hidden shadow-2xl border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentCoverUrl}
                alt={currentTitle}
                className="w-full h-full object-contain notranslate"
              />
            </div>

            <div
              className="text-center mt-4 space-y-1"
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                translate="no"
                className="notranslate music-title text-xl sm:text-2xl font-black text-white"
              >
                {currentTitle}
              </h3>
              <p
                translate="no"
                className="notranslate artist-name text-sm text-white/60"
              >
                {currentArtist}
              </p>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
export default CoverRatingsPage;
