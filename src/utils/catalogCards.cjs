// Collection cards never need song lists, review bodies or provider metadata.
const fields = ['id','album_name','artist_name','image_url','release_type','release_year','release_date','created_at','genres','review_count','final_rating','total_tracks','status','reviews_enabled','spotify_link','apple_music_link','youtube_link','other_link'];
function catalogCard(album) {
 const card = {};
 for (const key of fields) if (album[key] !== undefined) card[key] = album[key];
 if (album.best_track) card.best_track = {name:album.best_track.name,avg_rating:album.best_track.avg_rating};
 return card;
}
module.exports = { catalogCard, catalogCards: albums => albums.map(catalogCard) };
