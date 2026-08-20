import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from './AppHeader';

const FAQ_CATEGORIES = [
  { id: 'all', label: '🌟 Todas las Preguntas', icon: '✨' },
  { id: 'general', label: 'Dinámica & Club', icon: '🎧' },
  { id: 'ruleta', label: 'Ruleta & Sorteos', icon: '🎰' },
  { id: 'reviews', label: 'Reseñas & Puntuación', icon: '📝' },
  { id: 'leaderboard', label: 'Leaderboard & Insignias', icon: '🏆' },
  { id: 'catalogo', label: 'Catálogo & Spotify', icon: '💿' },
  { id: 'perfil', label: 'Perfil & Ajustes', icon: '👤' },
  { id: 'admin', label: 'Moderación & Cuentas', icon: '🔧' },
];

const FAQ_DATA = [
  // 1. Dinámica & Club
  {
    id: 'que-es-musiclub',
    category: 'general',
    question: '¿Qué es Musiclub y cuál es el objetivo de la plataforma?',
    answer:
      'Musiclub es el espacio oficial de nuestro club de música. Su objetivo es transformar la experiencia de escuchar y descubrir música en una dinámica interactiva, comunitaria y divertida. Permite que todos los miembros propongan discos, los seleccionen de forma aleatoria y transparente con una Ruleta estilo cyberpunk, califiquen cada canción y criterio técnico, y compitan en un Leaderboard con insignias por su participación.',
  },
  {
    id: 'flujo-semanal',
    category: 'general',
    question: '¿Cómo es el ciclo o rutina semanal habitual en el club?',
    answer:
      'El ciclo habitual consta de 5 sencillos pasos:\n\n1. **Proponer**: Cualquier miembro registrado busca y añade álbumes desde Spotify al catálogo.\n2. **Sorteo**: En la reunión semanal o sesión programada, se tira de la palanca de la Máquina Musical para elegir el disco ganador.\n3. **Escucha**: Durante la semana, los miembros escuchan el álbum completo en su plataforma favorita (Spotify, YouTube, Apple Music, vinilo, etc.).\n4. **Reseñar**: Cada miembro califica las canciones pista por pista, los 6 criterios técnicos y escribe sus comentarios.\n5. **Rankings y Podio**: Los resultados actualizan el Top histórico del club y otorgan puntos e insignias en el Leaderboard.',
  },
  {
    id: 'es-gratis-spotify',
    category: 'general',
    question: '¿Es gratis? ¿Necesito una cuenta de pago en Spotify?',
    answer:
      'Musiclub es 100% gratuito. No requieres una suscripción de pago de Spotify para usar la plataforma. Utilizamos la API oficial de Spotify únicamente para obtener información verídica de portadas, años y listas oficiales de canciones. Para escuchar los discos puedes utilizar la plataforma de streaming o formato físico que prefieras.',
  },
  {
    id: 'quien-puede-participar',
    category: 'general',
    question: '¿Quién puede votar, proponer discos y escribir reseñas?',
    answer:
      'Cualquier visitante puede explorar la ruleta, consultar el catálogo de discos, ver rankings y leer las reseñas de la comunidad. Para poder proponer nuevos álbumes, calificar canciones, personalizar tu perfil y ganar insignias, solo necesitas iniciar sesión con tu cuenta de Google o correo electrónico.',
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
      'Todos los álbumes que se encuentren en estado **ACTIVO** participan en el sorteo. Para evitar que las propuestas que llevan mucho tiempo esperando queden olvidadas en el fondo de la lista, la ruleta utiliza un **algoritmo de probabilidad ponderada por antigüedad**:\n\n• Los discos más antiguos en espera reciben hasta un **+40% de probabilidad adicional** sobre los discos recién añadidos.\n• Esto garantiza una rotación equilibrada y justa entre propuestas antiguas y nuevas, manteniendo viva la emoción del azar.',
  },
  {
    id: 'quien-tira-palanca',
    category: 'ruleta',
    question: '¿Quién puede activar la ruleta y tirar la palanca?',
    answer:
      'La ruleta suele ser activada durante las reuniones o sesiones del club por el administrador o en consenso grupal para fijar el disco oficial de la semana. Una vez determinado el ganador, el resultado se sincroniza en tiempo real en la base de datos para que todos los usuarios vean el mismo álbum ganador.',
  },
  {
    id: 'que-pasa-al-ganar',
    category: 'ruleta',
    question: '¿Qué pasa con el álbum después de que gana el sorteo?',
    answer:
      'El disco ganador pasa a mostrarse en la tarjeta destacada superior (**Álbum Ganador Actual**) con enlaces directos para escucharlo y calificarlo. Su estado puede cambiarse a **INACTIVO** para no volver a repetirse en futuros giros de la ruleta mientras no sea reiniciado por un administrador.',
  },

  // 3. Reseñas & Puntuación
  {
    id: 'criterios-tecnicos',
    category: 'reviews',
    question: '¿Cuáles son los 6 Criterios Técnicos de evaluación (1 a 5 ⭐)?',
    answer:
      'Cada reseña permite evaluar 6 dimensiones clave del álbum en una escala de 1 a 5 estrellas:\n\n1. 🎛️ **Producción**: Calidad de mezcla, masterización, claridad estéreo y diseño sonoro.\n2. 🎵 **Composición**: Riqueza melódica, armonías, arreglos y estructura de las canciones.\n3. 📝 **Letras**: Profundidad poética, mensaje, recursos líricos y narrativa.\n4. 💡 **Originalidad**: Propuesta innovadora, frescura y distinción estilística.\n5. 🔗 **Cohesión**: Fluidez, narrativa y sentido de unidad como obra completa de inicio a fin.\n6. 🔄 **Replay Value**: Ganas de volver a reproducir el disco completo una y otra vez.',
  },
  {
    id: 'calificacion-canciones',
    category: 'reviews',
    question: '¿Cómo funciona la calificación canción por canción (Tracklist)?',
    answer:
      'Al abrir el asistente de reseña (Review Wizard), se listan todas las canciones oficiales del álbum obtenidas desde Spotify. Puedes calificar cada pista individualmente en una escala de **1 a 10**. Si alguna canción no deseas calificarla, puedes dejarla sin puntaje y no afectará negativamente el promedio de las pistas.',
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
    question: '¿Cómo se calcula el puntaje final de una reseña?',
    answer:
      'El sistema calcula automáticamente una nota ponderada justa y equilibrada en escala de **1.0 a 10.0**:\n\n• **50% Canciones**: Promedio de todas las pistas individuales calificadas (escala 1 a 10).\n• **30% Criterios Técnicos**: Promedio de los 6 criterios (escala 1 a 5 convertida a 10).\n• **20% Calificación General**: Tu nota intuitiva global (escala 1 a 10).\n\n*(Nota: Si decides omitir la calificación pista por pista, la fórmula se ajusta automáticamente a 60% Criterios Técnicos y 40% Calificación General).*',
  },
  {
    id: 'editar-resena',
    category: 'reviews',
    question: '¿Puedo editar o actualizar una reseña que ya publiqué?',
    answer:
      '¡Sí! Si ya habías calificado un álbum y deseas cambiar alguna nota o comentario, simplemente abre el formulario de reseña del mismo álbum con tu sesión iniciada. El sistema cargará automáticamente tus puntuaciones anteriores para que puedas modificarlas y guardarlas.',
  },

  // 4. Leaderboard, XP & Insignias
  {
    id: 'como-funciona-leaderboard',
    category: 'leaderboard',
    question: '¿Cómo funciona el Leaderboard y el Sistema de Puntuación XP?',
    answer:
      'El Leaderboard clasifica a los miembros por su **Score XP de Club**, un puntaje integral que premia la constancia y los logros históricos:\n\n• **Puntos por Actividad**:\n  - 🎧 **+50 XP** por cada álbum reseñado.\n  - ✍️ **+25 XP extra** por reseñas con comentarios detallados.\n  - ⚡ **+2 XP** por cada pista individual calificada.\n  - 💿 **+30 XP** por cada álbum aportado al catálogo.\n\n• **Puntos por Insignias & Tiers**:\n  - Cada nivel desbloqueado otorga entre **+50 XP (Tier I)** hasta **+1,300 XP (Tier VII)**.\n  - Las Coronas de Récords #1 otorgan un bonus permanente de **+300 XP** mientras se conserve el récord.\n\nEn la parte superior se exhibe el **Podio de Honor** con medallas de Oro 🥇, Plata 🥈 y Bronce 🥉 para los 3 líderes de puntuación.',
  },
  {
    id: 'que-insignias-existen',
    category: 'leaderboard',
    question: '¿Qué insignias (Badges) existen y cómo se dividen en Tiers?',
    answer:
      'Las insignias se organizan en 3 pilares clave:\n\n1. 👑 **Récords #1 Dinámicos (Coronas)**: Títulos exclusivos para los líderes de la comunidad (#1 en reseñas: 👑 *Máster Reviewer*, #1 en aportes: 🏆 *Gran Curador*, #1 en pistas: ⚡ *Cirujano del Tracklist*, #1 en comentarios: ✒️ *Crítico Letrado*, #1 en dieces: 🌟 *Cazador Absoluto del 10*).\n\n2. 📈 **Progresión Multinivel (Tiers I al VII)**:\n  - 🎚️ *Pistas al Detalle*: Desde 🔬 Oyente Detallista (25 tracks) hasta 🪐 Enciclopedia Sonora (1,000 tracks).\n  - 🎧 *Explorador Musical*: Desde 🎧 Oyente Inicial (5 álbumes) hasta 🌌 Leyenda Melómana (500 álbumes).\n  - ✍️ *Pluma Crítica*: Desde ✍️ Primeros Apuntes (2 comentarios) hasta 🏛️ Reseñista Consagrado (250 comentarios).\n  - 💯 *Cazador del 10*: Desde 💯 Descubridor de Joyas (1 diez) hasta 🔮 Coleccionista Supremo (100 dieces).\n  - 💿 *Curaduría & Aportes*: Desde 💿 Melómano Colaborador (5 álbumes) hasta 🗿 Archivero Maestro (250 álbumes).\n\n3. ⚖️ **Personalidad & Rigor Crítico**:\n  - 🎯 *Crítico Exigente*: Tiers I a IV para promedios rigurosos (🎯 Oído Exigente hasta 💀 Inquisidor Sonoro con 5+ reviews).\n  - 💖 *Crítico Generoso*: Tiers I a V para promedios entusiastas (💖 Oído Optimista hasta 🪽 Apóstol del Aprecio con 5+ reviews).',
  },
  {
    id: 'perfil-otros-miembros',
    category: 'leaderboard',
    question: '¿Puedo consultar las estadísticas, XP y gustos de otros miembros?',
    answer:
      '¡Sí! En el Leaderboard puedes hacer clic en cualquier miembro para abrir una tarjeta con su biografía musical, su artista y álbum favoritos, su desglose de puntuación XP, progreso hacia sus siguientes tiers, y el listado de todos sus álbumes aportados y promedios por criterio.',
  },

  // 5. Catálogo & Spotify
  {
    id: 'estados-albumes-catalogo',
    category: 'catalogo',
    question: '¿Qué significan los estados ACTIVO, INDIVIDUAL, GANADOR e INACTIVO?',
    answer:
      'En el catálogo encontrarás álbumes clasificados con diferentes etiquetas de color:\n\n• 🟢 **ACTIVO**: El disco forma parte de la bolsa de sorteos de la ruleta.\n• 🟣 **INDIVIDUAL**: Álbum añadido para escucha libre personal o voluntaria fuera del sorteo semanal.\n• 🟡 **GANADOR**: El álbum seleccionado en el sorteo vigente de la semana.\n• ⚪ **INACTIVO**: Álbum que ya fue escuchado o que ha sido retirado de la ruleta.',
  },
  {
    id: 'como-proponer-album',
    category: 'catalogo',
    question: '¿Cómo propongo un nuevo álbum con el buscador de Spotify?',
    answer:
      'Inicia sesión y ve a la sección **Buscar Álbum en Spotify** (disponible en la página principal o catálogo). Escribe el nombre del disco o artista, selecciona el resultado oficial con autocompletado y elige si deseas agregarlo como propuesta para la ruleta (**Activo**) o para escucha personal (**Individual**). El sistema descargará automáticamente la portada oficial en alta definición, año y todas las canciones.',
  },
  {
    id: 'bonus-participacion',
    category: 'catalogo',
    question: '¿Qué es el Bonus por Participación en los Rankings?',
    answer:
      'Para evitar que un álbum con solo 1 reseña perfecta de 10.0 monopolice el primer lugar frente a discos con 15 reseñas y alto consenso, el ranking aplica un ligero multiplicador:\n\n• Hasta 5 reseñas: Sin bonus.\n• De 6 a 10 reseñas: +0.25 por cada reseña adicional.\n• Más de 10 reseñas: +1.25 base + 0.10 por cada reseña adicional.\nEsto premia a los álbumes que han generado mayor participación y debate en la comunidad.',
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
    question: '¿Qué funciones y herramientas tiene el Administrador?',
    answer:
      'Los usuarios con rol Administrador tienen acceso a la ruta protegida /admin, donde pueden:\n\n• Cambiar el estado de cualquier álbum (Activar, Desactivar, Individual).\n• Editar información de discos o eliminar propuestas duplicadas.\n• Moderar o eliminar reseñas que violen las normas de convivencia.\n• Controlar y reiniciar manualmente la selección de la máquina musical.',
  },
  {
    id: 'privacidad-seguridad',
    category: 'admin',
    question: '¿Cómo se protegen mis datos y mi cuenta?',
    answer:
      'La plataforma utiliza la infraestructura segura de **Supabase** con autenticación OAuth mediante Google y cifrado en tránsito. Musiclub nunca almacena contraseñas ni información bancaria, y tus datos solo se emplean para el funcionamiento interno de la comunidad musical.',
  },
];

