function sortReviewsNewestFirst(reviews = []) {
  const timestamp = review => {
    const value = Date.parse(review.created_at);
    return Number.isFinite(value) ? value : -Infinity;
  };
  return [...reviews].sort((a, b) => {
    const left = timestamp(a), right = timestamp(b);
    if (left !== right) return left > right ? -1 : 1;
    return String(a.id || '').localeCompare(String(b.id || ''));
  });
}
function latestCommunityReviews(reviews = [], limit = 3) {
  const seen = new Set();
  return sortReviewsNewestFirst(reviews).filter(review => {
    const identity = review.user_id || review.author_email || review.reviewer_email || review.reviewer_name || 'anonymous';
    const key = String(identity).normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}
module.exports = { sortReviewsNewestFirst, latestCommunityReviews };
