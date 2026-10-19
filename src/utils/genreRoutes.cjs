const catalog = require('./genreCatalog.cjs');
const slugForId = id => id.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
const bySlug = new Map(catalog.GENRES.map(genre => [slugForId(genre.id), genre]));
function genreSlug(raw) { const id = catalog.genreKey(raw); return id ? slugForId(id) : null; }
function genrePath(raw) { const slug = genreSlug(raw); return slug ? '/generos/' + encodeURIComponent(slug) : null; }
function findGenreBySlug(slug) { return bySlug.get(String(slug).normalize('NFC').toLowerCase()) || null; }
module.exports = { genreSlug, genrePath, findGenreBySlug };
