export const albums = ['Azul','Rojo','Verde'].map((name,index) => ({
  id:`00000000-0000-4000-8000-00000000000${index+1}`,
  album_name:name, artist_name:'Artista de Prueba', image_url:'/musiclub_logo.png',
  genres:[['Pop'],['Rock'],['Jazz']][index], release_type:'ALBUM', release_year:2025,
  release_date:'2025-01-01', created_at:'2025-01-01T00:00:00Z', reviews_enabled:true,
  tracks:[{id:`track-${index}`,name:'Canción de prueba',track_number:1}], total_tracks:1,
}));
export const reviews=albums.map((album,index)=>({
  id:`review-${index}`, album_id:album.id, reviewer_name:'Miembro de Prueba',
  rating_general:8, comment:'Una reseña de prueba.', created_at:'2025-01-02T00:00:00Z',
}));
export const tables={albums, public_reviews:reviews, public_profiles:[], public_cover_ratings:[],record_club_upcoming:[],record_club_trending:[]};
