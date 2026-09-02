// src/utils/badgeSystem.js

/**
 * CONFIGURACIÓN DE PUNTOS BASE POR ACTIVIDAD (XP)
 */
export const XP_CONFIG = {
  REVIEW_BASE: 50, // XP por cada álbum reseñado
  REVIEW_COMMENT_BONUS: 25, // XP adicional si la reseña incluye comentario en texto
  TRACK_RATED: 2, // XP por cada canción/track calificado individualmente
  RECORD_CROWN_BONUS: 300, // XP bono activo por ostentar un récord #1
};

/**
 * ESTILOS VISUALES POR NIVEL DE TIER
 */
export const TIER_STYLES = {
  tier_1: {
    badgeClass:
      'from-amber-700 via-amber-600 to-amber-800 text-amber-100 border-amber-500/40',
    borderClass: 'border-amber-700/50',
    glowClass: 'shadow-amber-900/30',
    tierRoman: 'I',
    tierName: 'Bronce',
  },
  tier_2: {
    badgeClass:
      'from-slate-400 via-slate-300 to-slate-500 text-slate-950 border-slate-300/50',
    borderClass: 'border-slate-400/50',
    glowClass: 'shadow-slate-400/30',
    tierRoman: 'II',
    tierName: 'Plata',
  },
  tier_3: {
    badgeClass:
      'from-amber-400 via-yellow-300 to-amber-500 text-amber-950 border-amber-300/60 font-black',
    borderClass: 'border-amber-400/60',
    glowClass: 'shadow-amber-400/40',
    tierRoman: 'III',
    tierName: 'Oro',
  },
  tier_4: {
    badgeClass:
      'from-cyan-400 via-teal-300 to-blue-500 text-cyan-950 border-cyan-300/60 font-black',
    borderClass: 'border-cyan-400/60',
    glowClass: 'shadow-cyan-400/40',
    tierRoman: 'IV',
    tierName: 'Platino',
  },
  tier_5: {
    badgeClass:
      'from-emerald-400 via-teal-300 to-cyan-500 text-emerald-950 border-emerald-300/60 font-black',
    borderClass: 'border-emerald-400/60',
    glowClass: 'shadow-emerald-400/40',
    tierRoman: 'V',
    tierName: 'Diamante',
  },
  tier_6: {
    badgeClass:
      'from-purple-500 via-fuchsia-400 to-pink-500 text-white border-fuchsia-300/70 font-black',
    borderClass: 'border-purple-500/70',
    glowClass: 'shadow-purple-500/50 shadow-lg',
    tierRoman: 'VI',
    tierName: 'Cósmico',
  },
  tier_7: {
    badgeClass:
      'from-rose-500 via-amber-300 to-yellow-400 text-slate-950 border-amber-200 font-black ring-2 ring-yellow-400/50',
    borderClass: 'border-amber-300',
    glowClass: 'shadow-amber-400/60 shadow-xl',
    tierRoman: 'VII',
    tierName: 'Leyenda',
  },
};

/**
 * CATÁLOGO DE INSIGNIAS DE PROGRESIÓN (MULTINIVEL)
 * NOTA: Cada insignia tiene un emoji totalmente único y sin repeticiones.
 */
