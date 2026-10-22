export const albums = ['Azul','Rojo','Verde'].map((name,index) => ({
  id:`00000000-0000-4000-8000-00000000000${index+1}`,
  album_name:name, artist_name:'Artista de Prueba', image_url:'/musiclub_logo.png',
  genres:[['Pop'],['Rock'],['Jazz']][index], release_type:'ALBUM', release_year:2025,
  release_date:'2025-01-01', created_at:'2025-01-01T00:00:00Z', reviews_enabled:true,
  tracks:[{id:`track-${index}`,name:'Canción de prueba',track_number:1}], total_tracks:1,
}));
export const reviews=albums.map((album,index)=>({
  id:`review-${index}`, album_id:album.id, reviewer_name:'Miembro de Prueba',
  rating_general:8, comment:index===2?'':'Una reseña de prueba.', created_at:`2025-01-0${index+2}T00:00:00Z`,
}));
export const tables={albums, public_reviews:reviews, public_profiles:[], public_cover_ratings:[],record_club_upcoming:[],record_club_trending:[]};

tables.artist_discographies=[{slug:'artista-de-prueba',name:'Artista de Prueba',refresh_after:'2099-01-01T00:00:00Z',checked_at:'2026-10-20T00:00:00Z',profile:{source:'OFFICIAL',artist:{name:'Artista de Prueba',image:'/musiclub_logo.png',genres:['Pop']},providers:{DEEZER:{status:'ok'}},discography:[{id:'deezer_fixture',name:'Edición exclusiva oficial',artists:['Artista de Prueba'],release_type:'ALBUM',releaseDate:'2025-02-01',releaseYear:2025,image:'/musiclub_logo.png',sources:[{provider:'DEEZER',id:'fixture'}]}]}}];

tables.record_club_upcoming=[{id:'upcoming-fixture',slug:'artista-proximo-estreno-oficial',artist_slug:'artista-proximo',artist_name:'Artista Próximo',album_name:'Estreno oficial',release_type:'ALBUM',release_date:'2099-01-01',image_url:'/musiclub_logo.png',tracks:[],total_tracks:10}];

// Historical variant rows remain readable, while the public catalogue groups them with the standard release.
tables.albums.push({...albums[0],id:'clean-variant-fixture',album_name:'Azul (Clean)',tracks:[{id:'clean-track',name:'Canción de prueba',track_number:1}]});
tables.public_reviews.push({...reviews[0],id:'clean-variant-review',album_id:'clean-variant-fixture',reviewer_name:'Otra persona',comment:'Reseña de la variante limpia.',created_at:'2025-01-01T00:00:00Z'});
