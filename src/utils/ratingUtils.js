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