export const PROGRESSION_BADGES = {
  tracks: {
    id: 'tracks',
    categoryName: 'Pistas al Detalle',
    icon: '🎚️',
    description:
      'Tracks individuales calificados minuciosamente canción por canción.',
    metricKey: 'total_tracks_rated',
    tiers: [
      {
        tier: 1,
        name: '🔬 Oyente Detallista',
        req: 25,
        xp: 50,
        color: 'from-cyan-600 to-teal-700 text-cyan-100',
      },
      {
        tier: 2,
        name: '🔍 Analista de Pistas',
        req: 75,
        xp: 100,
        color: 'from-orange-500 to-amber-600 text-white',
      },
      {
        tier: 3,
        name: '🎛️ Especialista en Tracks',
        req: 150,
        xp: 200,
        color: 'from-cyan-400 to-blue-500 text-cyan-950',
      },
      {
        tier: 4,
        name: '🧠 Cirujano Musical',
        req: 300,
        xp: 350,
        color: 'from-indigo-500 to-purple-600 text-white',
      },
      {
        tier: 5,
        name: '💎 Maestro del Detalle',
        req: 500,
        xp: 550,
        color: 'from-amber-400 to-yellow-500 text-amber-950 font-black',
      },
      {
        tier: 6,
        name: '🪐 Enciclopedia Sonora',
        req: 1000,
        xp: 850,
        color:
          'from-purple-600 via-fuchsia-500 to-pink-500 text-white font-black',
      },
    ],
  },
  reviews: {
    id: 'reviews',
    categoryName: 'Explorador Musical',
    icon: '🎧',
    description:
      'Cantidad acumulada de álbumes completos reseñados en el club.',
    metricKey: 'review_count',
    tiers: [
      {
        tier: 1,
        name: '🎧 Oyente Inicial',
        req: 5,
        xp: 50,
        color: 'from-slate-600 to-slate-700 text-slate-100',
      },
      {
        tier: 2,
        name: '🎵 Explorador Constante',
        req: 15,
        xp: 100,
        color: 'from-emerald-600 to-teal-700 text-emerald-100',
      },
      {
        tier: 3,
        name: '🎶 Crítico Frecuente',
        req: 30,
        xp: 200,
        color: 'from-amber-500 to-orange-600 text-amber-950',
      },
      {
        tier: 4,
        name: '📻 Devorador de Discos',
        req: 50,
        xp: 350,
        color: 'from-rose-500 to-red-600 text-white',
      },
      {
        tier: 5,
        name: '🎷 Entendido Musical',
        req: 100,
        xp: 550,
        color: 'from-purple-500 to-indigo-600 text-white',
      },
      {
        tier: 6,
        name: '🎼 Guardián del Catálogo',
        req: 200,
        xp: 850,
        color:
          'from-cyan-300 via-teal-300 to-emerald-400 text-slate-950 font-black',
      },
      {
        tier: 7,
        name: '🌌 Leyenda Melómana',
        req: 500,
        xp: 1300,
        color:
          'from-amber-300 via-yellow-400 to-orange-500 text-amber-950 font-black ring-1 ring-amber-300',
      },
    ],
  },
  comments: {
    id: 'comments',
    categoryName: 'Pluma Crítica',
    icon: '✍️',
    description: 'Reseñas enriquecidas con análisis y comentarios en texto.',
    metricKey: 'comments_count',
    tiers: [
      {
        tier: 1,
        name: '✍️ Primeros Apuntes',
        req: 2,
        xp: 50,
        color: 'from-blue-600 to-cyan-700 text-blue-100',
      },
      {
        tier: 2,
        name: '📝 Voz con Criterio',
        req: 10,
        xp: 100,
        color: 'from-indigo-500 to-blue-600 text-white',
      },
      {
        tier: 3,
        name: '📖 Cronista del Club',
        req: 25,
        xp: 200,
        color: 'from-blue-400 to-indigo-500 text-white',
      },
      {
        tier: 4,
        name: '🖋️ Ensayista Musical',
        req: 50,
        xp: 350,
        color: 'from-purple-500 to-indigo-600 text-white',
      },
      {
        tier: 5,
        name: '📜 Crítico Editorial',
        req: 100,
        xp: 550,
        color: 'from-amber-400 to-yellow-500 text-amber-950 font-black',
      },
      {
        tier: 6,
        name: '🏛️ Reseñista Consagrado',
        req: 250,
        xp: 850,
        color: 'from-purple-600 via-pink-500 to-rose-500 text-white font-black',
      },
    ],
  },
  tens: {
    id: 'tens',
    categoryName: 'Cazador del 10',
    icon: '💯',
    description:
      'Calificaciones perfectas (nota 10) otorgadas en evaluaciones completas.',
    metricKey: 'tens_count',
    tiers: [
      {
        tier: 1,
        name: '💯 Descubridor de Joyas',
        req: 1,
        xp: 50,
        color: 'from-pink-600 to-rose-700 text-pink-100',
      },
      {
        tier: 2,
        name: '🔟 Buscador de Excelencia',
        req: 5,
        xp: 100,
        color: 'from-rose-500 to-pink-600 text-white',
      },
      {
        tier: 3,
        name: '🥇 Guardián de Obras Maestras',
        req: 10,
        xp: 200,
        color: 'from-pink-400 to-rose-500 text-white font-bold',
      },
      {
        tier: 4,
        name: '🔥 Catador de Perfección',
        req: 25,
        xp: 350,
        color:
          'from-amber-400 via-rose-400 to-pink-500 text-slate-950 font-black',
      },
      {
        tier: 5,
        name: '✨ Consagrador del 10',
        req: 50,
        xp: 550,
        color:
          'from-cyan-300 via-pink-400 to-purple-500 text-slate-950 font-black',
      },
      {
        tier: 6,
        name: '🔮 Coleccionista Supremo',
        req: 100,
        xp: 850,
        color:
          'from-purple-600 via-fuchsia-500 to-rose-500 text-white font-black',
      },
    ],
  },
};

