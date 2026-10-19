import test from 'node:test';
import assert from 'node:assert/strict';
import presentation from '../src/utils/poolPresentation.cjs';
import visuals from '../src/utils/genreVisuals.cjs';

test('Pool capacity counts every accepted release and does not reopen after graduation', () => {
  assert.deepEqual(presentation.poolCapacity({max_releases:13},12),{limit:13,used:12,remaining:1,full:false});
  assert.equal(presentation.poolCapacity({max_releases:13},13).full,true);
  assert.equal(presentation.poolCapacity({max_releases:13},15).remaining,0);
  assert.equal(presentation.poolCapacity({max_releases:null},50).full,false);
});
test('a solid Pool and a gradient Pool preserve their selected colors', () => {
  assert.equal(presentation.poolBackground({mode:'solid',colorA:'#990011'}),'#990011');
  assert.equal(presentation.poolBackground({colorA:'#990011',colorB:'#220044'}),'linear-gradient(135deg, #990011, #220044)');
});
test('Pool presentation rejects executable URLs, CSS injection and arbitrary vinyl assets', () => {
  for(const mediaUrl of ['javascript:alert(1)','data:text/html,<script>x</script>','http://example.com/a.gif']) assert.equal(presentation.poolAppearance({mediaUrl}).mediaUrl,'');
  const result=presentation.poolAppearance({colorA:'red);url(x)',vinyl:'<svg>',logo:'https://other.test/logo.svg'});
  assert.equal(result.colorA,presentation.DEFAULT_APPEARANCE.colorA);
  assert.equal(result.vinyl,'brand');
  assert.equal(result.logo,presentation.DEFAULT_APPEARANCE.logo);
  assert.equal(presentation.poolAppearance(null).heading,'');
});
test('GIFs can be attached by HTTPS and headings stay bounded', () => {
  assert.equal(presentation.poolAppearance({mediaUrl:'https://example.com/pool.gif'}).mediaUrl,'https://example.com/pool.gif');
  assert.equal(presentation.poolAppearance({heading:'a'.repeat(200)}).heading.length,100);
});
test('the primary release genre resolves to the established capsule icon', () => {
  const genres=['Atmospheric Black Metal','Pop'];
  const art=visuals.genreRevealArtwork(genres[0]);
  assert.match(decodeURIComponent(art.center),/atmospheric black metal/);
  assert.notEqual(art.center,visuals.genreRevealArtwork(genres[1]).center);
});
