const clean = value => String(value || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const title = value => clean(String(value || '').replace(/\s*[-–(]\s*(?:remaster(?:ed)?|deluxe|expanded|anniversary|explicit|clean)(?:[^)]*)\)?$/i, ''));
const validName = value => value && !/^(?:track|pista|cancion)\s*\d+$/i.test(clean(value));

// Prefer the existing community calculation, never an unrelated popular song.
export function listeningTrack(album, reviews = []) {
  if (!album) return null;
  const tracks = (album.tracks || []).map((t, i) => typeof t === 'string' ? {name: t, track_number: i + 1} : t);
  const find = key => key == null ? null : tracks.find((t, i) => (t.id != null && String(t.id) === String(key)) || clean(t.name) === clean(key) || String(i + 1) === String(key));
  if (album.best_track?.name && validName(album.best_track.name)) {
    const track = find(album.best_track.id) || find(album.best_track.name);
    if (track && validName(track.name)) return {...track, reason: album.best_track.is_favorite_consensus ? 'Favorita del club' : 'Mejor calificada'};
  }
  const ids = album.edition_member_ids || [album.id];
  const related = reviews.filter(r => ids.includes(r.album_id));
  const scores = tracks.map(track => ({track, votes:0, scores:[]}));
  for (const review of related) {
    const favorite = find(review.favorite_track);
    if (favorite) scores.find(s => s.track === favorite).votes++;
    for (const [key, value] of Object.entries(review.track_ratings || {})) {
      const track = find(key), number = Number(value);
      if (track && number > 0 && number <= 10) scores.find(s => s.track === track).scores.push(number);
    }
  }
  const rated = scores.filter(s => validName(s.track.name) && (s.votes || s.scores.length));
  const avg = s => s.scores.length ? s.scores.reduce((a,b)=>a+b,0)/s.scores.length : 0;
  const favoriteFirst = related.length === 1 || Math.max(0, ...rated.map(s=>s.votes)) >= 2;
  rated.sort((a,b) => (favoriteFirst ? b.votes-a.votes : avg(b)-avg(a)) || (favoriteFirst ? avg(b)-avg(a) : b.votes-a.votes));
  return rated[0] ? {...rated[0].track, reason: favoriteFirst && rated[0].votes ? 'Favorita del club' : 'Mejor calificada'} : null;
}

export function matchListeningPreview(results, album, track) {
  if (!track) return null;
  const artist = clean(album.artist_name || album.artista), release = title(album.album_name || album.album);
  const candidates = results.filter(item => item.kind === 'song' && clean(item.artistName) === artist && title(item.trackName) === title(track.name) && title(item.collectionName) === release);
  for (const item of candidates) {
    try {
      const preview = new URL(item.previewUrl), link = new URL(item.trackViewUrl);
      if (preview.protocol !== 'https:' || !/(^|\.)itunes\.apple\.com$/.test(preview.hostname) || link.protocol !== 'https:' || !/(^|\.)(?:itunes|music)\.apple\.com$/.test(link.hostname)) continue;
      return {url:preview.href, storeUrl:link.href, name:track.name, artist:album.artist_name || album.artista, reason:track.reason};
    } catch { /* Incomplete provider records are not playable. */ }
  }
  return null;
}
