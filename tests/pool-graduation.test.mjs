import test from 'node:test';
import assert from 'node:assert/strict';
import { getCommunityFavoriteTracks } from '../src/utils/communityFavorites.js';
import { generatePoolGraduatedHtml } from '../src/services/emailService.js';

// Import the existing album calculator without a real account or any network calls.
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'test-only-public-key';
const { buildAlbumWithFullStats } = await import('../src/services/supabaseClient.js');
const tracks = [
  { id: 'c240075c-d650-4a85-9cb8-3b6017a8f6ce', name: 'Happy Birthday' },
  { id: '4c54dcf0-a5c7-4c56-ba43-0aba856e99b6', name: 'Nancy Tries to Take the Night' },
  { id: 'fb242dd9-d77c-4541-807b-b5dd6d9c1894', name: 'For the Cold Country' },
];

test('community favorites resolve UUIDs and combine ID/title votes before ranking', () => {
  const reviews = [
    { favorite_track: tracks[0].id }, { favorite_track: 'Happy Birthday' },
    { favorite_track: tracks[1].id }, { favorite_track: tracks[2].id },
    { favorite_track: '00000000-0000-0000-0000-000000000000' },
    { favorite_track: '7zzzzzzzzzzzzzzzzzzzzz' }, { favorite_track: null },
  ];
  assert.deepEqual(getCommunityFavoriteTracks(reviews, tracks), tracks.map(t => t.name));
  assert.deepEqual(getCommunityFavoriteTracks([], tracks), []);
});

test('favorites with equal votes use track score and then album order deterministically', () => {
  const reviews = tracks.map(t => ({ favorite_track: t.id }));
  const stats = tracks.map((t, i) => ({ name: t.name, avg_rating: i === 1 ? 10 : 8 }));
  assert.deepEqual(getCommunityFavoriteTracks(reviews, tracks, stats), [tracks[1].name, tracks[0].name, tracks[2].name]);
});

test('graduation uses the album weighted score, keeps pillars on five and renders readable favorites', () => {
  const review = { rating_general: 6, rating_produccion: 5, rating_composicion: 5,
    rating_letras: 5, rating_originalidad: 5, rating_cohesion: 5, rating_replay: 5,
    favorite_track: tracks[0].id, track_ratings: { [tracks[0].id]: 10 } };
  const album = { album_name: 'Album', artist_name: 'Artist', tracks };
  const stats = buildAlbumWithFullStats(album, [review]);
  assert.equal(stats.final_rating, 9.2); // 50% tracks + 30% pillars + 20% general; not raw general (6).
  const breakdown = Object.fromEntries(Object.entries(stats.criteria_averages).map(([key, value]) => [key.replace('rating_', ''), value]));
  const html = generatePoolGraduatedHtml({ ...album, albumName: album.album_name,
    artistName: album.artist_name, avgScore: stats.final_rating.toFixed(1), totalReviews: 1, breakdown,
    topTracks: getCommunityFavoriteTracks([review], tracks, stats.track_stats) });
  assert.equal((html.match(/5\.0 \/ 5/g) || []).length, 6);
  assert.ok(html.includes('★ 9.2'));
  assert.ok(html.includes('1. Happy Birthday'));
  assert.ok(!html.includes(tracks[0].id));
});

test('email distinguishes missing pillars from zero and escapes titles and member text', () => {
  const html = generatePoolGraduatedHtml({ albumName: 'Album', artistName: 'Artist',
    breakdown: { produccion: 0, composicion: null, letras: '', originalidad: NaN, cohesion: 20 },
    topTracks: ['A & B <song>'], highlightQuotes: [{ comment: '<img src=x>', reviewer: 'A & B' }] });
  assert.ok(html.includes('0.0 / 5'));
  assert.equal((html.match(/— \/ 5/g) || []).length, 5);
  assert.ok(html.includes('A &amp; B &lt;song&gt;'));
  assert.ok(!html.includes('<img src=x>'));
  assert.ok(!html.includes('★ 8.5'));
});
