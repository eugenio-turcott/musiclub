import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('⚠️ Faltan variables de entorno de Supabase');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Funciones helper para usar en toda la app
export const supabaseService = {
    // Álbumes
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

    // Reviews
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

    // Rankings
    getTopReviewers: async () => {
        const { data, error } = await supabase
            .from('reviewer_stats')
            .select('*')
            .order('review_count', { ascending: false })
            .limit(5);

        if (error) throw new Error(error.message);
        return data;
    },

    getTopAlbums: async () => {
        const { data, error } = await supabase
            .from('album_stats')
            .select('*')
            .order('avg_rating', { ascending: false })
            .limit(5);

        if (error) throw new Error(error.message);
        return data;
    }
};