const {editionKey}=require('./releaseEditions.cjs');
const { releasePath, slugify, decodeRouteSlug } = require('./releaseIdentity.cjs');
function matches(slug, rows) {
  const clean = decodeRouteSlug(slug).toLowerCase();
  const exact = rows.find(album => (album.id === slug || album.edition_member_ids?.includes(slug)) || releasePath(album)?.split('/').pop() === clean);
  if (exact) return { album: exact };
  const candidates = rows.filter(album => slugify(album.album_name, true) === clean);
  const legacy=candidates.filter((album,index)=>candidates.findIndex(other=>editionKey(other)===editionKey(album))===index);
  return legacy.length === 1 ? { album: legacy[0] } : { album: null, ambiguous: legacy.length > 1 };
}
async function resolvePublicRelease(slug, cached, loadFresh) {
  const current = matches(slug, cached);
  if (current.album || current.ambiguous) return { ...current, fresh: false };
  return { ...matches(slug, await loadFresh()), fresh: true };
}
module.exports = { resolvePublicRelease };
