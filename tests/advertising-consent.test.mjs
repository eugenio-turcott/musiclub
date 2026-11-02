import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import consent from '../src/utils/advertisingConsent.cjs';
import policy from '../src/utils/advertisingPolicy.cjs';
import placements from '../src/utils/adsterraPlacements.cjs';

const now = Date.UTC(2026, 9, 30);
test('advertising requires a current explicit choice, never a missing or malformed value', () => {
  for (const value of [null, '', 'true', '{', JSON.stringify({choice:'accepted'}), JSON.stringify({choice:'anything',savedAt:now})]) {
    assert.equal(consent.parsePreference(value, now), 'unknown');
  }
});
test('both acceptance and rejection remain valid within the retention period', () => {
  for (const choice of ['accepted', 'rejected']) {
    assert.equal(consent.parsePreference(JSON.stringify({choice,savedAt:now-1000}), now), choice);
  }
});
test('expired or future-dated advertising preferences never authorize a script', () => {
  for (const savedAt of [now-consent.MAX_AGE, now-consent.MAX_AGE-1, now+1, 'yesterday']) {
    assert.equal(consent.parsePreference(JSON.stringify({choice:'accepted',savedAt}), now), 'unknown');
  }
});

test('automatic delivery is restricted to the reviewed country and never inferred from a locale', () => {
  assert.equal(policy.advertisingMode('MX'),'automatic');
  for(const country of [null,undefined,'','XX','T1','ES','GB','CH','US','BR','es-MX']) assert.equal(policy.advertisingMode(country),'consent');
});

test('a regional default never overrides rejection or a browser privacy signal', () => {
  assert.equal(policy.mayLoadAdvertising('unknown','automatic'),true);
  assert.equal(policy.mayLoadAdvertising('unknown','consent'),false);
  assert.equal(policy.mayLoadAdvertising('accepted','consent'),true);
  assert.equal(policy.mayLoadAdvertising('accepted','pending'),false);
  assert.equal(policy.mayLoadAdvertising('rejected','automatic'),false);
  assert.equal(policy.mayLoadAdvertising('accepted','automatic',true),false);
});

test('ad placements cover public content without enabling private, legal or error pages', () => {
  for(const path of ['/','/catalogo','/reviews','/leaderboard','/albumes/azul','/artista/the-weeknd','/generos/pop','/portadas','/guias/como-resenar']) assert.equal(policy.publicAdvertisingPath(path),true,path);
  for(const path of ['/settings','/profile','/admin','/pool','/gashapon','/privacy','/terms','/contacto','/redes','/api/advertising/policy','/404']) assert.equal(policy.publicAdvertisingPath(path),false,path);
});

test('Adsterra selects only fitting official sizes and keeps vertical ads off small screens',()=>{
  for(const [width,expected] of [[280,null],[300,300],[320,320],[467,320],[468,468],[727,468],[728,728],[1440,728]]) {
    assert.equal(placements.horizontalBanner(width)?.width??null,expected);
  }
  assert.equal(placements.verticalBanner(999,1000),null);
  assert.equal(placements.verticalBanner(1000,800).height,300);
  assert.equal(placements.verticalBanner(1200,900).height,600);
  assert.equal(Object.keys(placements.BANNERS).length,6);
  const ids=Object.values(placements.BANNERS).map(value=>value.id).concat(placements.NATIVE.id);
  assert.equal(new Set(ids).size,7);
  assert.ok(!ids.includes('31067203') && !ids.includes('31067205') && !ids.includes('31067206'));
  for(const banner of Object.values(placements.BANNERS)) {
    assert.match(placements.bannerDocument(banner),new RegExp(`https://bicea.org/22/${banner.key}`));
  }
  assert.throws(()=>placements.bannerDocument({key:'untrusted'}),/Unknown/);
});

test('Adsterra can consume and delete its configuration in strict mode',()=>{
  for(const banner of Object.values(placements.BANNERS)) {
    const bootstrap=placements.bannerDocument(banner).match(/<script>([\s\S]*?)<\/script>/)[1];
    const context=vm.createContext({});
    vm.runInContext('window=globalThis',context);
    vm.runInContext(bootstrap,context);
    assert.equal(context.atOptions.key,banner.key);
    // The real vendor script deletes this property before rendering the ad.
    assert.equal(vm.runInContext('"use strict"; delete window.atOptions',context),true);
    assert.equal(context.atOptions,undefined);
  }
});

test('banner origin is separate from Musiclub and exposes only fixed public documents',async()=>{
  const src=placements.bannerSource('https://www.musiclub.org','32055938');
  assert.equal(new URL(src).origin,'https://ads.musiclub.org');
  assert.equal(placements.bannerSource('http://127.0.0.1:3101','32055938'),'http://ads.localhost:3101/api/advertising/banner/32055938');
  const valid=placements.advertisingHostResponse(new Request(src));
  assert.equal(valid.status,policy.ADVERTISING_ENABLED ? 200 : 404);
  assert.equal(valid.headers.get('content-security-policy'),'frame-ancestors https://www.musiclub.org');
  assert.equal(valid.headers.get('set-cookie'),null);
  if (policy.ADVERTISING_ENABLED) assert.match(await valid.text(),/window.atOptions=/);
  else assert.doesNotMatch(await valid.text(),/script|iframe|atOptions/i);
  for(const path of ['/','/profile','/api/reviews','/api/advertising/policy','/api/advertising/banner/31067203']) {
    assert.equal(placements.advertisingHostResponse(new Request(`https://ads.musiclub.org${path}`)).status,404);
  }
  assert.equal(placements.advertisingHostResponse(new Request(src,{method:'POST',body:'x'})).status,404);
});
