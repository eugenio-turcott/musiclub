import { createClient } from '@supabase/supabase-js';
import { getWeightedReviewScore, calculateReviewBonus } from '../utils/ratingUtils';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Faltan variables de entorno de Supabase');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// FUNCIONES DE RESPALDO - USANDO rating_general
// ============================================

async function getTopReviewersManual() {
  try {
    const { data: albumsWithReviews } = await supabase
      .from('albums')
      .select('id')
      .in('status', ['INACTIVO', 'GANADOR', 'INDIVIDUAL']);

    if (!albumsWithReviews || albumsWithReviews.length === 0) return [];

    const albumIds = albumsWithReviews.map((a) => a.id);

    const [reviewsRes, profilesRes] = await Promise.all([
      supabase
        .from('reviews')
        .select('reviewer_name, reviewer_email, rating_general, album_id')
        .in('album_id', albumIds),
      supabase.from('profiles').select('email, name, avatar_url'),
    ]);

    const reviews = reviewsRes.data;
    const profiles = profilesRes.data || [];

    if (!reviews || reviews.length === 0) return [];

    const profileMapByEmail = {};
    const profileMapByName = {};
    profiles.forEach((p) => {
      if (p.email) profileMapByEmail[p.email.toLowerCase().trim()] = p;
      if (p.name) profileMapByName[p.name.toLowerCase().trim()] = p;
    });

    const reviewerMap = {};
    reviews.forEach((review) => {
      const nameKey = review.reviewer_name;
      if (!reviewerMap[nameKey]) {
        const prof =
          (review.reviewer_email &&
            profileMapByEmail[review.reviewer_email.toLowerCase().trim()]) ||
          profileMapByName[nameKey.toLowerCase().trim()] ||
          null;

        reviewerMap[nameKey] = {
          ratings: [],
          albums: new Set(),
          email: review.reviewer_email,
          avatar_url: prof?.avatar_url || null,
        };
      }
      if (
        review.rating_general !== null &&
        review.rating_general !== undefined
      ) {
        reviewerMap[nameKey].ratings.push(review.rating_general);
      }
      reviewerMap[nameKey].albums.add(review.album_id);
    });

    const result = Object.entries(reviewerMap).map(([name, data]) => {
      const avg =
        data.ratings.length > 0
          ? data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length
          : 0;

      return {
        reviewer_name: name,
        reviewer_email: data.email,
        avatar_url: data.avatar_url,
        review_count: data.ratings.length,
        album_count: data.albums.size,
        avg_rating: parseFloat(avg.toFixed(1)),
      };
    });

    return result
      .filter((r) => r.review_count > 0)
      .sort(
        (a, b) => b.review_count - a.review_count || b.avg_rating - a.avg_rating
      )
      .slice(0, 15);
  } catch (error) {
    console.error('Error en getTopReviewersManual:', error);
    return [];
  }
}

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

