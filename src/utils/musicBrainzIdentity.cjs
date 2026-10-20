const { slugify } = require('./releaseIdentity.cjs');

// Release groups may omit mastering annotations, but deluxe/live/plus are distinct.
function titleKey(title) {
  return slugify(String(title || '')
    .replace(/\s*[([](?:\d{4}\s+)?remaster(?:ed)?(?:\s+\d{4})?[)\]]/gi, '')
    .replace(/\s*[-–—]\s*(?:\d{4}\s+)?remaster(?:ed)?(?:\s+\d{4})?\s*$/gi, ''), true);
}

function releaseGroupMatches(artist, title, group) {
  if (!artist || !title || !group?.title || titleKey(title) !== titleKey(group.title)) return false;
  const credits = group['artist-credit'] || [];
  const credited = credits.map(credit => typeof credit === 'string' ? credit : (credit.name || credit.artist?.name || '') + (credit.joinphrase || '')).join('');
  return Boolean(credited && slugify(artist) === slugify(credited));
}

module.exports = { titleKey, releaseGroupMatches };
