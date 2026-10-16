// Only these fields may cross the server/client boundary for a public review.
export const PUBLIC_REVIEW_FIELDS = 'id,album_id,reviewer_name,reviewer_avatar,rating_general,rating_produccion,rating_composicion,rating_letras,rating_originalidad,rating_cohesion,rating_replay,track_ratings,favorite_track,feeling,comment,created_at';

export function publicData(value) {
  if (Array.isArray(value)) return value.map(publicData);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !/email|password|token|secret|^role$|^identities$/i.test(key))
    .map(([key, item]) => [key, publicData(item)]));
}

export function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
