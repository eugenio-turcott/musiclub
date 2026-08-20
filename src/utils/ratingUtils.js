// src/utils/ratingUtils.js

/**
 * Calculador de calificación ponderada para una review:
 * - 50% Canciones (Track Ratings, escala 1-10)
 * - 30% Demás Criterios (Producción, Composición, Letras, Originalidad, Cohesión, Replay; escala 1-5 convertida a 1-10)
 * - 20% Calificación General (escala 1-10)
 */
export function getWeightedReviewScore(review) {
  if (!review) return null;

  // 1. Canciones (50%)
  const trackRatings = review.track_ratings || review.trackRatings || {};
  const trackScores = Object.values(trackRatings)
    .map(Number)
    .filter((v) => !isNaN(v) && v > 0);

  const hasTracks = trackScores.length > 0;
  const trackAvg = hasTracks
    ? trackScores.reduce((a, b) => a + b, 0) / trackScores.length
    : null;

  // 2. Criterios 1 a 6 (30%) - escala 1-5 convertida a escala de 10 (x 2)
  const c1to6Keys = [
    ['rating_produccion', 'ratingProduccion'],
    ['rating_composicion', 'ratingComposicion'],
    ['rating_letras', 'ratingLetras'],
    ['rating_originalidad', 'ratingOriginalidad'],
    ['rating_cohesion', 'ratingCohesion'],
    ['rating_replay', 'ratingReplay'],
  ];

  const c1to6Scores = [];
  c1to6Keys.forEach(([k1, k2]) => {
    const val = review[k1] ?? review[k2];
    if (val !== null && val !== undefined && !isNaN(Number(val)) && Number(val) > 0) {
      c1to6Scores.push(Number(val) * 2); // Convertir 1-5 a escala de 10
    }
  });

  const hasC1to6 = c1to6Scores.length > 0;
  const c1to6Avg = hasC1to6
    ? c1to6Scores.reduce((a, b) => a + b, 0) / c1to6Scores.length
    : null;

  // 3. Calificación General (20%)
  const genVal = review.rating_general ?? review.ratingGeneral;
  const hasGen = genVal !== null && genVal !== undefined && !isNaN(Number(genVal)) && Number(genVal) > 0;
  const generalScore = hasGen ? Number(genVal) : null;

  // Cálculo de Ponderación según datos disponibles
  if (hasTracks && hasC1to6 && hasGen) {
    return trackAvg * 0.50 + c1to6Avg * 0.30 + generalScore * 0.20;
  } else if (!hasTracks && hasC1to6 && hasGen) {
    // Si no hay canciones calificadas, ponderar 60% criterios y 40% general
    return c1to6Avg * 0.60 + generalScore * 0.40;
  } else if (hasTracks && hasGen) {
    return trackAvg * 0.70 + generalScore * 0.30;
  } else if (hasGen) {
    return generalScore;
  }

  return null;
}

/**
 * Promedio ponderado acumulado de una lista de reviews para un álbum
 */
export function getAlbumWeightedAverage(reviews) {
  if (!reviews || reviews.length === 0) return null;

  const validScores = reviews
    .map(getWeightedReviewScore)
    .filter((score) => score !== null && !isNaN(score));

  if (validScores.length === 0) return null;

  const total = validScores.reduce((sum, val) => sum + val, 0);
  const avg = total / validScores.length;
  return avg.toFixed(1);
}

/**
 * Cálculo del bonus extra de calificación por cantidad de reviews:
 * - Hasta 5 reviews: 0 bonus
 * - De 6 a 10 reviews (más de 5): +0.25 por cada review adicional
 * - Más de 10 reviews: +0.10 por cada review adicional después de la 10 (con los primeros 5 a +0.25 = +1.25)
 */
export function calculateReviewBonus(reviewCount) {
  if (!reviewCount || reviewCount <= 5) return 0;
  if (reviewCount > 10) {
    return 5 * 0.25 + (reviewCount - 10) * 0.10;
  }
  return (reviewCount - 5) * 0.25;
}

/**
 * Obtiene el nombre legible de una pista dado su identificador (id, spotifyId, o nombre)
 * y la lista de canciones del álbum.
 */