/**
 * INSIGNIAS DE PERSONALIDAD / ESTILO CRÍTICO (Requieren mín. 5 reseñas)
 * Cada nivel cuenta con un emoji exclusivo sin repetir.
 */
export const PERSONALITY_BADGES = {
  strict_critic: {
    id: 'strict_critic',
    categoryName: 'Crítico Exigente',
    icon: '🎯',
    description:
      'Análisis estricto, riguroso y altos estándares de evaluación.',
    minReviews: 10,
    tiers: [
      {
        tier: 1,
        name: '🎯 Oído Exigente',
        maxAvg: 7.4,
        xp: 100,
        color: 'from-rose-500 to-red-600 text-white',
      },
      {
        tier: 2,
        name: '🧐 Filtro Riguroso',
        maxAvg: 6.6,
        xp: 200,
        color: 'from-red-600 to-rose-700 text-white',
      },
      {
        tier: 3,
        name: '⚖️ Juez Inflexible',
        maxAvg: 5.8,
        xp: 350,
        color: 'from-red-700 to-rose-900 text-red-100',
      },
      {
        tier: 4,
        name: '💀 Inquisidor Sonoro',
        maxAvg: 5.0,
        xp: 500,
        color:
          'from-stone-900 via-red-950 to-black text-rose-300 border border-red-500/50 font-black',
      },
    ],
  },
  generous_critic: {
    id: 'generous_critic',
    categoryName: 'Crítico Generoso',
    icon: '💖',
    description:
      'Gran entusiasmo, pasión y aprecio por las propuestas musicales.',
    minReviews: 10,
    tiers: [
      {
        tier: 1,
        name: '💖 Oído Optimista',
        minAvg: 8.6,
        xp: 100,
        color: 'from-emerald-500 to-teal-600 text-emerald-950',
      },
      {
        tier: 2,
        name: '🌸 Fan Apasionado',
        minAvg: 8.8,
        xp: 200,
        color: 'from-teal-400 to-emerald-500 text-emerald-950',
      },
      {
        tier: 3,
        name: '🎺 Celebrador Sonoro',
        minAvg: 9.0,
        xp: 200,
        color: 'from-emerald-300 to-green-400 text-emerald-950 font-bold',
      },
      {
        tier: 4,
        name: '🌈 Embajador del Entusiasmo',
        minAvg: 9.2,
        xp: 350,
        color:
          'from-green-300 via-emerald-300 to-teal-400 text-emerald-950 font-black',
      },
      {
        tier: 5,
        name: '🪽 Apóstol del Aprecio',
        minAvg: 9.5,
        xp: 500,
        color:
          'from-emerald-200 via-teal-200 to-cyan-300 text-slate-950 font-black ring-1 ring-emerald-300',
      },
    ],
  },
};

/**
 * RÉCORDS #1 (CORONAS DINÁMICAS SIN TIERS)
 * Cada récord tiene un emoji único y exclusivo.
 */
export const RECORD_BADGES_CONFIG = [
  {
    id: 'top_reviewer',
    metricKey: 'review_count',
    label: '👑 Máster Reviewer',
    icon: '👑',
    color:
      'from-amber-400 via-yellow-300 to-amber-500 text-amber-950 font-black shadow-lg shadow-amber-500/20 ring-1 ring-amber-300',
    desc: 'Récord #1 histórico en cantidad de reseñas publicadas en el club.',
    xp: XP_CONFIG.RECORD_CROWN_BONUS,
  },
  {
    id: 'top_tracks',
    metricKey: 'total_tracks_rated',
    label: '⚡ Cirujano del Tracklist',
    icon: '⚡',
    color:
      'from-cyan-400 via-teal-300 to-blue-500 text-cyan-950 font-black shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-300',
    desc: 'Récord #1 con más canciones individuales calificadas pista por pista.',
    xp: XP_CONFIG.RECORD_CROWN_BONUS,
  },
  {
    id: 'top_writer',
    metricKey: 'comments_count',
    label: '✒️ Crítico Letrado',
    icon: '✒️',
    color:
      'from-blue-400 via-indigo-300 to-blue-600 text-blue-950 font-black shadow-lg shadow-blue-500/20 ring-1 ring-blue-300',
    desc: 'Récord #1 en reseñas redactadas con comentarios extensos y análisis.',
    xp: XP_CONFIG.RECORD_CROWN_BONUS,
  },
  {
    id: 'top_tens',
    metricKey: 'tens_count',
    label: '🌟 Cazador Absoluto del 10',
    icon: '🌟',
    color:
      'from-pink-500 via-rose-400 to-red-500 text-white font-black shadow-lg shadow-pink-500/20 ring-1 ring-pink-300',
    desc: 'Récord #1 en calificaciones perfectas (10 ⭐) otorgadas.',
    xp: XP_CONFIG.RECORD_CROWN_BONUS,
  },
];

