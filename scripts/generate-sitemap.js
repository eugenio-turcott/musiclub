// scripts/generate-sitemap.js
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { POPULAR_ALBUMS } = require('./popularMusicData');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Polyfill de WebSocket para entornos Node < 22 (evita errores en @supabase/realtime-js)
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class DummyWebSocket {
    constructor() {}
    addEventListener() {}
    removeEventListener() {}
    send() {}
    close() {}
  };
}

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://nzsuxrycbywbdyidvsfl.supabase.co';
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'sb_publishable_8CYM-sB7DY1_cyw8Amyr9g_-JtuZEKO';
const BASE_URL = 'https://www.musiclub.org';
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

function formatDate(dateVal) {
  try {
    if (!dateVal) return new Date().toISOString().split('T')[0];
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0];
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
}

function buildXmlUrlset(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${formatDate(u.lastmod)}</lastmod>
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
    <lastmod>${formatDate(s.lastmod)}</lastmod>
  </sitemap>`
  )
  .join('\n')}
</sitemapindex>`;
}

async function generateSitemap() {
  console.log('🗺️ Generando arquitectura modular de Sitemaps...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const today = new Date().toISOString();

  // 1. Consultar reseñas comunitarias para identificar álbumes con valor y opiniones reales
  const reviewMap = new Map();
  try {
    const { data: reviewsData, error: revError } = await supabase
      .from('reviews')
      .select('album_id, created_at');

    if (!revError && Array.isArray(reviewsData)) {
      reviewsData.forEach((r) => {
        if (r.album_id) {
          const prev = reviewMap.get(r.album_id);
          if (!prev || new Date(r.created_at) > new Date(prev)) {
            reviewMap.set(r.album_id, r.created_at);
          }
        }
      });
    }
  } catch (err) {
    console.warn('⚠️ Error consultando reseñas para sitemap:', err.message);
  }
  console.log(`⭐ Identificados ${reviewMap.size} álbumes con reseñas y opiniones de la comunidad.`);

  // 2. Consultar candidatos y ganadores del Pool
  const featuredPoolSet = new Set();
  try {
    const { data: poolData, error: poolError } = await supabase
      .from('pool_entries')
      .select('album_id, status');

    if (!poolError && Array.isArray(poolData)) {
      poolData.forEach((p) => {
        if (p.album_id && (p.status === 'winner' || p.status === 'graduated')) {
          featuredPoolSet.add(p.album_id);
        }
      });
    }
  } catch (err) {
    console.warn('⚠️ Error consultando pool para sitemap:', err.message);
  }

  // 3. Paginación exhaustiva para consultar TODOS los álbumes de Supabase (superando límite de 1000)
  const allAlbums = [];
  const step = 1000;
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data: pageAlbums, error } = await supabase
      .from('albums')
      .select('id, album_name, artist_name, release_type, created_at')
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

  console.log(`📦 Consultados ${allAlbums.length} lanzamientos totales de la base de datos.`);

  // 4. Rutas estáticas clave (Core)
  const coreRoutes = [
    { loc: `${BASE_URL}/`, priority: '1.0', changefreq: 'daily', lastmod: today },
    { loc: `${BASE_URL}/catalogo`, priority: '0.9', changefreq: 'daily', lastmod: today },
    { loc: `${BASE_URL}/pool`, priority: '0.85', changefreq: 'daily', lastmod: today },
    { loc: `${BASE_URL}/leaderboard`, priority: '0.85', changefreq: 'daily', lastmod: today },
    { loc: `${BASE_URL}/reviews`, priority: '0.85', changefreq: 'daily', lastmod: today },
    { loc: `${BASE_URL}/portadas`, priority: '0.8', changefreq: 'weekly', lastmod: today },
    { loc: `${BASE_URL}/playlists`, priority: '0.75', changefreq: 'weekly', lastmod: today },
    { loc: `${BASE_URL}/recomendaciones`, priority: '0.75', changefreq: 'weekly', lastmod: today },
    { loc: `${BASE_URL}/gashapon`, priority: '0.65', changefreq: 'weekly', lastmod: today },
    { loc: `${BASE_URL}/faq`, priority: '0.5', changefreq: 'monthly', lastmod: today },
    { loc: `${BASE_URL}/patch-notes`, priority: '0.5', changefreq: 'weekly', lastmod: today },
    { loc: `${BASE_URL}/privacy`, priority: '0.3', changefreq: 'monthly', lastmod: today },
    { loc: `${BASE_URL}/terms`, priority: '0.3', changefreq: 'monthly', lastmod: today },
  ];

  // 5. Separación inteligente de lanzamientos (Con reseñas vs Catálogo general)
  const reviewedReleasesMap = new Map();
  const catalogReleasesMap = new Map();
  const artistSet = new Set();

  allAlbums.forEach((alb) => {
    const albumName = alb.album_name;
    const artistName = alb.artist_name;
    const prefix = getReleaseTypePrefix(alb.release_type);

    if (albumName) {
      const slug = slugify(albumName);
      if (slug) {
        const hasReviews = reviewMap.has(alb.id) || featuredPoolSet.has(alb.id);
        const lastModDate = reviewMap.get(alb.id) || alb.created_at || today;

        if (hasReviews) {
          if (!reviewedReleasesMap.has(slug)) {
            reviewedReleasesMap.set(slug, {
              loc: `${BASE_URL}/${prefix}/${slug}`,
              lastmod: lastModDate,
              priority: '0.9',
              changefreq: 'weekly',
            });
          }
        } else {
          if (!catalogReleasesMap.has(slug) && !reviewedReleasesMap.has(slug)) {
            catalogReleasesMap.set(slug, {
              loc: `${BASE_URL}/${prefix}/${slug}`,
              lastmod: alb.created_at || today,
              priority: '0.6',
              changefreq: 'monthly',
            });
          }
        }
      }
    }

    if (artistName) {
      artistSet.add(artistName);
    }
  });

  // Integrar curaduría de álbumes populares para SEO programático
  (POPULAR_ALBUMS || []).forEach((item) => {
    if (item.album) {
      const slug = slugify(item.album);
      if (slug && !reviewedReleasesMap.has(slug) && !catalogReleasesMap.has(slug)) {
        const prefix = getReleaseTypePrefix(item.release_type);
        catalogReleasesMap.set(slug, {
          loc: `${BASE_URL}/${prefix}/${slug}`,
          lastmod: today,
          priority: '0.6',
          changefreq: 'monthly',
        });
      }
    }
    if (item.artist) {
      artistSet.add(item.artist);
    }
  });

  const reviewedRoutes = Array.from(reviewedReleasesMap.values());
  const catalogRoutes = Array.from(catalogReleasesMap.values());
  const artistRoutes = Array.from(artistSet).map((art) => ({
    loc: `${BASE_URL}/artista/${slugify(art)}`,
    lastmod: today,
    priority: '0.5',
    changefreq: 'monthly',
  }));

  const publicDir = path.join(__dirname, '..', 'public');

  // 6. Escribir los 4 sub-sitemaps modulares
  // Sub-sitemap 1: Páginas Principales (Core)
  const coreXml = buildXmlUrlset(coreRoutes);
  fs.writeFileSync(path.join(publicDir, 'sitemap-core.xml'), coreXml, 'utf8');

  // Sub-sitemap 2: Álbumes con Reseñas Comunitarias (Oro SEO)
  const reviewsXml = buildXmlUrlset(reviewedRoutes);
  fs.writeFileSync(path.join(publicDir, 'sitemap-reviews.xml'), reviewsXml, 'utf8');

  // Sub-sitemap 3: Catálogo General
  const catalogXml = buildXmlUrlset(catalogRoutes);
  fs.writeFileSync(path.join(publicDir, 'sitemap-catalog.xml'), catalogXml, 'utf8');

  // Sub-sitemap 4: Perfiles de Artistas
  const artistsXml = buildXmlUrlset(artistRoutes);
  fs.writeFileSync(path.join(publicDir, 'sitemap-artists.xml'), artistsXml, 'utf8');

  // 7. Escribir el Sitemap Index Maestro (sitemap.xml)
  const indexSitemaps = [
    { loc: `${BASE_URL}/sitemap-core.xml`, lastmod: today },
    { loc: `${BASE_URL}/sitemap-reviews.xml`, lastmod: today },
    { loc: `${BASE_URL}/sitemap-catalog.xml`, lastmod: today },
    { loc: `${BASE_URL}/sitemap-artists.xml`, lastmod: today },
  ];
  const indexXml = buildXmlSitemapIndex(indexSitemaps);
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), indexXml, 'utf8');

  const totalUrls = coreRoutes.length + reviewedRoutes.length + catalogRoutes.length + artistRoutes.length;

  console.log('✅ Arquitectura de Sitemaps generada exitosamente:');
  console.log(`   🌟 sitemap-core.xml:     ${coreRoutes.length} URLs (Páginas maestras)`);
  console.log(`   🏆 sitemap-reviews.xml:  ${reviewedRoutes.length} URLs (Álbumes con reseñas reales)`);
  console.log(`   💿 sitemap-catalog.xml:  ${catalogRoutes.length} URLs (Catálogo general)`);
  console.log(`   🎤 sitemap-artists.xml:  ${artistRoutes.length} URLs (Perfiles de artistas)`);
  console.log(`   📑 sitemap.xml:          Sitemap Index maestro que agrupa los 4 submódulos.`);
  console.log(`   🌐 Total de URLs:        ${totalUrls} URLs indexables.`);

  return {
    totalUrls,
    core: coreRoutes.length,
    reviews: reviewedRoutes.length,
    catalog: catalogRoutes.length,
    artists: artistRoutes.length,
  };
}

if (require.main === module) {
  generateSitemap().catch(console.error);
}

module.exports = { generateSitemap, slugify, getReleaseTypePrefix };
