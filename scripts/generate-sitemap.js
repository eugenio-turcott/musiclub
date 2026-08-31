// scripts/generate-sitemap.js
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { POPULAR_ALBUMS } = require('./popularMusicData');
require('dotenv').config();

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://nzsuxrycbywbdyidvsfl.supabase.co';
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'sb_publishable_8CYM-sB7DY1_cyw8Amyr9g_-JtuZEKO';
const BASE_URL = 'https://musiclub.org';

function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateSitemap() {
  console.log('Generating sitemap.xml...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: albums, error } = await supabase
    .from('albums')
    .select('album_name, artist_name, created_at');

  if (error) {
    console.warn('Error fetching albums for sitemap:', error.message);
  }

  const staticRoutes = [
    { loc: `${BASE_URL}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${BASE_URL}/albumes`, priority: '0.9', changefreq: 'daily' },
    { loc: `${BASE_URL}/leaderboard`, priority: '0.8', changefreq: 'daily' },
    { loc: `${BASE_URL}/reviews`, priority: '0.8', changefreq: 'daily' },
    { loc: `${BASE_URL}/recomendaciones`, priority: '0.7', changefreq: 'weekly' },
    { loc: `${BASE_URL}/gashapon`, priority: '0.6', changefreq: 'weekly' },
    { loc: `${BASE_URL}/faq`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${BASE_URL}/patch-notes`, priority: '0.4', changefreq: 'weekly' },
    { loc: `${BASE_URL}/privacy`, priority: '0.3', changefreq: 'monthly' },
    { loc: `${BASE_URL}/terms`, priority: '0.3', changefreq: 'monthly' },
  ];

  const albumMap = new Map();
  const artistSet = new Set();

  // 1. Álbumes existentes en la Base de Datos de Supabase
  (albums || []).forEach((alb) => {
    const albumName = alb.album_name;
    const artistName = alb.artist_name;
    if (albumName) {
      const slug = slugify(albumName);
      albumMap.set(slug, {
        loc: `${BASE_URL}/albumes/${slug}`,
        lastmod: alb.updated_at || alb.created_at || new Date().toISOString(),
        priority: '0.8',
        changefreq: 'weekly',
      });
    }
    if (artistName) {
      artistSet.add(artistName);
    }
  });

  // 2. Curaduría de álbumes y artistas populares para Programmatic SEO On-Demand
  (POPULAR_ALBUMS || []).forEach((item) => {
    if (item.album) {
      const slug = slugify(item.album);
      if (!albumMap.has(slug)) {
        albumMap.set(slug, {
          loc: `${BASE_URL}/albumes/${slug}`,
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

  const albumRoutes = Array.from(albumMap.values());
  const artistRoutes = Array.from(artistSet).map((art) => ({
    loc: `${BASE_URL}/artista/${slugify(art)}`,
    lastmod: new Date().toISOString(),
    priority: '0.7',
    changefreq: 'weekly',
  }));

  const allUrls = [...staticRoutes, ...albumRoutes, ...artistRoutes];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
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

  const publicPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  fs.writeFileSync(publicPath, xml, 'utf8');
  console.log(`✅ sitemap.xml generated with ${allUrls.length} URLs at ${publicPath}`);
}

generateSitemap().catch(console.error);
