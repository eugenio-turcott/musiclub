import test from 'node:test';
import assert from 'node:assert/strict';
import chronology from '../src/utils/reviewChronology.cjs';

test('home and public feed select newest publications regardless of author or comment length', () => {
  const reviews = [
    { id: 'old', created_at: '2026-09-03T12:00:00Z', reviewer_name: 'Corpus', comment: 'Largo '.repeat(200) },
    { id: 'second', created_at: '2026-10-20T10:00:00Z', reviewer_name: 'Santi', comment: 'Breve' },
    { id: 'newest', created_at: '2026-10-21T10:00:00Z', reviewer_name: 'Santi', comment: '' },
    { id: 'third', created_at: '2026-10-19T10:00:00Z', comment: null },
  ];
  const original = reviews.map(r => r.id);
  assert.deepEqual(chronology.sortReviewsNewestFirst(reviews).slice(0, 3).map(r => r.id), ['newest','second','third']);
  assert.deepEqual(reviews.map(r => r.id), original);
});

test('chronology compares actual instants across timezones and puts missing dates last', () => {
  const reviews = [
    { id:'unknown', created_at:null },
    { id:'invalid', created_at:'invalid' },
    { id:'earlier', created_at:'2026-10-22T01:00:00Z' },
    { id:'later', created_at:'2026-10-21T20:00:00-06:00' },
  ];
  assert.deepEqual(chronology.sortReviewsNewestFirst(reviews).map(r => r.id), ['later','earlier','invalid','unknown']);
  assert.deepEqual(chronology.sortReviewsNewestFirst([]), []);
});
