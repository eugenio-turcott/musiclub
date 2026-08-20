// src/utils/recommendationEngine.js
import { getWeightedReviewScore } from './ratingUtils';

export const CRITERIA_DEFINITIONS = [
  {
    key: 'rating_produccion',
    id: 'produccion',
    label: 'Producción',
    emoji: '🎛️',
    max: 5,
    archetypeTitle: 'El Audiófilo Técnico',
    archetypeDesc: 'Valoras mezclas impecables, masterización nítida y diseño sonoro envolvente.',
  },
  {
    key: 'rating_composicion',
    id: 'composicion',
    label: 'Composición',
    emoji: '🎵',
    max: 5,
    archetypeTitle: 'El Maestro Armónico',
    archetypeDesc: 'Te apasionan las progresiones complejas, arreglos elaborados y melodías memorables.',
  },
  {
    key: 'rating_letras',
    id: 'letras',
    label: 'Letras & Poesía',
    emoji: '📝',
    max: 5,
    archetypeTitle: 'El Poeta Musical',
    archetypeDesc: 'Buscas narrativa profunda, lirismo conmovedor y mensajes con sustancia.',
  },
  {
    key: 'rating_originalidad',
    id: 'originalidad',
    label: 'Originalidad',
    emoji: '💡',
    max: 5,
    archetypeTitle: 'El Vanguardista Sonoro',
    archetypeDesc: 'Premías la innovación, la experimentación y propuestas fuera de lo convencional.',
  },
  {
    key: 'rating_cohesion',
    id: 'cohesion',
    label: 'Cohesión Conceptual',
    emoji: '🔗',
    max: 5,
    archetypeTitle: 'El Arquitecto Conceptual',
    archetypeDesc: 'Aprecias los álbumes que funcionan como una obra integral fluida y cohesionada.',
  },
  {
    key: 'rating_replay',
    id: 'replay',
    label: 'Replay Value',
    emoji: '🔄',
    max: 5,
    archetypeTitle: 'El Devorador de Éxitos',
    archetypeDesc: 'Buscas discos adictivos que necesitas volver a reproducir en bucle.',
  },
];

/**
 * Extrae y calcula el perfil de gusto musical del usuario basado en sus mejores calificaciones.
 * @param {Object} user Objeto del usuario actual.
 * @param {Array} userReviews Lista de reseñas realizadas por el usuario.
 * @param {Array} allAlbums Lista completa de álbumes.
 * @returns {Object} Perfil de gusto musical con pesos de criterios, artistas top, y arquetipo musical.
 */
