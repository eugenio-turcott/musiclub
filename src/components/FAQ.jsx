'use client';
import { InterfaceText } from './UiIcon';
import { MusiclubVinyl } from './MusiclubVinyl';
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';
import { SEO } from './SEO';

const FAQ_CATEGORIES = [
  { id: 'all', label: '🌟 Todas las Preguntas', icon: '✨' },
  { id: 'general', label: 'Dinámica & Club', icon: '🎧' },
  { id: 'ruleta', label: 'Ruleta & Sorteos', icon: '🎰' },
  { id: 'reviews', label: 'Reseñas & Puntuación', icon: '📝' },
  { id: 'leaderboard', label: 'Leaderboard & Insignias', icon: '🏆' },
  { id: 'catalogo', label: 'Catálogo & Pool', icon: '💿' },
  { id: 'perfil', label: 'Perfil & Ajustes', icon: '👤' },
  { id: 'admin', label: 'Moderación & Cuentas', icon: '🔧' },
];

const FAQ_DATA = [
  // 1. Dinámica & Club
  {
    id: 'que-es-musiclub',
    category: 'general',
    question: '¿Dónde puedo conocer el proyecto y sus fuentes?',
    answer: 'Musiclub es un club independiente para descubrir música y compartir opiniones. En Sobre Musiclub explicamos el origen del proyecto, quién publica las reseñas y de dónde salen los datos musicales.',
    href: '/sobre-musiclub', linkLabel: 'Conocer Musiclub y sus fuentes',
  },
  {
    id: 'flujo-semanal',
    category: 'general',
    question: '¿Cómo participo en el Pool de una sala?',
    answer: 'Inicia sesión y únete a una sala pública o acepta una invitación a una privada. Cada sala tiene sus propios Pools por temporada: propuestas, disco elegido e historial. Deposita una cápsula cuando las propuestas estén abiertas y quede cupo. Puedes proponer un release por persona y temporada en cada sala. Quien administra esa sala organiza su dinámica.',
    href: '/pool', linkLabel: 'Ir al Pool Musical',
  },
  {
    id: 'es-gratis-spotify',
    category: 'general',
    question: '¿Tengo que pagar o tener Spotify Premium?',
    answer: 'La participación actual en Musiclub es gratuita y no requiere Spotify Premium. Puedes escuchar cada release en el servicio o formato que prefieras. Los enlaces de escucha llevan a servicios externos y sus condiciones son independientes de Musiclub.',
  },
  {
    id: 'quien-puede-participar',
    category: 'general',
    question: '¿Necesito una cuenta para participar?',
    answer: 'Puedes consultar el catálogo, los géneros, las salas públicas y las reseñas sin iniciar sesión. Las salas privadas solo son visibles para sus integrantes. Para publicar una reseña, calificar una portada, proponer un release o editar tu perfil, inicia sesión con Google. Las acciones de administración están reservadas a la administración.',
  },

  {
    id: 'salas-publicas-privadas', category: 'general',
    question: '¿Qué diferencia hay entre una sala pública y una privada?',
    answer: 'Las públicas aparecen en el directorio y cualquier persona con sesión puede unirse. Las privadas solo las ven sus integrantes y requieren una invitación. Quien administra una sala puede crear o revocar sus invitaciones; duran siete días y crear una nueva invalida la anterior. Las propuestas, selección e historial se protegen dentro de la sala privada. Las reseñas en las fichas del catálogo siguen siendo públicas.',
    href: '/pool', linkLabel: 'Explorar las salas de escucha',
  },

  // 2. Ruleta & Sorteos
  {
    id: 'como-funciona-ruleta',
    category: 'ruleta',
    question: '¿Cómo funciona la Máquina Musical (Slot Machine)?',
    answer:
      'La Máquina Musical cuenta con 3 carretes retro-cyberpunk que giran en secuencia con animaciones y efectos de neón. Al presionar el botón de tirar palanca, los carretes comienzan a girar a alta velocidad y se detienen uno a uno hasta revelar el disco ganador con una lluvia de confetti y un popup fullscreen.',
  },
  {
    id: 'probabilidades-seleccion',
    category: 'ruleta',
    question: '¿Cómo funcionan las probabilidades y la selección de álbumes?',
    answer:
      'Todos los álbumes que se encuentren en estado **ACTIVO** participan en el sorteo. Para evitar que las propuestas que llevan mucho tiempo esperando queden olvidadas en el fondo de la lista, la ruleta utiliza un **algoritmo de probabilidad ponderada por antigüedad**:\n\n• Los discos más antiguos en espera reciben hasta un **+40% de peso en el sorteo** sobre los discos recién añadidos.\n• Esto favorece a las propuestas con más espera, sin garantizar qué disco ganará.',
  },
  {
    id: 'quien-tira-palanca',
    category: 'ruleta',
    question: '¿Quién elige el disco oficial del Pool?',
    answer: 'Quien administra cada sala puede usar la ruleta o elegir un candidato en espera de su propio Pool. Explorar releases del Pool en Gashapon es una experiencia de descubrimiento: no sustituye ni cambia el ganador oficial.',
  },
  {
    id: 'que-pasa-al-ganar',
    category: 'ruleta',
    question: '¿Qué pasa con una cápsula cuando gana?',
    answer: 'Se muestra como ganador actual y deja de participar como candidato en espera. La administración controla cuándo se puede reseñar y cuándo pasa al historial. Ganar o pasar al historial no libera otra propuesta para la misma persona en esa temporada.',
  },

  // 3. Reseñas & Puntuación
  {
    id: 'criterios-tecnicos',
    category: 'reviews',
    question: '¿Dónde se explican los criterios para reseñar?',
    answer: 'La guía de tu primera reseña explica cómo separar las canciones, los pilares y tu valoración general. Úsala si quieres orientarte antes de abrir el formulario.',
    href: '/guias/escribir-primera-resena', linkLabel: 'Leer la guía de tu primera reseña',
  },
  {
    id: 'calificacion-canciones',
    category: 'reviews',
    question: '¿Puedo publicar con canciones sin calificar?',
    answer: 'Si la ficha tiene canciones disponibles, el formulario pide calificar todas antes de publicar. También debes completar los seis pilares y la nota general. El comentario es opcional. Si el release no tiene canciones disponibles, puedes continuar con los pilares y la nota general.',
  },
  {
    id: 'calificacion-general',
    category: 'reviews',
    question: '¿Qué es la Calificación General Independiente (1 a 10 ⭐)?',
    answer:
      'Es tu valoración global e intuitiva del álbum como escucha personal. Permite reflejar tu conexión emocional con la obra más allá del desglose analítico o técnico.',
  },
  {
    id: 'formula-puntaje',
    category: 'reviews',
    question: '¿Dónde puedo consultar la fórmula de las notas?',
    answer: 'La metodología explica las escalas, los pesos de canciones, pilares y nota general, y cómo se obtiene el promedio del club. El número de reseñas aporta contexto, pero no suma puntos extra a la nota.',
    href: '/guias/como-calificamos', linkLabel: 'Consultar la metodología de calificación',
  },
  {
    id: 'editar-resena',
    category: 'reviews',
    question: '¿Cómo edito una reseña publicada?',
    answer: 'Abre la ficha del release con la misma cuenta que usaste para publicarla. El formulario recupera tus notas para que puedas modificarlas. En el Pool, la edición depende de que las reseñas estén habilitadas por la administración.',
  },

  // 4. Leaderboard, XP & Insignias
  {
    id: 'como-funciona-leaderboard',
    category: 'leaderboard',
    question: '¿Cómo funciona el Leaderboard y el Sistema de Puntuación XP?',
    answer:
      'El Leaderboard clasifica a los miembros por su **Score XP de Club**, un puntaje integral que premia la constancia y los logros históricos:\n\n• **Puntos por Actividad**:\n  - 🎧 **+50 XP** por cada álbum reseñado.\n  - ✍️ **+25 XP extra** por reseñas con comentarios detallados.\n  - ⚡ **+2 XP** por cada pista individual calificada.\n\n• **Puntos por Insignias & Tiers**:\n  - Cada nivel desbloqueado otorga entre **+50 XP (Tier I)** hasta **+1,300 XP (Tier VII)**.\n  - Las Coronas de Récords #1 otorgan un bonus permanente de **+300 XP** mientras se conserve el récord.\n\nEn la parte superior se exhibe el **Podio de Honor** con medallas de Oro 🥇, Plata 🥈 y Bronce 🥉 para los 3 líderes de puntuación.',
  },
  {
    id: 'que-insignias-existen',
    category: 'leaderboard',
    question: '¿Qué insignias (Badges) existen y cómo se dividen en Tiers?',
    answer:
      'Las insignias se organizan en 3 pilares clave:\n\n1. 👑 **Récords #1 Dinámicos (Coronas)**: Títulos exclusivos para los líderes de la comunidad (#1 en reseñas: 👑 *Máster Reviewer*, #1 en pistas: ⚡ *Cirujano del Tracklist*, #1 en comentarios: ✒️ *Crítico Letrado*, #1 en dieces: 🌟 *Cazador Absoluto del 10*).\n\n2. 📈 **Progresión Multinivel (Tiers I al VII)**:\n  - 🎚️ *Pistas al Detalle*: Desde 🔬 Oyente Detallista (25 tracks) hasta 🪐 Enciclopedia Sonora (1,000 tracks).\n  - 🎧 *Explorador Musical*: Desde 🎧 Oyente Inicial (5 álbumes) hasta 🌌 Leyenda Melómana (500 álbumes).\n  - ✍️ *Pluma Crítica*: Desde ✍️ Primeros Apuntes (2 comentarios) hasta 🏛️ Reseñista Consagrado (250 comentarios).\n  - 💯 *Cazador del 10*: Desde 💯 Descubridor de Joyas (1 diez) hasta 🔮 Coleccionista Supremo (100 dieces).\n\n3. ⚖️ **Personalidad & Rigor Crítico**:\n  - 🎯 *Crítico Exigente*: Tiers I a IV para promedios rigurosos (🎯 Oído Exigente hasta 💀 Inquisidor Sonoro con 5+ reviews).\n  - 💖 *Crítico Generoso*: Tiers I a V para promedios entusiastas (💖 Oído Optimista hasta 🪽 Apóstol del Aprecio con 5+ reviews).',
  },
  {
    id: 'perfil-otros-miembros',
    category: 'leaderboard',
    question:
      '¿Puedo consultar las estadísticas, XP y gustos de otros miembros?',
    answer:
      '¡Sí! En el Leaderboard puedes hacer clic en cualquier miembro para abrir una tarjeta con su biografía musical, su artista y álbum favoritos, su desglose de puntuación XP, progreso hacia sus siguientes tiers, y el listado de todas sus reseñas y promedios por criterio.',
  },

  // 5. Catálogo & Spotify
  {
    id: 'estados-albumes-catalogo',
    category: 'catalogo',
    question: '¿Estar en el catálogo significa estar en el Pool?',
    answer: 'No. El catálogo reúne los releases disponibles en Musiclub. Cada sala tiene su propio Pool por temporada: propuestas en espera, disco elegido e historial independientes. Puedes encontrar un disco en el catálogo aunque nadie lo haya propuesto al Pool.',
  },
  {
    id: 'como-proponer-album',
    category: 'catalogo',
    question: '¿Cómo deposito o cambio mi cápsula?',
    answer: 'Entra a tu sala e inicia sesión. Usa Depositar cápsula para buscar un release y añadir una nota opcional. Si ya tienes una propuesta en espera, usa Editar mi cápsula: puedes cambiar el release o la nota mientras las propuestas sigan abiertas, incluso con el cupo lleno. La edición conserva tu lugar.',
    href: '/pool', linkLabel: 'Consultar mi cápsula',
  },
  {
    id: 'calificacion-rankings',
    category: 'catalogo',
    question: '¿Cómo se calculan las calificaciones en los Rankings?',
    answer:
      'Las calificaciones de cada álbum en los rankings se obtienen directamente del promedio ponderado de todas las reseñas de la comunidad (evaluando criterios técnicos como producción, composición, letras, originalidad, cohesión y replay value), de forma transparente y sin puntajes extra ni multiplicadores artificiales.',
  },

  // 6. Perfil & Ajustes
  {
    id: 'como-personalizar-perfil',
    category: 'perfil',
    question: '¿Cómo personalizo mi perfil de usuario?',
    answer:
      'En el menú superior haz clic en tu avatar o ve a **Configuración** (o ruta /settings). Allí podrás modificar:\n\n• Tu nombre público y avatar (imagen personalizada o URL).\n• Tu biografía musical.\n• Tu artista favorito y álbum favorito de toda la vida.\n• Etiquetas de tus géneros musicales favoritos.\n• Enlaces a tus perfiles de Spotify e Instagram.',
  },
  {
    id: 'estadisticas-personales',
    category: 'perfil',
    question: '¿Qué estadísticas puedo consultar en "Mi Perfil"?',
    answer:
      'En la página de **Mi Perfil** (/profile) encontrarás un panel con:\n\n• Tu promedio histórico otorgado y total de pistas evaluadas.\n• Tu promedio desglosado en cada uno de los 6 criterios técnicos.\n• Tu álbum mejor calificado y tu álbum peor calificado.\n• Tu porcentaje de completitud del catálogo del club.\n• Todas tus reseñas anteriores con buscador y filtros de orden.',
  },

  // 7. Moderación & Cuentas
  {
    id: 'panel-admin',
    category: 'admin',
    question: '¿Qué acciones están reservadas a la administración?',
    answer: 'La administración gestiona las temporadas y sus cupos, abre o cierra propuestas y reseñas, selecciona ganadores y revisa incidencias del catálogo y de la comunidad. Cada miembro puede editar su propia cápsula en espera y sus reseñas cuando corresponda; no las de otra persona.',
  },
  {
    id: 'privacidad-seguridad',
    category: 'admin',
    question: '¿Dónde consulto el uso de mis datos o pido ayuda?',
    answer: 'En Privacidad encontrarás qué datos usa el sitio y las preferencias de medición. Contacto reúne los canales para soporte, correcciones y solicitudes sobre tu cuenta. No compartas contraseñas ni códigos de acceso.',
    href: '/contacto', linkLabel: 'Contactar con Musiclub',
  },
];

