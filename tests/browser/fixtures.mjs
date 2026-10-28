export const albums = ['Azul','Rojo','Verde'].map((name,index) => ({
  id:`00000000-0000-4000-8000-00000000000${index+1}`,
  album_name:name, artist_name:'Artista de Prueba', image_url:'/musiclub_logo.png',
  genres:[['Pop'],['Rock'],['Jazz']][index], release_type:'ALBUM', release_year:2025,
  release_date:'2025-01-01', created_at:'2025-01-01T00:00:00Z', reviews_enabled:true,
  tracks:[{id:`track-${index}`,name:'Canción de prueba',track_number:1}], total_tracks:1,
}));
export const reviews=albums.map((album,index)=>({
  id:`review-${index}`, album_id:album.id, reviewer_name:index===2?'Otra persona actual':'Miembro de Prueba',
  rating_general:8, comment:index===2?'':'Una reseña de prueba.', created_at:`2025-01-0${index+2}T00:00:00Z`,
}));
export const tables={albums, public_reviews:reviews, public_profiles:[], public_cover_ratings:[],record_club_upcoming:[],record_club_trending:[]};
tables.pool_rooms=[{id:'00000000-0000-4000-8000-000000000000',name:'Musiclub · Sala del club',description:'Un espacio público para escuchar juntos.',visibility:'public',owner_id:null,created_at:'2026-10-26T00:00:00Z'}];
tables.pool_room_members=[];
tables.seasons=[{id:'fixture-season',room_id:tables.pool_rooms[0].id,season_number:1,name:'Primera escucha',description:'Un Pool de esta sala.',is_active:true,is_open:false,appearance:{},max_releases:null}];
tables.public_pool_entries=[];
tables.seasons[0].season_number=2;
tables.seasons.push({id:'fixture-past-season',room_id:tables.pool_rooms[0].id,season_number:1,name:'El origen del club',description:'Nuestra primera escucha compartida.',is_active:false,is_open:false,appearance:{},start_date:'2025-01-01',end_date:'2025-02-01'});
tables.public_pool_entries.push({id:'past-entry',season_id:'fixture-past-season',album_id:albums[0].id,status:'GRADUADO',created_at:'2025-01-01T00:00:00Z',nominated_by:'Miembro de Prueba'});

tables.artist_discographies=[{slug:'artista-de-prueba',name:'Artista de Prueba',refresh_after:'2099-01-01T00:00:00Z',checked_at:'2026-10-20T00:00:00Z',profile:{source:'OFFICIAL',artist:{name:'Artista de Prueba',image:'/musiclub_logo.png',genres:['Pop']},providers:{DEEZER:{status:'ok'}},discography:[{id:'deezer_fixture',name:'Edición exclusiva oficial',artists:['Artista de Prueba'],release_type:'ALBUM',releaseDate:'2025-02-01',releaseYear:2025,image:'/musiclub_logo.png',sources:[{provider:'DEEZER',id:'fixture'}]}]}}];

tables.record_club_upcoming=[{id:'upcoming-fixture',slug:'artista-proximo-estreno-oficial',artist_slug:'artista-proximo',artist_name:'Artista Próximo',album_name:'Estreno oficial',release_type:'ALBUM',release_date:'2099-01-01',image_url:'/musiclub_logo.png',tracks:[],total_tracks:10}];

// Historical variant rows remain readable, while the public catalogue groups them with the standard release.
tables.albums.push({...albums[0],id:'clean-variant-fixture',album_name:'Azul (Clean)',tracks:[{id:'clean-track',name:'Canción de prueba',track_number:1}]});
tables.public_reviews.push({...reviews[0],id:'clean-variant-review',album_id:'clean-variant-fixture',reviewer_name:'Otra persona',comment:'Reseña de la variante limpia.',created_at:'2025-01-01T00:00:00Z'});

tables.artist_discographies.push({slug:'the-weeknd',name:'the weeknd',refresh_after:'2099-01-01',updated_at:'2026-10-01',profile:{source:'OFFICIAL',artist:{name:'the weeknd',genres:['Pop']},discography:[{id:'deezer_weeknd_fixture',name:'Starboy',artists:['The Weeknd'],release_type:'ALBUM',releaseDate:'2016-11-25',image:'/musiclub_logo.png',sources:[{provider:'DEEZER',id:'weeknd_fixture'}]}]}});

for(const review of tables.public_reviews.filter(review=>[albums[0].id,'clean-variant-fixture'].includes(review.album_id))) review.feeling='intrigado';
