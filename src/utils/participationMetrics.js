export function participationMetrics(reviews, now = Date.now()) {
  const start = now - 30 * 86400000;
  const people = new Map();
  let recentReviews = 0;
  for (const review of reviews) {
    const timestamp = Date.parse(review.created_at);
    if (!Number.isFinite(timestamp) || timestamp > now) continue;
    if (timestamp >= start) recentReviews++;
    const person = review.reviewer_email?.trim().toLowerCase();
    if (!person) continue;
    const existing = people.get(person) || { first: timestamp, last: timestamp };
    existing.first = Math.min(existing.first, timestamp);
    existing.last = Math.max(existing.last, timestamp);
    people.set(person, existing);
  }
  const active = [...people.values()].filter(p => p.last >= start);
  return { recentReviews, active: active.length, firstTime: active.filter(p => p.first >= start).length,
    returned: active.filter(p => p.first < start).length };
}
