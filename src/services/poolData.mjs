// Read only the releases and public reviews belonging to the selected Pool.
// The caller supplies its authenticated client so private rooms keep their RLS boundary.
export async function loadPoolData(client, buildAlbum, seasonId, roomId) {
  const {data: seasons, error: seasonError} = await client.from('seasons').select('*').eq('room_id', roomId).order('season_number', {ascending:true});
  if (seasonError) throw new Error('No se pudieron cargar los Pools de esta sala');
  const season = seasonId ? seasons?.find(item => item.id === seasonId) : seasons?.find(item => item.is_active) || seasons?.[0];
  if (!season) throw new Error('Esta sala no tiene un Pool disponible o no tienes acceso');
  const {data: entries, error} = await client.from('public_pool_entries').select('*').eq('season_id', season.id).order('created_at', {ascending:false});
  if (error) throw new Error('No se pudieron cargar las propuestas del Pool');
  const albumIds = [...new Set((entries || []).map(entry => entry.album_id).filter(Boolean))];
  const userIds = [...new Set((entries || []).map(entry => entry.user_id).filter(Boolean))];
  const readReviews = async () => {
    const all = [];
    for (let from = 0; ; from += 1000) {
      const result = await client.from('public_reviews').select('*').in('album_id', albumIds).order('id').range(from, from + 999);
      if (result.error) throw new Error('No se pudieron cargar las reseñas del Pool');
      all.push(...(result.data || []));
      if ((result.data || []).length < 1000) return all;
    }
  };
  const [releases, reviews, profiles] = await Promise.all([
    albumIds.length ? client.from('albums').select('*').in('id', albumIds) : {data:[]},
    albumIds.length ? readReviews() : [],
    userIds.length ? client.from('public_profiles').select('id,name,avatar_url').in('id', userIds) : {data:[]},
  ]);
  if (releases.error) throw new Error('No se pudieron cargar los releases del Pool');
  if (profiles.error) throw new Error('No se pudieron cargar los integrantes del Pool');
  const reviewsByAlbum = new Map();
  for (const review of reviews) {
    if (!reviewsByAlbum.has(review.album_id)) reviewsByAlbum.set(review.album_id, []);
    reviewsByAlbum.get(review.album_id).push(review);
  }
  const byId = new Map((releases.data || []).map(album => [album.id, buildAlbum(album, reviewsByAlbum.get(album.id) || [])]));
  const members = new Map((profiles.data || []).map(profile => [profile.id, profile]));
  const active = [], history = [];
  let winner = null;
  for (const entry of entries || []) {
    const album = byId.get(entry.album_id);
    if (!album) continue;
    const item = {...album, pool_entry_id:entry.id, album:album.album_name, artista:album.artist_name, imagen:album.image_url,
      status:entry.status, nominated_user_id:entry.user_id || null, review_scheduled_for:entry.review_scheduled_for || null,
      added_by:members.get(entry.user_id)?.name?.trim() || entry.nominated_by || 'Miembro',
      nominated_avatar:members.get(entry.user_id)?.avatar_url || null, created_at:entry.created_at, nominated_at:entry.created_at,
      nomination_note:entry.note || '', reviews_enabled:entry.status === 'GANADOR' && entry.reviews_enabled === true,
      spotifyLink:entry.spotify_link || album.spotify_link, youtubeLink:entry.youtube_link || album.youtube_link,
      appleMusicLink:entry.apple_music_link || album.apple_music_link, otherLink:entry.other_link || album.other_link};
    if (entry.status === 'GANADOR') winner = item;
    else if (entry.status === 'ACTIVO') active.push(item);
    else history.push(item);
  }
  return {seasons:seasons || [], season:{...season,entry_count:(entries || []).length}, active, winner, history, isFromDedicatedTable:true};
}
