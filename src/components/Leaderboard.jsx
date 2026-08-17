// src/components/Leaderboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabaseService } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';

const CRITERIA_INFO = [
  { key: 'rating_produccion', label: 'Producción', emoji: '🎛️' },
  { key: 'rating_composicion', label: 'Composición', emoji: '🎵' },
  { key: 'rating_letras', label: 'Letras', emoji: '📝' },
  { key: 'rating_originalidad', label: 'Originalidad', emoji: '💡' },
  { key: 'rating_cohesion', label: 'Cohesión', emoji: '🔗' },
  { key: 'rating_replay', label: 'Replay Value', emoji: '🔄' },
];

export const BADGES_GUIDE = [
  {
    category: '📈 Nivel de Reviews & Trayectoria',
    icon: '📝',
    description:
      'Se otorgan automáticamente según la cantidad total de reseñas publicadas en el club.',
    badges: [
      {
        label: '👑 Máster Reviewer',
        color: 'from-amber-400 via-yellow-300 to-amber-500',
        textColor: 'text-black',
        req: 'Récord #1 del Club',
        desc: 'Miembro líder con el número máximo de reseñas registradas de toda la comunidad.',
      },
      {
        label: '🔥 Reviewer Experto',
        color: 'from-orange-400 to-amber-500',
        textColor: 'text-black',
        req: '≥ 5 reseñas',
        desc: 'Veterano comprometido con un alto volumen de calificaciones detalladas.',
      },
      {
        label: '🎧 Melómano Activo',
        color: 'from-blue-400 to-cyan-400',
        textColor: 'text-black',
        req: '3 a 4 reseñas',
        desc: 'Participante regular y activo en las dinámicas semanales del club.',
      },
      {
        label: '🌱 Oído Debutante',
        color: 'from-lime-300 to-emerald-400',
        textColor: 'text-black',
        req: '1 a 2 reseñas',
        desc: 'Nuevos miembros que han dado sus primeros pasos calificando álbumes.',
      },
      {
        label: '✨ Nuevo Integrante',
        color: 'from-slate-200 to-slate-400',
        textColor: 'text-slate-900',
        req: '0 reseñas',
        desc: 'Recién registrado en la comunidad, listo para sumergirse en la primera escucha.',
      },
    ],
  },
  {
    category: '⚖️ Personalidad & Rigor de Crítica',
    icon: '🎯',
    description:
      'Refleja la severidad o generosidad de los puntajes promedio otorgados por el usuario.',
    badges: [
      {
        label: '💀 El Verdugo (Cero Piedad)',
        color: 'from-red-600 via-rose-700 to-red-800',
        textColor: 'text-white',
        req: 'Promedio ≤ 5.0 ⭐',
        desc: 'Califica sin compasión y con estándares implacables. Muy difícil de complacer.',
      },
      {
        label: '🎯 Crítico Implacable',
        color: 'from-red-500 via-orange-500 to-amber-500',
        textColor: 'text-black',
        req: 'Promedio 5.1 a 6.5 ⭐',
        desc: 'Criterio estricto y riguroso. No regala puntos a producciones estándar.',
      },
      {
        label: '🧐 Paladar Exigente',
        color: 'from-amber-400 to-orange-400',
        textColor: 'text-black',
        req: 'Promedio 6.6 a 7.3 ⭐',
        desc: 'Análisis fino, selectivo y crítico pero apreciando las buenas intenciones.',
      },
      {
        label: '⚖️ Oído Equilibrado',
        color: 'from-sky-300 via-blue-400 to-indigo-400',
        textColor: 'text-black',
        req: 'Promedio 7.4 a 8.3 ⭐',
        desc: 'Criterio armónico, justo y centrado que pondera virtudes y defectos.',
      },
      {
        label: '💖 Crítico Generoso',
        color: 'from-emerald-300 via-teal-400 to-cyan-400',
        textColor: 'text-black',
        req: 'Promedio 8.4 a 8.9 ⭐',
        desc: 'Gran aprecio por el arte, destacando siempre el disfrute y los puntos altos.',
      },
      {
        label: '✨ Amor Puro (Todo es Obra de Arte)',
        color: 'from-fuchsia-300 via-pink-400 to-rose-400',
        textColor: 'text-black',
        req: 'Promedio ≥ 9.0 ⭐',
        desc: 'Pasión desbordante por la música, encontrando magia y emoción en cada proyecto.',
      },
    ],
  },
  {
    category: '💿 Curaduría & Aportes al Catálogo',
    icon: '📦',
    description:
      'Reconoce la cantidad de álbumes propuestos para las dinámicas del club.',
    badges: [
      {
        label: '🌟 Gran Curador',
        color: 'from-purple-400 via-fuchsia-400 to-pink-500',
        textColor: 'text-black',
        req: 'Máximo aportador (#1)',
        desc: 'El miembro que más álbumes y joyas musicales ha incorporado al catálogo.',
      },
      {
        label: '📦 Coleccionista',
        color: 'from-indigo-300 to-purple-400',
        textColor: 'text-black',
        req: '≥ 3 álbumes añadidos',
        desc: 'Ha enriquecido activamente el repertorio del club con varias propuestas.',
      },
      {
        label: '💿 Aportador Musical',
        color: 'from-teal-300 to-cyan-300',
        textColor: 'text-black',
        req: '1 a 2 álbumes añadidos',
        desc: 'Ha compartido álbumes para que la comunidad los escuche y evalúe.',
      },
    ],
  },
  {
    category: '⚡ Hábitos y Especialidades de Evaluación',
    icon: '✨',
    description:
      'Insignias especiales por profundidad, comentarios y particularidades al calificar.',
    badges: [
      {
        label: '👑 Máster de Tracks',
        color: 'from-amber-300 via-yellow-400 to-orange-400',
        textColor: 'text-black',
        req: '≥ 80 canciones puntuadas',
        desc: 'Nivel legendario: evalúa minuciosamente casi cada canción de unos 6 a 8 álbumes.',
      },
      {
        label: '⚡ Detallista de Pistas',
        color: 'from-yellow-300 to-amber-400',
        textColor: 'text-black',
        req: '40 a 79 canciones puntuadas',
        desc: 'Gran constancia evaluando canción por canción a lo largo de varios discos (~3 a 5 álbumes).',
      },
      {
        label: '🔍 Explorador de Tracks',
        color: 'from-cyan-300 to-sky-400',
        textColor: 'text-black',
        req: '15 a 39 canciones puntuadas',
        desc: 'Se toma el tiempo de puntuar temas individuales pista por pista (~1 a 3 álbumes).',
      },
      {
        label: '✍️ Pluma Crítica',
        color: 'from-violet-300 to-purple-400',
        textColor: 'text-black',
        req: '≥ 1 reseña con comentario',
        desc: 'Escribe análisis y reflexiones en texto enriqueciendo la discusión.',
      },
      {
        label: '💯 Cazador del 10',
        color: 'from-amber-300 to-yellow-400',
        textColor: 'text-black',
        req: 'Ha otorgado al menos un 10',
        desc: 'Ha encontrado la perfección o una canción/álbum 10/10 en el club.',
      },
      {
        label: '🔨 Martillo de Juez',
        color: 'from-rose-500 to-red-700',
        textColor: 'text-white',
        req: 'Ha otorgado nota ≤ 4',
        desc: 'No titubea en aplicar notas bajas cuando un disco o track no da la talla.',
      },
    ],
  },
];