export function FAQ({ isPage = false }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState({ 'que-es-musiclub': true });

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
    <div className="min-h-screen cyber-grid p-3 sm:p-6 md:p-8 w-full max-w-full overflow-x-hidden">
      <div className="max-w-5xl mx-auto w-full">
        {/* Universal Standard App Header */}
        {isPage && (
          <div className="mb-6">
            <AppHeader showTitle={false} />
          </div>
        )}

        {/* Hero Banner FAQ */}
        <div className="relative overflow-hidden bg-gradient-to-br from-black/80 via-[#1a1a38]/80 to-black/90 border border-[#f5576c]/30 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl mb-8">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-[#f5576c]/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-[#f093fb]/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5576c]/15 border border-[#f5576c]/30 text-[#f5576c] text-xs font-bold uppercase tracking-wider mb-3">
                <span>❓</span> Centro de Ayuda y Preguntas Frecuentes
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight title-albumes">
                GUÍA & LOGÍSTICA DEL CLUB
              </h1>
              <p className="text-white/60 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
                Descubre cómo funciona la Ruleta Cyberpunk, el sistema de calificaciones ponderadas, el cálculo de probabilidades, el Leaderboard con insignias y toda la dinámica comunitaria de Musiclub.
              </p>
            </div>
            <div className="text-6xl sm:text-7xl flex-shrink-0 animate-pulse">
              🎰
            </div>
          </div>

          {/* Tarjetas de Resumen Rápido */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/10">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
              <div className="text-2xl mb-1">🎰</div>
              <div className="text-white font-bold text-xs sm:text-sm">Ruleta Ponderada</div>
              <div className="text-white/40 text-[11px]">+40% peso por antigüedad</div>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
              <div className="text-2xl mb-1">📝</div>
              <div className="text-white font-bold text-xs sm:text-sm">Reseñas Ponderadas</div>
              <div className="text-white/40 text-[11px]">50% Tracks · 30% Crit. · 20% Gen.</div>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
              <div className="text-2xl mb-1">🏆</div>
              <div className="text-white font-bold text-xs sm:text-sm">Leaderboard & Badges</div>
              <div className="text-white/40 text-[11px]">7 Insignias automáticas</div>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
              <div className="text-2xl mb-1">🎧</div>
              <div className="text-white font-bold text-xs sm:text-sm">Spotify Sync</div>
              <div className="text-white/40 text-[11px]">Catálogo y pistas oficiales</div>
            </div>
          </div>
        </div>

        {/* Buscador y Controles */}
        <div className="bg-black/60 border border-white/10 rounded-2xl p-4 mb-6 backdrop-blur-md flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar pregunta o tema..."
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
                    ? 'bg-gradient-to-r from-[#f5576c] to-[#f093fb] text-white border-transparent shadow-lg shadow-[#f5576c]/20 scale-105'
                    : 'bg-black/40 text-white/60 border-white/10 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Lista de Preguntas / Acordeón */}
        <div className="space-y-3">
          {filteredFAQs.length === 0 ? (
            <div className="bg-black/60 border border-white/10 rounded-2xl p-10 text-center text-white/50">
              <div className="text-4xl mb-2">🔎</div>
              <p className="font-bold text-white/80">No se encontraron preguntas coincidentes</p>
              <p className="text-xs text-white/40 mt-1">
                Prueba con otros términos de búsqueda o selecciona otra categoría.
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
                    onClick={() => toggleItem(item.id)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-[#f5576c] flex-shrink-0 group-hover:scale-110 transition-transform">
                        {idx + 1}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-white/90 group-hover:text-white transition-colors">
                        {item.question}
                      </h3>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-transform duration-300 flex-shrink-0 ${
                        isOpen
                          ? 'bg-[#f5576c] text-white rotate-180'
                          : 'bg-white/10 text-white/60 group-hover:bg-white/20'
                      }`}
                    >
                      ▼
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-6 pb-5 pt-1 text-white/75 text-xs sm:text-sm leading-relaxed border-t border-white/5 whitespace-pre-line">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer del FAQ */}
        <div className="mt-12 bg-black/40 border border-white/10 rounded-2xl p-6 text-center text-white/50 text-xs sm:text-sm">
          <p className="mb-2 text-white/80 font-bold">¿Tienes alguna otra duda o sugerencia para el club?</p>
          <p className="text-white/40 mb-4">
            Puedes proponer nuevas dinámicas, consultar el código o contactar al administrador del club.
          </p>
          <div className="flex justify-center gap-4 text-xs">
            <Link to="/" className="text-[#f5576c] hover:underline font-semibold">
              🎧 Ir al Inicio de Musiclub
            </Link>
            <span className="text-white/20">·</span>
            <Link to="/leaderboard" className="text-[#f5576c] hover:underline font-semibold">
              🏆 Ver Leaderboard
            </Link>
            <span className="text-white/20">·</span>
            <Link to="/albumes" className="text-[#f5576c] hover:underline font-semibold">
              💿 Explorar Catálogo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
