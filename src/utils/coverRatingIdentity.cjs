function normalizedEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

// Names are presentation, never identity. An explicit owner ID takes precedence.
function ownsCoverRating(rating, user) {
  if (!rating || !user?.id) return false;
  if (rating.user_id) return rating.user_id === user.id;
  const email = normalizedEmail(user.email);
  return Boolean(email && normalizedEmail(rating.user_email) === email);
}

function ownCoverRatings(ratings, user) {
  const map = new Map();
  for (const rating of ratings || []) {
    if (!rating.album_id || !ownsCoverRating(rating, user)) continue;
    const previous = map.get(rating.album_id);
    const time = item => new Date(item.updated_at || item.created_at || 0).getTime() || 0;
    if (!previous || time(rating) > time(previous)) map.set(rating.album_id, rating);
  }
  return map;
}

module.exports = { normalizedEmail, ownsCoverRating, ownCoverRatings };
