import test from 'node:test';
import assert from 'node:assert/strict';
import { deliverNotificationOnce } from '../src/services/notificationDelivery.js';
import { reviewAssessment } from '../src/utils/reviewAssessment.js';
import { publicMetricEvent } from '../src/utils/metricsPrivacy.js';
import { participationMetrics } from '../src/utils/participationMetrics.js';

test('participation distinguishes first-time reviewers from returning people without counting duplicate identities', () => {
  const now = Date.parse('2026-10-16T12:00:00Z');
  const rows = [
    { reviewer_email: 'A@example.test', created_at: '2026-01-01' },
    { reviewer_email: 'a@example.test', created_at: '2026-10-15' },
    { reviewer_email: 'b@example.test', created_at: '2026-10-10' },
    { reviewer_email: 'b@example.test', created_at: '2026-10-11' },
    { reviewer_email: 'future@example.test', created_at: '2027-01-01' },
    { reviewer_email: 'invalid@example.test', created_at: 'bad' },
  ];
  assert.deepEqual(participationMetrics(rows, now), { recentReviews: 3, active: 2, firstTime: 1, returned: 1 });
});

test('concurrent retries result in one delivery and no retries after an uncertain failure', async () => {
  const claimed = new Set(); const statuses = [];
  const db = { rpc: async (name, args) => {
    if (name === 'musiclub_claim_notification') { const exists = claimed.has(args.p_key); claimed.add(args.p_key); return { data: !exists }; }
    statuses.push(args.p_sent); return {};
  } };
  let sends = 0;
  const send = async () => { sends++; return { provider: 'smtp', success: true }; };
  const results = await Promise.all(Array.from({ length: 10 }, () => deliverNotificationOnce(db, 'same', send)));
  assert.equal(sends, 1); assert.equal(results.filter(r => r.skipped).length, 9); assert.deepEqual(statuses, [true]);
  await assert.rejects(deliverNotificationOnce(db, 'uncertain', async () => { throw new Error('SMTP connection lost'); }));
  assert.equal((await deliverNotificationOnce(db, 'uncertain', send)).skipped, true);
  assert.equal(sends, 1);
});

test('a claim failure prevents any send', async () => {
  let sends = 0;
  await assert.rejects(deliverNotificationOnce({ rpc: async () => ({ error: 'offline' }) }, 'key', async () => sends++));
  assert.equal(sends, 0);
});

test('club reviews require all six pillars on five and preserve track and general ratings', () => {
  const ratings = {general:8, produccion:3, composicion:4, letras:5, originalidad:3, cohesion:4, replay:5};
  const assessment = reviewAssessment(ratings, {song:10});
  assert.equal(assessment.ratingGeneral,8);
  assert.equal(assessment.ratingProduccion,3);
  assert.equal(assessment.ratingReplay,5);
  assert.deepEqual(assessment.trackRatings,{song:10});
  assert.throws(() => reviewAssessment({general:8},{}), /cada pilar/);
  assert.throws(() => reviewAssessment({...ratings, general:11},{}));
  assert.throws(() => reviewAssessment({...ratings, produccion:6},{}), /cada pilar/);
  assert.throws(() => reviewAssessment({...ratings, replay:null},{}), /cada pilar/);
});

test('analytics remove all URL parameters and exclude private pages', () => {
  assert.deepEqual(publicMetricEvent({ type: 'pageview', url: 'https://www.musiclub.org/catalogo?q=private-search#note' }), { type: 'pageview', url: 'https://www.musiclub.org/catalogo' });
  for (const page of ['admin', 'settings', 'profile', 'recomendaciones', 'perfil']) assert.equal(publicMetricEvent({ url: `https://www.musiclub.org/${page}?email=private` }), null);
});