export function buildUserTasteProfile(user, userReviews = [], allAlbums = []) {
  if (!userReviews || userReviews.length === 0) {
    return {
      hasHistory: false,
      totalReviews: 0,
      topRatedAlbums: [],
      topArtists: [],
      criteriaWeights: {
        rating_produccion: 0.5,
        rating_composicion: 0.5,
        rating_letras: 0.5,
        rating_originalidad: 0.5,
        rating_cohesion: 0.5,
        rating_replay: 0.5,
      },
      topCriteria: ['rating_composicion', 'rating_produccion'],
      favoriteGenres: user?.favorite_genres || [],
      favoriteArtist: user?.favorite_artist || null,
      favoriteAlbum: user?.favorite_album || null,
      tasteArchetype: {
        title: 'Melómano en Exploración',
        emoji: '🌱',
        description: 'Aún estás comenzando a reseñar álbumes en el club. Califica tus primeros discos para desbloquear tu ADN sonoro.',
      },
      averageUserScore: 0,
    };
  }

  const albumMap = new Map();
  allAlbums.forEach((a) => {
    if (a && a.id) albumMap.set(a.id, a);
  });

  // Enriquecer cada review con su puntaje ponderado
  const scoredReviews = userReviews
    .map((r) => {
      const score = getWeightedReviewScore(r) ?? (r.rating_general ? Number(r.rating_general) : null);
      const alb = albumMap.get(r.album_id) || r.albums || null;
      return {
        ...r,
        weightedScore: score !== null && !isNaN(score) ? Number(score) : null,
        albumName: alb?.album_name || alb?.album || r.album_title || 'Álbum',
        artistName: alb?.artist_name || alb?.artista || r.album_artist || 'Artista',
        imageUrl: alb?.image_url || alb?.imagen || r.album_image || null,
      };
    })
    .filter((r) => r.weightedScore !== null);

  if (scoredReviews.length === 0) {
    return {
      hasHistory: false,
      totalReviews: 0,
      topRatedAlbums: [],
      topArtists: [],
      criteriaWeights: {},
      topCriteria: [],
      favoriteGenres: user?.favorite_genres || [],
      favoriteArtist: user?.favorite_artist || null,
      favoriteAlbum: user?.favorite_album || null,
      tasteArchetype: {
        title: 'Melómano en Exploración',
        emoji: '🌱',
        description: 'Empieza a calificar canciones y criterios para generar recomendaciones personalizadas.',
      },
      averageUserScore: 0,
    };
  }

  // Ordenar de mayor a menor calificación
  scoredReviews.sort((a, b) => b.weightedScore - a.weightedScore);

  const avgUserScore =
    scoredReviews.reduce((sum, r) => sum + r.weightedScore, 0) / scoredReviews.length;

  // Determinar los álbumes "Top": los calificados con >= 7.0 o el tercio superior de sus mejores notas
  const minTopThreshold = Math.max(7.0, avgUserScore * 0.95);
  let topRatedReviews = scoredReviews.filter((r) => r.weightedScore >= minTopThreshold);

  if (topRatedReviews.length === 0) {
    // Si el usuario es muy exigente y ninguno pasa el umbral, tomar el 50% superior
    const halfCount = Math.max(1, Math.ceil(scoredReviews.length / 2));
    topRatedReviews = scoredReviews.slice(0, halfCount);
  }

  // 1. Análisis de Artistas con mayor afinidad
  const artistScores = {};
  topRatedReviews.forEach((r) => {
    const artist = (r.artistName || '').trim();
    if (artist) {
      if (!artistScores[artist]) {
        artistScores[artist] = { name: artist, count: 0, totalScore: 0, maxScore: 0 };
      }
      artistScores[artist].count += 1;
      artistScores[artist].totalScore += r.weightedScore;
      artistScores[artist].maxScore = Math.max(artistScores[artist].maxScore, r.weightedScore);
    }
  });

  if (user?.favorite_artist) {
    const favArtist = user.favorite_artist.trim();
    if (!artistScores[favArtist]) {
      artistScores[favArtist] = { name: favArtist, count: 2, totalScore: 20, maxScore: 10 };
    } else {
      artistScores[favArtist].totalScore += 10;
      artistScores[favArtist].count += 1;
    }
  }

  const topArtists = Object.values(artistScores)
    .map((a) => ({
      name: a.name,
      avgScore: a.totalScore / a.count,
      maxScore: a.maxScore,
      count: a.count,
    }))
    .sort((a, b) => b.avgScore - a.avgScore || b.count - a.count);

  // 2. Vector de Criterios Técnicos Ponderados por la nota que dio el usuario
  // Cada criterio en las mejores notas del usuario recibe un peso normalizado (0.0 a 1.0)
  const criteriaWeightedSums = {};
  const criteriaTotalWeights = {};

  CRITERIA_DEFINITIONS.forEach((c) => {
    criteriaWeightedSums[c.key] = 0;
    criteriaTotalWeights[c.key] = 0;
  });

  topRatedReviews.forEach((r) => {
    // El peso de cada review para el perfil es cuadrático a su nota (las notas 9-10 pesan más que las 7)
    const reviewWeight = Math.pow(r.weightedScore / 10, 2);

    CRITERIA_DEFINITIONS.forEach((c) => {
      const val = r[c.key] !== undefined && r[c.key] !== null ? Number(r[c.key]) : null;
      if (val !== null && !isNaN(val) && val > 0) {
        // Escala normalizada de 0 a 1
        const normalizedVal = val / c.max;
        criteriaWeightedSums[c.key] += normalizedVal * reviewWeight;
        criteriaTotalWeights[c.key] += reviewWeight;
      }
    });
  });

  const criteriaWeights = {};
  CRITERIA_DEFINITIONS.forEach((c) => {
    if (criteriaTotalWeights[c.key] > 0) {
      criteriaWeights[c.key] = criteriaWeightedSums[c.key] / criteriaTotalWeights[c.key];
    } else {
      criteriaWeights[c.key] = 0.5; // Valor neutral
    }
  });

  // Criterios ordenados de mayor a menor afinidad
  const rankedCriteria = [...CRITERIA_DEFINITIONS]
    .map((c) => ({
      ...c,
      weight: criteriaWeights[c.key] || 0.5,
    }))
    .sort((a, b) => b.weight - a.weight);

  const topCriteriaKeys = rankedCriteria.slice(0, 3).map((c) => c.key);
  const primaryCriterion = rankedCriteria[0];

  // 3. Determinar el Arquetipo Musical del usuario
  let archetype = {
    title: primaryCriterion ? primaryCriterion.archetypeTitle : 'Melómano Equilibrado',
    emoji: primaryCriterion ? primaryCriterion.emoji : '🎧',
    description: primaryCriterion
      ? primaryCriterion.archetypeDesc
      : 'Aprecias una experiencia musical integral y completa en cada proyecto.',
    primaryCriterion: primaryCriterion?.label || 'General',
  };

  // Si tiene puntuaciones muy altas en más de un criterio
  if (rankedCriteria.length >= 2 && rankedCriteria[0].weight >= 0.85 && rankedCriteria[1].weight >= 0.85) {
    if (rankedCriteria[0].id === 'produccion' && rankedCriteria[1].id === 'cohesion') {
      archetype = {
        title: 'El Diseñador Atmosférico',
        emoji: '🌌',
        description: 'Te deslumbran álbumes con producción cinematográfica que te sumergen de principio a fin.',
        primaryCriterion: 'Producción & Cohesión',
      };
    } else if (rankedCriteria[0].id === 'letras' && rankedCriteria[1].id === 'composicion') {
      archetype = {
        title: 'El Cantautor Clásico',
        emoji: '📜',
        description: 'Valoras la lírica profunda arropada por una maestría compositiva acústica u orquestal.',
        primaryCriterion: 'Letras & Composición',
      };
    } else if (rankedCriteria[0].id === 'originalidad' && rankedCriteria[1].id === 'replay') {
      archetype = {
        title: 'El Cazador de Vanguardias',
        emoji: '⚡',
        description: 'Buscas sonidos frescos e innovadores que una vez que descubres no puedes parar de escuchar.',
        primaryCriterion: 'Originalidad & Replay',
      };
    }
  }

  return {
    hasHistory: true,
    totalReviews: scoredReviews.length,
    topRatedAlbums: topRatedReviews.slice(0, 8),
    topArtists,
    criteriaWeights,
    rankedCriteria,
    topCriteria: topCriteriaKeys,
    favoriteGenres: user?.favorite_genres || [],
    favoriteArtist: user?.favorite_artist || null,
    favoriteAlbum: user?.favorite_album || null,
    tasteArchetype: archetype,
    averageUserScore: parseFloat(avgUserScore.toFixed(2)),
  };
}