/**
 * CALCULAR GAMIFICACIÓN COMPLETA PARA UN USUARIO
 *
 * @param {Object} u - Datos procesados del usuario
 * @param {Object} communityMaxes - Máximos globales de la comunidad para récords #1
 * @returns {Object} { totalXp, activityXp, badgesXp, recordXp, badges, allBadgesProgress }
 */
export function calculateUserGamification(u, communityMaxes = {}) {
  const reviews = u.reviews || [];
  const reviewCount = u.review_count || 0;
  const tracksRatedCount = u.total_tracks_rated || 0;
  const avgScore = u.avg_score || 0;

  // 1. Métricas complementarias
  let commentsCount = 0;
  let tensCount = 0;

  reviews.forEach((r) => {
    if (
      r.comment &&
      typeof r.comment === 'string' &&
      r.comment.trim().length > 0
    ) {
      commentsCount += 1;
    }
    // Considerar 10 en calificación general o en tracks
    const gen10 = Number(r.rating_general) === 10;
    const track10 =
      r.track_ratings &&
      typeof r.track_ratings === 'object' &&
      Object.values(r.track_ratings).some((v) => Number(v) === 10);
    if (gen10 || track10) {
      tensCount += 1;
    }
  });

  // Guardar métricas en el objeto usuario
  u.comments_count = commentsCount;
  u.tens_count = tensCount;

  // 2. XP por Actividad Base
  const activityXp =
    reviewCount * XP_CONFIG.REVIEW_BASE +
    commentsCount * XP_CONFIG.REVIEW_COMMENT_BONUS +
    tracksRatedCount * XP_CONFIG.TRACK_RATED;

  let badgesXp = 0;
  let recordXp = 0;
  const activeBadges = [];
  const allBadgesProgress = [];

  // 3. Evaluar Insignias de Progresión Multinivel
  Object.values(PROGRESSION_BADGES).forEach((badgeDef) => {
    const userVal = u[badgeDef.metricKey] || 0;
    let highestUnlockedTier = null;
    let nextTier = null;
    let accumulatedXp = 0;

    badgeDef.tiers.forEach((t) => {
      if (userVal >= t.req) {
        highestUnlockedTier = t;
        accumulatedXp += t.xp;
      } else if (!nextTier) {
        nextTier = t;
      }
    });

    badgesXp += accumulatedXp;

    const progressInfo = {
      badgeId: badgeDef.id,
      categoryName: badgeDef.categoryName,
      icon: badgeDef.icon,
      description: badgeDef.description,
      currentValue: userVal,
      unlockedTier: highestUnlockedTier,
      nextTier: nextTier,
      accumulatedXp,
      progressPercent: nextTier
        ? Math.min(
            100,
            Math.round(
              ((userVal - (highestUnlockedTier ? highestUnlockedTier.req : 0)) /
                (nextTier.req -
                  (highestUnlockedTier ? highestUnlockedTier.req : 0))) *
                100
            )
          )
        : 100,
    };

    allBadgesProgress.push(progressInfo);

    if (highestUnlockedTier) {
      const tierStyle =
        TIER_STYLES[`tier_${highestUnlockedTier.tier}`] || TIER_STYLES.tier_1;
      const tooltipText = nextTier
        ? `${highestUnlockedTier.name} • Siguiente meta: ${nextTier.name} (${userVal} / ${nextTier.req})`
        : `${highestUnlockedTier.name} • ¡Nivel Máximo de ${badgeDef.categoryName} Alcanzado! (${userVal} totales)`;

      activeBadges.push({
        id: `${badgeDef.id}_t${highestUnlockedTier.tier}`,
        badgeKey: badgeDef.id,
        type: 'progression',
        tierNumber: highestUnlockedTier.tier,
        tierRoman: tierStyle.tierRoman,
        tierName: tierStyle.tierName,
        label: highestUnlockedTier.name,
        color: highestUnlockedTier.color,
        borderClass: tierStyle.borderClass,
        glowClass: tierStyle.glowClass,
        xp: highestUnlockedTier.xp,
        accumulatedXp,
        desc: tooltipText,
        tooltip: tooltipText,
        progressInfo,
      });
    }
  });

  // 4. Evaluar Insignias de Personalidad / Estilo Crítico (mínimo de reviews)
  if (
    reviewCount >= PERSONALITY_BADGES.strict_critic.minReviews &&
    avgScore > 0
  ) {
    let unlockedStrict = null;
    let strictXp = 0;
    PERSONALITY_BADGES.strict_critic.tiers.forEach((t) => {
      if (avgScore <= t.maxAvg) {
        unlockedStrict = t;
        strictXp = Math.max(strictXp, t.xp);
      }
    });

    if (unlockedStrict) {
      badgesXp += strictXp;
      const tierStyle =
        TIER_STYLES[`tier_${unlockedStrict.tier}`] || TIER_STYLES.tier_1;
      const nextStrictTier = PERSONALITY_BADGES.strict_critic.tiers.find(
        (t) => t.tier === unlockedStrict.tier + 1
      );
      const strictTooltip = nextStrictTier
        ? `${unlockedStrict.name} (Promedio: ${avgScore.toFixed(1)} ⭐) • Siguiente meta: ${nextStrictTier.name} (Promedio ≤ ${nextStrictTier.maxAvg} ⭐)`
        : `${unlockedStrict.name} (Promedio: ${avgScore.toFixed(1)} ⭐) • ¡Nivel Máximo de Exigencia Alcanzado!`;

      activeBadges.push({
        id: `strict_t${unlockedStrict.tier}`,
        badgeKey: 'strict_critic',
        type: 'personality',
        tierNumber: unlockedStrict.tier,
        tierRoman: tierStyle.tierRoman,
        label: unlockedStrict.name,
        color: unlockedStrict.color,
        borderClass: tierStyle.borderClass,
        glowClass: tierStyle.glowClass,
        xp: strictXp,
        desc: strictTooltip,
        tooltip: strictTooltip,
      });
    }
  }

  if (
    reviewCount >= PERSONALITY_BADGES.generous_critic.minReviews &&
    avgScore > 0
  ) {
    let unlockedGen = null;
    let genXp = 0;
    PERSONALITY_BADGES.generous_critic.tiers.forEach((t) => {
      if (avgScore >= t.minAvg) {
        unlockedGen = t;
        genXp = Math.max(genXp, t.xp);
      }
    });

    if (unlockedGen) {
      badgesXp += genXp;
      const tierStyle =
        TIER_STYLES[`tier_${unlockedGen.tier}`] || TIER_STYLES.tier_1;
      const nextGenTier = PERSONALITY_BADGES.generous_critic.tiers.find(
        (t) => t.tier === unlockedGen.tier + 1
      );
      const genTooltip = nextGenTier
        ? `${unlockedGen.name} (Promedio: ${avgScore.toFixed(1)} ⭐) • Siguiente meta: ${nextGenTier.name} (Promedio ≥ ${nextGenTier.minAvg} ⭐)`
        : `${unlockedGen.name} (Promedio: ${avgScore.toFixed(1)} ⭐) • ¡Nivel Máximo de Generosidad Alcanzado!`;

      activeBadges.push({
        id: `generous_t${unlockedGen.tier}`,
        badgeKey: 'generous_critic',
        type: 'personality',
        tierNumber: unlockedGen.tier,
        tierRoman: tierStyle.tierRoman,
        label: unlockedGen.name,
        color: unlockedGen.color,
        borderClass: tierStyle.borderClass,
        glowClass: tierStyle.glowClass,
        xp: genXp,
        desc: genTooltip,
        tooltip: genTooltip,
      });
    }
  }

  // 5. Evaluar Récords #1 (Coronas Dinámicas)
  RECORD_BADGES_CONFIG.forEach((rec) => {
    const userVal = u[rec.metricKey] || 0;
    const maxVal = communityMaxes[rec.metricKey] || 0;

    if (userVal > 0 && userVal === maxVal) {
      recordXp += rec.xp;
      const recTooltip = `${rec.label} • Récord #1 del Club: ${rec.desc} (${userVal} actuales • +${rec.xp} XP)`;
      activeBadges.unshift({
        id: rec.id,
        badgeKey: rec.id,
        type: 'record',
        isRecord: true,
        label: rec.label,
        color: rec.color,
        xp: rec.xp,
        desc: recTooltip,
        tooltip: recTooltip,
      });
    }
  });

  const totalXp = activityXp + badgesXp + recordXp;

  return {
    totalXp,
    activityXp,
    badgesXp,
    recordXp,
    badges: activeBadges,
    allBadgesProgress,
  };
}

