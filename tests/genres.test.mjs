import test from 'node:test';
import assert from 'node:assert/strict';
import routes from '../src/utils/genreRoutes.cjs';
import sitemap from '../src/utils/sitemapData.cjs';
import visuals from '../src/utils/genreVisuals.cjs';
import fs from 'node:fs';
import genres from '../src/utils/genreCatalog.cjs';
import { normalizeCanonicalGenres } from '../src/utils/genreNormalizer.js';
import { planReleaseGenres } from '../scripts/lib/release-genres.mjs';

test('genre normalization preserves specific styles and consolidates spelling and languages', () => {
  assert.deepEqual(normalizeCanonicalGenres(['hip-hop', 'Hip Hop', 'Rap', 'Black Metal', 'death metal', 'Metal Alternativo']), ['Hip-Hop', 'Black Metal', 'Death Metal', 'Metal Alternativo']);
  assert.deepEqual(normalizeCanonicalGenres(['Techno/House', '5+ wochen', 'Q12345', 'df2bacfa-8f55-4ffc-9323-fbee21698b59', {name:'qawwali'}]), ['Techno', 'House', 'Qawwali']);
  assert.deepEqual(normalizeCanonicalGenres([]), []);
  assert.equal(genres.genreKey('Electrónica'), 'electronic');
  assert.equal(genres.genreKey('electronica'), 'electronica');
});
test('migration checks identity and refuses an unresolved release before writing', () => {
  const row = { id: '1', album_name: 'Album', artist_name: 'Artist', genres: [] };
  assert.throws(() => planReleaseGenres([row], []), /Missing verified genre/);
  assert.throws(() => planReleaseGenres([row], [{...row, album_name:'Other', genres:['Jazz']}]), /identity changed/);
  const [plan] = planReleaseGenres([row], [{...row, genres:['Jazz','unknown123']}]);
  assert.deepEqual(plan.genres,['Jazz']);
  assert.equal(plan.changed,true);
  assert.equal(planReleaseGenres([{...row, genres:['Jazz']}],[])[0].changed,false);
});
test('every registered genre has a stable unique capsule and a readable label', () => {
  assert.ok(genres.GENRES.length >= 2215);
  const ids = new Set();
  for (const genre of genres.GENRES) {
    assert.equal(genres.genreKey(genre.id), genre.id);
    const capsule = genres.genreCapsule(genre.id);
    assert.deepEqual(capsule, genres.genreCapsule(genre.name));
    assert.equal(capsule.genre, genre.id);
    assert.ok(!ids.has(capsule.id)); ids.add(capsule.id);
    assert.ok(capsule.badge.length > 1);
  }
});
test('a genre filter never draws another genre and never substitutes an empty genre', () => {
  const albums = [{id:'a',genres:['Rock','Indie Rock']},{id:'b',genres:['Jazz']},{id:'c',genres:['rock']},{id:'d',genres:[]}];
  for (let index=0; index<100; index++) {
    const draw = genres.drawGenreCapsule(albums,'Rock',()=>index/100);
    assert.ok(['a','c'].includes(draw.album.id));
    assert.equal(draw.theme.genre,'rock');
    assert.ok(genres.albumGenreKeys(draw.album).includes(draw.theme.genre));
  }
  assert.equal(genres.drawGenreCapsule(albums,'qawwali'),null);
  assert.equal(genres.drawGenreCapsule([{id:'empty',genres:[]}]),null);
  for (let index=0;index<100;index++) {
    const draw=genres.drawGenreCapsule(albums,'all',()=>index/100);
    assert.ok(genres.albumGenreKeys(draw.album).includes(draw.theme.genre));
  }
});


test('genre pages preserve every identity, aliases and accents without URL collisions', () => {
  const paths = new Set();
  for (const genre of genres.GENRES) {
    const slug = routes.genreSlug(genre.id);
    assert.equal(routes.findGenreBySlug(slug)?.id, genre.id);
    assert.ok(!paths.has(routes.genrePath(genre.id)), genre.id);
    paths.add(routes.genrePath(genre.id));
  }
  assert.equal(routes.genrePath('Rap'), routes.genrePath('Hip-Hop'));
  assert.notEqual(routes.genrePath('kaseko'), routes.genrePath('kasékò'));
  assert.equal(routes.findGenreBySlug('not-a-musical-genre'), null);
  const xml = sitemap.sitemapXml(sitemap.buildSitemapGroups([{id:'x',artist_name:'A',album_name:'B',genres:['Rock','rock','Pop']}]).catalog);
  assert.equal((xml.match(/\/generos\/rock</g) || []).length,1);
  assert.ok(!xml.includes('/generos/jazz'));
});

test('genre symbols repeat only inside the same musical family', () => {
  const seen = new Map(), cache = new Map();
  for (const genre of genres.GENRES) {
    const {src,family} = visuals.genreArtwork(genre.id);
    let symbol = src;
    if (!src.startsWith('data:')) {
      if (!cache.has(src)) cache.set(src, fs.readFileSync(new URL('../public'+src, import.meta.url),'utf8'));
      symbol = cache.get(src).match(/translate\(110 104\)[^>]*>(.*?)<\/g>/)?.[1];
      assert.ok(symbol, genre.id);
    }
    if (seen.has(symbol)) assert.equal(seen.get(symbol),family,genre.id);
    seen.set(symbol,family);
  }
});


test('every genre reveal has a separate center without an embedded outer record', () => {
  const checked = new Set();
  for (const genre of genres.GENRES) {
    const art = visuals.genreRevealArtwork(genre.id);
    assert.equal(art.disc, '/genres/reveal/disc.svg');
    if (art.center.startsWith('data:') || checked.has(art.center)) continue;
    const svg = fs.readFileSync(new URL('../public'+art.center, import.meta.url),'utf8');
    assert.match(svg,/viewBox="0 0 100 100"/);
    assert.ok(!svg.includes('clipPath'),genre.id);
    assert.notEqual(art.center, art.src);
    checked.add(art.center);
  }
  assert.ok(checked.size >= 81);
});
