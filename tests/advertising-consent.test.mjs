import test from 'node:test';
import assert from 'node:assert/strict';
import consent from '../src/utils/advertisingConsent.cjs';
import policy from '../src/utils/advertisingPolicy.cjs';

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
