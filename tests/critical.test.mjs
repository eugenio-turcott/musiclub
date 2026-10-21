import test from 'node:test';
import assert from 'node:assert/strict';
import identity from '../src/utils/releaseIdentity.cjs';
import sitemap from '../src/utils/sitemapData.cjs';
import { publicData, jsonLd } from '../src/utils/publicData.js';
import { getReleaseUrl } from '../src/utils/ratingUtils.js';

test('Unicode album identities survive encoded route parameters and HTTP redirects', () => {
  const path = getReleaseUrl({ artist_name: 'Аигел', album_name: '1190' });
  const encoded = encodeURI(path);
  const headers = new Headers({ Location: encoded });
  assert.equal(headers.get('Location'), encoded);
  assert.equal(identity.decodeRouteSlug(encoded.split('/').pop()), 'аигел-1190');
  assert.equal(identity.decodeRouteSlug('black-country-new-road-forever-howlong'), 'black-country-new-road-forever-howlong');
  assert.equal(identity.decodeRouteSlug('invalid%'), 'invalid%');
});

test('sitemap and application agree for artists, formats, accents and editions', () => {
  for (const album of [
    { artist_name: 'ROSALÍA', album_name: 'MOTOMAMI', release_type: 'ALBUM' },
    { artist_name: 'ROSALÍA', album_name: 'MOTOMAMI +', release_type: 'ALBUM' },
    { artist_name: 'piri & tommy', album_name: 'about dancing', release_type: 'EP' },
    { artist_name: '宇多田ヒカル', album_name: '初恋', release_type: 'SINGLE' },
    { artist_name: 'A', album_name: 'B', release_type: 'COMPILACIÓN' },
  ]) assert.equal(identity.releasePath(album), getReleaseUrl(album));
  assert.notEqual(getReleaseUrl({ artist: 'ROSALÍA', name: 'MOTOMAMI' }), getReleaseUrl({ artist: 'ROSALÍA', name: 'MOTOMAMI +' }));
});

test('sitemaps exclude empty identities and deduplicate canonical releases', () => {
  const albums = [
    { id: 1, artist_name: 'Björk', album_name: 'Debut', review_count: 0 },
    { id: 2, artist_name: 'Björk', album_name: 'Debut', review_count: 1 },
    { artist_name: '', album_name: 'Orphan' },
    { artist_name: '宇多田ヒカル', album_name: '初恋' },
  ];
  const groups = sitemap.buildSitemapGroups(albums);
  assert.equal(groups.reviews.length, 1);
  assert.equal(groups.catalog.length, 0);
  assert.equal(groups.artists.length, 1);
  assert.ok(groups.artists.every(a => !a.loc.endsWith('/artista/')));
  assert.ok(!groups.core.some(a => a.loc.endsWith('/recomendaciones')));
  assert.match(sitemap.sitemapXml([{ loc: 'https://x.test/a?b=c&d=e' }]), /c&amp;d=e/);
});

test('lastmod uses real content dates without inventing modification dates', () => {
  const groups = sitemap.buildSitemapGroups([{ id: 1, artist_name: 'A', album_name: 'B', created_at: '2026-01-01', review_count: 1 }],
    [{ album_id: 1, created_at: '2026-10-16' }]);
  assert.equal(groups.reviews[0].lastmod, '2026-10-16T00:00:00.000Z');
  assert.ok(!sitemap.sitemapXml(groups.core).includes('<lastmod>'));
});

test('public serialization removes nested private data without deleting musical content', () => {
  const result = publicData({ album_name: 'A', added_by_email: 'private', reviews: [
    { reviewer_name: 'Critic', reviewer_email: 'private', comment: 'Opinion', access_token: 'private', profile: { role: 'admin', avatar: 'artwork' } },
  ] });
  assert.deepEqual(result, { album_name: 'A', reviews: [{ reviewer_name: 'Critic', comment: 'Opinion', profile: { avatar: 'artwork' } }] });
});

test('JSON-LD cannot close its script element and preserves the original text', () => {
  const value = { name: '</script><script>alert(1)</script>' };
  assert.ok(!jsonLd(value).includes('<'));
  assert.deepEqual(JSON.parse(jsonLd(value)), value);
});
