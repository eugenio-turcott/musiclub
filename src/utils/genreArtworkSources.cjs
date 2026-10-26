const genres = require('./genreCatalog.cjs');
const pressings = require('./vinylPressings.cjs');

// Colors and motifs are immutable SVG assets generated on the server. The browser
// only needs their URLs, not the full symbol library or every genre's palette.
function genreArtworkSources(raw, edition) {
 const key = genres.genreKey(raw);
 const pressing = edition == null && key ? {id:`genre:${key}`,disc:'/genres/colors/v1/'+encodeURIComponent(key)+'.svg'} : pressings.vinylEdition(edition ?? 0);
 return { id:pressing.id,disc:pressing.disc,center:key ? '/genres/symbols/v4/'+encodeURIComponent(key)+'.svg' : '/musiclub_logo_corchea.png' };
}
module.exports = { genreArtworkSources };
