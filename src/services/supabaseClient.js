import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('⚠️ Faltan variables de entorno de Supabase');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// FUNCIONES DE RESPALDO (MANUALES)
// ============================================

// Respaldo manual para getTopReviewers
async function getTopReviewersManual() {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select('reviewer_name, rating_produccion, rating_composicion, rating_letras, rating_originalidad, rating_cohesion, rating_replay, rating_general, album_id');

        if (error) return [];

        if (!data || data.length === 0) return [];

        const reviewerMap = {};
        data.forEach(review => {
            if (!reviewerMap[review.reviewer_name]) {
                reviewerMap[review.reviewer_name] = { reviews: [], albums: new Set() };
            }
            reviewerMap[review.reviewer_name].reviews.push(review);
            reviewerMap[review.reviewer_name].albums.add(review.album_id);
        });

        return Object.entries(reviewerMap).map(([name, data]) => {
            const allRatings = data.reviews.flatMap(r => [
                r.rating_produccion, r.rating_composicion, r.rating_letras,
                r.rating_originalidad, r.rating_cohesion, r.rating_replay, r.rating_general
            ]).filter(v => v !== null && v !== undefined);

            const avg = allRatings.length > 0
                ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
                : 0;

            return {
                reviewer_name: name,
                review_count: data.reviews.length,
                album_count: data.albums.size,
                avg_rating: parseFloat(avg.toFixed(1))
            };
        }).sort((a, b) => b.review_count - a.review_count).slice(0, 5);
    } catch (error) {
        console.error('Error en getTopReviewersManual:', error);
        return [];
    }
}

// Respaldo manual para getTopAlbums
async function getTopAlbumsManual() {
    try {
        const { data: albums, error: albumsError } = await supabase
            .from('albums')
            .select('id, album_name, artist_name, image_url, status')
            .eq('status', 'ACTIVO');

        if (albumsError) return [];

        const { data: reviews, error: reviewsError } = await supabase
            .from('reviews')
            .select('album_id, rating_produccion, rating_composicion, rating_letras, rating_originalidad, rating_cohesion, rating_replay, rating_general');

        if (reviewsError) return [];

        if (!reviews || reviews.length === 0) return [];

        const albumReviews = {};
        reviews.forEach(review => {
            if (!albumReviews[review.album_id]) albumReviews[review.album_id] = [];
            albumReviews[review.album_id].push(review);
        });

        const categories = ['produccion', 'composicion', 'letras', 'originalidad', 'cohesion', 'replay', 'general'];
        const result = [];

        albums.forEach(album => {
            const reviewsForAlbum = albumReviews[album.id] || [];
            if (reviewsForAlbum.length < 2) return;

            const albumData = {
                id: album.id,
                album_name: album.album_name,
                artist_name: album.artist_name,
                image_url: album.image_url,
                review_count: reviewsForAlbum.length,
            };

            categories.forEach(cat => {
                const key = `rating_${cat}`;
                const values = reviewsForAlbum.map(r => r[key]).filter(v => v !== null && v !== undefined);
                const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                albumData[`avg_${cat}`] = parseFloat(avg.toFixed(1));
            });

            const allRatings = reviewsForAlbum.flatMap(r =>
                categories.map(cat => r[`rating_${cat}`])
            ).filter(v => v !== null && v !== undefined);

            albumData.avg_rating = allRatings.length > 0
                ? parseFloat((allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1))
                : 0;

            result.push(albumData);
        });

        return result.sort((a, b) => b.avg_rating - a.avg_rating).slice(0, 10);
    } catch (error) {
        console.error('Error en getTopAlbumsManual:', error);
        return [];
    }
}

// ============================================
// FUNCIONES PRINCIPALES DE SUPABASE SERVICE
// ============================================

