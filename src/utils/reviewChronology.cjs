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
module.exports = { sortReviewsNewestFirst };
