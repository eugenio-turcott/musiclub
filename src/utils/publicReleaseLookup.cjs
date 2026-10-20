const { releasePath, slugify, decodeRouteSlug } = require('./releaseIdentity.cjs');
function matches(slug, rows) {
  const clean = decodeRouteSlug(slug).toLowerCase();
  const exact = rows.find(album => album.id === slug || releasePath(album)?.split('/').pop() === clean);
  if (exact) return { album: exact };
  const legacy = rows.filter(album => slugify(album.album_name, true) === clean);
  return legacy.length === 1 ? { album: legacy[0] } : { album: null, ambiguous: legacy.length > 1 };
}
async function resolvePublicRelease(slug, cached, loadFresh) {
  const current = matches(slug, cached);
  if (current.album || current.ambiguous) return { ...current, fresh: false };
  return { ...matches(slug, await loadFresh()), fresh: true };
}
module.exports = { resolvePublicRelease };