/**
 * Encuentra usuarios con gustos musicales similares (Melómanos Afines) usando similitud de calificaciones.
 * @param {Object} user Objeto del usuario actual.
 * @param {Array} userReviews Reseñas del usuario actual.
 * @param {Array} allReviews Todas las reseñas de la comunidad.
 * @param {Array} allProfiles Perfiles registrados de usuarios.
 * @returns {Array} Lista de melómanos afines ordenada por porcentaje de similitud.
 */
export function findTasteTwins(user, userReviews = [], allReviews = [], allProfiles = []) {
  if (!userReviews || userReviews.length < 2 || !allReviews || allReviews.length === 0) {
    return [];
  }

  const currentUserEmail = (user?.email || '').toLowerCase().trim();
  const currentUserName = (user?.name || '').toLowerCase().trim();

  // Mapear reseñas del usuario actual por album_id -> score
  const userAlbumScores = new Map();
  userReviews.forEach((r) => {
    const score = getWeightedReviewScore(r) ?? r.rating_general;
    if (score !== null && score !== undefined && !isNaN(score) && r.album_id) {
      userAlbumScores.set(r.album_id, Number(score));
    }
  });

  if (userAlbumScores.size < 2) return [];

  // Mapear perfiles por email / nombre
  const profileMap = new Map();
  allProfiles.forEach((p) => {
    if (p.email) profileMap.set(p.email.toLowerCase().trim(), p);
    if (p.name) profileMap.set(p.name.toLowerCase().trim(), p);
  });

  // Agrupar reseñas de otros usuarios
  const otherUsersMap = new Map();

  allReviews.forEach((r) => {
    const rEmail = (r.reviewer_email || '').toLowerCase().trim();
    const rName = (r.reviewer_name || '').toLowerCase().trim();

    // Ignorar si es el mismo usuario
    if (
      (currentUserEmail && rEmail === currentUserEmail) ||
      (currentUserName && rName === currentUserName)
    ) {
      return;
    }

    const key = rEmail || rName;
    if (!key) return;

    if (!otherUsersMap.has(key)) {
      const prof = (rEmail && profileMap.get(rEmail)) || (rName && profileMap.get(rName));
      otherUsersMap.set(key, {
        name: r.reviewer_name || prof?.name || key,
        email: r.reviewer_email || prof?.email || '',
        avatar_url: prof?.avatar_url || null,
        scores: new Map(),
        allUserReviews: [],
      });
    }

    const score = getWeightedReviewScore(r) ?? r.rating_general;
    if (score !== null && score !== undefined && !isNaN(score) && r.album_id) {
      const targetUser = otherUsersMap.get(key);
      targetUser.scores.set(r.album_id, Number(score));
      targetUser.allUserReviews.push({
        ...r,
        weightedScore: Number(score),
      });
    }
  });

  const tasteTwins = [];

  otherUsersMap.forEach((otherUser) => {
    // Encontrar álbumes en común
    const commonAlbumIds = [];
    userAlbumScores.forEach((scoreA, albumId) => {
      if (otherUser.scores.has(albumId)) {
        commonAlbumIds.push(albumId);
      }
    });

    if (commonAlbumIds.length < 2) return; // Requiere al menos 2 álbumes en común

    // Calcular similitud basada en la distancia absoluta y correlación
    let totalDifference = 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    commonAlbumIds.forEach((albumId) => {
      const a = userAlbumScores.get(albumId);
      const b = otherUser.scores.get(albumId);
      totalDifference += Math.abs(a - b);
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    });

    const cosineSim = (normA > 0 && normB > 0) ? dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
    const avgDiff = totalDifference / commonAlbumIds.length;
    // Escala de compatibilidad de 0 a 100%
    const diffScore = Math.max(0, 1 - (avgDiff / 5)); // si la diferencia promedio es 0 -> 1.0; si es 5 -> 0.0
    const similarityPercentage = Math.round(((cosineSim * 0.5) + (diffScore * 0.5)) * 100);

    if (similarityPercentage >= 60) {
      // Álbumes que le encantaron a este melómano afín (>= 7.8) y que el usuario actual aún NO ha calificado
      const recommendedByTwin = otherUser.allUserReviews
        .filter((r) => r.weightedScore >= 7.8 && !userAlbumScores.has(r.album_id))
        .sort((a, b) => b.weightedScore - a.weightedScore);

      tasteTwins.push({
        name: otherUser.name,
        email: otherUser.email,
        avatar_url: otherUser.avatar_url,
        similarity: similarityPercentage,
        commonAlbumsCount: commonAlbumIds.length,
        favoriteRecommendations: recommendedByTwin,
      });
    }
  });

  return tasteTwins.sort((a, b) => b.similarity - a.similarity || b.commonAlbumsCount - a.commonAlbumsCount);
}