export function getTrackDisplayName(trackKey, tracks = []) {
  if (!trackKey) return 'Pista';
  const strKey = String(trackKey).trim();
  if (Array.isArray(tracks) && tracks.length > 0) {
    // 1. Buscar coincidencia exacta por ID de Spotify o ID de base de datos
    const foundById = tracks.find(
      (t) =>
        t &&
        typeof t === 'object' &&
        (t.id === strKey || String(t.id) === strKey || t.spotify_id === strKey)
    );
    if (foundById && foundById.name) return foundById.name;

    // 2. Buscar coincidencia por nombre insensible a mayúsculas
    const foundByName = tracks.find(
      (t) =>
        t &&
        ((typeof t === 'string' && t.toLowerCase().trim() === strKey.toLowerCase()) ||
          (typeof t === 'object' &&
            t.name &&
            t.name.toLowerCase().trim() === strKey.toLowerCase()))
    );
    if (foundByName) {
      return typeof foundByName === 'string' ? foundByName : foundByName.name;
    }

    // 3. Si el key es un índice numérico (1-based o 0-based)
    if (!isNaN(Number(strKey)) && Number(strKey) > 0) {
      const idx = Number(strKey);
      if (tracks[idx - 1]) {
        const item = tracks[idx - 1];
        return typeof item === 'string' ? item : item.name || `Pista ${idx}`;
      }
    }
  }

  return strKey;
}

// ==========================================================
// 7 EMOCIONES / SENTIMIENTO DEL ÁLBUM ("¿Cómo te hizo sentir?")
// ==========================================================
export const EMOTIONS = [
  {
    id: 'euforico',
    emoji: '🤩',
    label: 'Eufórico / Asombrado',
    text: 'Eufórico / Asombrado',
    description: 'Éxtasis musical, adrenalina pura o fascinación total.',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    minScore: 9.3,
  },
  {
    id: 'inspirado',
    emoji: '😊',
    label: 'Inspirado / Feliz',
    text: 'Inspirado / Feliz',
    description: 'Vibra brillante, optimismo contagioso y gozo sonoro.',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    minScore: 8.3,
  },
  {
    id: 'relajado',
    emoji: '😌',
    label: 'Relajado / Conectado',
    text: 'Relajado / Conectado',
    description: 'Paz mental, atmósfera envolvente y disfrute íntimo.',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    minScore: 7.3,
  },
  {
    id: 'intrigado',
    emoji: '🤔',
    label: 'Intrigado / Reflexivo',
    text: 'Intrigado / Reflexivo',
    description: 'Desafiante, intelectual, misterioso o experimental.',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    minScore: 6.0,
  },
  {
    id: 'melancolico',
    emoji: '😢',
    label: 'Nostálgico / Melancólico',
    text: 'Nostálgico / Melancólico',
    description: 'Tristeza hermosa, nostalgia profunda y catarsis emocional.',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    minScore: 5.0,
  },
  {
    id: 'indiferente',
    emoji: '😐',
    label: 'Indiferente / Aburrido',
    text: 'Indiferente / Aburrido',
    description: 'Plano, monótono, sin impacto o fácil de olvidar.',
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    minScore: 4.2,
  },
  {
    id: 'asco',
    emoji: '🤢',
    label: 'Desagrado / Asco',
    text: 'Desagrado / Asco',
    description: 'Inaudible, pésima ejecución o rechazo auditivo total.',
    badgeClass: 'bg-lime-500/20 text-lime-300 border-lime-500/40',
    minScore: 0.0,
  },
];

/**
 * Obtiene la emoción predeterminada calculada según la calificación ponderada
 */
export function getEmotionForScore(score) {
  if (score === null || score === undefined || isNaN(score)) {
    return EMOTIONS.find((e) => e.id === 'relajado');
  }

  const num = Number(score);
  if (num >= 9.3) return EMOTIONS.find((e) => e.id === 'euforico');
  if (num >= 8.3) return EMOTIONS.find((e) => e.id === 'inspirado');
  if (num >= 7.3) return EMOTIONS.find((e) => e.id === 'relajado');
  if (num >= 6.0) return EMOTIONS.find((e) => e.id === 'intrigado');
  if (num >= 4.2) return EMOTIONS.find((e) => e.id === 'indiferente');
  return EMOTIONS.find((e) => e.id === 'asco');
}

/**
 * Obtiene la emoción de una review existente o calculada
 */
export function getEmotionFromReview(review) {
  if (!review) return EMOTIONS[2]; // Default Relajado

  // 1. Si ya tiene el campo 'feeling' o 'emotion' guardado en BD
  const rawFeeling = review.feeling || review.emotion;
  if (rawFeeling) {
    const matched = EMOTIONS.find(
      (e) =>
        e.text.toLowerCase() === rawFeeling.toLowerCase() ||
        e.label.toLowerCase() === rawFeeling.toLowerCase() ||
        e.id === rawFeeling.toLowerCase() ||
        rawFeeling.toLowerCase().includes(e.id)
    );
    if (matched) return matched;
  }

  // 2. Si no tiene 'feeling', se asigna por defecto en base a la calificación ponderada
  const weightedScore = getWeightedReviewScore(review) ?? review.rating_general;
  return getEmotionForScore(weightedScore);
}
