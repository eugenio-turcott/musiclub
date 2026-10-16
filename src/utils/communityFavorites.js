import { getTrackDisplayName } from './ratingUtils.js';

const isInternalKey = value => /^(?:[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}|[A-Za-z\d]{22}|\d+|spotify:track:.*|https?:\/\/.*)$/i.test(value);

// Count explicit favorites after resolving their IDs, so an ID and a title share one vote total.
export function getCommunityFavoriteTracks(reviews = [], tracks = [], trackStats = []) {
  const votes = new Map();
  for (const review of reviews) {
    const raw = review.favorite_track ?? review.favoriteTrack;
    if (typeof raw !== 'string' || !raw.trim()) continue;
    const name = getTrackDisplayName(raw, tracks).trim();
    if (!name || (name === raw.trim() && isInternalKey(name))) continue;
    const key = name.toLocaleLowerCase('es');
    const current = votes.get(key) || { name, votes: 0 };
    current.votes++;
    votes.set(key, current);
  }
  const stats = new Map(trackStats.map(t => [String(t.name).toLocaleLowerCase('es'), t]));
  const order = new Map(tracks.map((t, i) => [String(typeof t === 'string' ? t : t.name).toLocaleLowerCase('es'), i]));
  return [...votes.values()].sort((a, b) => b.votes - a.votes ||
    (stats.get(b.name.toLocaleLowerCase('es'))?.avg_rating ?? 0) - (stats.get(a.name.toLocaleLowerCase('es'))?.avg_rating ?? 0) ||
    (order.get(a.name.toLocaleLowerCase('es')) ?? Infinity) - (order.get(b.name.toLocaleLowerCase('es')) ?? Infinity) ||
    a.name.localeCompare(b.name, 'es')).slice(0, 3).map(t => t.name);
}
