import { MusiclubVinyl } from './MusiclubVinyl';
// src/components/GashaponMachine.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import { getWeightedReviewScore } from '../utils/ratingUtils';
import { gashaponSound } from '../utils/gashaponAudio';
import { ReviewSystem } from './ReviewSystem';
import { registerUntranslatableEntities } from '../utils/translateCrashGuard';
import { GashaponReveal } from './GashaponReveal';
import { GenreArtwork } from './GenreArtwork';
import { GashaponGenres } from './GashaponGenres';
import genreCatalog from '../utils/genreCatalog.cjs';
import vinylEditions from '../utils/vinylEditions.cjs';
import { Link } from 'react-router-dom';
import { useReleaseLibrary } from './ReleaseLibraryProvider';
import { GashaponReleaseActions } from './GashaponReleaseActions';
import { ReleaseLibraryList } from './ReleaseLibraryList';
import releaseLibraryHelpers from '../utils/releaseLibrary.cjs';

// 20 cápsulas arcade coloridas y dinámicas (definición completa de apariencia dentro y fuera del domo)
const DOME_CAPSULES = [
  // Capa Inferior (Base del domo)
  {
    id: 1,
    name: 'Cápsula Melódica Rosa',
    badge: 'MELODÍA',
    top: '70%',
    left: '16%',
    size: 'w-10 h-10 sm:w-11 sm:h-11',
    topGrad: 'from-pink-500 to-rose-600',
    botGrad: 'from-white/95 to-pink-100',
    icon: '🎵',
    swirl: 'animate-capsule-swirl-1',
    idle: 'animate-capsule-idle',
    delay: '0.1s',
    rot: '12deg',
    glow: 'rgba(244, 63, 94, 0.6)',
    ring: 'border-pink-400',
    shadow: 'shadow-pink-500/30',
  },
  {
    id: 2,
    name: 'Cápsula Corona Dorada',
    badge: 'REALEZA',
    top: '74%',
    left: '38%',
    size: 'w-11 h-11 sm:w-12 sm:h-12',
    topGrad: 'from-amber-400 to-yellow-500',
    botGrad: 'from-amber-100 to-yellow-200',
    icon: '👑',
    swirl: 'animate-capsule-swirl-2',
    idle: 'animate-capsule-idle-alt',
    delay: '0.3s',
    rot: '-18deg',
    glow: 'rgba(245, 158, 11, 0.6)',
    ring: 'border-amber-400',
    shadow: 'shadow-amber-500/40',
  },
  {
    id: 3,
    name: 'Cápsula Headphone Cyan',
    badge: 'AUDIÓFILO',
    top: '68%',
    left: '62%',
    size: 'w-10 h-10 sm:w-11 sm:h-11',
    topGrad: 'from-cyan-400 to-blue-600',
    botGrad: 'from-white/95 to-cyan-100',
    icon: '🎧',
    swirl: 'animate-capsule-swirl-3',
    idle: 'animate-capsule-idle',
    delay: '0.5s',
    rot: '25deg',
    glow: 'rgba(6, 182, 212, 0.6)',
    ring: 'border-cyan-400',
    shadow: 'shadow-cyan-500/30',
  },
  {
    id: 4,
    name: 'Cápsula Diamante Púrpura',
    badge: 'JOYA',
    top: '76%',
    left: '26%',
    size: 'w-9 h-9 sm:w-10 sm:h-10',
    topGrad: 'from-purple-500 to-indigo-600',
    botGrad: 'from-white/95 to-purple-100',
    icon: '💎',
    swirl: 'animate-capsule-swirl-4',
    idle: 'animate-capsule-idle-alt',
    delay: '0.7s',
    rot: '-30deg',
    glow: 'rgba(168, 85, 247, 0.6)',
    ring: 'border-purple-400',
    shadow: 'shadow-purple-500/30',
  },
  {
    id: 5,
    name: 'Cápsula Relámpago Esmeralda',
    badge: 'ENERGÍA',
    top: '72%',
    left: '52%',
    size: 'w-10 h-10 sm:w-11 sm:h-11',
    topGrad: 'from-emerald-400 to-teal-600',
    botGrad: 'from-white/95 to-emerald-100',
    icon: '⚡',
    swirl: 'animate-capsule-swirl-5',
    idle: 'animate-capsule-idle',
    delay: '0.9s',
    rot: '15deg',
    glow: 'rgba(16, 185, 129, 0.6)',
    ring: 'border-emerald-400',
    shadow: 'shadow-emerald-500/30',
  },
  {
    id: 6,
    name: 'Cápsula Guitarra Rubí',
    badge: 'ROCK',
    top: '78%',
    left: '72%',
    size: 'w-8 h-8 sm:w-9 sm:h-9',
    topGrad: 'from-rose-400 to-red-500',
    botGrad: 'from-white/95 to-rose-100',
    icon: '🎸',
    swirl: 'animate-capsule-swirl-1',
    idle: 'animate-capsule-idle-alt',
    delay: '1.1s',
    rot: '-20deg',
    glow: 'rgba(239, 68, 68, 0.6)',
    ring: 'border-rose-400',
    shadow: 'shadow-rose-500/30',
  },

  // Capa Media
  {
    id: 7,
    name: 'Cápsula Fuego Fucsia',
    badge: 'PASIÓN',
    top: '50%',
    left: '10%',
    size: 'w-11 h-11 sm:w-12 sm:h-12',
    topGrad: 'from-fuchsia-500 to-pink-600',
    botGrad: 'from-white/95 to-fuchsia-100',
    icon: '🔥',
    swirl: 'animate-capsule-swirl-2',
    idle: 'animate-capsule-idle',
    delay: '0.2s',
    rot: '-15deg',
    glow: 'rgba(217, 70, 239, 0.6)',
    ring: 'border-fuchsia-400',
    shadow: 'shadow-fuchsia-500/30',
  },
  {
    id: 8,
    name: 'Cápsula Mística Violeta',
    badge: 'MÍSTICO',
    top: '46%',
    left: '30%',
    size: 'w-10 h-10 sm:w-11 sm:h-11',
    topGrad: 'from-violet-500 to-purple-700',
    botGrad: 'from-white/95 to-violet-100',
    icon: '🔮',
    swirl: 'animate-capsule-swirl-3',
    idle: 'animate-capsule-idle-alt',
    delay: '0.6s',
    rot: '35deg',
    glow: 'rgba(139, 92, 246, 0.6)',
    ring: 'border-violet-400',
    shadow: 'shadow-violet-500/30',
  },
  {
    id: 9,
    name: 'Cápsula Piano Carmesí',
    badge: 'CLÁSICO',
    top: '52%',
    left: '50%',
    size: 'w-11 h-11 sm:w-12 sm:h-12',
    topGrad: 'from-red-500 to-rose-600',
    botGrad: 'from-white/95 to-red-100',
    icon: '🎹',
    swirl: 'animate-capsule-swirl-4',
    idle: 'animate-capsule-idle',
    delay: '0.8s',
    rot: '-22deg',
    glow: 'rgba(239, 68, 68, 0.6)',
    ring: 'border-red-400',
    shadow: 'shadow-red-500/30',
  },
  {
    id: 10,
    name: 'Cápsula Trébol Lima',
    badge: 'SUERTE',
    top: '48%',
    left: '70%',
    size: 'w-10 h-10 sm:w-11 sm:h-11',
    topGrad: 'from-lime-400 to-emerald-500',
    botGrad: 'from-white/95 to-lime-100',
    icon: '🍀',
    swirl: 'animate-capsule-swirl-5',
    idle: 'animate-capsule-idle-alt',
    delay: '1.0s',
    rot: '40deg',
    glow: 'rgba(132, 204, 22, 0.6)',
    ring: 'border-lime-400',
    shadow: 'shadow-lime-500/30',
  },
  {
    id: 11,
    name: 'Cápsula Estrella Ámbar',
    badge: 'BRILLO',
    top: '54%',
    left: '82%',
    size: 'w-8 h-8 sm:w-9 sm:h-9',
    topGrad: 'from-amber-500 to-orange-600',
    botGrad: 'from-white/95 to-amber-100',
    icon: '🌟',
    swirl: 'animate-capsule-swirl-1',
    idle: 'animate-capsule-idle',
    delay: '1.3s',
    rot: '-14deg',
    glow: 'rgba(245, 158, 11, 0.6)',
    ring: 'border-amber-400',
    shadow: 'shadow-amber-500/30',
  },

  // Capa Media-Alta
  {
    id: 12,
    name: 'Cápsula Vinilo Celeste',
    badge: 'VINILO',
    top: '30%',
    left: '16%',
    size: 'w-10 h-10 sm:w-11 sm:h-11',
    topGrad: 'from-sky-400 to-blue-500',
    botGrad: 'from-white/95 to-sky-100',
    icon: '💿',
    swirl: 'animate-capsule-swirl-2',
    idle: 'animate-capsule-idle-alt',
    delay: '0.4s',
    rot: '-45deg',
    glow: 'rgba(14, 165, 233, 0.6)',
    ring: 'border-sky-400',
    shadow: 'shadow-sky-500/30',
  },
  {
    id: 13,
    name: 'Cápsula Estrella Naranja',
    badge: 'HIT',
    top: '32%',
    left: '40%',
    size: 'w-11 h-11 sm:w-12 sm:h-12',
    topGrad: 'from-amber-300 to-orange-500',
    botGrad: 'from-amber-100 to-orange-100',
    icon: '⭐',
    swirl: 'animate-capsule-swirl-3',
    idle: 'animate-capsule-idle',
    delay: '0.95s',
    rot: '18deg',
    glow: 'rgba(249, 115, 22, 0.6)',
    ring: 'border-orange-400',
    shadow: 'shadow-orange-500/30',
  },
  {
    id: 14,
    name: 'Cápsula Chispa Rosa',
    badge: 'DESCUBRIMIENTO',
    top: '28%',
    left: '62%',
    size: 'w-9 h-9 sm:w-10 sm:h-10',
    topGrad: 'from-pink-400 to-purple-500',
    botGrad: 'from-white/95 to-pink-100',
    icon: '✨',
    swirl: 'animate-capsule-swirl-4',
    idle: 'animate-capsule-idle-alt',
    delay: '1.2s',
    rot: '-10deg',
    glow: 'rgba(236, 72, 153, 0.6)',
    ring: 'border-pink-400',
    shadow: 'shadow-pink-400/30',
  },
  {
    id: 15,
    name: 'Cápsula Arcade Índigo',
    badge: 'RETRO',
    top: '34%',
    left: '78%',
    size: 'w-9 h-9 sm:w-10 sm:h-10',
    topGrad: 'from-indigo-400 to-violet-600',
    botGrad: 'from-white/95 to-indigo-100',
    icon: '👾',
    swirl: 'animate-capsule-swirl-5',
    idle: 'animate-capsule-idle',
    delay: '1.4s',
    rot: '28deg',
    glow: 'rgba(99, 102, 241, 0.6)',
    ring: 'border-indigo-400',
    shadow: 'shadow-indigo-400/30',
  },

  // Capa Alta / Cúpula Superior
  {
    id: 16,
    name: 'Cápsula Cósmica Turquesa',
    badge: 'CÓSMICO',
    top: '14%',
    left: '26%',
    size: 'w-9 h-9 sm:w-10 sm:h-10',
    topGrad: 'from-teal-400 to-cyan-600',
    botGrad: 'from-white/95 to-teal-100',
    icon: '🚀',
    swirl: 'animate-capsule-swirl-1',
    idle: 'animate-capsule-idle-alt',
    delay: '1.5s',
    rot: '28deg',
    glow: 'rgba(20, 184, 166, 0.6)',
    ring: 'border-teal-400',
    shadow: 'shadow-teal-400/30',
  },
  {
    id: 17,
    name: 'Cápsula Dulce Amarilla',
    badge: 'POP',
    top: '12%',
    left: '48%',
    size: 'w-10 h-10 sm:w-11 sm:h-11',
    topGrad: 'from-yellow-400 to-amber-500',
    botGrad: 'from-yellow-100 to-amber-100',
    icon: '🍬',
    swirl: 'animate-capsule-swirl-2',
    idle: 'animate-capsule-idle',
    delay: '0.85s',
    rot: '-35deg',
    glow: 'rgba(234, 179, 8, 0.6)',
    ring: 'border-yellow-400',
    shadow: 'shadow-yellow-400/40',
  },
  {
    id: 18,
    name: 'Cápsula Fantasía Pastel',
    badge: 'FANTASÍA',
    top: '16%',
    left: '68%',
    size: 'w-8 h-8 sm:w-9 sm:h-9',
    topGrad: 'from-rose-400 to-pink-500',
    botGrad: 'from-white/95 to-rose-100',
    icon: '🦄',
    swirl: 'animate-capsule-swirl-3',
    idle: 'animate-capsule-idle-alt',
    delay: '1.7s',
    rot: '50deg',
    glow: 'rgba(251, 113, 133, 0.6)',
    ring: 'border-rose-400',
    shadow: 'shadow-rose-400/30',
  },

  // Capa Frontal Acentos
  {
    id: 19,
    name: 'Cápsula Suerte Zafiro',
    badge: 'AZAR',
    top: '60%',
    left: '20%',
    size: 'w-9 h-9 sm:w-10 sm:h-10',
    topGrad: 'from-indigo-500 to-blue-600',
    botGrad: 'from-white/95 to-indigo-100',
    icon: '🎲',
    swirl: 'animate-capsule-swirl-4',
    idle: 'animate-capsule-idle',
    delay: '1.15s',
    rot: '-12deg',
    glow: 'rgba(99, 102, 241, 0.6)',
    ring: 'border-indigo-400',
    shadow: 'shadow-indigo-500/30',
  },
  {
    id: 20,
    name: 'Cápsula Espacial Mandarina',
    badge: 'ESPACIAL',
    top: '58%',
    left: '66%',
    size: 'w-9 h-9 sm:w-10 sm:h-10',
    topGrad: 'from-orange-400 to-rose-500',
    botGrad: 'from-white/95 to-orange-100',
    icon: '🛸',
    swirl: 'animate-capsule-swirl-5',
    idle: 'animate-capsule-idle-alt',
    delay: '0.45s',
    rot: '22deg',
    glow: 'rgba(251, 146, 60, 0.6)',
    ring: 'border-orange-400',
    shadow: 'shadow-orange-400/30',
  },
];

