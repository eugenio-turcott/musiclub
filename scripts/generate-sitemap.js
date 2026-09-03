// scripts/generate-sitemap.js
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { POPULAR_ALBUMS } = require('./popularMusicData');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://nzsuxrycbywbdyidvsfl.supabase.co';
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'sb_publishable_8CYM-sB7DY1_cyw8Amyr9g_-JtuZEKO';
const BASE_URL = 'https://musiclub.org';
const MAX_URLS_PER_SITEMAP = 45000;

function slugify(text) {
  if (!text) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getReleaseTypePrefix(rawType) {
  if (!rawType) return 'albumes';
  const normalized = rawType.toString().trim().toUpperCase();

  if (
    normalized === 'EP' ||
    normalized.includes('EP') ||
    normalized.includes('MINI')
  ) {
    return 'eps';
  }

  if (
    normalized === 'SINGLE' ||
    normalized === 'SENCILLO' ||
    normalized.includes('SINGLE') ||
    normalized.includes('SENCILLO') ||
    normalized.includes('CANCIÓN') ||
    normalized.includes('CANCION') ||
    normalized.includes('TRACK')
  ) {
    return 'sencillos';
  }

  if (
    normalized === 'COMPILATION' ||
    normalized === 'COMPILACION' ||
    normalized.includes('COMPILATION') ||
    normalized.includes('COMPILACION') ||
    normalized.includes('GREATEST') ||
    normalized.includes('HITS') ||
    normalized.includes('RECOPILATORIO')
  ) {
    return 'compilaciones';
  }

  if (
    normalized === 'REMIX' ||
    normalized.includes('REMIX') ||
    normalized.includes('REMIXES')
  ) {
    return 'remixes';
  }

  return 'albumes';
}

function buildXmlUrlset(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString().split('T')[0]}</lastmod>` : ''}
    <changefreq>${u.changefreq || 'weekly'}</changefreq>
    <priority>${u.priority || '0.5'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;
}

function buildXmlSitemapIndex(sitemaps) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    (s) => `  <sitemap>
    <loc>${s.loc}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`
  )
  .join('\n')}
</sitemapindex>`;
}

async function generateSitemap() {
  console.log('🗺️ Generando sitemap.xml actualizado...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Paginación exhaustiva para consultar TODOS los álbumes de Supabase (superando el límite de 1000)
  const allAlbums = [];
  const step = 1000;
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data: pageAlbums, error } = await supabase
      .from('albums')
      .select('album_name, artist_name, release_type, created_at')
      .order('created_at', { ascending: false })
      .range(from, from + step - 1);

    if (error) {
      console.warn('⚠️ Error consultando lote de álbumes para sitemap:', error.message);
      break;
    }

    if (!pageAlbums || pageAlbums.length === 0) {
      hasMore = false;
    } else {
      allAlbums.push(...pageAlbums);
      if (pageAlbums.length < step) {
        hasMore = false;
      } else {
        from += step;
      }
    }
  }

  console.log(`📦 Consultados ${allAlbums.length} lanzamientos de la base de datos.`);

  const staticRoutes = [
    { loc: `${BASE_URL}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${BASE_URL}/catalogo`, priority: '0.9', changefreq: 'daily' },
    { loc: `${BASE_URL}/pool`, priority: '0.85', changefreq: 'daily' },
    { loc: `${BASE_URL}/leaderboard`, priority: '0.8', changefreq: 'daily' },
    { loc: `${BASE_URL}/reviews`, priority: '0.8', changefreq: 'daily' },
    { loc: `${BASE_URL}/recomendaciones`, priority: '0.7', changefreq: 'weekly' },
    { loc: `${BASE_URL}/gashapon`, priority: '0.6', changefreq: 'weekly' },
    { loc: `${BASE_URL}/faq`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${BASE_URL}/patch-notes`, priority: '0.4', changefreq: 'weekly' },
    { loc: `${BASE_URL}/privacy`, priority: '0.3', changefreq: 'monthly' },
    { loc: `${BASE_URL}/terms`, priority: '0.3', changefreq: 'monthly' },
  ];

  const releaseMap = new Map();
  const artistSet = new Set();

  // 2. Álbumes y releases existentes en la Base de Datos de Supabase
  allAlbums.forEach((alb) => {
    const albumName = alb.album_name;
    const artistName = alb.artist_name;
    const prefix = getReleaseTypePrefix(alb.release_type);

    if (albumName) {
      const slug = slugify(albumName);
      if (slug && !releaseMap.has(slug)) {
        releaseMap.set(slug, {
          loc: `${BASE_URL}/${prefix}/${slug}`,
          lastmod: alb.created_at || new Date().toISOString(),
          priority: '0.8',
          changefreq: 'weekly',
        });
      }
    }
    if (artistName) {
      artistSet.add(artistName);
    }
  });

  // 3. Curaduría de álbumes populares para Programmatic SEO On-Demand
  (POPULAR_ALBUMS || []).forEach((item) => {
    if (item.album) {
      const slug = slugify(item.album);
      if (slug && !releaseMap.has(slug)) {
        const prefix = getReleaseTypePrefix(item.release_type);
        releaseMap.set(slug, {
          loc: `${BASE_URL}/${prefix}/${slug}`,
          lastmod: new Date().toISOString(),
          priority: '0.75',
          changefreq: 'weekly',
        });
      }
    }
    if (item.artist) {
      artistSet.add(item.artist);
    }
  });

  const releaseRoutes = Array.from(releaseMap.values());
  const artistRoutes = Array.from(artistSet).map((art) => ({
    loc: `${BASE_URL}/artista/${slugify(art)}`,
    lastmod: new Date().toISOString(),
    priority: '0.7',
    changefreq: 'weekly',
  }));

  const allUrls = [...staticRoutes, ...releaseRoutes, ...artistRoutes];
  const publicDir = path.join(__dirname, '..', 'public');

  // 4. Escribir archivo de Sitemap cumpliendo con los estándares de Google
  if (allUrls.length <= MAX_URLS_PER_SITEMAP) {
    const xml = buildXmlUrlset(allUrls);
    const mainSitemapPath = path.join(publicDir, 'sitemap.xml');
    fs.writeFileSync(mainSitemapPath, xml, 'utf8');
    console.log(`✅ sitemap.xml generado con éxito: ${allUrls.length} URLs totales indexables en ${mainSitemapPath}`);
  } else {
    // Si supera 45,000 URLs, particionar según estándar oficial de Google
    const numParts = Math.ceil(allUrls.length / MAX_URLS_PER_SITEMAP);
    const sitemapsIndexList = [];

    for (let part = 0; part < numParts; part++) {
      const chunkUrls = allUrls.slice(part * MAX_URLS_PER_SITEMAP, (part + 1) * MAX_URLS_PER_SITEMAP);
      const partFileName = `sitemap-${part + 1}.xml`;
      const partXml = buildXmlUrlset(chunkUrls);
      fs.writeFileSync(path.join(publicDir, partFileName), partXml, 'utf8');
      sitemapsIndexList.push({ loc: `${BASE_URL}/${partFileName}` });
    }

    const indexXml = buildXmlSitemapIndex(sitemapsIndexList);
    const mainSitemapPath = path.join(publicDir, 'sitemap.xml');
    fs.writeFileSync(mainSitemapPath, indexXml, 'utf8');
    console.log(`✅ sitemap.xml (Index) generado con ${numParts} partes particionadas para ${allUrls.length} URLs.`);
  }

  return allUrls.length;
}

if (require.main === module) {
  generateSitemap().catch(console.error);
}

module.exports = { generateSitemap, slugify, getReleaseTypePrefix };
