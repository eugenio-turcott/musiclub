const { slugify, artistCreditKey } = require('./releaseIdentity.cjs');

// Release groups may omit mastering annotations, but deluxe/live/plus are distinct.
function titleKey(title) {
  return slugify(String(title || '')
    .replace(/\s*[([](?:\d{4}\s+)?remaster(?:ed)?(?:\s+\d{4})?[)\]]/gi, '')
    .replace(/\s*[-–—]\s*(?:\d{4}\s+)?remaster(?:ed)?(?:\s+\d{4})?\s*$/gi, ''), true);
}

function formatArtistCredits(credits = []) {
  return credits.map(credit => typeof credit === 'string' ? (/^(?:\s*[,;&]+\s*|\s*and\s*)$/i.test(credit) ? '' : credit.trim()) : credit.name || credit.artist?.name || '').filter(Boolean).join(', ');
}

function releaseGroupMatches(artist, title, group) {
  if (!artist || !title || !group?.title || titleKey(title) !== titleKey(group.title)) return false;
  const credits = group['artist-credit'] || [];
  const credited = formatArtistCredits(credits);
  return Boolean(credited && artistCreditKey(artist) === artistCreditKey(credited));
}

module.exports = { titleKey, releaseGroupMatches, formatArtistCredits };
