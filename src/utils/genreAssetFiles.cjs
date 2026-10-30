const catalog = require('./genreCatalog.cjs');

// A deterministic, filesystem-safe name for every genre, including punctuation.
function genreAssetPath(value) {
  const key = catalog.genreKey(value);
  return key ? `/genre-vinyl/v5/${Buffer.from(key).toString('base64url')}.png` : null;
}
module.exports = { genreAssetPath };
