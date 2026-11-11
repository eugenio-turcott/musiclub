const catalog = require('./genreCatalog.cjs');

// A deterministic, filesystem-safe name for every genre, including punctuation.
function genreAssetPath(value) {
  const key = catalog.genreKey(value);
  const encoded = key && btoa(String.fromCharCode(...new TextEncoder().encode(key))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/, '');
  return key ? `/genre-vinyl/v6/${encoded}.png` : null;
}
function genreSvgAssetPath(value) {
  return genreAssetPath(value)?.replace(/\.png$/, '.svg') || null;
}
module.exports = { genreAssetPath, genreSvgAssetPath };
