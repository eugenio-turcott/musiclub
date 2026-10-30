const KEY = 'musiclub_advertising_v1';
const MAX_AGE = 180 * 24 * 60 * 60 * 1000;

function parsePreference(raw, now = Date.now()) {
  try {
    const value = JSON.parse(raw);
    if (!['accepted', 'rejected'].includes(value?.choice)) return 'unknown';
    if (!Number.isFinite(value.savedAt) || value.savedAt > now || now - value.savedAt >= MAX_AGE) return 'unknown';
    return value.choice;
  } catch { return 'unknown'; }
}

module.exports = { KEY, MAX_AGE, parsePreference };