function UserAvatar({ user, size = 'md', className = '' }) {
  const [imgError, setImgError] = useState(false);
  const name = user?.name || user?.email || 'U';
  const initial = (name.trim()[0] || 'U').toUpperCase();

  const sizeClasses =
    {
      sm: 'w-8 h-8 text-xs font-bold',
      md: 'w-12 h-12 sm:w-14 sm:h-14 text-lg sm:text-xl font-black',
      podium_silver: 'w-full h-full text-2xl font-black',
      podium_gold: 'w-full h-full text-3xl font-black',
      podium_bronze: 'w-full h-full text-2xl font-black',
      modal: 'w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-3xl font-black',
    }[size] || 'w-12 h-12 text-base font-black';

  const gradients = [
    'from-rose-500 to-pink-500 text-white',
    'from-amber-400 to-yellow-500 text-black',
    'from-emerald-500 to-teal-400 text-white',
    'from-cyan-400 to-blue-500 text-black',
    'from-indigo-500 to-purple-500 text-white',
    'from-fuchsia-500 to-pink-500 text-white',
    'from-orange-500 to-amber-500 text-black',
  ];
  const charCode = initial.charCodeAt(0) || 0;
  const gradient = gradients[charCode % gradients.length];

  if (user?.avatar_url && !imgError) {
    return (
      <img
        src={user.avatar_url}
        alt={name}
        className={`${sizeClasses} rounded-full object-cover ${className} bg-white`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-full bg-gradient-to-tr ${gradient} flex items-center justify-center flex-shrink-0 select-none shadow-md ${className}`}
      title={name}
    >
      {initial}
    </div>
  );
}

export function Leaderboard({ isPage = false }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('reviews_desc'); // reviews_desc | rating_desc | rating_asc | albums_desc | name_asc
  const [filterType, setFilterType] = useState('all'); // all | with_reviews | with_albums
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [showBadgesGuide, setShowBadgesGuide] = useState(false);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);
      try {
        const data = await supabaseService.getDetailedLeaderboard();
        setUsers(data || []);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('No se pudo cargar el Leaderboard.');
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  // Global Club Metrics
  const globalMetrics = useMemo(() => {
    if (!users || users.length === 0) {
      return {
        totalReviews: 0,
        totalUsers: 0,
        totalAlbums: 0,
        avgClubRating: 0,
      };
    }
    const totalReviews = users.reduce(
      (sum, u) => sum + (u.review_count || 0),
      0
    );
    const totalAlbums = users.reduce(
      (sum, u) => sum + (u.albums_added_count || 0),
      0
    );
    const activeReviewers = users.filter((u) => u.review_count > 0);
    const avgSum = activeReviewers.reduce(
      (sum, u) => sum + (u.avg_score || 0),
      0
    );
    const avgClubRating =
      activeReviewers.length > 0
        ? (avgSum / activeReviewers.length).toFixed(1)
        : '0.0';

    return {
      totalReviews,
      totalUsers: users.length,
      totalAlbums,
      avgClubRating,
    };
  }, [users]);

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Filter by type
    if (filterType === 'with_reviews') {
      result = result.filter((u) => u.review_count > 0);
    } else if (filterType === 'with_albums') {
      result = result.filter((u) => u.albums_added_count > 0);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.favorite_artist?.toLowerCase().includes(q) ||
          u.favorite_album?.toLowerCase().includes(q) ||
          u.bio?.toLowerCase().includes(q) ||
          (Array.isArray(u.favorite_genres) &&
            u.favorite_genres.some((g) => g.toLowerCase().includes(q)))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'reviews_desc') {
        return b.review_count - a.review_count || b.avg_score - a.avg_score;
      }
      if (sortBy === 'rating_desc') {
        return b.avg_score - a.avg_score || b.review_count - a.review_count;
      }
      if (sortBy === 'rating_asc') {
        if (a.review_count === 0 && b.review_count > 0) return 1;
        if (b.review_count === 0 && a.review_count > 0) return -1;
        return a.avg_score - b.avg_score || b.review_count - a.review_count;
      }
      if (sortBy === 'albums_desc') {
        return (
          b.albums_added_count - a.albums_added_count ||
          b.review_count - a.review_count
        );
      }
      if (sortBy === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });

    return result;
  }, [users, searchQuery, sortBy, filterType]);

  // Top 3 for Podium
  const podiumUsers = useMemo(() => {
    const sortedForPodium = [...users]
      .filter((u) => u.review_count > 0)
      .sort(
        (a, b) => b.review_count - a.review_count || b.avg_score - a.avg_score
      );
    return [
      sortedForPodium[1] || null, // 2nd (Silver)
      sortedForPodium[0] || null, // 1st (Gold)
      sortedForPodium[2] || null, // 3rd (Bronze)
    ];
  }, [users]);

  const isCurrentUser = (itemUser) => {
    if (!user || !itemUser) return false;
    const emailMatch =
      user.email &&
      itemUser.email &&
      user.email.toLowerCase().trim() === itemUser.email.toLowerCase().trim();
    const idMatch =
      user.id && itemUser.id && String(user.id) === String(itemUser.id);
    const nameMatch =
      user.name &&
      itemUser.name &&
      user.name.toLowerCase().trim() === itemUser.name.toLowerCase().trim();
    return Boolean(emailMatch || idMatch || nameMatch);
  };

  return (
    <div className="min-h-screen bg-[#0d0e15] text-white py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-white/5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 transition-all font-semibold"
          >
            <span>←</span> Volver al Inicio
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/albumes"
              className="text-xs sm:text-sm text-slate-400 hover:text-cyan-300 transition-colors font-medium flex items-center gap-1.5"
            >
              <span>💿</span> Álbumes
            </Link>
            <Link
              to="/reviews"
              className="text-xs sm:text-sm text-slate-400 hover:text-amber-300 transition-colors font-medium flex items-center gap-1.5"
            >
              <span>📝</span> Reviews
            </Link>
            {user && (
              <Link
                to="/profile"
                className="text-xs sm:text-sm text-slate-400 hover:text-white transition-colors font-medium flex items-center gap-1.5"
              >
                <span>👤</span> Mi Perfil
              </Link>
            )}
          </div>
        </div>

        {/* Header Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-yellow-500/20 to-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
            <span>🏆</span>
            <span>Clasificación de la Comunidad</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-amber-200">
            Leaderboard de Miembros
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Explora a detalle la actividad de cada miembro: cantidad de reviews,
            promedios otorgados, álbumes compartidos e insignias especiales.
          </p>
          <div className="pt-1">
            <button
              onClick={() => setShowBadgesGuide(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-500/20 to-amber-500/15 border border-amber-400/40 hover:border-amber-400 text-amber-300 hover:text-white font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-amber-500/10 active:scale-95"
            >
              <span>📖</span>
              <span>¿Qué significa cada insignia? Ver Guía Completa</span>
            </button>
          </div>
        </div>

        {/* Global Stats Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#151722]/80 border border-white/5 p-4 rounded-2xl backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all" />
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                📝
              </span>
              <div>
                <p className="text-xs text-slate-400 font-medium">
                  Total Reviews
                </p>
                <p className="text-xl sm:text-2xl font-black text-white">
                  {globalMetrics.totalReviews}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#151722]/80 border border-white/5 p-4 rounded-2xl backdrop-blur-sm relative overflow-hidden group hover:border-cyan-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-all" />
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                👥
              </span>
              <div>
                <p className="text-xs text-slate-400 font-medium">Miembros</p>
                <p className="text-xl sm:text-2xl font-black text-white">
                  {globalMetrics.totalUsers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#151722]/80 border border-white/5 p-4 rounded-2xl backdrop-blur-sm relative overflow-hidden group hover:border-rose-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-all" />
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                💿
              </span>
              <div>
                <p className="text-xs text-slate-400 font-medium">
                  Álbumes Añadidos
                </p>
                <p className="text-xl sm:text-2xl font-black text-white">
                  {globalMetrics.totalAlbums}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#151722]/80 border border-white/5 p-4 rounded-2xl backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all" />
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                ⭐
              </span>
              <div>
                <p className="text-xs text-slate-400 font-medium">
                  Promedio del Club
                </p>
                <p className="text-xl sm:text-2xl font-black text-emerald-400">
                  {globalMetrics.avgClubRating} / 10
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Podium Top 3 */}
        {podiumUsers[1] && (
          <div className="bg-gradient-to-b from-[#181a27]/90 to-[#12131e]/90 border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-white">
                <span>👑</span> Podio de Reviewers
              </h2>
              <span className="text-xs text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                Top Contribuidores de Reseñas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-end">
              {/* 2nd Place (Silver) */}
              {podiumUsers[0] && (
                <div
                  onClick={() => setSelectedUserDetail(podiumUsers[0])}
                  className="bg-[#141622]/90 border border-slate-700/50 hover:border-slate-400/80 rounded-2xl p-5 text-center flex flex-col items-center transition-all duration-300 hover:-translate-y-1 cursor-pointer shadow-lg relative group order-2 md:order-1"
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-900 font-black text-xs px-3 py-0.5 rounded-full shadow-md">
                    🥈 #2 Puesto
                  </div>
                  <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-slate-400 to-slate-200 mb-3 mt-2 flex items-center justify-center overflow-hidden">
                    <UserAvatar user={podiumUsers[0]} size="podium_silver" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    {podiumUsers[0].name}
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">
                    {podiumUsers[0].favorite_artist
                      ? `Fan de ${podiumUsers[0].favorite_artist}`
                      : podiumUsers[0].email || 'Miembro'}
                  </p>
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full text-xs border border-white/5 mb-3">
                    <span className="text-amber-400 font-bold">
                      {podiumUsers[0].review_count} reviews
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300">
                      Prom: {podiumUsers[0].avg_score.toFixed(1)} ⭐
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-1">
                    {podiumUsers[0].badges?.map((b) => (
                      <span
                        key={b.id}
                        title={b.desc || b.label}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${b.color} ${b.textColor || 'text-black'} shadow-sm`}
                      >
                        {b.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 1st Place (Gold) */}
              {podiumUsers[1] && (
                <div
                  onClick={() => setSelectedUserDetail(podiumUsers[1])}
                  className="bg-gradient-to-b from-[#221f14] via-[#1a1820] to-[#141522] border-2 border-amber-400/60 hover:border-amber-300 rounded-3xl p-6 text-center flex flex-col items-center transition-all duration-300 hover:-translate-y-2 cursor-pointer shadow-[0_0_30px_rgba(251,191,36,0.15)] relative group order-1 md:order-2 md:-mt-4"
                >
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs px-4 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <span>👑</span>
                    <span>#1 Campeón</span>
                  </div>
                  <div className="w-24 h-24 rounded-full p-1.5 bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 mb-3 mt-3 shadow-[0_0_20px_rgba(251,191,36,0.4)] flex items-center justify-center overflow-hidden">
                    <UserAvatar user={podiumUsers[1]} size="podium_gold" />
                  </div>
                  <h3 className="text-lg font-black text-amber-300 group-hover:text-amber-200 transition-colors">
                    {podiumUsers[1].name}
                  </h3>
                  <p className="text-xs text-amber-200/70 mb-3 font-medium">
                    {podiumUsers[1].favorite_artist
                      ? `Fan de ${podiumUsers[1].favorite_artist}`
                      : podiumUsers[1].email || 'Líder del Club'}
                  </p>
                  <div className="flex items-center gap-2 bg-amber-400/10 px-4 py-1.5 rounded-full text-xs border border-amber-400/30 mb-3 shadow-inner">
                    <span className="text-amber-300 font-black">
                      {podiumUsers[1].review_count} reviews
                    </span>
                    <span className="text-amber-400/40">•</span>
                    <span className="text-white font-bold">
                      Prom: {podiumUsers[1].avg_score.toFixed(1)} ⭐
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-1">
                    {podiumUsers[1].badges?.map((b) => (
                      <span
                        key={b.id}
                        title={b.desc || b.label}
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r ${b.color} ${b.textColor || 'text-black'} shadow-md`}
                      >
                        {b.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 3rd Place (Bronze) */}
              {podiumUsers[2] && (
                <div
                  onClick={() => setSelectedUserDetail(podiumUsers[2])}
                  className="bg-[#141622]/90 border border-amber-800/40 hover:border-amber-600/70 rounded-2xl p-5 text-center flex flex-col items-center transition-all duration-300 hover:-translate-y-1 cursor-pointer shadow-lg relative group order-3"
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-700 text-amber-100 font-black text-xs px-3 py-0.5 rounded-full shadow-md">
                    🥉 #3 Puesto
                  </div>
                  <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-amber-700 to-amber-500 mb-3 mt-2 flex items-center justify-center overflow-hidden">
                    <UserAvatar user={podiumUsers[2]} size="podium_bronze" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    {podiumUsers[2].name}
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">
                    {podiumUsers[2].favorite_artist
                      ? `Fan de ${podiumUsers[2].favorite_artist}`
                      : podiumUsers[2].email || 'Miembro'}
                  </p>
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full text-xs border border-white/5 mb-3">
                    <span className="text-amber-400 font-bold">
                      {podiumUsers[2].review_count} reviews
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300">
                      Prom: {podiumUsers[2].avg_score.toFixed(1)} ⭐
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-1">
                    {podiumUsers[2].badges?.map((b) => (
                      <span
                        key={b.id}
                        title={b.desc || b.label}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${b.color} ${b.textColor || 'text-black'} shadow-sm`}
                      >
                        {b.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filter and Search Controls */}
        <div className="bg-[#151722]/90 border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Search Bar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre, artista favorito, género..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/70 transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === 'all'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
              }`}
            >
              Todos ({users.length})
            </button>
            <button
              onClick={() => setFilterType('with_reviews')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === 'with_reviews'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
              }`}
            >
              Con Reviews ({users.filter((u) => u.review_count > 0).length})
            </button>
            <button
              onClick={() => setFilterType('with_albums')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === 'with_albums'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
              }`}
            >
              Con Álbumes (
              {users.filter((u) => u.albums_added_count > 0).length})
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 whitespace-nowrap">
              Ordenar por:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-xl text-xs text-white px-3 py-2.5 focus:outline-none focus:border-amber-400/70"
            >
              <option value="reviews_desc">👑 Más Reviews</option>
              <option value="rating_desc">⭐ Mayor Promedio Otorgado</option>
              <option value="rating_asc">
                🎯 Más Exigente (Menor Promedio)
              </option>
              <option value="albums_desc">💿 Más Álbumes Añadidos</option>
              <option value="name_asc">🔤 Nombre (A-Z)</option>
            </select>
          </div>
        </div>

        {/* User Ranking Table / Cards */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="inline-block w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">
              Cargando clasificación de usuarios...
            </p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center text-red-400">
            {error}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 bg-white/5 border border-white/5 rounded-3xl text-center space-y-2">
            <span className="text-4xl">🔍</span>
            <h3 className="text-lg font-bold text-white">
              No se encontraron usuarios
            </h3>
            <p className="text-slate-400 text-xs">
              Intenta con otro término de búsqueda o limpia los filtros.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((itemUser, index) => {
              const isSelf = isCurrentUser(itemUser);
              const userRank = index + 1;

              return (
                <div
                  key={itemUser.id || itemUser.email || index}
                  onClick={() => setSelectedUserDetail(itemUser)}
                  className={`bg-[#141622]/80 border transition-all duration-300 rounded-2xl p-4 sm:p-5 hover:bg-[#191c2b] cursor-pointer relative overflow-hidden group ${
                    isSelf
                      ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.15)]'
                      : 'border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Rank + Avatar + Name + Badges */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      {/* Rank Badge */}
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center font-black text-sm sm:text-base text-slate-300 group-hover:border-amber-400/30 group-hover:text-amber-300 transition-colors">
                        {userRank === 1
                          ? '🥇'
                          : userRank === 2
                            ? '🥈'
                            : userRank === 3
                              ? '🥉'
                              : `#${userRank}`}
                      </div>

                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <UserAvatar
                          user={itemUser}
                          size="md"
                          className="border-2 border-white/10 group-hover:border-amber-400/60 transition-colors"
                        />
                        {isSelf && (
                          <span
                            className="absolute -bottom-1 -right-1 bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full border border-black shadow"
                            title="Tú"
                          >
                            TÚ
                          </span>
                        )}
                      </div>

                      {/* Name & Subtext */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                            {itemUser.name}
                          </h3>
                          {itemUser.role === 'admin' && (
                            <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 font-semibold px-2 py-0.5 rounded-full">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate">
                          {itemUser.favorite_artist ? (
                            <span>
                              Artista favorito:{' '}
                              <strong className="text-slate-300 font-medium">
                                {itemUser.favorite_artist}
                              </strong>
                            </span>
                          ) : (
                            itemUser.email || 'Miembro del Club'
                          )}
                        </p>

                        {/* Badges */}
                        {itemUser.badges && itemUser.badges.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {itemUser.badges.map((b) => (
                              <span
                                key={b.id}
                                title={b.desc || b.label}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${b.color} ${b.textColor || 'text-black'} shadow-sm`}
                              >
                                {b.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Key Stats Counters + Action Button */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-3 sm:gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/5">
                      {/* Reviews Pill */}
                      <div className="text-center sm:text-right">
                        <p className="text-[11px] text-slate-400 font-medium">
                          Reviews
                        </p>
                        <p className="text-base sm:text-lg font-black text-amber-400">
                          {itemUser.review_count}
                        </p>
                      </div>

                      {/* Albums Contributed */}
                      <div className="text-center sm:text-right">
                        <p className="text-[11px] text-slate-400 font-medium">
                          Álbumes
                        </p>
                        <p className="text-base sm:text-lg font-black text-cyan-400">
                          {itemUser.albums_added_count}
                        </p>
                      </div>

                      {/* Average Score Given */}
                      <div className="text-center sm:text-right bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                        <p className="text-[10px] text-slate-400 font-medium">
                          Promedio Dado
                        </p>
                        <p className="text-base sm:text-lg font-black text-emerald-400">
                          {itemUser.avg_score > 0
                            ? `${itemUser.avg_score.toFixed(1)} ⭐`
                            : '—'}
                        </p>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUserDetail(itemUser);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-amber-400 hover:text-black text-slate-300 text-xs font-semibold border border-white/10 transition-all ml-auto sm:ml-0"
                      >
                        Ver Detalle ➜
                      </button>
                    </div>
                  </div>

                  {/* Highlights Bar */}
                  {(itemUser.highest_review || itemUser.lowest_review) && (
                    <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      {itemUser.highest_review && (
                        <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-lg">
                          <span>🌟</span>
                          <span>Su favorito:</span>
                          <span className="text-white font-medium">
                            {itemUser.highest_review.album}
                          </span>
                          <span className="text-amber-400 font-bold">
                            (
                            {typeof itemUser.highest_review.score === 'number'
                              ? itemUser.highest_review.score.toFixed(1)
                              : itemUser.highest_review.score}{' '}
                            ⭐)
                          </span>
                        </div>
                      )}
                      {itemUser.lowest_review && (
                        <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-lg">
                          <span>📉</span>
                          <span>Más severo:</span>
                          <span className="text-white font-medium">
                            {itemUser.lowest_review.album}
                          </span>
                          <span className="text-red-400 font-bold">
                            (
                            {typeof itemUser.lowest_review.score === 'number'
                              ? itemUser.lowest_review.score.toFixed(1)
                              : itemUser.lowest_review.score}{' '}
                            ⭐)
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUserDetail && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedUserDetail(null)}
        >
          <div
            className="bg-[#151724] border border-white/10 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedUserDetail(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 w-9 h-9 rounded-full flex items-center justify-center transition-colors text-lg"
            >
              ✕
            </button>

            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              <UserAvatar
                user={selectedUserDetail}
                size="modal"
                className="border-4 border-amber-400/40 shadow-xl"
              />
              <div className="space-y-1.5">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h2 className="text-2xl font-black text-white">
                    {selectedUserDetail.name}
                  </h2>
                  {selectedUserDetail.role === 'admin' && (
                    <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 font-bold px-2.5 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {selectedUserDetail.email}
                </p>
                {selectedUserDetail.bio && (
                  <p className="text-xs sm:text-sm text-slate-300 italic pt-1">
                    "{selectedUserDetail.bio}"
                  </p>
                )}
                {/* Badges */}
                {selectedUserDetail.badges &&
                  selectedUserDetail.badges.length > 0 && (
                    <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 pt-2">
                      {selectedUserDetail.badges.map((b) => (
                        <span
                          key={b.id}
                          title={b.desc || b.label}
                          className={`text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r ${b.color} ${b.textColor || 'text-black'} shadow-md cursor-help`}
                        >
                          {b.label}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-black/30 border border-white/5 p-3.5 rounded-2xl text-center">
                <p className="text-[11px] text-slate-400">Total Reviews</p>
                <p className="text-xl font-black text-amber-400">
                  {selectedUserDetail.review_count}
                </p>
              </div>
              <div className="bg-black/30 border border-white/5 p-3.5 rounded-2xl text-center">
                <p className="text-[11px] text-slate-400">Promedio General</p>
                <p className="text-xl font-black text-emerald-400">
                  {selectedUserDetail.avg_score > 0
                    ? `${selectedUserDetail.avg_score.toFixed(1)} ⭐`
                    : '—'}
                </p>
              </div>
              <div className="bg-black/30 border border-white/5 p-3.5 rounded-2xl text-center">
                <p className="text-[11px] text-slate-400">Álbumes Añadidos</p>
                <p className="text-xl font-black text-cyan-400">
                  {selectedUserDetail.albums_added_count}
                </p>
              </div>
              <div className="bg-black/30 border border-white/5 p-3.5 rounded-2xl text-center">
                <p className="text-[11px] text-slate-400">Pistas Calificadas</p>
                <p className="text-xl font-black text-purple-400">
                  {selectedUserDetail.total_tracks_rated || 0}
                </p>
              </div>
            </div>

            {/* Criteria Breakdown */}
            {selectedUserDetail.review_count > 0 && (
              <div className="space-y-3 bg-black/20 p-4 rounded-2xl border border-white/5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Promedios Otorgados por Criterio (Escala 1 a 5)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {CRITERIA_INFO.map((crit) => {
                    const val =
                      selectedUserDetail.criteria_averages?.[crit.key];
                    return (
                      <div
                        key={crit.key}
                        className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-center justify-between"
                      >
                        <span className="text-xs text-slate-300 flex items-center gap-1.5">
                          <span>{crit.emoji}</span>
                          <span>{crit.label}</span>
                        </span>
                        <span className="text-xs font-black text-amber-300">
                          {val ? `${val} / 5` : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Musical Identity */}
            {(selectedUserDetail.favorite_artist ||
              selectedUserDetail.favorite_album ||
              (selectedUserDetail.favorite_genres &&
                selectedUserDetail.favorite_genres.length > 0)) && (
              <div className="space-y-2.5 bg-black/20 p-4 rounded-2xl border border-white/5 text-xs">
                <h4 className="font-bold uppercase tracking-wider text-slate-400">
                  🎧 Identidad Musical
                </h4>
                {selectedUserDetail.favorite_artist && (
                  <p className="text-slate-300">
                    <span className="text-slate-400">Artista favorito:</span>{' '}
                    <strong className="text-white">
                      {selectedUserDetail.favorite_artist}
                    </strong>
                  </p>
                )}
                {selectedUserDetail.favorite_album && (
                  <p className="text-slate-300">
                    <span className="text-slate-400">Álbum favorito:</span>{' '}
                    <strong className="text-white">
                      {selectedUserDetail.favorite_album}
                    </strong>
                  </p>
                )}
                {selectedUserDetail.favorite_genres &&
                  selectedUserDetail.favorite_genres.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-slate-400">Géneros:</span>
                      {selectedUserDetail.favorite_genres.map((g, i) => (
                        <span
                          key={i}
                          className="bg-amber-400/10 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/20 text-[10px]"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            )}

            {/* Albums Added by User */}
            {selectedUserDetail.albums_added &&
              selectedUserDetail.albums_added.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    💿 Álbumes Añadidos (
                    {selectedUserDetail.albums_added.length})
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {selectedUserDetail.albums_added.map((alb, i) => (
                      <div
                        key={i}
                        className="bg-black/30 border border-yellow-400/50 rounded-xl p-2 text-center group"
                      >
                        <img
                          src={
                            alb.image_url ||
                            'https://via.placeholder.com/100/1a1a2e/ffffff?text=🎵'
                          }
                          alt={alb.album_name}
                          className="w-full aspect-square rounded-lg object-cover mb-1.5"
                        />
                        <p className="text-[11px] font-bold text-white truncate">
                          {alb.album_name}
                        </p>
                        <p className="text-[9px] text-slate-400 truncate">
                          {alb.artist_name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Badges Guide Modal */}
      {showBadgesGuide && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowBadgesGuide(false)}
        >
          <div
            className="bg-[#151724] border border-amber-500/30 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowBadgesGuide(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 w-9 h-9 rounded-full flex items-center justify-center transition-colors text-lg"
              title="Cerrar"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="space-y-2 text-center sm:text-left pr-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <span>📖</span>
                <span>Guía Oficial de Títulos & Reconocimientos</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Glosario de Insignias del Club
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Cada miembro del club desbloquea automáticamente insignias y
                títulos honoríficos calculados a partir de su actividad,
                severidad de crítica, aportes al catálogo y hábitos de escucha.
              </p>
            </div>

            {/* Categories List */}
            <div className="space-y-6 pt-2">
              {BADGES_GUIDE.map((cat, idx) => (
                <div
                  key={idx}
                  className="bg-black/30 border border-white/5 rounded-2xl p-4 sm:p-5 space-y-3.5"
                >
                  <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
                    <span className="text-xl">{cat.icon}</span>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {cat.category}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cat.badges.map((b, bIdx) => (
                      <div
                        key={bIdx}
                        className="bg-white/5 border border-white/5 hover:border-white/10 rounded-xl p-3 flex flex-col justify-between gap-2 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span
                            className={`text-xs font-black px-2.5 py-1 rounded-full bg-gradient-to-r ${b.color} ${b.textColor} shadow-sm`}
                          >
                            {b.label}
                          </span>
                          <span className="text-[10px] font-bold text-amber-300/90 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md">
                            {b.req}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-snug">
                          {b.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Tip */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-500/20 text-center text-xs text-amber-200/80">
              💡{' '}
              <em>
                Sigue escuchando, calificando y compartiendo álbumes para
                desbloquear más insignias y escalar en el Leaderboard.
              </em>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
