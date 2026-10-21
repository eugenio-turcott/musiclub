const genreCatalog = require('./genreCatalog.cjs');
const genreRoutes = require('./genreRoutes.cjs');
const { slugify, releasePath } = require('./releaseIdentity.cjs');
const BASE = 'https://www.musiclub.org';
const CORE = ['/', '/catalogo', '/pool', '/leaderboard', '/reviews', '/portadas', '/playlists', '/gashapon', '/faq', '/sobre-musiclub', '/contacto', '/guias', '/guias/como-calificamos', '/guias/escribir-primera-resena', '/guias/descubrir-discos-en-comunidad', '/patch-notes', '/privacy', '/terms'];
function buildSitemapGroups(albums, reviews = []) {
  const reviewed = new Map(), catalog = new Map(), artists = new Map();
  for (const album of albums) {
    const pathname = releasePath(album);
    if (!pathname) continue;
    const dates = [album.created_at, ...reviews.filter(r => r.album_id === album.id).map(r => r.created_at)].filter(d => d && !Number.isNaN(Date.parse(d)));
    const lastmod = dates.length ? new Date(Math.max(...dates.map(Date.parse))).toISOString() : undefined;
    const entry = { loc: BASE + pathname, lastmod };
    if (album.review_count > 0) { reviewed.set(pathname, entry); catalog.delete(pathname); }

    const name = slugify(album.artist_name);
    if (name && album.review_count > 0) artists.set(name, { loc: `${BASE}/artista/${name}` });
  }
  for (const id of genreCatalog.genreCounts(albums.filter(album => album.review_count > 0)).keys()) { const path = genreRoutes.genrePath(id); catalog.set(path, {loc:BASE+path}); }
  return { core: CORE.map(p => ({ loc: BASE + p })), reviews: [...reviewed.values()], catalog: [...catalog.values()], artists: [...artists.values()] };
}
const escapeXml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function sitemapXml(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map(e => `<url><loc>${escapeXml(e.loc)}</loc>${e.lastmod ? `<lastmod>${escapeXml(e.lastmod)}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>`;
}
function indexXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['core','reviews','catalog','artists'].map(k => `<sitemap><loc>${BASE}/sitemap-${k}.xml</loc></sitemap>`).join('')}</sitemapindex>`;
}
module.exports = { buildSitemapGroups, sitemapXml, indexXml };
