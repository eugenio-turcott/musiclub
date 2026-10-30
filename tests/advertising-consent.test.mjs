import test from 'node:test';
import assert from 'node:assert/strict';
import consent from '../src/utils/advertisingConsent.cjs';

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
