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
 * Desactivado / Eliminado (retorna siempre 0).
 */
export function calculateReviewBonus() {
  return 0;
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

/**
 * Obtiene la canción con mayor calificación de un mapa de track_ratings.
 * Si varias canciones comparten la nota más alta, desempata aleatoriamente si randomIfTie es true.
 */
export function getTopRatedTrack(trackRatings, randomIfTie = false) {
  if (!trackRatings || typeof trackRatings !== 'object') return null;
  const entries = Object.entries(trackRatings).filter(
    ([_, val]) => val !== null && val !== undefined && !isNaN(Number(val))
  );
  if (entries.length === 0) return null;

  const maxScore = Math.max(...entries.map(([_, v]) => Number(v)));
  const topKeys = entries.filter(([_, v]) => Number(v) === maxScore).map(([k]) => k);

  if (topKeys.length === 0) return null;
  if (topKeys.length === 1 || !randomIfTie) return topKeys[0];

  const randomIndex = Math.floor(Math.random() * topKeys.length);
  return topKeys[randomIndex];
}

/**
 * Obtiene la canción favorita de una review.
 * Prioriza review.favorite_track o review.favoriteTrack; si no existe,
 * calcula la pista con calificación más alta de track_ratings.
 */
export function getReviewFavoriteTrack(review) {
  if (!review) return null;
  if (review.favorite_track) return review.favorite_track;
  if (review.favoriteTrack) return review.favoriteTrack;

  const rawRatings = review.track_ratings || review.trackRatings;
  return getTopRatedTrack(rawRatings, false);
}

/**
 * Comprueba si una pista dada corresponde a la canción favorita de una review.
 */
export function isFavoriteTrackMatch(trackOrKey, favoriteTrackKey, tracks = [], idx = 0) {
  if (!favoriteTrackKey) return false;

  const favStr = String(favoriteTrackKey).trim().toLowerCase();

  if (typeof trackOrKey === 'string') {
    const str = trackOrKey.trim().toLowerCase();
    if (str === favStr) return true;
  }

  if (typeof trackOrKey === 'object' && trackOrKey !== null) {
    if (trackOrKey.id && String(trackOrKey.id).toLowerCase() === favStr) return true;
    if (trackOrKey.spotify_id && String(trackOrKey.spotify_id).toLowerCase() === favStr) return true;
    if (trackOrKey.name && trackOrKey.name.trim().toLowerCase() === favStr) return true;
    if (trackOrKey.track_number && String(trackOrKey.track_number) === favStr) return true;
  }

  if (String(idx + 1) === favStr || String(idx) === favStr) return true;

  // Buscar por nombre legible
  const displayName = getTrackDisplayName(favoriteTrackKey, tracks);
  if (displayName && typeof trackOrKey === 'object' && trackOrKey?.name) {
    if (trackOrKey.name.trim().toLowerCase() === displayName.trim().toLowerCase()) return true;
  } else if (displayName && typeof trackOrKey === 'string') {
    if (trackOrKey.trim().toLowerCase() === displayName.trim().toLowerCase()) return true;
  }

  return false;
}

/**
 * Convierte el nombre de un artista en un slug URL-friendly para rutas como /artista/Radiohead o /artistas/The-Weeknd
 */
export function slugifyArtist(artistName) {
  if (!artistName) return '';
  return String(artistName)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina tildes y diacríticos
    .replace(/['’]/g, '') // Remueve comillas/apóstrofes
    .replace(/[^a-zA-Z0-9]+/g, '-') // Caracteres especiales y espacios se vuelven guiones
    .replace(/^-+|-+$/g, ''); // Quita guiones iniciales y finales
}

/**
 * Busca todos los álbumes de un artista en la colección local de Musiclub
 */
export function findAlbumsByArtist(albums = [], artistQuery = '') {
  if (!artistQuery || !albums || albums.length === 0) return [];
  const targetSlug = slugifyArtist(artistQuery).toLowerCase();
  const cleanQuery = artistQuery.toLowerCase().trim();

  return albums.filter((a) => {
    const artistName = a.artist_name || a.artist || a.artista || '';
    if (!artistName) return false;
    if (slugifyArtist(artistName).toLowerCase() === targetSlug) return true;
    if (artistName.toLowerCase().trim() === cleanQuery) return true;
    if (artistName.toLowerCase().includes(cleanQuery)) return true;
    return false;
  });
}

/**
 * Convierte el nombre de un álbum en un slug URL-friendly para rutas como /albumes/Love-Deluxe.
 * - Quita acentos y caracteres diacríticos.
 * - Elimina caracteres especiales y los reemplaza por guión.
 * - Normaliza guiones consecutivos y extremos.
 */
export function slugifyAlbum(albumName) {
  if (!albumName) return '';
  return String(albumName)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina tildes y diacríticos
    .replace(/['’]/g, '') // Remueve comillas/apóstrofes
    .replace(/[^a-zA-Z0-9]+/g, '-') // Caracteres especiales y espacios se vuelven guiones
    .replace(/^-+|-+$/g, ''); // Quita guiones iniciales y finales
}

/**
 * Busca un álbum en una lista por su slug o por su ID.
 */
export function findAlbumBySlug(albums = [], slug = '') {
  if (!slug || !albums || albums.length === 0) return null;
  const cleanSlug = String(slug).trim().toLowerCase();

  // 1. Coincidencia por slug exacto
  const bySlug = albums.find(
    (a) => slugifyAlbum(a.album_name || a.album || '').toLowerCase() === cleanSlug
  );
  if (bySlug) return bySlug;

  // 2. Coincidencia por ID directo
  const byId = albums.find((a) => String(a.id).toLowerCase() === cleanSlug);
  if (byId) return byId;

  // 3. Coincidencia por nombre alfanumérico normalizado
  const targetAlnum = cleanSlug.replace(/[^a-z0-9]/g, '');
  if (targetAlnum) {
    const byNormalizedName = albums.find((a) => {
      const aName = (a.album_name || a.album || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      return aName && aName === targetAlnum;
    });
    if (byNormalizedName) return byNormalizedName;
  }

  return null;
}

/**
 * Calcula la canción top / corona (👑) de un álbum según las reglas:
 * 1. Si solo hay 1 review: se toma la canción favorita marcada con estrellita (⭐) por ese usuario.
 * 2. Si hay más reviews:
 *    - Se contabilizan las estrellitas de favorita en cada review.
 *    - Si una canción favorita se repite y es común entre usuarios (>= 2 votos), se prioriza esa canción
 *      (desempatando por el promedio más alto si hay varias con la misma cantidad máxima de estrellas).
 *    - Si no hay estrellas repetidas, se toma la de promedio de calificación más alto (avg_rating).
 */
export function calculateAlbumTopTrack(album, reviews = [], computedTrackStats = []) {
  if (!album) return null;

  const albumReviews = Array.isArray(reviews) ? reviews : [];
  const tracksSource = Array.isArray(album.tracks) ? album.tracks : [];

  // Si no hay reviews y no hay trackStats, no hay top track
  if (albumReviews.length === 0 && (!computedTrackStats || computedTrackStats.length === 0)) {
    return null;
  }

  // Asegurar lista de trackStats base
  let statsList = Array.isArray(computedTrackStats) && computedTrackStats.length > 0
    ? [...computedTrackStats]
    : [];

  if (statsList.length === 0 && tracksSource.length > 0) {
    statsList = tracksSource.map((t, idx) => ({
      id: typeof t === 'object' && t.id ? String(t.id) : null,
      name: typeof t === 'string' ? t : (t.name || `Pista ${idx + 1}`),
      track_number: typeof t === 'object' && t.track_number ? t.track_number : idx + 1,
      duration_ms: typeof t === 'object' ? t.duration_ms : undefined,
      rating_count: 0,
      avg_rating: null,
      scores: [],
    }));
  }

  // 1. CASO: Solo 1 Review
  if (albumReviews.length === 1) {
    const singleReview = albumReviews[0];
    const favKey = getReviewFavoriteTrack(singleReview);

    if (favKey) {
      // Buscar en statsList
      let matchedStat = statsList.find((ts, idx) =>
        isFavoriteTrackMatch(ts, favKey, tracksSource, idx)
      );

      let scoreVal = null;
      if (singleReview.track_ratings && typeof singleReview.track_ratings === 'object') {
        const rawScore = singleReview.track_ratings[favKey];
        if (rawScore !== null && rawScore !== undefined && !isNaN(Number(rawScore))) {
          scoreVal = Number(rawScore);
        }
      }
      if (scoreVal === null && matchedStat?.avg_rating !== null && matchedStat?.avg_rating !== undefined) {
        scoreVal = matchedStat.avg_rating;
      }
      if (scoreVal === null) {
        scoreVal = singleReview.rating_general || 10;
      }

      const favDisplayName = matchedStat?.name || getTrackDisplayName(favKey, tracksSource);

      return {
        id: matchedStat?.id || favKey,
        name: favDisplayName,
        avg_rating: parseFloat(Number(scoreVal).toFixed(1)),
        star_votes: 1,
        is_favorite_consensus: true,
      };
    }
  }

  // 2. CASO: Múltiples Reviews (o cálculo general con trackStats)
  if (statsList.length === 0) return null;

  // Tally de votos de estrella (⭐) por cada pista en statsList
  const starVoteCounts = new Array(statsList.length).fill(0);

  albumReviews.forEach((rev) => {
    const favKey = getReviewFavoriteTrack(rev);
    if (favKey) {
      const foundIdx = statsList.findIndex((ts, idx) =>
        isFavoriteTrackMatch(ts, favKey, tracksSource, idx)
      );
      if (foundIdx !== -1) {
        starVoteCounts[foundIdx]++;
      }
    }
  });

  const enrichedTracks = statsList.map((ts, idx) => ({
    ...ts,
    star_votes: starVoteCounts[idx] || 0,
  }));

  const tracksWithScores = enrichedTracks.filter(
    (t) => t.avg_rating !== null || t.star_votes > 0
  );
  if (tracksWithScores.length === 0) return null;

  const maxStarVotes = Math.max(...tracksWithScores.map((t) => t.star_votes));

  // Si hay canciones con estrellas en común repetidas (>= 2 votos)
  if (maxStarVotes >= 2) {
    const topVotedTracks = tracksWithScores.filter((t) => t.star_votes === maxStarVotes);
    // Desempate por mejor avg_rating
    topVotedTracks.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    const winnerTrack = topVotedTracks[0];
    return {
      id: winnerTrack.id,
      name: winnerTrack.name,
      avg_rating: winnerTrack.avg_rating ?? 10,
      star_votes: winnerTrack.star_votes,
      is_favorite_consensus: true,
    };
  }

  // Si no hay estrellas repetidas (todas tienen 0 o 1 voto), ordenar por mayor calificación promedio
  const sortedByRating = [...tracksWithScores].sort((a, b) => {
    if ((b.avg_rating || 0) !== (a.avg_rating || 0)) {
      return (b.avg_rating || 0) - (a.avg_rating || 0);
    }
    // Desempate por estrella individual o conteo de reseñas
    if (b.star_votes !== a.star_votes) {
      return b.star_votes - a.star_votes;
    }
    return (b.rating_count || 0) - (a.rating_count || 0);
  });

  const topTrack = sortedByRating[0];
  return {
    id: topTrack.id,
    name: topTrack.name,
    avg_rating: topTrack.avg_rating ?? (topTrack.star_votes > 0 ? 10 : null),
    star_votes: topTrack.star_votes,
    is_favorite_consensus: topTrack.star_votes > 0,
  };
}