// Helper para renderizar el badge según el release_type del álbum (ALBUM, EP, SENCILLO, etc.)
const renderReleaseTypeBadge = (album) => {
  if (!album) return null;
  const rawType = String(
    album.release_type || album.releaseType || 'ALBUM'
  ).toUpperCase();

  const typeConfig = {
    ALBUM: {
      label: '💿 Álbum',
      cls: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    EP: {
      label: '💽 EP',
      cls: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
    SENCILLO: {
      label: '🎵 Sencillo',
      cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    SINGLE: {
      label: '🎵 Sencillo',
      cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    COMPILACION: {
      label: '📚 Compilación',
      cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    'EN VIVO': {
      label: '🎤 En Vivo',
      cls: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    SOUNDTRACK: {
      label: '🎬 Soundtrack',
      cls: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    REMIX: {
      label: '🎛️ Remix',
      cls: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
    },
  };

  const config = typeConfig[rawType] || {
    label: `💿 ${rawType}`,
    cls: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  };

  return (
    <span
      className={`text-[11px] px-2.5 py-0.5 rounded-full border font-bold ${config.cls}`}
    >
      {config.label}
    </span>
  );
};

export function GashaponMachine({
  albums = [],
  collectionLabel = 'releases del catálogo',
  user = null,
  userReviews = [],
  refetchUserReviews = null,
  refetchAlbums = null,
  onReviewSubmitted = null,
}) {
  const releaseLibrary = useReleaseLibrary();
  const [checkingPreferences, setCheckingPreferences] = useState(false);
  const [preferenceMessage, setPreferenceMessage] = useState('');
  const checkingRef = useRef(false);
  // Estados principales de la máquina:
  // 'IDLE' -> 'CRANKING' -> 'DROPPING' -> 'LANDED' -> 'OPENING' -> 'REVEALED'
  const [machineState, setMachineState] = useState('IDLE');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState('all');
  useEffect(() => {
    const genre = genreCatalog.genreKey(new URLSearchParams(window.location.search).get('genero'));
    if (genre) setSelectedGenre(genre);
  }, []); // 'pending' | 'all' | 'ALBUM' | 'EP' | 'SENCILLO'
  const [soundEnabled, setSoundEnabled] = useState(() =>
    gashaponSound.isEnabled()
  );
  const [isFastMode, setIsFastMode] = useState(false);

  // Cápsula seleccionada actualmente
  const [currentCapsule, setCurrentCapsule] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [sparks, setSparks] = useState([]);
  const [isCrankAnimating, setIsCrankAnimating] = useState(false);
  const [xpToast, setXpToast] = useState(null);

  // Modal / Popup épico para presentación y apertura cinematográfica
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openingDuration, setOpeningDuration] = useState(2400);
  const [openingStartedAt, setOpeningStartedAt] = useState(0);
  const openingRef = useRef(false);
  const openedDrawRef = useRef(-1);
  const openingTimerRef = useRef(null);
  const drawRef = useRef(0);
  const modalRef = useRef(null);
  const modalOpenerRef = useRef(null);
  const [modalStage, setModalStage] = useState('DROPPING'); // 'DROPPING' | 'READY' | 'OPENING' | 'REVEALED'
  useEffect(() => {
    drawRef.current++; clearTimeout(openingTimerRef.current); openingRef.current = false;
    setCurrentCapsule(null); setSessionHistory([]); setMachineState('IDLE'); setIsModalOpen(false);
  }, [releaseLibrary.account]);
  const clearDiscardedCapsule = () => {
    setIsModalOpen(false); setMachineState('IDLE'); setCurrentCapsule(null);
    const key = currentCapsule ? releaseLibraryHelpers.releaseKey(currentCapsule.album) : null;
    setSessionHistory(previous => previous.filter(item => releaseLibraryHelpers.releaseKey(item.album) !== key && !releaseLibraryHelpers.isDismissed(item.album, releaseLibrary.rows)));
    setPreferenceMessage('Release descartado. No volverá a salir hasta que lo reactives en tu historial.');
  };
  useEffect(() => {
    if (currentCapsule && releaseLibraryHelpers.isDismissed(currentCapsule.album, releaseLibrary.rows)) clearDiscardedCapsule();
  }, [releaseLibrary.rows, currentCapsule]);

  // Auto-registrar cápsula actual contra traducción (V.8.11)
  useEffect(() => {
    if (currentCapsule?.album) {
      registerUntranslatableEntities({
        releases: [
          currentCapsule.album.album || currentCapsule.album.album_name,
        ].filter(Boolean),
        artists: [
          currentCapsule.album.artista || currentCapsule.album.artist_name,
        ].filter(Boolean),
      });
    }
  }, [currentCapsule]);

  const containerRef = useRef(null);
  const reviewSectionRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearTimeout(openingTimerRef.current);
      drawRef.current++;
    };
  }, []);

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen || !modalRef.current) return;
    const previous = document.activeElement !== document.body ? document.activeElement : modalOpenerRef.current;
    const modal = modalRef.current;
    modal.querySelector('button')?.focus({preventScroll:true});
    const trap = event => {
      if (event.key !== 'Tab') return;
      const controls = [...modal.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),[tabindex="0"]')].filter(element=>element.getClientRects().length);
      const first = controls[0], last = controls[controls.length-1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    modal.addEventListener('keydown',trap);
    return () => {
      modal.removeEventListener('keydown',trap);
      const target = previous?.isConnected && !previous.disabled ? previous : containerRef.current?.querySelector('button[title="¡Toca para ver la cápsula en grande!"]');
      target?.focus?.({preventScroll:true});
    };
  }, [isModalOpen]);

  // Bloquear scroll de la página de fondo cuando el modal esté abierto
  useEffect(() => {
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isModalOpen]);

  // Map de reviews del usuario por album_id
  const userReviewMap = useMemo(() => {
    const map = new Map();
    userReviews.forEach((rev) => {
      if (rev && rev.album_id) {
        map.set(rev.album_id, rev);
      }
    });
    return map;
  }, [userReviews]);

  // Pool base: TODOS los releases del catálogo
  const eligibleAlbums = useMemo(() => {
    if (!albums || albums.length === 0 || releaseLibrary.loading || releaseLibrary.error) return [];
    return albums.filter(
      (alb) => alb && (alb.id || alb.album || alb.album_name) && !releaseLibraryHelpers.isDismissed(alb, releaseLibrary.rows)
    );
  }, [albums, releaseLibrary.rows, releaseLibrary.loading, releaseLibrary.error]);

  // Pool de álbumes filtrado según la pestaña activa (Pendientes, Todo el Pool, o por release_type)
  const filteredPool = useMemo(() => {
    return genreCatalog.filterByGenre(eligibleAlbums, selectedGenre).filter((alb) => {
      const isReviewed = userReviewMap.has(alb.id);
      const rType = String(
        alb.release_type || alb.releaseType || 'ALBUM'
      ).toUpperCase();

      if (activeFilter === 'pending') {
        return !isReviewed;
      }
      if (activeFilter === 'ALBUM') {
        return rType === 'ALBUM';
      }
      if (activeFilter === 'EP') {
        return rType === 'EP';
      }
      if (activeFilter === 'SENCILLO') {
        return rType === 'SENCILLO' || rType === 'SINGLE';
      }
      // 'all'
      return true;
    });
  }, [eligibleAlbums, activeFilter, userReviewMap, selectedGenre]);

  const domeCapsules = useMemo(() => {
    const keys = [...genreCatalog.genreCounts(filteredPool).keys()].sort();
    if (selectedGenre === 'all' && !keys.length) return [];
    return DOME_CAPSULES.map((slot, index) => ({ ...slot, ...genreCatalog.genreCapsule(selectedGenre === 'all' ? keys[Math.floor(index * keys.length / DOME_CAPSULES.length)] : selectedGenre), edition: vinylEditions.vinylEdition(index).id, slot: slot.id }));
  }, [filteredPool, selectedGenre]);
  const handleGenreChange = genre => {
    drawRef.current++; clearTimeout(openingTimerRef.current); openingRef.current = false;
    setSelectedGenre(genre); setCurrentCapsule(null); setMachineState('IDLE'); setIsModalOpen(false);
  };

  // Toggle de sonido
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    gashaponSound.setEnabled(next);
    if (next) {
      gashaponSound.playCoinInsert();
    }
  };

  // Lanzar partículas de confeti visual
  const launchParticles = useCallback(() => {
    const colors = [
      '#f5576c',
      '#f093fb',
      '#ffd93d',
      '#6bcb77',
      '#4d96ff',
      '#a855f7',
      '#06b6d4',
    ];
    const newSparks = [];
    for (let i = 0; i < 35; i++) {
      newSparks.push({
        id: Math.random(),
        color: colors[Math.floor(Math.random() * colors.length)],
        left: 50 + (Math.random() * 40 - 20),
        top: 45 + (Math.random() * 30 - 15),
        size: Math.random() * 12 + 6,
        vx: (Math.random() - 0.5) * 120,
        vy: (Math.random() - 0.8) * 140,
        emoji: ['✨', '⭐', '🎵', '💫', '🎶', '💎', '🔥'][
          Math.floor(Math.random() * 7)
        ],
      });
    }
    setSparks(newSparks);
    setTimeout(() => {
      if (isMountedRef.current) setSparks([]);
    }, 1500);
  }, []);

  // Función para tirar de la manivela y girar el Gashapon
  const handleSpinGashapon = async () => {
    if (openingRef.current || ['CRANKING','DROPPING','OPENING'].includes(machineState)) return;
    if (filteredPool.length === 0 || checkingRef.current || releaseLibrary.pending.length) return;
    checkingRef.current = true;
    setCheckingPreferences(true); setPreferenceMessage('');
    const beforeDraw = drawRef.current;
    let available;
    try {
      const latest = await releaseLibrary.refresh();
      if (latest.account !== releaseLibrary.account || beforeDraw !== drawRef.current || !isMountedRef.current) return;
      available = filteredPool.filter(album => !releaseLibraryHelpers.isDismissed(album, latest.rows));
    } catch (error) { setPreferenceMessage(error.message); return; }
    finally { checkingRef.current = false; if (isMountedRef.current) setCheckingPreferences(false); }
    if (!available.length) { setPreferenceMessage('No quedan releases con estos filtros. Puedes cambiar los filtros o reactivar alguno en tu historial.'); return; }

    modalOpenerRef.current = document.activeElement;
    const drawId = ++drawRef.current;
    clearTimeout(openingTimerRef.current);
    // 1. Iniciar giro en la máquina
    setMachineState('CRANKING');
    setIsCrankAnimating(true);
    setIsModalOpen(false);

    // Sonidos
    gashaponSound.playCoinInsert();
    setTimeout(() => {
      if (!isMountedRef.current || drawRef.current !== drawId) return;
      gashaponSound.playCrankTurn(isFastMode ? 1.5 : 1);
      gashaponSound.playGlobeShake();
    }, 150);

    const selection = genreCatalog.drawGenreCapsule(available, selectedGenre);
    if (!selection) { setMachineState('IDLE'); setIsCrankAnimating(false); return; }
    const edition = vinylEditions.drawVinylEdition(currentCapsule?.edition);
    const capsuleData = { ...selection, edition: edition.id, theme: { ...selection.theme, glow: edition.glow }, pulledAt: Date.now(), isReviewed: userReviewMap.has(selection.album.id) };

    setCurrentCapsule(capsuleData);

    const spinDuration = isFastMode ? 850 : 1600;

    // 2. Caída de la cápsula por el conducto y apertura del POPUP
    setTimeout(() => {
      if (!isMountedRef.current || drawRef.current !== drawId) return;
      setIsCrankAnimating(false);
      setMachineState('DROPPING');
      setModalStage('DROPPING');
      setIsModalOpen(true);
      gashaponSound.playCapsuleDrop();

      // 3. Cápsula aterriza en el centro del popup
      setTimeout(
        () => {
          if (!isMountedRef.current || drawRef.current !== drawId) return;
          setMachineState('LANDED');
          setModalStage('READY');

          // Si es fast mode, abrir automáticamente
          if (isFastMode) {
            setTimeout(() => { if (isMountedRef.current && drawRef.current === drawId) handleOpenCapsule(capsuleData); }, 450);
          }
        },
        isFastMode ? 300 : 550
      );
    }, spinDuration);
  };

  // Función para abrir la cápsula que cayó (sea en bandeja o en popup)
  const handleOpenCapsule = (capsuleToOpen = currentCapsule) => {
    if (!capsuleToOpen || openingRef.current || openedDrawRef.current === drawRef.current) return;
    openedDrawRef.current = drawRef.current;
    openingRef.current = true;
    modalRef.current?.querySelector('button')?.focus({preventScroll:true});
    const drawId = drawRef.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduced ? 180 : isFastMode ? 1500 : 2400;
    setOpeningDuration(duration);
    setOpeningStartedAt(Date.now());
    setMachineState('OPENING');
    setModalStage('OPENING');
    gashaponSound.playCapsuleOpen();
    openingTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current || drawRef.current !== drawId) return;
      openingRef.current = false;
      setMachineState('REVEALED');
      setModalStage('REVEALED');
      gashaponSound.playFanfare('epic');
      setSessionHistory(previous => previous.some(item => item.album.id === capsuleToOpen.album.id) ? previous : [capsuleToOpen, ...previous.slice(0,9)]);
    }, duration);
  };

  // Ir directamente a calificar desde el modal
  const handleGoToReviewFromModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      reviewSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 200);
  };

  // Re-inspeccionar una cápsula en modal grande desde el historial
  const handleInspectCapsule = (item) => {
    if (releaseLibraryHelpers.isDismissed(item.album, releaseLibrary.rows)) return;
    drawRef.current++; clearTimeout(openingTimerRef.current); openingRef.current = false;
    setCurrentCapsule(item);
    setMachineState('REVEALED');
    setModalStage('REVEALED');
    setIsModalOpen(true);
  };

  // Contadores para chips
  const totalEligibleCount = eligibleAlbums.length;
  const pendingCount = useMemo(() => {
    return eligibleAlbums.filter((alb) => !userReviewMap.has(alb.id)).length;
  }, [eligibleAlbums, userReviewMap]);

  const albumCount = useMemo(() => {
    return eligibleAlbums.filter((alb) => {
      const t = String(
        alb.release_type || alb.releaseType || 'ALBUM'
      ).toUpperCase();
      return t === 'ALBUM';
    }).length;
  }, [eligibleAlbums]);

  const epCount = useMemo(() => {
    return eligibleAlbums.filter((alb) => {
      const t = String(alb.release_type || alb.releaseType || '').toUpperCase();
      return t === 'EP';
    }).length;
  }, [eligibleAlbums]);

  const singleCount = useMemo(() => {
    return eligibleAlbums.filter((alb) => {
      const t = String(alb.release_type || alb.releaseType || '').toUpperCase();
      return t === 'SENCILLO' || t === 'SINGLE';
    }).length;
  }, [eligibleAlbums]);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-300/20 bg-purple-400/5 p-3 text-xs">
        <Link to="/profile?tab=later" className="inline-flex min-h-11 items-center rounded-xl px-3 font-bold text-pink-200 hover:bg-white/5">Escuchar más tarde</Link>
        <a href="#gashapon-discard-history" onClick={() => { const history = document.getElementById('gashapon-discard-history'); if (history) history.open = true; }} className="inline-flex min-h-11 items-center rounded-xl px-3 font-bold text-purple-200 hover:bg-white/5">Historial de descartes ({releaseLibrary.rows.filter(row => row.gashapon_dismissed).length})</a>
      </div>
      {checkingPreferences && <p role="status" className="text-center text-sm text-purple-200">Comprobando tus descartes…</p>}
      {preferenceMessage && <p role="status" className="rounded-xl border border-purple-300/20 p-3 text-sm text-purple-100">{preferenceMessage}</p>}
      {releaseLibrary.error && <div role="alert" className="rounded-xl border border-rose-300/20 p-3 text-sm text-rose-200">{releaseLibrary.error} No giraremos hasta recuperar tus descartes.<button type="button" onClick={() => releaseLibrary.refresh().catch(() => {})} className="ml-2 min-h-11 px-3 font-bold underline">Volver a cargar</button></div>}
      {/* Toast flotante de XP Ganado */}
      {xpToast && (
        <div className="fixed top-20 right-4 z-50 animate-xp-bounce bg-linear-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 px-5 py-3 rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.6)] border-2 border-white/60 flex items-center gap-3 font-black">
          <span className="text-2xl animate-spin-slow">✨</span>
          <div>
            <p className="text-xs uppercase tracking-wider font-bold opacity-80">
              {xpToast.message}
            </p>
            <p className="text-lg leading-tight">
              +{xpToast.xp} XP para tu Perfil
            </p>
          </div>
        </div>
      )}

      {/* CABECERA ARCADE DE LA MÁQUINA */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-7 md:p-8 bg-linear-to-br from-[#18112e] via-[#101024] to-[#090814] border border-white/10 shadow-2xl backdrop-blur-xl">
        {/* Luces de neón ambientales */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-linear-to-br from-[#f5576c]/20 via-[#f093fb]/15 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-10 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Large Background Spinning Musiclub Vinyl (Watermark Cutoff) */}
        <div className="absolute -right-16 -bottom-16 sm:-right-20 sm:-bottom-20 md:-right-24 md:-top-16 w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[440px] lg:h-[440px] pointer-events-none select-none z-0 opacity-25 flex items-center justify-center">
          <MusiclubVinyl
            src="/musiclub_logo_3.png"
            alt=""
            className="w-full h-full object-contain animate-spin-slow drop-shadow-[0_0_35px_rgba(245,87,108,0.3)]"
          />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left">
          <div className="space-y-1.5 max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Gashapon Musical
            </h1>
            <p className="text-white/60 text-sm sm:text-base leading-relaxed">
              Elige un género y gira la manivela para descubrir una cápsula de los{' '}
              <strong className="text-purple-300">{collectionLabel}</strong>{' '}
              (álbumes, EPs y más). Cada género tiene su cápsula. ¡Califícalo con el sistema
              oficial!
            </p>
          </div>

          {/* Barra de Controles Rápidos (Sonido, Modo Rápido, Monedas) */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 sm:gap-3 bg-[#0b0c16]/95 backdrop-blur-xl p-2 sm:p-3 rounded-2xl border border-white/20 shadow-2xl">
            {/* Toggle de Sonido */}
            <button
              type="button"
              onClick={handleToggleSound}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border active:scale-95 ${
                soundEnabled
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 shadow-sm'
                  : 'bg-white/5 text-white/40 border-white/10 hover:text-white'
              }`}
              title={
                soundEnabled ? 'Silenciar sonidos' : 'Activar efectos de sonido'
              }
            >
              <span>{soundEnabled ? '🔊' : '🔇'}</span>
              <span className="hidden xs:inline">
                {soundEnabled ? 'FX On' : 'Mute'}
              </span>
            </button>

            {/* Toggle de Modo Rápido */}
            <button
              type="button"
              onClick={() => setIsFastMode(!isFastMode)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border active:scale-95 ${
                isFastMode
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                  : 'bg-white/5 text-white/50 border-white/10 hover:text-white'
              }`}
              title="Acelera la animación de giro y apertura"
            >
              <span>⚡</span>
              <span className="hidden xs:inline">
                {isFastMode ? 'Turbo On' : 'Turbo Off'}
              </span>
            </button>

            {/* Token Badge */}
            <div className="px-3.5 py-2 rounded-xl bg-linear-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40 text-xs font-black flex items-center gap-1.5">
              <span>🪙</span>
              <span>Monedas: ∞</span>
            </div>
          </div>
        </div>

        <div className="mt-6"><GashaponGenres albums={eligibleAlbums} value={selectedGenre} onChange={handleGenreChange} disabled={['CRANKING','DROPPING','OPENING'].includes(machineState)} /></div>
        <p className="mt-3 text-sm text-slate-300" role="status">{filteredPool.length} lanzamientos disponibles con estos filtros. {selectedGenre !== 'all' && 'Todas las cápsulas representan el género seleccionado.'}</p>
        {filteredPool.length === 0 && <p className="mt-2 text-sm text-amber-200">No hay lanzamientos que coincidan. Prueba otro género o cambia los filtros.</p>}
        {/* SELECTOR DE FILTRO DE CÁPSULAS */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-center md:justify-start gap-2">
          <span className="text-white/40 text-xs font-bold uppercase tracking-wider mr-1">
            Pool de Releases:
          </span>

          <button
            type="button"
            onClick={() => setActiveFilter('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border active:scale-95 ${
              activeFilter === 'pending'
                ? 'bg-linear-to-r from-[#f5576c] to-[#f093fb] text-white border-transparent shadow-lg shadow-[#f5576c]/30 font-black'
                : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
            }`}
          >
            <span>⏳</span> Pendientes por Calificar ({pendingCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border active:scale-95 ${
              activeFilter === 'all'
                ? 'bg-linear-to-r from-cyan-500 to-blue-600 text-white border-transparent shadow-lg shadow-cyan-500/30 font-black'
                : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
            }`}
          >
            <span>🎲</span> Todos los Releases ({totalEligibleCount})
          </button>

          {albumCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('ALBUM')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border active:scale-95 ${
                activeFilter === 'ALBUM'
                  ? 'bg-linear-to-r from-purple-500 to-indigo-600 text-white border-transparent shadow-lg shadow-purple-500/30 font-black'
                  : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
              }`}
            >
              <span>💿</span> Solo Álbumes ({albumCount})
            </button>
          )}

          {epCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('EP')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border active:scale-95 ${
                activeFilter === 'EP'
                  ? 'bg-linear-to-r from-cyan-500 to-teal-600 text-white border-transparent shadow-lg shadow-cyan-500/30 font-black'
                  : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
              }`}
            >
              <span>💽</span> Solo EPs ({epCount})
            </button>
          )}

          {singleCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('SENCILLO')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border active:scale-95 ${
                activeFilter === 'SENCILLO'
                  ? 'bg-linear-to-r from-emerald-500 to-teal-600 text-white border-transparent shadow-lg shadow-emerald-500/30 font-black'
                  : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
              }`}
            >
              <span>🎵</span> Solo Sencillos ({singleCount})
            </button>
          )}
        </div>
      </div>

      {/* ÁREA PRINCIPAL: MÁQUINA DE GASHAPON 3D INTERACTIVA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA: GASHAPON MACHINE DOME & CRANK (5 COLUMNAS EN LG) */}
        <div className="lg:col-span-4 flex flex-col items-center">
          <div className="relative w-full max-w-[340px] sm:max-w-[380px] bg-linear-to-b from-[#1b1933] via-[#121226] to-[#0a0a14] rounded-3xl p-5 sm:p-6 border-2 border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Iluminación de marquesina arcade */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-80">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping"></span>
            </div>

            {/* CÚPULA DE CRISTAL TRANSPARENTE (DOME) */}
            <div
              className={`relative w-56 h-56 sm:w-64 sm:h-64 mx-auto rounded-full bg-linear-to-br from-white/15 via-white/5 to-transparent border-4 border-white/30 shadow-[inset_0_0_35px_rgba(255,255,255,0.2),0_15px_35px_rgba(0,0,0,0.6)] backdrop-blur-md overflow-hidden flex items-center justify-center ${
                machineState === 'CRANKING' ? 'animate-gashapon-shake' : ''
              }`}
            >
              {/* Reflejos de cristal hiperrealistas */}
              <div className="absolute top-3 left-6 w-20 h-10 bg-linear-to-b from-white/40 to-transparent rounded-full -rotate-45 blur-[1px] pointer-events-none"></div>
              <div className="absolute bottom-4 right-6 w-16 h-8 bg-linear-to-t from-white/20 to-transparent rounded-full -rotate-45 blur-[2px] pointer-events-none"></div>

              {/* Mecanismo giratorio interno */}
              <div
                className={`absolute w-12 h-12 rounded-full border-4 border-amber-400/40 bg-black/40 flex items-center justify-center shadow-lg ${
                  machineState === 'CRANKING' ? 'animate-spin' : ''
                }`}
              >
                <span className="text-amber-300 text-sm font-black">⚙️</span>
              </div>

              {/* CÁPSULAS FLOTANDO/AGITÁNDOSE DENTRO DE LA CÚPULA (20 Cápsulas Arcade) */}
              <div className="relative w-full h-full p-2 pointer-events-none">
                {domeCapsules.map((cap) => (
                  <div
                    key={cap.slot}
                    data-capsule-genre={cap.genre}
                    title={cap.name}
                    className={`absolute ${cap.size} rounded-full shadow-md border border-[#f57fa2]/25 overflow-hidden bg-[#090915] transition-all duration-300 ${cap.shadow} ${
                      machineState === 'CRANKING' ? cap.swirl : cap.idle
                    }`}
                    style={{
                      top: cap.top,
                      left: cap.left,
                      animationDelay: cap.delay,
                      transform: `rotate(${cap.rot})`,
                    }}
                  >
                    <GenreArtwork genre={cap.genre} edition={cap.edition} size={64} className="h-full w-full drop-shadow-md" />
                  </div>
                ))}
              </div>
            </div>

            {/* BASE METÁLICA DEL GASHAPON & MANIVELA ROTATORIA */}
            <div className="mt-4 bg-linear-to-b from-[#201d36] to-[#0f0e1c] rounded-2xl p-4 border border-white/10 shadow-inner flex flex-col items-center space-y-3">
              {/* Manivela Interactiva (Crank Handle) */}
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  disabled={
                    machineState === 'CRANKING' ||
                    machineState === 'DROPPING' ||
                    machineState === 'OPENING' ||
                    filteredPool.length === 0
                  }
                  onClick={handleSpinGashapon}
                  className={`relative group w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-linear-to-tr from-slate-700 via-slate-400 to-slate-200 border-4 border-amber-400/80 shadow-[0_8px_20px_rgba(0,0,0,0.6),inset_0_2px_6px_rgba(255,255,255,0.8)] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-60 cursor-pointer ${
                    isCrankAnimating ? 'animate-crank-turn' : 'hover:scale-105'
                  }`}
                  title="¡Haz click para girar la manivela!"
                >
                  {/* Centro metálico con estrías */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-linear-to-br from-amber-400 to-yellow-600 border-2 border-white/40 shadow-inner flex items-center justify-center">
                    <span className="text-sm sm:text-base font-black">🎵</span>
                  </div>

                  {/* Mango de la perilla */}
                  <div className="absolute top-1 right-2 w-4 h-8 bg-linear-to-r from-amber-400 to-yellow-500 rounded-full border border-black/30 shadow-md transform rotate-45"></div>

                  {/* Indicador de giro */}
                  <span className="absolute -bottom-1 text-[9px] font-black text-amber-300 bg-black/80 px-2 py-0.5 rounded-full border border-amber-400/40">
                    GIRAR ↻
                  </span>
                </button>
              </div>

              {/* BOTÓN GRANDE DE ACCIÓN / TIRA LA PALANCA */}
              <button
                type="button"
                disabled={
                  machineState === 'CRANKING' ||
                  machineState === 'DROPPING' ||
                  machineState === 'OPENING' ||
                  filteredPool.length === 0
                }
                onClick={handleSpinGashapon}
                className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm uppercase tracking-wider text-white shadow-xl transition-all duration-300 flex items-center justify-center gap-2 border active:scale-95 ${
                  filteredPool.length === 0
                    ? 'bg-slate-800 border-white/10 opacity-60 cursor-not-allowed'
                    : machineState === 'CRANKING'
                      ? 'bg-linear-to-r from-amber-500 to-orange-500 border-amber-400/50 animate-pulse'
                      : 'bg-linear-to-r from-[#f5576c] via-[#f093fb] to-cyan-400 hover:brightness-110 border-white/20 shadow-[#f5576c]/30 hover:scale-[1.02]'
                }`}
              >
                <span>
                  {machineState === 'CRANKING'
                    ? '🌀 Girando...'
                    : '✨ ¡GIRAR GASHAPON! ✨'}
                </span>
              </button>

              {/* BANDEJA RECEPTORA DE CÁPSULAS (CHUTE & TRAY) */}
              <div className="w-full bg-black/60 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center min-h-[90px] relative overflow-hidden">
                <span className="text-white/30 text-[9px] font-mono uppercase tracking-widest block mb-1">
                  Bandeja Receptora
                </span>

                {/* Si no hay cápsula que haya caído */}
                {machineState === 'IDLE' && (
                  <p className="text-white/40 text-xs italic text-center">
                    Gira la perilla para recibir tu cápsula 🔮
                  </p>
                )}

                {/* Cápsula cayendo o en bandeja */}
                {(machineState === 'DROPPING' ||
                  machineState === 'LANDED' ||
                  machineState === 'OPENING') &&
                  currentCapsule && (
                    <div className="relative z-10 flex flex-col items-center animate-capsule-drop">
                      {/* Partículas de brillo */}
                      <div className="absolute -top-3 text-sm animate-ping">
                        ✨
                      </div>

                      {/* Botón de Cápsula Interactiva */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsModalOpen(true);
                          if (
                            modalStage !== 'OPENING' &&
                            modalStage !== 'REVEALED'
                          ) {
                            setModalStage('READY');
                          }
                        }}
                        className={`group relative w-16 h-16 rounded-full border-2 ${currentCapsule.theme.ring} overflow-hidden transform hover:scale-110 active:scale-95 transition-all cursor-pointer flex flex-col`}
                        style={{boxShadow: `0 0 25px ${currentCapsule.theme.glow}`}}
                        title="¡Toca para ver la cápsula en grande!"
                      >
                        <GenreArtwork genre={currentCapsule.theme.genre} edition={currentCapsule.edition} size={64} className="h-full w-full" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsModalOpen(true);
                          if (
                            modalStage === 'READY' ||
                            modalStage === 'DROPPING'
                          ) {
                            handleOpenCapsule(currentCapsule);
                          }
                        }}
                        className="mt-1.5 text-[11px] font-black text-amber-300 bg-amber-400/20 hover:bg-amber-400/30 px-3 py-0.5 rounded-full border border-amber-400/40 animate-pulse cursor-pointer"
                      >
                        ¡Ver en Popup y Abrir! 🎁
                      </button>
                    </div>
                  )}

                {machineState === 'REVEALED' && (
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 text-xs font-bold">
                        ✓ Cápsula Abierta
                      </span>
                      <button
                        type="button"
                        onClick={handleSpinGashapon}
                        className="text-[11px] text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg border border-white/10 font-bold transition-all cursor-pointer"
                      >
                        Girar otra ↻
                      </button>
                    </div>
                    {currentCapsule && (
                      <button
                        type="button"
                        onClick={() => {
                          setModalStage('REVEALED');
                          setIsModalOpen(true);
                        }}
                        className="text-[10px] text-amber-300 hover:text-amber-200 underline font-bold cursor-pointer"
                      >
                        Ver cápsula en grande 🔮
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: ÁLBUM REVELADO & CALIFICACIÓN DIRECTA (7 COLUMNAS EN LG) */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-6">
          {/* Si aún no se ha revelado ningún álbum */}
          {(!currentCapsule ||
            machineState === 'IDLE' ||
            machineState === 'CRANKING') && (
            <div className="rounded-3xl p-8 sm:p-12 bg-linear-to-br from-[#121424] to-[#0a0d18] border border-white/10 text-center flex flex-col items-center justify-center min-h-[380px] space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl shadow-2xl animate-float-slow">
                🎰
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  ¿Listo para tu siguiente joya musical?
                </h3>
                <p className="text-white/50 text-xs sm:text-sm leading-relaxed">
                  Hay{' '}
                  <strong className="text-amber-300">
                    {filteredPool.length} releases
                  </strong>{' '}
                  disponibles en el filtro seleccionado. Gira la manivela para
                  abrir tu cápsula y calificar directamente en esta pestaña.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSpinGashapon}
                disabled={filteredPool.length === 0}
                className="px-6 py-3 bg-linear-to-r from-[#f5576c] to-[#f093fb] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#f5576c]/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <span>🪙</span> ¡Probar Suerte Ahora!
              </button>
            </div>
          )}

          {/* ÁLBUM REVELADO CON CALIFICACIÓN DIRECTA */}
          {machineState === 'REVEALED' && currentCapsule?.album && (
            <div className="space-y-5 animate-card-reveal">
              {/* TARJETA DEL ÁLBUM REVELADO */}
              <div className="relative rounded-3xl p-5 sm:p-7 bg-linear-to-br from-[#16172d] via-[#101324] to-[#090b16] border-2 border-white/20 shadow-2xl overflow-hidden backdrop-blur-xl">
                {/* Rayos de luz decorativos de apertura */}
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-linear-to-bl from-amber-400/20 via-pink-500/15 to-transparent rounded-full blur-3xl pointer-events-none"></div>

                {/* Partículas de chispa al abrir */}
                {sparks.map((spark) => (
                  <div
                    key={spark.id}
                    className="absolute pointer-events-none transition-all duration-1000 select-none animate-ping"
                    style={{
                      left: `${spark.left}%`,
                      top: `${spark.top}%`,
                      fontSize: `${spark.size}px`,
                      zIndex: 30,
                    }}
                  >
                    {spark.emoji}
                  </div>
                ))}

                {/* Header de Rareza de la Cápsula */}
                <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-white/10 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <GenreArtwork genre={currentCapsule.theme.genre} edition={currentCapsule.edition} size={36} className="h-9 w-9 shrink-0" />
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      {currentCapsule.theme.name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/80">
                      {currentCapsule.theme.badge}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setModalStage('REVEALED');
                        setIsModalOpen(true);
                      }}
                      className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/90 border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                      title="Ver presentación de la cápsula en pantalla completa"
                    >
                      <span>🔮</span> Ver Cápsula en Grande
                    </button>

                    {userReviewMap.has(currentCapsule.album.id) ? (
                      <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <span>✓</span> Ya Calificado (★{' '}
                        {(
                          getWeightedReviewScore(
                            userReviewMap.get(currentCapsule.album.id)
                          ) ??
                          userReviewMap.get(currentCapsule.album.id)
                            .rating_general
                        )?.toFixed(1)}
                        )
                      </span>
                    ) : (
                      <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <span>⏳</span> Pendiente por Calificar (+120 XP)
                      </span>
                    )}
                  </div>
                </div>

                {/* Contenido del Álbum: Portada de Vinilo + Metadatos */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                  {/* Portada con efecto de Vinilo saliente */}
                  <div className="relative group shrink-0">
                    {/* Disco de vinilo detrás */}
                    <div className="absolute top-0 -right-4 sm:-right-6 w-28 h-28 sm:w-32 sm:h-32 rounded-full drop-shadow-xl flex items-center justify-center animate-disc-spin group-hover:translate-x-3 transition-transform duration-500 overflow-hidden">
                      <GenreArtwork genre={currentCapsule.theme.genre} edition={currentCapsule.edition} size={128} className="w-full h-full select-none pointer-events-none" />
                    </div>

                    {/* Portada del álbum */}
                    <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl bg-black">
                      <img
                        src={currentCapsule.album.imagen}
                        alt={currentCapsule.album.album}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src =
                            'https://via.placeholder.com/300/1a1a2e/ffffff?text=🎵';
                        }}
                      />
                    </div>
                  </div>

                  {/* Metadatos del Álbum */}
                  <div className="flex-1 ml-0 sm:ml-4 min-w-0 text-center sm:text-left space-y-2">
                    <div>
                      <h3
                        translate="no"
                        className="notranslate music-title text-lg sm:text-xl font-black text-white truncate"
                        title={currentCapsule.album.album}
                      >
                        {currentCapsule.album.album}
                      </h3>
                      <p
                        translate="no"
                        className="notranslate artist-name text-sm font-bold text-white/70 truncate mt-0.5"
                        title={currentCapsule.album.artista}
                      >
                        {currentCapsule.album.artista}
                      </p>
                    </div>

                    {/* Chips de Información */}
                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                      {currentCapsule.album.tracks &&
                        Array.isArray(currentCapsule.album.tracks) && (
                          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70">
                            🎵 {currentCapsule.album.tracks.length} tracks
                          </span>
                        )}

                      {renderReleaseTypeBadge(currentCapsule.album)}

                      {currentCapsule.album.spotify_url && (
                        <a
                          href={currentCapsule.album.spotify_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#1DB954]/20 hover:bg-[#1DB954]/30 text-[#1DB954] border border-[#1DB954]/40 font-bold transition-all flex items-center gap-1"
                        >
                          <span>▶</span> Escuchar en Spotify
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SISTEMA DE CALIFICACIÓN OFICIAL */}
              <GashaponReleaseActions album={currentCapsule.album} onDiscard={clearDiscardedCapsule} />
              <div
                ref={reviewSectionRef}
                className="rounded-3xl p-5 sm:p-7 bg-linear-to-br from-[#131427] to-[#0b0d18] border border-white/15 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⭐</span>
                    <h4 className="text-white font-black text-sm sm:text-base">
                      Calificar Este Release y Ganar XP
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleSpinGashapon}
                    className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-xl text-xs font-bold border border-white/10 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>↻</span> Girar Otra Cápsula
                  </button>
                </div>

                <div className="pt-2">
                  <ReviewSystem
                    album={currentCapsule.album}
                    tracks={currentCapsule.album.tracks || []}
                    user={user}
                    isIndividual={true}
                    onReviewSubmitted={async () => {
                      gashaponSound.playSuccess();
                      launchParticles();
                      setXpToast({
                        xp: 120,
                        message: '¡Calificación Guardada!',
                      });
                      setTimeout(() => {
                        if (isMountedRef.current) setXpToast(null);
                      }, 3500);
                      if (refetchUserReviews) await refetchUserReviews();
                      if (refetchAlbums) await refetchAlbums();
                      if (onReviewSubmitted) onReviewSubmitted();
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HISTORIAL / COLECCIÓN DE CÁPSULAS DE ESTA SESIÓN */}
      <details id="gashapon-discard-history" className="scroll-mt-8 rounded-2xl border border-white/10 bg-black/20 p-4">
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-bold text-purple-200">Historial permanente de descartes · ver y reactivar</summary>
        <ReleaseLibraryList mode="discarded" />
      </details>
      {sessionHistory.length > 0 && (
        <div className="rounded-3xl p-5 sm:p-6 bg-black/30 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-bold text-xs sm:text-sm flex items-center gap-2">
              <span>🗂️</span> Cápsulas Abiertas en Esta Sesión (
              {sessionHistory.length})
            </h4>
            <span className="text-white/40 text-[11px]">
              Toca cualquier cápsula para re-inspeccionar en grande
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 pt-1">
            {sessionHistory.map((item, idx) => {
              const isCurrent = currentCapsule?.album?.id === item.album.id;
              const isReviewed = userReviewMap.has(item.album.id);

              return (
                <button
                  key={item.album.id || idx}
                  type="button"
                  onClick={() => handleInspectCapsule(item)}
                  className={`shrink-0 w-36 sm:w-40 rounded-2xl p-2.5 text-left border transition-all active:scale-95 flex flex-col justify-between cursor-pointer ${
                    isCurrent
                      ? 'bg-white/15 border-[#f5576c] shadow-lg shadow-[#f5576c]/20'
                      : 'bg-white/5 hover:bg-white/10 border-white/5'
                  }`}
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-2">
                    <img
                      src={item.album.imagen}
                      alt={item.album.album}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src =
                          'https://via.placeholder.com/150/1a1a2e/ffffff?text=🎵';
                      }}
                    />
                    <div className="absolute top-1 right-1 text-xs">
                      <GenreArtwork genre={item.theme.genre} edition={item.edition} size={96} className="block h-[1.5em] w-[1.5em] shrink-0" />
                    </div>
                    {isReviewed && (
                      <div className="absolute bottom-1 right-1 bg-emerald-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center font-bold">
                        ✓
                      </div>
                    )}
                  </div>
                  <h5
                    translate="no"
                    className="notranslate music-title text-white font-bold text-[11px] truncate"
                    title={item.album.album}
                  >
                    {item.album.album}
                  </h5>
                  <p
                    translate="no"
                    className="notranslate artist-name text-white/50 text-[10px] truncate"
                    title={item.album.artista}
                  >
                    {item.album.artista}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL POPUP ÉPICO DEL GASHAPON (PORTAL DIRECTO A DOCUMENT.BODY)
          ========================================================================= */}
      {isModalOpen &&
        currentCapsule &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget && modalStage !== 'OPENING') {
                setIsModalOpen(false);
              }
            }}
            className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-full h-full min-h-screen z-[9999999] flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-2xl animate-fadeIn overflow-y-auto"
          >
            {/* Fondo con rayos sunburst giratorios */}
            <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 flex items-center justify-center pointer-events-none overflow-hidden">
              <div
                className="w-[650px] h-[650px] sm:w-[900px] sm:h-[900px] rounded-full opacity-10 pointer-events-none"
                style={{
                  background: `conic-gradient(from 0deg, transparent 0deg 15deg, ${currentCapsule.theme.glow} 15deg 30deg, transparent 30deg 45deg, ${currentCapsule.theme.glow} 45deg 60deg, transparent 60deg 75deg, ${currentCapsule.theme.glow} 75deg 90deg, transparent 90deg 105deg, ${currentCapsule.theme.glow} 105deg 120deg, transparent 120deg 135deg, ${currentCapsule.theme.glow} 135deg 150deg, transparent 150deg 165deg, ${currentCapsule.theme.glow} 165deg 180deg, transparent 180deg 195deg, ${currentCapsule.theme.glow} 195deg 210deg, transparent 210deg 225deg, ${currentCapsule.theme.glow} 225deg 240deg, transparent 240deg 255deg, ${currentCapsule.theme.glow} 255deg 270deg, transparent 270deg 285deg, ${currentCapsule.theme.glow} 285deg 300deg, transparent 300deg 315deg, ${currentCapsule.theme.glow} 315deg 330deg, transparent 330deg 345deg, ${currentCapsule.theme.glow} 345deg 360deg)`,
                }}
              ></div>
              <div
                className="absolute w-[450px] h-[450px] sm:w-[600px] sm:h-[600px] rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ background: currentCapsule.theme.glow }}
              ></div>
            </div>

            {/* Partículas de chispas en el modal */}
            {sparks.map((spark) => (
              <div
                key={spark.id}
                className="fixed pointer-events-none transition-all duration-1000 select-none animate-ping"
                style={{
                  left: `${spark.left}%`,
                  top: `${spark.top}%`,
                  fontSize: `${spark.size * 1.5}px`,
                  zIndex: 60,
                }}
              >
                {spark.emoji}
              </div>
            ))}

            {/* Tarjeta Contenedora del Modal */}
            <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="gashapon-capsule-title" data-gashapon-dialog className="relative z-10 w-full max-w-2xl bg-linear-to-b from-[#1b1933] via-[#121327] to-[#090a16] rounded-3xl p-5 sm:p-8 border-2 border-white/20 shadow-[0_0_80px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col items-center max-h-[92vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden my-auto">
              {/* Botón de Cerrar */}
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer z-30 font-bold"
                title="Cerrar modal"
              >
                ✕
              </button>

              <div className="flex w-full flex-col items-center gap-3 py-2 text-center sm:gap-4">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#f57fa2]/25 bg-white/5 px-3 py-1 text-xs font-bold text-[#ffdbe6]"><GenreArtwork genre={currentCapsule.theme.genre} edition={currentCapsule.edition} size={24} className="h-6 w-6" />{currentCapsule.theme.badge}</span>
                  <h3 id="gashapon-capsule-title" className="text-2xl font-black text-white sm:text-3xl">{modalStage === 'REVEALED' ? 'Tu próxima escucha' : currentCapsule.theme.name}</h3>
                  {modalStage !== 'REVEALED' && <p className="text-xs text-white/50 sm:text-sm">{modalStage === 'OPENING' ? 'Tu género abre la puerta a un nuevo release…' : modalStage === 'DROPPING' ? 'Tu cápsula está llegando…' : 'Toca el vinilo y descubre qué te espera.'}</p>}
                </div>
                <GashaponReveal key={currentCapsule.pulledAt} genre={currentCapsule.theme.genre} edition={currentCapsule.edition} stage={modalStage} duration={openingDuration} startedAt={openingStartedAt} album={currentCapsule.album} onOpen={() => handleOpenCapsule(currentCapsule)} />
                {modalStage === 'READY' && <button type="button" onClick={() => handleOpenCapsule(currentCapsule)} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-linear-to-r from-[#f5576c] to-[#f093fb] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#f57fa2]/20 transition-transform hover:scale-105 active:scale-95">Abrir mi cápsula</button>}
                <p role="status" className="sr-only">{modalStage === 'OPENING' ? 'Abriendo cápsula' : modalStage === 'REVEALED' ? `Descubriste ${currentCapsule.album.album}, de ${currentCapsule.album.artista}` : ''}</p>
              </div>

              {/* FASE 3: ÁLBUM REVELADO EN EL MODAL */}
              {modalStage === 'REVEALED' && currentCapsule?.album && (
                <div className="w-full flex flex-col items-center space-y-5 animate-card-reveal text-center sm:text-left">
                  <div className="w-full py-2">
                    {/* Información del Álbum */}
                    <div className="min-w-0 space-y-2.5 text-center">
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-pink-400 bg-pink-500/20 px-2.5 py-0.5 rounded-full border border-pink-500/30 inline-block">
                          RELEASE DESCUBIERTO
                        </span>
                        <h3
                          translate="no"
                          className="notranslate music-title text-xl sm:text-2xl font-black text-white leading-tight"
                          title={currentCapsule.album.album}
                        >
                          {currentCapsule.album.album}
                        </h3>
                        <p
                          translate="no"
                          className="notranslate artist-name text-base font-bold text-white/70"
                          title={currentCapsule.album.artista}
                        >
                          {currentCapsule.album.artista}
                        </p>
                      </div>

                      {/* Badges de soporte */}
                      <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                        {currentCapsule.album.tracks &&
                          Array.isArray(currentCapsule.album.tracks) && (
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/80">
                              🎵 {currentCapsule.album.tracks.length} tracks
                            </span>
                          )}

                        {renderReleaseTypeBadge(currentCapsule.album)}

                        {currentCapsule.album.spotify_url && (
                          <a
                            href={currentCapsule.album.spotify_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#1DB954]/20 hover:bg-[#1DB954]/30 text-[#1DB954] border border-[#1DB954]/40 font-bold transition-all flex items-center gap-1"
                          >
                            <span>▶</span> Spotify
                          </a>
                        )}
                      </div>

                      {/* Estado de Calificación */}
                      <div className="pt-1">
                        {userReviewMap.has(currentCapsule.album.id) ? (
                          <span className="inline-flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <span>✓</span> Ya Calificado (★{' '}
                            {(
                              getWeightedReviewScore(
                                userReviewMap.get(currentCapsule.album.id)
                              ) ??
                              userReviewMap.get(currentCapsule.album.id)
                                .rating_general
                            )?.toFixed(1)}
                            )
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <span>⏳</span> Pendiente por Calificar (+120 XP)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BOTONES DE ACCIÓN DEL MODAL */}
                  <GashaponReleaseActions album={currentCapsule.album} onDiscard={clearDiscardedCapsule} />
                  <div className="w-full pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleSpinGashapon}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span>↻</span>
                      <span>Girar Otra Cápsula</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGoToReviewFromModal}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-linear-to-r from-[#f5576c] via-[#e11d48] to-[#f093fb] hover:brightness-110 text-white font-black text-xs sm:text-sm shadow-xl shadow-[#f5576c]/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>⭐</span>
                      <span>¡Calificar Este Release Ahora!</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default GashaponMachine;