export const supabaseService = {
    // ==========================================
    // ÁLBUMES
    // ==========================================

    getActiveAlbums: async () => {
        const { data, error } = await supabase
            .from('albums')
            .select('*')
            .eq('status', 'ACTIVO')
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
            .insert([{
                album_name: albumData.albumName,
                artist_name: albumData.artistName,
                image_url: albumData.imageUrl,
                spotify_link: albumData.spotifyLink || null,
                youtube_link: albumData.youtubeLink || null,
                apple_music_link: albumData.appleMusicLink || null,
                status: 'ACTIVO',
                added_by: albumData.addedBy || null,
                added_by_email: albumData.addedByEmail || null
            }])
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
        const { data, error } = await supabase
            .from('reviews')
            .select('*, albums(album_name, artist_name, image_url)');

        if (error) throw new Error(error.message);
        return data;
    },

    submitReview: async (reviewData) => {
        const { data, error } = await supabase
            .from('reviews')
            .insert([{
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
                comment: reviewData.comment || ''
            }])
            .select();

        if (error) throw new Error(error.message);
        return data[0];
    },

    // ==========================================
    // RANKINGS - USANDO VISTAS DE SUPABASE
    // ==========================================

    getTopReviewers: async () => {
        try {
            const { data, error } = await supabase
                .from('reviewer_stats')
                .select('*')
                .order('review_count', { ascending: false })
                .limit(5);

            if (error) {
                console.error('Error en getTopReviewers (vista):', error);
                // Fallback: calcular manualmente
                return await getTopReviewersManual();
            }

            return data || [];
        } catch (error) {
            console.error('Error en getTopReviewers:', error);
            return await getTopReviewersManual();
        }
    },

    getTopAlbums: async () => {
        try {
            const { data, error } = await supabase
                .from('album_stats')
                .select('*')
                .order('avg_rating', { ascending: false })
                .limit(10);

            if (error) {
                console.error('Error en getTopAlbums (vista):', error);
                // Fallback: calcular manualmente
                return await getTopAlbumsManual();
            }

            return data || [];
        } catch (error) {
            console.error('Error en getTopAlbums:', error);
            return await getTopAlbumsManual();
        }
    },

    getTopByAllCategories: async () => {
        const categories = ['produccion', 'composicion', 'letras', 'originalidad', 'cohesion', 'replay', 'general'];
        const result = {};

        try {
            // Obtener todos los álbumes con sus reviews
            const { data: albums, error: albumsError } = await supabase
                .from('albums')
                .select(`
                    id,
                    album_name,
                    artist_name,
                    image_url,
                    reviews!inner(
                        rating_produccion,
                        rating_composicion,
                        rating_letras,
                        rating_originalidad,
                        rating_cohesion,
                        rating_replay,
                        rating_general
                    )
                `)
                .eq('status', 'ACTIVO');

            if (albumsError) throw albumsError;

            if (!albums || albums.length === 0) {
                return result;
            }

            // Procesar cada categoría
            categories.forEach(cat => {
                const key = `rating_${cat}`;
                const categoryResults = [];

                albums.forEach(album => {
                    const reviews = album.reviews || [];

                    // Solo álbumes con al menos 2 reviews
                    if (reviews.length < 2) return;

                    const values = reviews
                        .map(r => r[key])
                        .filter(v => v !== null && v !== undefined);

                    if (values.length === 0) return;

                    const avg = values.reduce((a, b) => a + b, 0) / values.length;

                    categoryResults.push({
                        id: album.id,
                        album_name: album.album_name,
                        artist_name: album.artist_name,
                        image_url: album.image_url,
                        avg_rating: parseFloat(avg.toFixed(1)),
                        review_count: reviews.length
                    });
                });

                // Ordenar y tomar top 5
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
            const { data, error } = await supabase
                .from('reviews')
                .select('rating_produccion, rating_composicion, rating_letras, rating_originalidad, rating_cohesion, rating_replay, rating_general');

            if (error) throw error;

            if (!data || data.length === 0) {
                return {
                    avg_produccion: 0,
                    avg_composicion: 0,
                    avg_letras: 0,
                    avg_originalidad: 0,
                    avg_cohesion: 0,
                    avg_replay: 0,
                    avg_general: 0,
                    distribution: {}
                };
            }

            const categories = ['produccion', 'composicion', 'letras', 'originalidad', 'cohesion', 'replay', 'general'];
            const stats = {};
            const distribution = {};

            categories.forEach(cat => {
                const key = `rating_${cat}`;
                const values = data.map(r => r[key]).filter(v => v !== null && v !== undefined);
                stats[`avg_${cat}`] = values.length > 0
                    ? parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1))
                    : 0;
            });

            data.forEach(r => {
                if (r.rating_general !== null && r.rating_general !== undefined) {
                    const score = Math.round(r.rating_general);
                    distribution[score] = (distribution[score] || 0) + 1;
                }
            });

            // Asegurar que todos los scores 1-10 existan
            for (let i = 1; i <= 10; i++) {
                if (!distribution[i]) distribution[i] = 0;
            }

            return {
                ...stats,
                distribution
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
                distribution: {}
            };
        }
    },
};