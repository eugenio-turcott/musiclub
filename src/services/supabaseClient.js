// src/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

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
    const { data: inactiveAlbums } = await supabase
      .from('albums')
      .select('id')
      .eq('status', 'INACTIVO');

    if (!inactiveAlbums || inactiveAlbums.length === 0) return [];

    const inactiveIds = inactiveAlbums.map((a) => a.id);

    const { data: reviews } = await supabase
      .from('reviews')
      .select('reviewer_name, rating_general, album_id')
      .in('album_id', inactiveIds);

    if (!reviews || reviews.length === 0) return [];

    const reviewerMap = {};
    reviews.forEach((review) => {
      if (!reviewerMap[review.reviewer_name]) {
        reviewerMap[review.reviewer_name] = { ratings: [], albums: new Set() };
      }
      if (
        review.rating_general !== null &&
        review.rating_general !== undefined
      ) {
        reviewerMap[review.reviewer_name].ratings.push(review.rating_general);
      }
      reviewerMap[review.reviewer_name].albums.add(review.album_id);
    });

    const result = Object.entries(reviewerMap).map(([name, data]) => {
      const avg =
        data.ratings.length > 0
          ? data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length
          : 0;

      return {
        reviewer_name: name,
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
      .slice(0, 5);
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
          status: albumData.status || 'ACTIVO', // 👈 Permitir status personalizado
          added_by: albumData.addedBy || null,
          added_by_email: albumData.addedByEmail || null,
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
    const { data: inactiveAlbums } = await supabase
      .from('albums')
      .select('id')
      .eq('status', 'INACTIVO');

    if (!inactiveAlbums || inactiveAlbums.length === 0) return [];

    const inactiveIds = inactiveAlbums.map((a) => a.id);

    const { data, error } = await supabase
      .from('reviews')
      .select('*, albums!inner(album_name, artist_name, image_url)')
      .in('album_id', inactiveIds);

    if (error) throw new Error(error.message);
    return data || [];
  },

  submitReview: async (reviewData) => {
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

  // ==========================================
  // RANKINGS - USANDO rating_general
  // ==========================================

  getTopReviewers: async () => {
    try {
      // Cambiar: Incluir tanto INACTIVO como GANADOR
      const { data: inactiveAlbums } = await supabase
        .from('albums')
        .select('id')
        .in('status', ['INACTIVO', 'GANADOR']); // 👈 AQUÍ el cambio

      if (!inactiveAlbums || inactiveAlbums.length === 0) return [];

      const inactiveIds = inactiveAlbums.map((a) => a.id);

      const { data, error } = await supabase
        .from('reviews')
        .select('reviewer_name, rating_general, album_id')
        .in('album_id', inactiveIds);

      if (error || !data || data.length === 0) {
        return await getTopReviewersManual();
      }

      const reviewerMap = {};
      data.forEach((review) => {
        if (!reviewerMap[review.reviewer_name]) {
          reviewerMap[review.reviewer_name] = {
            ratings: [],
            albums: new Set(),
          };
        }
        if (
          review.rating_general !== null &&
          review.rating_general !== undefined
        ) {
          reviewerMap[review.reviewer_name].ratings.push(review.rating_general);
        }
        reviewerMap[review.reviewer_name].albums.add(review.album_id);
      });

      const result = Object.entries(reviewerMap).map(([name, data]) => {
        const avg =
          data.ratings.length > 0
            ? data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length
            : 0;

        return {
          reviewer_name: name,
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
        .slice(0, 5);
    } catch (error) {
      console.error('Error en getTopReviewers:', error);
      return await getTopReviewersManual();
    }
  },

  getTopAlbums: async () => {
    try {
      // CAMBIAR: Incluir tanto INACTIVO como GANADOR
      const { data: albums, error } = await supabase
        .from('albums')
        .select(
          `
          id,
          album_name,
          artist_name,
          image_url,
          reviews(rating_general)
        `
        )
        .in('status', ['INACTIVO', 'GANADOR']); // 👈 AQUÍ está el cambio

      if (error || !albums || albums.length === 0) return [];

      const result = [];

      albums.forEach((album) => {
        const reviews = album.reviews || [];
        const ratings = reviews
          .map((r) => r.rating_general)
          .filter((v) => v !== null && v !== undefined);

        if (ratings.length === 0) return;

        const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;

        result.push({
          id: album.id,
          album_name: album.album_name,
          artist_name: album.artist_name,
          image_url: album.image_url,
          review_count: ratings.length,
          avg_rating: parseFloat(avg.toFixed(1)),
        });
      });

      return result.sort((a, b) => b.avg_rating - a.avg_rating).slice(0, 10);
    } catch (error) {
      console.error('Error en getTopAlbums:', error);
      // Fallback con la misma lógica
      const { data: albums } = await supabase
        .from('albums')
        .select('id, album_name, artist_name, image_url')
        .in('status', ['INACTIVO', 'GANADOR']); // 👈 También aquí

      if (!albums || albums.length === 0) return [];

      const albumIds = albums.map((a) => a.id);
      const { data: reviews } = await supabase
        .from('reviews')
        .select('album_id, rating_general')
        .in('album_id', albumIds);

      if (!reviews || reviews.length === 0) return [];

      const albumRatings = {};
      reviews.forEach((r) => {
        if (!albumRatings[r.album_id]) albumRatings[r.album_id] = [];
        if (r.rating_general !== null && r.rating_general !== undefined) {
          albumRatings[r.album_id].push(r.rating_general);
        }
      });

      const result = albums
        .map((album) => {
          const ratings = albumRatings[album.id] || [];
          if (ratings.length === 0) return null;
          const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          return {
            id: album.id,
            album_name: album.album_name,
            artist_name: album.artist_name,
            image_url: album.image_url,
            review_count: ratings.length,
            avg_rating: parseFloat(avg.toFixed(1)),
          };
        })
        .filter((a) => a !== null)
        .sort((a, b) => b.avg_rating - a.avg_rating)
        .slice(0, 10);

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
          reviews(
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
        .in('status', ['INACTIVO', 'GANADOR']); // 👈 AQUÍ el cambio

      if (error || !albums || albums.length === 0) return result;

      categories.forEach((cat) => {
        const key = `rating_${cat}`;
        const categoryResults = [];

        albums.forEach((album) => {
          const reviews = album.reviews || [];
          const values = reviews
            .map((r) => r[key])
            .filter((v) => v !== null && v !== undefined);

          if (values.length === 0) return;

          const avg = values.reduce((a, b) => a + b, 0) / values.length;

          categoryResults.push({
            id: album.id,
            album_name: album.album_name,
            artist_name: album.artist_name,
            image_url: album.image_url,
            avg_rating: parseFloat(avg.toFixed(1)),
            review_count: values.length,
          });
        });

        result[cat] = categoryResults
          .sort((a, b) => b.avg_rating - a.avg_rating)
          .slice(0, 5);
      });

      return result;
    } catch (error) {
      console.error('Error en getTopByAllCategories:', error);
      return result;
    }
  },

  getGlobalStats: async () => {
    try {
      const { data: inactiveAlbums } = await supabase
        .from('albums')
        .select('id')
        .in('status', ['INACTIVO', 'GANADOR']); // 👈 AQUÍ el cambio

      if (!inactiveAlbums || inactiveAlbums.length === 0) {
        return {
          avg_produccion: 0,
          avg_composicion: 0,
          avg_letras: 0,
          avg_originalidad: 0,
          avg_cohesion: 0,
          avg_replay: 0,
          avg_general: 0,
          distribution: {},
          inactive_albums: 0,
          total_reviews: 0,
        };
      }

      const inactiveIds = inactiveAlbums.map((a) => a.id);

      const { data, error } = await supabase
        .from('reviews')
        .select(
          'rating_produccion, rating_composicion, rating_letras, rating_originalidad, rating_cohesion, rating_replay, rating_general'
        )
        .in('album_id', inactiveIds);

      if (error || !data || data.length === 0) {
        return {
          avg_produccion: 0,
          avg_composicion: 0,
          avg_letras: 0,
          avg_originalidad: 0,
          avg_cohesion: 0,
          avg_replay: 0,
          avg_general: 0,
          distribution: {},
          inactive_albums: inactiveIds.length,
          total_reviews: 0,
        };
      }

      // ... resto del código igual
    } catch (error) {
      // ... resto del código igual
    }
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
};
