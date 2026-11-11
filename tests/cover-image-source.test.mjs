import test from 'node:test';
import assert from 'node:assert/strict';
import sources from '../src/utils/coverImageSource.cjs';

test('failed responsive artwork retries the stored URL without stale candidates', () => {
  const original = 'https://cdn.rcrd.club/releases/release/artwork.webp?v=46339313240&width=500';
  const first = sources.coverImageSource(original);
  assert.match(first.srcSet, /240w, .*480w, .*720w/);
  assert.equal(new URL(first.src).searchParams.get('v'), '46339313240');
  const retry = sources.coverImageSource(original, 1);
  assert.equal(retry.src, original);
  assert.equal(retry.srcSet, undefined);
  assert.equal(retry.optimized, false);
  assert.deepEqual(sources.coverImageSource(original, 2), { fallback: true });
});

test('image proxy failures retry the original provider before the local fallback', () => {
  for (const original of ['https://i.scdn.co/image/cover', 'https://example.supabase.co/storage/v1/object/public/covers/release.jpg', '/musiclub_logo.png']) {
    assert.equal(sources.coverImageSource(original).optimized, true);
    assert.deepEqual(sources.coverImageSource(original, 1), { src: original, optimized: false });
    assert.deepEqual(sources.coverImageSource(original, 2), { fallback: true });
  }
});

test('missing artwork uses a fallback immediately; a new source starts with its own candidates', () => {
  for (const value of [null, undefined, '', '   ']) assert.deepEqual(sources.coverImageSource(value), { fallback: true });
  assert.deepEqual(sources.coverImageSource('https://cdn.rcrd.club/releases/old.webp', 2), { fallback: true });
  assert.match(sources.coverImageSource('https://cdn.rcrd.club/releases/new.webp').src, /new\.webp/);
  assert.equal(sources.coverImageSource('https://other.example/cover.jpg').optimized, false);
});

test('Spotify covers use existing responsive CDN sizes while failures retain the exact original URL',()=>{
 const original='https://i.scdn.co/image/ab67616d0000b2731234567890abcdef';
 const image=sources.coverImageSource(original);
 assert.match(image.src,/ab67616d00001e02/);assert.match(image.srcSet,/64w, .*300w, .*640w/);assert.equal(image.optimized,false);
 assert.deepEqual(sources.coverImageSource(original,1),{src:original,optimized:false});
 assert.equal(sources.coverImageSource('https://i.scdn.co/image/artist-photo').srcSet,undefined);
});