export const supabaseService = {
  // ==========================================
  // USUARIOS
  // ==========================================

  getUserByEmail: async (email) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  },

  createUser: async (userData) => {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: userData.email,
          name: userData.name || userData.email.split('@')[0],
          role: userData.role || 'user',
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  upsertUser: async (userData) => {
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          email: userData.email,
          name: userData.name || userData.email.split('@')[0],
          role: userData.role || 'user',
        },
        { onConflict: 'email' }
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // ==========================================
  // ÁLBUMES
  // ==========================================

  getActiveAlbums: async () => {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .in('status', ['ACTIVO', 'GANADOR'])
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  },

  getAlbumById: async (id) => {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  findAlbum: async (albumName, artistName) => {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .eq('album_name', albumName)
      .eq('artist_name', artistName)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  },

  createAlbum: async (albumData) => {
    const { data, error } = await supabase
      .from('albums')
      .insert([
        {
          album_name: albumData.albumName,
          artist_name: albumData.artistName,
          image_url: albumData.imageUrl,
          spotify_link: albumData.spotifyLink || null,
          youtube_link: albumData.youtubeLink || null,
          apple_music_link: albumData.appleMusicLink || null,
          status: albumData.status || 'ACTIVO',
          added_by: albumData.addedBy || null,
          added_by_email: albumData.addedByEmail || null,
          tracks: albumData.tracks || [],
          spotify_verified: albumData.status === 'INDIVIDUAL' ? true : false,
          reviews_enabled: albumData.reviews_enabled || false, // 👈 AGREGAR
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  markAlbumInactive: async (albumName, artistName) => {
    const { data, error } = await supabase
      .from('albums')
      .update({ status: 'INACTIVO' })
      .eq('album_name', albumName)
      .eq('artist_name', artistName)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Marcar álbum como GANADOR
  markAlbumAsWinner: async (albumName, artistName) => {
    // Primero, resetear cualquier ganador anterior
    await supabase
      .from('albums')
      .update({ status: 'ACTIVO' })
      .eq('status', 'GANADOR');

    // Luego marcar el nuevo ganador
    const { data, error } = await supabase
      .from('albums')
      .update({ status: 'GANADOR' })
      .eq('album_name', albumName)
      .eq('artist_name', artistName)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Obtener álbum ganador actual
  getCurrentWinner: async () => {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .eq('status', 'GANADOR')
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  },

  // Resetear ganador (volver a ACTIVO)
  resetWinner: async () => {
    const { error } = await supabase
      .from('albums')
      .update({ status: 'ACTIVO' })
      .eq('status', 'GANADOR');

    if (error) throw new Error(error.message);
    return true;
  },

  // ==========================================
  // REVIEWS
  // ==========================================

  getReviews: async (albumId) => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('album_id', albumId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  },

  getAllReviews: async () => {
    // 👈 INCLUIR INDIVIDUAL también
    const { data: albumsWithReviews } = await supabase
      .from('albums')
      .select('id')
      .in('status', ['INACTIVO', 'GANADOR', 'INDIVIDUAL']);

    if (!albumsWithReviews || albumsWithReviews.length === 0) return [];

    const albumIds = albumsWithReviews.map((a) => a.id);

    const { data, error } = await supabase
      .from('reviews')
      .select('*, albums!inner(album_name, artist_name, image_url)')
      .in('album_id', albumIds);

    if (error) throw new Error(error.message);
    return data || [];
  },

  submitReview: async (reviewData) => {
    // Validar si el usuario ya calificó este álbum para prevenir duplicados
    if (reviewData.albumId && (reviewData.reviewerEmail || reviewData.reviewerName)) {
      try {
        let checkQuery = supabase
          .from('reviews')
          .select('id')
          .eq('album_id', reviewData.albumId);

        if (reviewData.reviewerEmail) {
          checkQuery = checkQuery.eq('reviewer_email', reviewData.reviewerEmail);
        } else {
          checkQuery = checkQuery.eq('reviewer_name', reviewData.reviewerName);
        }

        const { data: existing } = await checkQuery;
        if (existing && existing.length > 0) {
          throw new Error('Ya has enviado una reseña para este álbum previamente.');
        }
      } catch (checkErr) {
        if (checkErr.message?.includes('Ya has enviado')) {
          throw checkErr;
        }
      }
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert([
        {
          album_id: reviewData.albumId,
          reviewer_name: reviewData.reviewerName,
          reviewer_email: reviewData.reviewerEmail,
          track_ratings: reviewData.trackRatings || {},
          rating_produccion: reviewData.ratingProduccion,
          rating_composicion: reviewData.ratingComposicion,
          rating_letras: reviewData.ratingLetras,
          rating_originalidad: reviewData.ratingOriginalidad,
          rating_cohesion: reviewData.ratingCohesion,
          rating_replay: reviewData.ratingReplay,
          rating_general: reviewData.ratingGeneral,
          comment: reviewData.comment || '',
        },
      ])
      .select();

    if (error) throw new Error(error.message);
    return data[0];
  },

  getUserReviews: async (email, name) => {
    try {
      if (!email && !name) return [];

      let query = supabase
        .from('reviews')
        .select(
          `
          *,
          albums:album_id (
            id,
            album_name,
            artist_name,
            image_url,
            status,
            tracks,
            spotify_link,
            youtube_link
          )
        `
        )
        .order('created_at', { ascending: false });

      if (email && name) {
        query = query.or(`reviewer_email.eq.${email},reviewer_name.eq.${name}`);
      } else if (email) {
        query = query.eq('reviewer_email', email);
      } else {
        query = query.eq('reviewer_name', name);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error en getUserReviews:', err);
      return [];
    }
  },

  getUserReviewedAlbumIds: async (email, name) => {
    try {
      if (!email && !name) return [];
      let query = supabase.from('reviews').select('album_id');

      if (email && name) {
        query = query.or(`reviewer_email.eq.${email},reviewer_name.eq.${name}`);
      } else if (email) {
        query = query.eq('reviewer_email', email);
      } else {
        query = query.eq('reviewer_name', name);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((r) => r.album_id).filter(Boolean);
    } catch (err) {
      console.error('Error en getUserReviewedAlbumIds:', err);
      return [];
    }
  },

  updateUserProfile: async (userId, profileData) => {
    try {
      // 1. Metadata de auth
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: profileData.name,
            name: profileData.name,
            avatar_url: profileData.avatar_url,
            bio: profileData.bio,
            favorite_artist: profileData.favorite_artist,
            favorite_album: profileData.favorite_album,
            favorite_genres: profileData.favorite_genres,
            spotify_url: profileData.spotify_url,
            instagram_url: profileData.instagram_url,
          },
        });
      } catch (authErr) {
        console.warn('Advertencia en auth.updateUser:', authErr);
      }

      // 2. Tabla profiles
      const upsertPayload = {
        id: userId,
        updated_at: new Date().toISOString(),
      };
      if (profileData.name !== undefined) upsertPayload.name = profileData.name;
      if (profileData.email !== undefined) upsertPayload.email = profileData.email;
      if (profileData.avatar_url !== undefined) upsertPayload.avatar_url = profileData.avatar_url;
      if (profileData.role !== undefined) upsertPayload.role = profileData.role;
      if (profileData.bio !== undefined) upsertPayload.bio = profileData.bio;
      if (profileData.favorite_artist !== undefined) upsertPayload.favorite_artist = profileData.favorite_artist;
      if (profileData.favorite_album !== undefined) upsertPayload.favorite_album = profileData.favorite_album;
      if (profileData.favorite_genres !== undefined) upsertPayload.favorite_genres = profileData.favorite_genres;
      if (profileData.spotify_url !== undefined) upsertPayload.spotify_url = profileData.spotify_url;
      if (profileData.instagram_url !== undefined) upsertPayload.instagram_url = profileData.instagram_url;

      const { data, error } = await supabase
        .from('profiles')
        .upsert([upsertPayload], { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.warn('Advertencia en upsert profiles:', error);
      }
      return { success: true, data: data || profileData };
    } catch (err) {
      console.error('Error en updateUserProfile:', err);
      return { success: false, error: err.message };
    }
  },

  // ==========================================
  // RANKINGS - USANDO rating_general
  // ==========================================

  getTopReviewers: async () => {
    try {
      const { data: albumsWithReviews } = await supabase
        .from('albums')
        .select('id')
        .in('status', ['INACTIVO', 'GANADOR', 'INDIVIDUAL']);

      if (!albumsWithReviews || albumsWithReviews.length === 0) return [];

      const albumIds = albumsWithReviews.map((a) => a.id);

      const [reviewsRes, profilesRes] = await Promise.all([
        supabase.from('reviews').select('*').in('album_id', albumIds),
        supabase.from('profiles').select('email, name, avatar_url'),
      ]);

      const data = reviewsRes.data;
      const profiles = profilesRes.data || [];

      if (reviewsRes.error || !data || data.length === 0) {
        return await getTopReviewersManual();
      }

      const profileMapByEmail = {};
      const profileMapByName = {};
      profiles.forEach((p) => {
        if (p.email) profileMapByEmail[p.email.toLowerCase().trim()] = p;
        if (p.name) profileMapByName[p.name.toLowerCase().trim()] = p;
      });

      const reviewerMap = {};
      data.forEach((review) => {
        const nameKey = review.reviewer_name;
        if (!reviewerMap[nameKey]) {
          const prof =
            (review.reviewer_email &&
              profileMapByEmail[review.reviewer_email.toLowerCase().trim()]) ||
            profileMapByName[nameKey.toLowerCase().trim()] ||
            null;

          reviewerMap[nameKey] = {
            ratings: [],
            albums: new Set(),
            email: review.reviewer_email,
            avatar_url: prof?.avatar_url || null,
          };
        }
        const score = getWeightedReviewScore(review) ?? review.rating_general;
        if (score !== null && score !== undefined && !isNaN(score)) {
          reviewerMap[nameKey].ratings.push(score);
        }
        reviewerMap[nameKey].albums.add(review.album_id);
      });

      const result = Object.entries(reviewerMap).map(([name, data]) => {
        const avg =
          data.ratings.length > 0
            ? data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length
            : 0;

        return {
          reviewer_name: name,
          reviewer_email: data.email,
          avatar_url: data.avatar_url,
          review_count: data.ratings.length,
          album_count: data.albums.size,
          avg_rating: parseFloat(avg.toFixed(1)),
        };
      });

      return result
        .filter((r) => r.review_count > 0)
        .sort(
          (a, b) =>
            b.review_count - a.review_count || b.avg_rating - a.avg_rating
        )
        .slice(0, 15);
    } catch (error) {
      console.error('Error en getTopReviewers:', error);
      return await getTopReviewersManual();
    }
  },

  getTopAlbums: async () => {
    try {
      const { data: albums, error } = await supabase
        .from('albums')
        .select(
          `
          id,
          album_name,
          artist_name,
          image_url,
          status,
          reviews(
            track_ratings,
            rating_produccion,
            rating_composicion,
            rating_letras,
            rating_originalidad,
            rating_cohesion,
            rating_replay,
            rating_general
          )
        `
        )
        .in('status', ['INACTIVO', 'GANADOR', 'INDIVIDUAL']);

      if (error || !albums || albums.length === 0) return [];

      const result = [];

      albums.forEach((album) => {
        const reviews = album.reviews || [];
        const scores = reviews
          .map((r) => getWeightedReviewScore(r))
          .filter((s) => s !== null && !isNaN(s));

        if (scores.length === 0) return;

        const baseAvg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const reviewCount = scores.length;
        const bonus = calculateReviewBonus(reviewCount);
        const finalRating = Math.min(10, baseAvg + bonus);

        result.push({
          id: album.id,
          album_name: album.album_name,
          artist_name: album.artist_name,
          image_url: album.image_url,
          status: album.status,
          review_count: reviewCount,
          base_rating: parseFloat(baseAvg.toFixed(2)),
          bonus: parseFloat(bonus.toFixed(2)),
          avg_rating: parseFloat(finalRating.toFixed(2)),
        });
      });

      return result.sort(
        (a, b) => b.avg_rating - a.avg_rating || b.review_count - a.review_count
      );
    } catch (error) {
      console.error('Error en getTopAlbums:', error);
      // Fallback
      const { data: albums } = await supabase
        .from('albums')
        .select('id, album_name, artist_name, image_url, status')
        .in('status', ['INACTIVO', 'GANADOR', 'INDIVIDUAL']);

      if (!albums || albums.length === 0) return [];

      const albumIds = albums.map((a) => a.id);
      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .in('album_id', albumIds);

      if (!reviews || reviews.length === 0) return [];

      const albumRatings = {};
      reviews.forEach((r) => {
        if (!albumRatings[r.album_id]) albumRatings[r.album_id] = [];
        const score = getWeightedReviewScore(r) ?? r.rating_general;
        if (score !== null && score !== undefined && !isNaN(score)) {
          albumRatings[r.album_id].push(score);
        }
      });

      const result = albums
        .map((album) => {
          const ratings = albumRatings[album.id] || [];
          if (ratings.length === 0) return null;
          const baseAvg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          const reviewCount = ratings.length;
          const bonus = calculateReviewBonus(reviewCount);
          const finalRating = Math.min(10, baseAvg + bonus);

          return {
            id: album.id,
            album_name: album.album_name,
            artist_name: album.artist_name,
            image_url: album.image_url,
            status: album.status,
            review_count: reviewCount,
            base_rating: parseFloat(baseAvg.toFixed(2)),
            bonus: parseFloat(bonus.toFixed(2)),
            avg_rating: parseFloat(finalRating.toFixed(2)),
          };
        })
        .filter((a) => a !== null)
        .sort((a, b) => b.avg_rating - a.avg_rating || b.review_count - a.review_count);

      return result;
    }
  },

  getTopByAllCategories: async () => {
    const categories = [
      'produccion',
      'composicion',
      'letras',
      'originalidad',
      'cohesion',
      'replay',
      'general',
    ];
    const result = {};

    try {
      const { data: albums, error } = await supabase
        .from('albums')
        .select(
          `
          id,
          album_name,
          artist_name,
          image_url,
          status,
          reviews(
            track_ratings,
            rating_produccion,
            rating_composicion,
            rating_letras,
            rating_originalidad,
            rating_cohesion,
            rating_replay,
            rating_general
          )
        `
        )
        .in('status', ['INACTIVO', 'GANADOR', 'INDIVIDUAL']);

      if (error || !albums || albums.length === 0) return result;

      categories.forEach((cat) => {
        const key = `rating_${cat}`;
        const categoryResults = [];
        const maxScale = cat === 'general' ? 10 : 5;

        albums.forEach((album) => {
          const reviews = album.reviews || [];
          const values = reviews
            .map((r) => {
              if (cat === 'general') {
                return getWeightedReviewScore(r) ?? r.rating_general;
              }
              return r[key];
            })
            .filter((v) => v !== null && v !== undefined && !isNaN(v));

          if (values.length === 0) return;

          const baseAvg = values.reduce((a, b) => a + b, 0) / values.length;
          const reviewCount = values.length;
          const bonus = calculateReviewBonus(reviewCount);
          const finalRating = Math.min(maxScale, baseAvg + bonus);

          categoryResults.push({
            id: album.id,
            album_name: album.album_name,
            artist_name: album.artist_name,
            image_url: album.image_url,
            status: album.status,
            review_count: reviewCount,
            base_rating: parseFloat(baseAvg.toFixed(2)),
            bonus: parseFloat(bonus.toFixed(2)),
            avg_rating: parseFloat(finalRating.toFixed(2)),
          });
        });

        result[cat] = categoryResults.sort(
          (a, b) => b.avg_rating - a.avg_rating || b.review_count - a.review_count
        );
      });

      return result;
    } catch (error) {
      console.error('Error en getTopByAllCategories:', error);
      return result;
    }
  },

  getGlobalStats: async () => {
    try {
      // Obtener álbumes INACTIVOS y GANADORES (los que tienen reviews)
      const { data: albumsWithReviews } = await supabase
        .from('albums')
        .select('id')
        .in('status', ['INACTIVO', 'GANADOR', 'INDIVIDUAL']);

      if (!albumsWithReviews || albumsWithReviews.length === 0) {
        return {
          avg_produccion: 0,
          avg_composicion: 0,
          avg_letras: 0,
          avg_originalidad: 0,
          avg_cohesion: 0,
          avg_replay: 0,
          avg_general: 0,
          distribution: {},
          total_reviews: 0,
        };
      }

      const albumIds = albumsWithReviews.map((a) => a.id);

      // Obtener todas las reviews de esos álbumes
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select(
          'rating_produccion, rating_composicion, rating_letras, rating_originalidad, rating_cohesion, rating_replay, rating_general'
        )
        .in('album_id', albumIds);

      if (error || !reviews || reviews.length === 0) {
        return {
          avg_produccion: 0,
          avg_composicion: 0,
          avg_letras: 0,
          avg_originalidad: 0,
          avg_cohesion: 0,
          avg_replay: 0,
          avg_general: 0,
          distribution: {},
          total_reviews: 0,
        };
      }

      // Calcular promedios por categoría
      const categories = [
        'produccion',
        'composicion',
        'letras',
        'originalidad',
        'cohesion',
        'replay',
        'general',
      ];

      const result = {};
      const distribution = {};

      categories.forEach((cat) => {
        const key = `rating_${cat}`;
        const values = reviews
          .map((r) => r[key])
          .filter((v) => v !== null && v !== undefined);

        const avg =
          values.length > 0
            ? values.reduce((a, b) => a + b, 0) / values.length
            : 0;

        result[`avg_${cat}`] = parseFloat(avg.toFixed(1));

        // Distribución para rating_general
        if (cat === 'general') {
          values.forEach((v) => {
            const rounded = Math.round(v);
            distribution[rounded] = (distribution[rounded] || 0) + 1;
          });
        }
      });

      return {
        ...result,
        distribution,
        total_reviews: reviews.length,
      };
    } catch (error) {
      console.error('Error en getGlobalStats:', error);
      return {
        avg_produccion: 0,
        avg_composicion: 0,
        avg_letras: 0,
        avg_originalidad: 0,
        avg_cohesion: 0,
        avg_replay: 0,
        avg_general: 0,
        distribution: {},
        total_reviews: 0,
      };
    }
  },

  // ==========================================
  // TRACKS - Sincronización con Spotify
  // ==========================================

  updateAlbumTracks: async (albumId, tracks) => {
    const { data, error } = await supabase
      .from('albums')
      .update({
        tracks: tracks,
        spotify_verified: true,
      })
      .eq('id', albumId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  getAlbumTracks: async (albumId) => {
    const { data, error } = await supabase
      .from('albums')
      .select('tracks, spotify_verified')
      .eq('id', albumId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Para crear álbum con tracks desde Spotify
  createAlbumWithTracks: async (albumData) => {
    const { data, error } = await supabase
      .from('albums')
      .insert([
        {
          album_name: albumData.albumName,
          artist_name: albumData.artistName,
          image_url: albumData.imageUrl,
          spotify_link: albumData.spotifyLink || null,
          youtube_link: albumData.youtubeLink || null,
          apple_music_link: albumData.appleMusicLink || null,
          status: albumData.status || 'ACTIVO',
          added_by: albumData.addedBy || null,
          added_by_email: albumData.addedByEmail || null,
          tracks: albumData.tracks || [],
          spotify_verified: albumData.status === 'INDIVIDUAL' ? true : false,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // ============================================
  // ADMIN FUNCTIONS
  // ============================================

  getAllAlbums: async () => {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  },

  updateAlbumStatus: async (albumId, newStatus) => {
    const { data, error } = await supabase
      .from('albums')
      .update({ status: newStatus })
      .eq('id', albumId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  deleteAlbum: async (albumId) => {
    const { error } = await supabase.from('albums').delete().eq('id', albumId);

    if (error) throw new Error(error.message);
    return true;
  },

  // ============================================
  // LEADERBOARD & ÁLBUMES COMPLETOS
  // ============================================

  getAllProfiles: async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error in getAllProfiles:', err);
      return [];
    }
  },

  getDetailedLeaderboard: async () => {
    try {
      const [profilesRes, reviewsRes, albumsRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase
          .from('reviews')
          .select('*, albums(id, album_name, artist_name, image_url, status)'),
        supabase.from('albums').select('*'),
      ]);

      const profiles = profilesRes.data || [];
      const reviews = reviewsRes.data || [];
      const albums = albumsRes.data || [];

      const profileByEmail = new Map();
      const profileByName = new Map();
      profiles.forEach((p) => {
        if (p.email) profileByEmail.set(p.email.toLowerCase().trim(), p);
        if (p.name) profileByName.set(p.name.toLowerCase().trim(), p);
      });

      const userMap = new Map();

      // 1. Inicializar con perfiles registrados
      profiles.forEach((p) => {
        const key = (p.email || p.name || p.id).toLowerCase().trim();
        userMap.set(key, {
          id: p.id,
          name: p.name || p.email?.split('@')[0] || 'Usuario',
          email: p.email || '',
          avatar_url: p.avatar_url || null,
          bio: p.bio || null,
          role: p.role || 'user',
          favorite_artist: p.favorite_artist || null,
          favorite_album: p.favorite_album || null,
          favorite_genres: p.favorite_genres || [],
          spotify_url: p.spotify_url || null,
          instagram_url: p.instagram_url || null,
          created_at: p.created_at,
          reviews: [],
          albums_added: [],
        });
      });

      // 2. Asociar álbumes añadidos
      albums.forEach((alb) => {
        const userEmail = (alb.added_by_email || '').toLowerCase().trim();
        const userName = (alb.added_by || '').toLowerCase().trim();

        let foundKey = null;
        if (userEmail && userMap.has(userEmail)) {
          foundKey = userEmail;
        } else if (userName && userMap.has(userName)) {
          foundKey = userName;
        } else if (userEmail) {
          for (const [k, u] of userMap.entries()) {
            if (u.email && u.email.toLowerCase().trim() === userEmail) {
              foundKey = k;
              break;
            }
          }
        }

        if (!foundKey) {
          const key = (alb.added_by_email || alb.added_by || alb.id).toLowerCase().trim();
          userMap.set(key, {
            id: alb.user_id || key,
            name: alb.added_by || alb.added_by_email?.split('@')[0] || 'Miembro',
            email: alb.added_by_email || '',
            avatar_url: null,
            bio: null,
            role: 'user',
            favorite_artist: null,
            favorite_album: null,
            favorite_genres: [],
            spotify_url: null,
            instagram_url: null,
            created_at: alb.created_at,
            reviews: [],
            albums_added: [],
          });
          foundKey = key;
        }

        userMap.get(foundKey).albums_added.push(alb);
      });

      // 3. Asociar reviews
      reviews.forEach((rev) => {
        const revEmail = (rev.reviewer_email || '').toLowerCase().trim();
        const revName = (rev.reviewer_name || '').toLowerCase().trim();

        let foundKey = null;
        if (revEmail && userMap.has(revEmail)) {
          foundKey = revEmail;
        } else if (revName && userMap.has(revName)) {
          foundKey = revName;
        } else {
          for (const [k, u] of userMap.entries()) {
            if (revEmail && u.email && u.email.toLowerCase().trim() === revEmail) {
              foundKey = k;
              break;
            }
            if (revName && u.name && u.name.toLowerCase().trim() === revName) {
              foundKey = k;
              break;
            }
          }
        }

        if (!foundKey) {
          const key = (rev.reviewer_email || rev.reviewer_name || rev.id).toLowerCase().trim();
          const prof =
            (revEmail && profileByEmail.get(revEmail)) ||
            (revName && profileByName.get(revName)) ||
            null;
          userMap.set(key, {
            id: prof?.id || key,
            name: rev.reviewer_name || prof?.name || 'Miembro',
            email: rev.reviewer_email || prof?.email || '',
            avatar_url: prof?.avatar_url || null,
            bio: prof?.bio || null,
            role: prof?.role || 'user',
            favorite_artist: prof?.favorite_artist || null,
            favorite_album: prof?.favorite_album || null,
            favorite_genres: prof?.favorite_genres || [],
            spotify_url: prof?.spotify_url || null,
            instagram_url: prof?.instagram_url || null,
            created_at: rev.created_at,
            reviews: [],
            albums_added: [],
          });
          foundKey = key;
        }

        userMap.get(foundKey).reviews.push(rev);
      });

      // 4. Computar métricas por usuario
      const leaderboardList = Array.from(userMap.values()).map((userData) => {
        const userReviews = userData.reviews;
        let weightedSum = 0;
        let generalSum = 0;
        let validScoresCount = 0;
        let totalTracksRated = 0;

        const critKeys = [
          'rating_produccion',
          'rating_composicion',
          'rating_letras',
          'rating_originalidad',
          'rating_cohesion',
          'rating_replay',
        ];
        const criteriaSums = {
          rating_produccion: 0,
          rating_composicion: 0,
          rating_letras: 0,
          rating_originalidad: 0,
          rating_cohesion: 0,
          rating_replay: 0,
        };
        const criteriaCounts = {
          rating_produccion: 0,
          rating_composicion: 0,
          rating_letras: 0,
          rating_originalidad: 0,
          rating_cohesion: 0,
          rating_replay: 0,
        };

        let highestReview = null;
        let lowestReview = null;

        userReviews.forEach((rev) => {
          const weightedScore = getWeightedReviewScore(rev) ?? rev.rating_general;
          if (weightedScore !== null && weightedScore !== undefined && !isNaN(weightedScore)) {
            weightedSum += weightedScore;
            validScoresCount += 1;

            if (
              !highestReview ||
              weightedScore > (getWeightedReviewScore(highestReview) ?? highestReview.rating_general ?? 0)
            ) {
              highestReview = rev;
            }
            if (
              !lowestReview ||
              weightedScore < (getWeightedReviewScore(lowestReview) ?? lowestReview.rating_general ?? 10)
            ) {
              lowestReview = rev;
            }
          }

          if (rev.rating_general !== null && rev.rating_general !== undefined && !isNaN(rev.rating_general)) {
            generalSum += Number(rev.rating_general);
          }

          critKeys.forEach((ck) => {
            if (rev[ck] !== null && rev[ck] !== undefined && !isNaN(rev[ck])) {
              criteriaSums[ck] += Number(rev[ck]);
              criteriaCounts[ck] += 1;
            }
          });

          if (rev.track_ratings && typeof rev.track_ratings === 'object') {
            totalTracksRated += Object.keys(rev.track_ratings).length;
          }
        });

        const avgScore = validScoresCount > 0 ? parseFloat((weightedSum / validScoresCount).toFixed(2)) : 0;
        const avgGeneral = validScoresCount > 0 ? parseFloat((generalSum / validScoresCount).toFixed(1)) : 0;

        const criteriaAverages = {};
        critKeys.forEach((ck) => {
          criteriaAverages[ck] =
            criteriaCounts[ck] > 0 ? parseFloat((criteriaSums[ck] / criteriaCounts[ck]).toFixed(1)) : 0;
        });

        return {
          ...userData,
          review_count: userReviews.length,
          albums_added_count: userData.albums_added.length,
          avg_score: avgScore,
          avg_general: avgGeneral,
          criteria_averages: criteriaAverages,
          total_tracks_rated: totalTracksRated,
          highest_review: highestReview
            ? {
                album: highestReview.albums?.album_name || 'Álbum',
                artist: highestReview.albums?.artist_name || 'Artista',
                image_url: highestReview.albums?.image_url || null,
                score: getWeightedReviewScore(highestReview) ?? highestReview.rating_general,
              }
            : null,
          lowest_review: lowestReview
            ? {
                album: lowestReview.albums?.album_name || 'Álbum',
                artist: lowestReview.albums?.artist_name || 'Artista',
                image_url: lowestReview.albums?.image_url || null,
                score: getWeightedReviewScore(lowestReview) ?? lowestReview.rating_general,
              }
            : null,
        };
      });

      // Calcular insignias multinivel
      const maxReviews = Math.max(...leaderboardList.map((u) => u.review_count), 0);
      const maxAlbumsAdded = Math.max(...leaderboardList.map((u) => u.albums_added_count), 0);

      leaderboardList.forEach((u) => {
        const badges = [];
        const reviews = u.reviews || [];
        const reviewCount = u.review_count || 0;
        const avgScore = u.avg_score || 0;
        const albumsCount = u.albums_added_count || 0;
        const tracksCount = u.total_tracks_rated || 0;

        const hasCommentsCount = reviews.filter(
          (r) => r.comment && r.comment.trim().length > 0
        ).length;
        const hasTen = reviews.some(
          (r) =>
            Number(r.rating_general) === 10 ||
            (r.track_ratings &&
              Object.values(r.track_ratings).some((v) => Number(v) === 10))
        );

        // 1. 👑 MÁSTER REVIEWER (Dorado / Amarillo) - Líder de Reseñas
        if (reviewCount > 0 && reviewCount === maxReviews) {
          badges.push({
            id: 'top_reviewer',
            label: '👑 Máster Reviewer',
            color: 'from-amber-400 via-yellow-400 to-amber-500',
            textColor: 'text-amber-950',
            desc: 'Líder del club con el mayor número de reseñas publicadas',
          });
        }

        // 2. 🌟 GRAN CURADOR (Púrpura / Violeta) - Líder de Álbumes Aportados
        if (albumsCount > 0 && albumsCount === maxAlbumsAdded) {
          badges.push({
            id: 'top_curator',
            label: '🌟 Gran Curador',
            color: 'from-purple-500 via-fuchsia-500 to-violet-600',
            textColor: 'text-white',
            desc: 'Mayor aportador de álbumes compartidos en la colección',
          });
        }

        // 3. ⚡ PISTAS AL DETALLE (Cian / Turquesa Eléctrico) - Calificador de Tracks
        if (tracksCount >= 25) {
          badges.push({
            id: 'track_master',
            label: '⚡ Pistas al Detalle',
            color: 'from-cyan-400 via-teal-400 to-cyan-500',
            textColor: 'text-cyan-950',
            desc: 'Se toma el tiempo de calificar minuciosamente canción por canción (≥ 25 tracks)',
          });
        }

        // 4. 🎯 CRÍTICO EXIGENTE (Rojo / Carmesí) - Rigor de Calificación
        if (reviewCount >= 2 && avgScore > 0 && avgScore <= 7.2) {
          badges.push({
            id: 'tough_critic',
            label: '🎯 Crítico Exigente',
            color: 'from-rose-500 via-red-500 to-rose-600',
            textColor: 'text-white',
            desc: 'Estándares rigurosos y análisis estricto (Promedio ≤ 7.2 ⭐)',
          });
        }

        // 5. 💖 CRÍTICO GENEROSO (Verde / Esmeralda) - Gran Aprecio
        if (reviewCount >= 2 && avgScore >= 8.6) {
          badges.push({
            id: 'generous',
            label: '💖 Crítico Generoso',
            color: 'from-emerald-400 via-green-400 to-teal-500',
            textColor: 'text-emerald-950',
            desc: 'Gran aprecio por la música y valoraciones entusiastas (Promedio ≥ 8.6 ⭐)',
          });
        }

        // 6. ✍️ PLUMA CRÍTICA (Azul / Índigo Real) - Redacción de Comentarios
        if (hasCommentsCount >= 2) {
          badges.push({
            id: 'writer',
            label: '✍️ Pluma Crítica',
            color: 'from-blue-500 via-indigo-500 to-blue-600',
            textColor: 'text-white',
            desc: 'Escribe reseñas detalladas con opiniones y análisis en texto',
          });
        }

        // 7. 💯 CAZADOR DEL 10 (Rosa / Fucsia) - Calificación Perfecta
        if (hasTen) {
          badges.push({
            id: 'perfectionist',
            label: '💯 Cazador del 10',
            color: 'from-pink-500 via-rose-400 to-pink-600',
            textColor: 'text-white',
            desc: 'Ha encontrado y otorgado al menos un 10 perfecto a un álbum o canción',
          });
        }

        u.badges = badges;
      });

      return leaderboardList.sort(
        (a, b) => b.review_count - a.review_count || b.avg_score - a.avg_score
      );
    } catch (err) {
      console.error('Error in getDetailedLeaderboard:', err);
      return [];
    }
  },

  getAllAlbumsWithFullStats: async () => {
    try {
      const [albumsRes, reviewsRes, profilesRes] = await Promise.all([
        supabase
          .from('albums')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('reviews').select('*'),
        supabase.from('profiles').select('email, name, avatar_url'),
      ]);

      const albums = albumsRes.data || [];
      const reviews = reviewsRes.data || [];
      const profiles = profilesRes.data || [];

      const profileMapByEmail = new Map();
      const profileMapByName = new Map();
      profiles.forEach((p) => {
        if (p.email) profileMapByEmail.set(p.email.toLowerCase().trim(), p);
        if (p.name) profileMapByName.set(p.name.toLowerCase().trim(), p);
      });

      const reviewsByAlbum = new Map();
      reviews.forEach((r) => {
        if (!reviewsByAlbum.has(r.album_id)) {
          reviewsByAlbum.set(r.album_id, []);
        }
        const prof =
          (r.reviewer_email &&
            profileMapByEmail.get(r.reviewer_email.toLowerCase().trim())) ||
          (r.reviewer_name &&
            profileMapByName.get(r.reviewer_name.toLowerCase().trim())) ||
          null;

        const weightedScore = getWeightedReviewScore(r) ?? r.rating_general;

        reviewsByAlbum.get(r.album_id).push({
          ...r,
          avatar_url: prof?.avatar_url || null,
          weighted_score:
            weightedScore !== null && weightedScore !== undefined && !isNaN(weightedScore)
              ? parseFloat(weightedScore.toFixed(2))
              : null,
        });
      });

      const result = albums.map((alb) => {
        const albumReviews = reviewsByAlbum.get(alb.id) || [];
        const validScores = albumReviews
          .map((r) => r.weighted_score ?? r.rating_general)
          .filter((s) => s !== null && s !== undefined && !isNaN(s));

        const reviewCount = albumReviews.length;
        const baseAvg =
          validScores.length > 0
            ? validScores.reduce((a, b) => a + b, 0) / validScores.length
            : 0;
        const bonus = calculateReviewBonus(reviewCount);
        const finalScore = validScores.length > 0 ? Math.min(10, baseAvg + bonus) : null;

        const critKeys = [
          'rating_produccion',
          'rating_composicion',
          'rating_letras',
          'rating_originalidad',
          'rating_cohesion',
          'rating_replay',
          'rating_general',
        ];
        const criteriaAverages = {};
        critKeys.forEach((ck) => {
          const vals = albumReviews
            .map((r) => r[ck])
            .filter((v) => v !== null && v !== undefined && !isNaN(v));
          criteriaAverages[ck] =
            vals.length > 0
              ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1))
              : null;
        });

        // Estadísticas por canción
        const trackStatsMap = {};
        const tracksList = alb.tracks || [];
        tracksList.forEach((t) => {
          const tName = typeof t === 'string' ? t : t.name;
          trackStatsMap[tName] = {
            name: tName,
            scores: [],
            track_number: t.track_number,
            duration_ms: t.duration_ms,
          };
        });

        albumReviews.forEach((rev) => {
          if (rev.track_ratings && typeof rev.track_ratings === 'object') {
            Object.entries(rev.track_ratings).forEach(([tName, score]) => {
              if (score !== null && score !== undefined && !isNaN(score)) {
                if (!trackStatsMap[tName]) {
                  trackStatsMap[tName] = { name: tName, scores: [] };
                }
                trackStatsMap[tName].scores.push(Number(score));
              }
            });
          }
        });

        const computedTrackStats = Object.values(trackStatsMap).map((ts) => {
          const avg =
            ts.scores.length > 0
              ? ts.scores.reduce((a, b) => a + b, 0) / ts.scores.length
              : null;
          return {
            name: ts.name,
            track_number: ts.track_number,
            duration_ms: ts.duration_ms,
            rating_count: ts.scores.length,
            avg_rating: avg ? parseFloat(avg.toFixed(1)) : null,
          };
        });

        const tracksWithAvg = computedTrackStats.filter((t) => t.avg_rating !== null);
        let bestTrack = null;
        let worstTrack = null;
        if (tracksWithAvg.length > 0) {
          bestTrack = [...tracksWithAvg].sort((a, b) => b.avg_rating - a.avg_rating)[0];
          worstTrack = [...tracksWithAvg].sort((a, b) => a.avg_rating - b.avg_rating)[0];
        }

        return {
          id: alb.id,
          album_name: alb.album_name,
          artist_name: alb.artist_name,
          image_url: alb.image_url,
          status: alb.status,
          added_by: alb.added_by,
          added_by_email: alb.added_by_email,
          user_id: alb.user_id,
          spotify_link: alb.spotify_link,
          youtube_link: alb.youtube_link,
          apple_music_link: alb.apple_music_link,
          tracks: alb.tracks || [],
          created_at: alb.created_at,
          review_count: reviewCount,
          base_rating: parseFloat(baseAvg.toFixed(2)),
          bonus: parseFloat(bonus.toFixed(2)),
          final_rating: finalScore !== null ? parseFloat(finalScore.toFixed(2)) : null,
          criteria_averages: criteriaAverages,
          track_stats: computedTrackStats,
          best_track: bestTrack,
          worst_track: worstTrack,
          reviews: albumReviews,
        };
      });

      return result;
    } catch (err) {
      console.error('Error in getAllAlbumsWithFullStats:', err);
      return [];
    }
  },
};