/**
 * Calcula la compatibilidad y razones de recomendación para un álbum específico.
 * @param {Object} album Álbum candidato.
 * @param {Object} tasteProfile Perfil de gusto musical del usuario.
 * @param {Array} tasteTwins Melómanos afines.
 * @returns {Object} Desglose de compatibilidad, porcentaje y explicaciones.
 */
export function calculateAlbumCompatibility(album, tasteProfile, tasteTwins = []) {
  if (!album) return null;

  let compatibility = 40; // Base neutral calibrada
  const reasons = [];
  const matchBadges = [];

  const albumArtist = (album.artist_name || album.artista || '').trim().toLowerCase();
  const albumName = (album.album_name || album.album || '').trim();

  // 1. Coincidencia de Artista (hasta +38%)
  const isSameTopArtist = tasteProfile.topArtists?.some((a) => {
    const artistKey = a.name.toLowerCase().trim();
    return artistKey && (albumArtist.includes(artistKey) || artistKey.includes(albumArtist));
  });

  const isFavoriteArtist =
    tasteProfile.favoriteArtist &&
    albumArtist.includes(tasteProfile.favoriteArtist.toLowerCase().trim());

  if (isFavoriteArtist) {
    compatibility += 38;
    matchBadges.push({ emoji: '👑', label: 'Artista Favorito', color: 'from-purple-500 to-pink-500' });
    reasons.push(`Es de tu artista favorito configurado (${tasteProfile.favoriteArtist}).`);
  } else if (isSameTopArtist) {
    const matchedArtist = tasteProfile.topArtists.find((a) =>
      albumArtist.includes(a.name.toLowerCase().trim())
    );
    compatibility += 32;
    matchBadges.push({ emoji: '🎵', label: 'Mismo Artista Top', color: 'from-indigo-500 to-cyan-500' });
    reasons.push(`Has calificado muy alto álbumes previos de ${matchedArtist?.name || album.artist_name || album.artista}.`);
  }

  // 2. Resonancia de Criterios Técnicos (hasta +36%)
  const critAvgs = album.criteria_averages || {};
  let criteriaScoreSum = 0;
  let criteriaWeightSum = 0;
  let topMatchingCriterion = null;

  CRITERIA_DEFINITIONS.forEach((c) => {
    const albumVal = critAvgs[c.key];
    const userPref = tasteProfile.criteriaWeights?.[c.key] || 0.5;

    if (albumVal !== undefined && albumVal !== null && !isNaN(albumVal) && albumVal > 0) {
      const normalizedAlbumScore = albumVal / c.max; // 0.0 a 1.0
      const resonance = normalizedAlbumScore * userPref;
      criteriaScoreSum += resonance;
      criteriaWeightSum += userPref;

      if (normalizedAlbumScore >= 0.80 && userPref >= 0.65) {
        if (!topMatchingCriterion || normalizedAlbumScore > topMatchingCriterion.score) {
          topMatchingCriterion = { criterion: c, score: normalizedAlbumScore, albumVal };
        }
      }
    }
  });

  if (criteriaWeightSum > 0) {
    const criteriaFactor = criteriaScoreSum / criteriaWeightSum; // 0.0 a 1.0
    const criteriaBonus = Math.round(criteriaFactor * 35);
    compatibility += criteriaBonus;

    if (topMatchingCriterion) {
      matchBadges.push({
        emoji: topMatchingCriterion.criterion.emoji,
        label: `Match en ${topMatchingCriterion.criterion.label}`,
        color: 'from-amber-400 to-orange-500',
      });
      reasons.push(
        `Destaca con ${topMatchingCriterion.albumVal}★ en ${topMatchingCriterion.criterion.label}, uno de tus criterios más exigentes.`
      );
    }
  } else {
    compatibility += 8;
  }

  // 3. Recomendación de Melómanos Afines (hasta +28%)
  let twinEndorsementCount = 0;
  tasteTwins.forEach((twin) => {
    const endorsed = twin.favoriteRecommendations?.find((r) => r.album_id === album.id);
    if (endorsed) {
      twinEndorsementCount += 1;
      if (twinEndorsementCount === 1) {
        matchBadges.push({
          emoji: '🤝',
          label: `Afinidad con @${twin.name}`,
          color: 'from-emerald-400 to-teal-500',
        });
        reasons.push(
          `Recomendado por ${twin.name} (${twin.similarity}% afinidad contigo), quien le dio ${endorsed.weightedScore.toFixed(1)}★.`
        );
      }
    }
  });

  if (twinEndorsementCount > 0) {
    compatibility += Math.min(28, twinEndorsementCount * 14);
  }

  // 4. Calidad y Consenso Comunitario (hasta +18%)
  const finalRating = album.final_rating || album.avg_rating || album.base_rating;
  if (finalRating !== null && finalRating !== undefined && !isNaN(finalRating)) {
    if (finalRating >= 8.8) {
      compatibility += 18;
      if (matchBadges.length < 3) {
        matchBadges.push({ emoji: '💎', label: 'Aclamado del Club', color: 'from-cyan-400 to-blue-500' });
      }
      reasons.push(`Tiene una destacada calificación comunitaria de ${Number(finalRating).toFixed(1)}★.`);
    } else if (finalRating >= 7.8) {
      compatibility += 12;
    } else if (finalRating >= 7.0) {
      compatibility += 6;
    }
  }

  // 5. Coincidencia de Géneros Favoritos (hasta +12%)
  if (tasteProfile.favoriteGenres && tasteProfile.favoriteGenres.length > 0) {
    const genreMatch = tasteProfile.favoriteGenres.some((g) => {
      const gTerm = g.toLowerCase().trim();
      return (
        albumName.toLowerCase().includes(gTerm) ||
        albumArtist.includes(gTerm)
      );
    });
    if (genreMatch) {
      compatibility += 12;
      matchBadges.push({ emoji: '🏷️', label: 'Coincidencia de Género', color: 'from-pink-500 to-rose-500' });
    }
  }

  // Si tiene pocos o ningún reason específico, agregar un reason basado en sus mejores calificaciones
  if (reasons.length === 0 && tasteProfile.topRatedAlbums?.length > 0) {
    const topAlb = tasteProfile.topRatedAlbums[0];
    reasons.push(`Recomendado para expandir tu biblioteca tras tu ${topAlb.weightedScore.toFixed(1)}★ a ${topAlb.albumName}.`);
  }

  // Normalizar entre 50% y 99%
  const finalScore = Math.min(99, Math.max(50, Math.round(compatibility)));

  return {
    compatibilityScore: finalScore,
    matchBadges: matchBadges.slice(0, 3),
    reasons,
    primaryReason: reasons[0] || 'Recomendación basada en tus gustos musicales.',
  };
}

