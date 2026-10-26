const editions = require('./vinylEditions.cjs');
const discs = require('./vinylDisc.cjs');
const symbols = require('./genreSymbols.cjs');
function genreBadgeSvg(key) {
 const disc = discs.vinylDiscSvg(editions.defaultEdition(key));
 const symbol = symbols.genreSymbol(key).svg;
 const viewBox = symbol.match(/viewBox="([^"]+)"/)[1];
 const inner = svg => svg.replace(/^<svg\b[^>]*>/,'').replace(/<\/svg>\s*$/,'');
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">${inner(disc)}<svg x="82" y="82" width="156" height="156" viewBox="${viewBox}">${inner(symbol)}</svg></svg>`;
}
module.exports = { genreBadgeSvg };
