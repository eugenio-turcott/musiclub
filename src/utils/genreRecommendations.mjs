import genres from './genreCatalog.cjs';
import { getWeightedReviewScore } from './ratingUtils.js';

export const PERSONALIZATION_MINIMUM = 10;
const clamp = value => Math.min(10, Math.max(0, value));
const scoreOf = review => {
  const value = getWeightedReviewScore(review);
  return value !== null && value !== undefined && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 10 ? Number(value) : null;
};

export function buildGenreRecommendations(albums = [], reviews = [], { authenticated = false, now = Date.now() } = {}) {
  // A release counts once, including after an edit or duplicate review row.
  const latest = new Map();
  if (authenticated) for (const review of reviews) {
    if (!review.album_id || scoreOf(review) === null) continue;
    const id = String(review.album_id), previous = latest.get(id);
    const timestamp = Date.parse(review.updated_at || review.created_at || '') || 0;
    if (!previous || timestamp >= previous.timestamp) latest.set(id, { review, score: scoreOf(review), timestamp });
  }
  const albumMap = new Map(albums.map(album => [String(album.id), album]));
  const byGenre = new Map();
  for (const [id, { review, score }] of latest) {
    const keys = genres.albumGenreKeys(albumMap.get(id) || review.albums);
    for (const key of keys) {
      const stat = byGenre.get(key) || { id: key, count: 0, total: 0, evidence: 0, enjoyment: 0 };
      stat.count++; stat.total += score;
      // A heavily tagged album must not create more evidence than a single-genre album.
      stat.evidence += 1 / keys.length;
      stat.enjoyment += (score / 10) ** 2 / keys.length;
      byGenre.set(key, stat);
    }
  }
  const genreProfile = [...byGenre.values()].map(stat => ({
    id: stat.id, name: genres.normalizeGenres([stat.id])[0], count: stat.count,
    average: stat.total / stat.count,
    weight: stat.enjoyment / (stat.evidence + 2),
  })).sort((a,b) => b.weight - a.weight || b.count - a.count || a.id.localeCompare(b.id));
  const ratedCount = latest.size;
  const personalized = authenticated && ratedCount >= PERSONALIZATION_MINIMUM && genreProfile.some(genre => genre.weight > 0);
  const weights = new Map(genreProfile.map(genre => [genre.id, genre.weight]));
  const maxWeight = Math.max(...genreProfile.map(genre => genre.weight), 0.001);
  const published = album => !(album.release_date && Date.parse(album.release_date) > now);
  const available = albums.filter(album => album.id && !latest.has(String(album.id)) && published(album) && album.reviews_enabled !== false);
  const counts = album => Math.max(0, Number(album.review_count) || 0);
  const mean = album => {
    const raw = album.base_rating ?? album.avg_rating ?? album.final_rating;
    return raw !== null && raw !== undefined && Number.isFinite(Number(raw)) ? clamp(Number(raw)) : null;
  };
  const community = albums.filter(album => published(album) && counts(album) > 0 && mean(album) !== null);
  const votes = community.reduce((sum, album) => sum + counts(album), 0);
  const prior = votes ? community.reduce((sum, album) => sum + counts(album) * mean(album), 0) / votes : 0;
  const maxVotes = Math.max(...community.map(counts), 1);
  const ranked = available.filter(album => personalized || (counts(album) > 0 && mean(album) !== null)).map(album => {
    const count = counts(album), average = mean(album);
    const adjusted = count && average !== null ? (count * average + 5 * prior) / (count + 5) : 0;
    const communityScore = 0.7 * adjusted / 10 + 0.3 * Math.log1p(count) / Math.log1p(maxVotes);
    const keys = genres.albumGenreKeys(album), matches = keys.filter(key => weights.has(key))
      .sort((a,b) => weights.get(b) - weights.get(a));
    const affinity = keys.length ? keys.reduce((sum, key) => sum + (weights.get(key) || 0), 0) / keys.length / maxWeight : 0;
    const matchingGenres = matches.map(key => genreProfile.find(genre => genre.id === key));
    const reason = personalized && matchingGenres.length
      ? `Por tu afinidad con ${matchingGenres.slice(0,2).map(genre => genre.name).join(' y ')}.`
      : count ? `${count} ${count === 1 ? 'reseña' : 'reseñas'} de la comunidad${average !== null ? ` · ${average.toFixed(1)}/10` : ''}.`
        : 'Para ampliar tus escuchas en los géneros del club.';
    return { ...album, recommendationScore: personalized ? 0.8 * affinity + 0.2 * communityScore : communityScore,
      genreAffinity: affinity, communityScore, adjustedCommunityScore: adjusted, communityAverage: average,
      matchingGenres: matchingGenres.map(genre => genre.name), recommendationReason: reason };
  });
  const tie = (a,b) => counts(b) - counts(a) || String(a.id).localeCompare(String(b.id));
  ranked.sort((a,b) => b.recommendationScore - a.recommendationScore || tie(a,b));
  return { personalized, ratedCount, minimum: PERSONALIZATION_MINIMUM, genreProfile,
    recommendations: ranked,
    mostReviewed: [...ranked].filter(album => counts(album) > 0).sort((a,b) => counts(b)-counts(a) || b.adjustedCommunityScore-a.adjustedCommunityScore || tie(a,b)),
    acclaimed: [...ranked].filter(album => counts(album) > 0 && album.communityAverage >= 8).sort((a,b) => b.adjustedCommunityScore-a.adjustedCommunityScore || tie(a,b)),
  };
}
