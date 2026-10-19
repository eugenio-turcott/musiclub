const genres = require('./genreCatalog.cjs');
const artwork = require('../data/genreArtwork.json');
const editions = require('./vinylEditions.cjs');
const { genreFamily, uniqueGenreMotif } = require('./genreFamilies.cjs');

function genreArtwork(raw) {
  const key = genres.genreKey(raw), family = genreFamily(raw);
  const fallback = family.startsWith('genre:') ? `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#171433"/><g fill="none" stroke="#F57FA2" stroke-width="3" stroke-linejoin="round">${uniqueGenreMotif(family)}</g></svg>`)}` : `/genres/families/${family}.svg`;
  return { family, src: artwork[key] || fallback, name: genres.normalizeGenres([raw])[0] || 'Música' };
}
function genreRevealArtwork(raw, edition) {
  const visual = genreArtwork(raw);
  const pressing = edition == null ? editions.defaultEdition(genres.genreKey(raw) || raw) : editions.vinylEdition(edition);
  return { ...visual, ...pressing, center: genres.genreKey(raw) ? '/genres/symbols/v1/'+encodeURIComponent(genres.genreKey(raw))+'.svg' : visual.src };
}
module.exports = { genreRevealArtwork, genreFamily, genreArtwork, uniqueGenreMotif };
