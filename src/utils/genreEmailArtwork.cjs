const catalog = require('./genreCatalog.cjs');
const editions = require('./vinylEditions.cjs');
const { vinylDiscSvg } = require('./vinylDisc.cjs');
const { genreSymbol } = require('./genreSymbols.cjs');

function genreEmailSvg(raw) {
  const key = catalog.genreKey(raw);
  if (!key) return null;
  const symbol = genreSymbol(key).svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return vinylDiscSvg(editions.defaultEdition(key)).replace('</svg>', `<svg x="82" y="82" width="156" height="156" viewBox="0 0 100 100">${symbol}</svg></svg>`);
}
module.exports = { genreEmailSvg };