/**
 * DATOS ESTRUCTURADOS PARA RENDERIZAR LA GUÍA COMPLETA DE INSIGNIAS Y PUNTOS
 */
export const BADGES_GUIDE_DATA = [
  {
    category: 'Récords #1 Dinámicos (Coronas)',
    icon: '👑',
    description:
      'Distinciones exclusivas para el miembro que ostenta el puesto número 1 absoluto en cada métrica. Otorgan +300 XP mientras se conserve la corona.',
    items: RECORD_BADGES_CONFIG.map((r) => ({
      title: r.label,
      badgeClass: r.color,
      req: 'Líder #1 de la Comunidad',
      xp: `+${r.xp} XP`,
      desc: r.desc,
    })),
  },
  {
    category: 'Progresión Multinivel (Evolutivas)',
    icon: '📈',
    description:
      'Insignias con múltiples Tiers que evolucionan visualmente a medida que acumulas actividad en el club.',
    groups: Object.values(PROGRESSION_BADGES).map((b) => ({
      name: b.categoryName,
      icon: b.icon,
      description: b.description,
      tiers: b.tiers.map((t) => ({
        tierRoman: TIER_STYLES[`tier_${t.tier}`]?.tierRoman || `T${t.tier}`,
        tierName: TIER_STYLES[`tier_${t.tier}`]?.tierName || '',
        name: t.name,
        req: `${t.req} ${b.id === 'tracks' ? 'canciones' : b.id === 'reviews' ? 'álbumes' : b.id === 'comments' ? 'comentarios' : 'dieces'}`,
        xp: `+${t.xp} XP`,
        color: t.color,
      })),
    })),
  },
  {
    category: 'Personalidad y Estilo Crítico',
    icon: '⚖️',
    description:
      'Reconocen tu rigor evaluativo o entusiasmo musical. Requieren un mínimo de 5 reseñas publicadas para activarse.',
    groups: [
      {
        name: PERSONALITY_BADGES.strict_critic.categoryName,
        icon: PERSONALITY_BADGES.strict_critic.icon,
        description: `${PERSONALITY_BADGES.strict_critic.description} (Mínimo ${PERSONALITY_BADGES.strict_critic.minReviews} reseñas).`,
        tiers: PERSONALITY_BADGES.strict_critic.tiers.map((t) => ({
          tierRoman: TIER_STYLES[`tier_${t.tier}`]?.tierRoman || `T${t.tier}`,
          tierName: TIER_STYLES[`tier_${t.tier}`]?.tierName || '',
          name: t.name,
          req: `Promedio ≤ ${t.maxAvg} ⭐`,
          xp: `+${t.xp} XP`,
          color: t.color,
        })),
      },
      {
        name: PERSONALITY_BADGES.generous_critic.categoryName,
        icon: PERSONALITY_BADGES.generous_critic.icon,
        description: `${PERSONALITY_BADGES.generous_critic.description} (Mínimo ${PERSONALITY_BADGES.generous_critic.minReviews} reseñas).`,
        tiers: PERSONALITY_BADGES.generous_critic.tiers.map((t) => ({
          tierRoman: TIER_STYLES[`tier_${t.tier}`]?.tierRoman || `T${t.tier}`,
          tierName: TIER_STYLES[`tier_${t.tier}`]?.tierName || '',
          name: t.name,
          req: `Promedio ≥ ${t.minAvg} ⭐`,
          xp: `+${t.xp} XP`,
          color: t.color,
        })),
      },
    ],
  },
];
