// Offline preview/validation. Production XML is served by the cached Next routes.
const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');
const { buildSitemapGroups, sitemapXml, indexXml } = require('../src/utils/sitemapData.cjs');
const { slugify, getReleaseTypePrefix } = require('../src/utils/releaseIdentity.cjs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local'), quiet: true });
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });

async function rows(db, table, fields) {
  const result = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select(fields).order('id').range(from, from + 999);
    if (error) throw new Error(`No se pudo generar el sitemap (${table})`);
    result.push(...data);
    if (data.length < 1000) return result;
  }
}
async function generateSitemap() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } });
  const [albums, reviews] = await Promise.all([
    rows(db, 'albums', 'id,album_name,artist_name,release_type,created_at'), rows(db, 'public_reviews', 'id,album_id,created_at'),
  ]);
  const withStats = albums.map(a => ({ ...a, review_count: reviews.filter(r => r.album_id === a.id).length }));
  const groups = buildSitemapGroups(withStats, reviews);
  const output = path.resolve(__dirname, '../build/sitemaps');
  fs.mkdirSync(output, { recursive: true });
  for (const [section, entries] of Object.entries(groups)) fs.writeFileSync(path.join(output, `sitemap-${section}.xml`), sitemapXml(entries));
  fs.writeFileSync(path.join(output, 'sitemap.xml'), indexXml());
  const counts = Object.fromEntries(Object.entries(groups).map(([key, list]) => [key, list.length]));
  const totalUrls = Object.values(counts).reduce((a,b) => a+b,0);
  console.log('Vista previa de sitemaps validada:', { ...counts, totalUrls });
  return { ...counts, totalUrls };
}
if (require.main === module) generateSitemap().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { generateSitemap, slugify, getReleaseTypePrefix };
