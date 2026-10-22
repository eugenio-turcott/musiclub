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

test('community highlights keep the newest review per person and ignore comment length', () => {
 const reviews=[
  {id:'old-long',reviewer_name:'Corpus',created_at:'2026-09-01',comment:'long '.repeat(200)},
  {id:'latest',reviewer_name:'Santi',created_at:'2026-10-22',comment:''},
  {id:'repeat',reviewer_name:' SANTI ',created_at:'2026-10-21'},
  {id:'second',reviewer_name:'Abel',created_at:'2026-10-20'},
  {id:'third',reviewer_name:'Otra persona',created_at:'2026-10-19'},
 ];
 assert.deepEqual(chronology.latestCommunityReviews(reviews).map(r=>r.id),['latest','second','third']);
 assert.equal(chronology.latestCommunityReviews([{id:'a',user_id:'one',reviewer_name:'Antes'},{id:'b',user_id:'one',reviewer_name:'Después'}]).length,1);
});

 test('community highlights return fewer than three when fewer distinct authors exist',()=>{
  assert.equal(chronology.latestCommunityReviews([{reviewer_name:'Only one'},{reviewer_name:'Only one'}]).length,1);
 });