export function FAQ({ isPage = false }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState({
    'que-es-musiclub': true,
  });

  const toggleItem = (id) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const all = {};
    filteredFAQs.forEach((item) => {
      all[item.id] = true;
    });
    setExpandedItems(all);
  };

  const collapseAll = () => {
    setExpandedItems({});
  };

  const filteredFAQs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen cyber-grid p-3 sm:p-6 w-full max-w-full overflow-x-hidden">
      <SEO
        title="Preguntas frecuentes y ayuda del sitio | Musiclub"
        description="Resuelve todas tus dudas sobre Musiclub: cómo funciona la Ruleta, el sistema de calificaciones, el Leaderboard y la dinámica del club."
        url="https://www.musiclub.org/faq"
        keywords="faq musiclub, preguntas frecuentes, como funciona musiclub, reglas del club de musica"
      />

      <div className="max-w-7xl mx-auto w-full">
        {/* Universal Standard App Header */}
        {isPage && (
          <div className="mb-6">
            <AppHeader showTitle={false} />
          </div>
        )}

        {/* Hero Header estilo Patch Notes */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 bg-linear-to-br from-[#121426] via-[#1a1738] to-[#0c0d1e] border border-white/10 shadow-2xl mb-8">
          {/* Orbes decorativos */}
          <div className="absolute -top-12 -right-12 w-60 h-60 bg-[#f5576c]/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-12 -left-12 w-60 h-60 bg-[#f093fb]/15 rounded-full blur-3xl pointer-events-none"></div>

          {/* Large Background Spinning Musiclub Vinyl (Watermark Cutoff) */}
          <div className="absolute -right-16 -bottom-16 sm:-right-20 sm:-bottom-20 md:-right-24 md:-top-16 w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[440px] lg:h-[440px] pointer-events-none select-none z-0 opacity-25 flex items-center justify-center">
            <MusiclubVinyl
              src="/musiclub_logo_3.png"
              alt=""
              className="w-full h-full object-contain animate-spin-slow drop-shadow-[0_0_35px_rgba(245,87,108,0.3)]"
            />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-linear-to-r from-white via-[#f093fb] to-[#f5576c] tracking-tight">
                Preguntas Frecuentes
              </h1>
              <p className="text-white/70 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed">
                Respuestas rápidas para usar tu cuenta, publicar reseñas y participar en el Pool. Para aprender a escuchar y escribir sobre un disco, consulta las guías de escucha.
              </p>
            </div>

            {/* Badges de Preguntas y Controles rápidos */}
            <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-3.5 py-2 rounded-2xl bg-[#0e1022]/95 border border-white/20 backdrop-blur-xl flex items-center gap-2 shadow-2xl">
                  <span className="text-xs"><InterfaceText>{"💡"}</InterfaceText></span>
                  <div className="text-left">
                    <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider">
                      Base de Respuestas
                    </p>
                    <p className="text-white font-black text-xs sm:text-sm leading-tight">
                      {FAQ_DATA.length} Preguntas
                    </p>
                  </div>
                </div>

                <div className="px-4 py-2 rounded-2xl bg-[#0e1022]/95 border border-white/20 backdrop-blur-xl flex items-center gap-3 shadow-2xl">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <div className="text-left">
                    <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider">
                      Categorías
                    </p>
                    <p className="text-white font-black text-base sm:text-lg leading-tight">
                      {FAQ_CATEGORIES.length - 1} Áreas
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={expandAll}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <span><InterfaceText>{"📖"}</InterfaceText></span>
                  <span>Desplegar Todo</span>
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <span><InterfaceText>{"📁"}</InterfaceText></span>
                  <span>Colapsar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tarjetas de Resumen Rápido */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/10">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
              <div className="text-2xl mb-1"><InterfaceText>{"🎰"}</InterfaceText></div>
              <div className="text-white font-bold text-xs sm:text-sm">
                Ruleta Ponderada
              </div>
              <div className="text-white/40 text-[11px]">
                +40% peso por antigüedad
              </div>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
              <div className="text-2xl mb-1"><InterfaceText>{"📝"}</InterfaceText></div>
              <div className="text-white font-bold text-xs sm:text-sm">
                Reseñas Ponderadas
              </div>
              <div className="text-white/40 text-[11px]">
                50% Tracks · 30% Crit. · 20% Gen.
              </div>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
              <div className="text-2xl mb-1"><InterfaceText>{"🏆"}</InterfaceText></div>
              <div className="text-white font-bold text-xs sm:text-sm">
                Leaderboard & Badges
              </div>
              <div className="text-white/40 text-[11px]">
                7 Insignias automáticas
              </div>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
              <div className="text-2xl mb-1"><InterfaceText>{"🎧"}</InterfaceText></div>
              <div className="text-white font-bold text-xs sm:text-sm">
                Fuentes musicales
              </div>
              <div className="text-white/40 text-[11px]">
                Catálogo y pistas oficiales
              </div>
            </div>
          </div>
        </div>

        <nav aria-label="Recursos de ayuda" className="mb-6 flex flex-wrap gap-3 text-sm font-bold text-pink-200">
          <Link to="/guias" className="rounded-xl border border-white/15 p-3 hover:bg-white/5">Guías de escucha y reseña →</Link>
          <Link to="/privacy" className="rounded-xl border border-white/15 p-3 hover:bg-white/5">Privacidad</Link>
          <Link to="/contacto" className="rounded-xl border border-white/15 p-3 hover:bg-white/5">Contactar con soporte</Link>
        </nav>
        {/* Buscador y Controles */}
        <div className="bg-black/60 border border-white/10 rounded-2xl p-4 mb-6 backdrop-blur-md flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm"><InterfaceText>{" 🔍 "}</InterfaceText></span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar una pregunta frecuente" placeholder="Buscar pregunta o tema..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-[#f5576c] transition-colors placeholder:text-white/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={expandAll}
              className="text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-all"
            >
              Expandir todo
            </button>
            <button
              onClick={collapseAll}
              className="text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-all"
            >
              Colapsar todo
            </button>
          </div>
        </div>

        {/* Filtro de Categorías */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-3 mb-6">
          {FAQ_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-linear-to-r from-[#f5576c] to-[#f093fb] text-white border-transparent shadow-lg shadow-[#f5576c]/20 scale-105'
                    : 'bg-black/40 text-white/60 border-white/10 hover:text-white hover:bg-white/5'
                }`}
              >
                <span><InterfaceText>{cat.icon}</InterfaceText></span>
                <span><InterfaceText>{cat.label}</InterfaceText></span>
              </button>
            );
          })}
        </div>

        {/* Lista de Preguntas / Acordeón */}
        <div className="space-y-3">
          {filteredFAQs.length === 0 ? (
            <div className="bg-black/60 border border-white/10 rounded-2xl p-10 text-center text-white/50">
              <div className="text-4xl mb-2"><InterfaceText>{"🔎"}</InterfaceText></div>
              <p className="font-bold text-white/80">
                No se encontraron preguntas coincidentes
              </p>
              <p className="text-xs text-white/40 mt-1">
                Prueba con otros términos de búsqueda o selecciona otra
                categoría.
              </p>
            </div>
          ) : (
            filteredFAQs.map((item, idx) => {
              const isOpen = !!expandedItems[item.id];
              return (
                <div
                  key={item.id}
                  className={`border rounded-2xl transition-all overflow-hidden backdrop-blur-md ${
                    isOpen
                      ? 'bg-black/80 border-[#f5576c]/40 shadow-lg shadow-[#f5576c]/5'
                      : 'bg-black/50 border-white/10 hover:border-white/20'
                  }`}
                >
                  <button
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${item.id}`}
                    onClick={() => toggleItem(item.id)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-[#f5576c] shrink-0 group-hover:scale-110 transition-transform">
                        {idx + 1}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-white/90 group-hover:text-white transition-colors">
                        {item.question}
                      </h3>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-transform duration-300 shrink-0 ${
                        isOpen
                          ? 'bg-[#f5576c] text-white rotate-180'
                          : 'bg-white/10 text-white/60 group-hover:bg-white/20'
                      }`}
                    >
                      ▼
                    </div>
                  </button>

                  {isOpen && (
                    <div id={`faq-answer-${item.id}`} className="px-4 sm:px-6 pb-5 pt-1 text-white/75 text-xs sm:text-sm leading-relaxed border-t border-white/5 whitespace-pre-line">
                      {item.answer}
                      {item.href && <Link to={item.href} className="mt-3 block font-bold text-pink-300 underline">{item.linkLabel} →</Link>}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer del FAQ */}
        <div className="mt-12 bg-black/40 border border-white/10 rounded-2xl p-6 text-center text-white/50 text-xs sm:text-sm">
          <p className="mb-2 text-white/80 font-bold">
            ¿Tienes alguna otra duda o sugerencia para el club?
          </p>
          <p className="text-white/40 mb-4">
            Puedes proponer nuevas dinámicas, consultar el código o contactar al
            administrador del club.
          </p>
          <div className="flex justify-center gap-4 text-xs">
            <Link
              to="/"
              className="text-[#f5576c] hover:underline font-semibold"
            ><InterfaceText>{" 🎧 Ir al Inicio de Musiclub "}</InterfaceText></Link>
            <span className="text-white/20">·</span>
            <Link
              to="/leaderboard"
              className="text-[#f5576c] hover:underline font-semibold"
            ><InterfaceText>{" 🏆 Ver Leaderboard "}</InterfaceText></Link>
            <span className="text-white/20">·</span>
            <Link
              to="/catalogo"
              className="text-[#f5576c] hover:underline font-semibold"
            ><InterfaceText>{" 💿 Explorar Catálogo "}</InterfaceText></Link>
          </div>
        </div>

        {/* Global Footer */}
        <Footer />
      </div>
    </div>
  );
}