/**
 * Obtiene la lista completa de recomendaciones personalizadas del club para el usuario.
 * @param {Object} user Objeto del usuario actual.
 * @param {Array} userReviews Lista de reseñas del usuario.
 * @param {Array} allAlbumsWithStats Lista completa de álbumes con estadísticas.
 * @param {Array} allReviews Todas las reseñas de la comunidad.
 * @param {Array} allProfiles Perfiles de usuarios.
 * @returns {Object} Recomendaciones agrupadas, perfil y melómanos afines.
 */
export function getPersonalizedRecommendations(
  user,
  userReviews = [],
  allAlbumsWithStats = [],
  allReviews = [],
  allProfiles = []
) {
  const tasteProfile = buildUserTasteProfile(user, userReviews, allAlbumsWithStats);
  const tasteTwins = findTasteTwins(user, userReviews, allReviews, allProfiles);

  // Set de álbumes ya calificados por el usuario para no recomendárselos de nuevo
  const reviewedAlbumIds = new Set(userReviews.map((r) => r.album_id).filter(Boolean));

  // Filtrar solo álbumes que NO pertenezcan al pool (ej. status INDIVIDUAL o fuera de pool) y que el usuario aún NO ha calificado
  const unreviewedAlbums = allAlbumsWithStats.filter((alb) => {
    if (reviewedAlbumIds.has(alb.id)) return false;
    // Excluir álbumes pertenecientes al pool del club (ACTIVO, GANADOR, INACTIVO, PROXIMO)
    const isPoolAlbum =
      alb.status === 'ACTIVO' ||
      alb.status === 'GANADOR' ||
      alb.status === 'INACTIVO' ||
      alb.status === 'PROXIMO';
    return !isPoolAlbum;
  });

  // Calcular compatibilidad para cada álbum no calificado
  const scoredAlbums = unreviewedAlbums
    .map((alb) => {
      const compat = calculateAlbumCompatibility(alb, tasteProfile, tasteTwins);
      return {
        ...alb,
        compatibilityScore: compat.compatibilityScore,
        matchBadges: compat.matchBadges,
        reasons: compat.reasons,
        primaryReason: compat.primaryReason,
      };
    })
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore || (b.final_rating || 0) - (a.final_rating || 0));

  // Álbumes de alta afinidad (≥ 90% Match)
  const highMatchPicks = scoredAlbums.filter((a) => a.compatibilityScore >= 90);

  // Categorías de recomendaciones
  const topPicks = highMatchPicks.length >= 3 ? highMatchPicks : scoredAlbums.slice(0, 8);
  const criticsTreasures = scoredAlbums
    .filter((a) => (a.final_rating || a.avg_rating || 0) >= 8.0)
    .slice(0, 8);
  const tasteTwinPicks = scoredAlbums
    .filter((a) => a.matchBadges.some((b) => b.emoji === '🤝'))
    .slice(0, 8);

  // Joyas según el criterio favorito del usuario
  const topCritKey = tasteProfile.topCriteria[0] || 'rating_composicion';
  const topCritDef = CRITERIA_DEFINITIONS.find((c) => c.key === topCritKey) || CRITERIA_DEFINITIONS[0];
  const criteriaPicks = scoredAlbums
    .filter((a) => a.criteria_averages && a.criteria_averages[topCritKey] >= 3.8)
    .slice(0, 8);

  return {
    tasteProfile,
    tasteTwins,
    recommendations: scoredAlbums,
    highMatchPicks,
    topPicks,
    criticsTreasures,
    tasteTwinPicks,
    criteriaPicks,
    topCriterionDef: topCritDef,
    unreviewedCount: unreviewedAlbums.length,
    reviewedCount: reviewedAlbumIds.size,
  };
}
