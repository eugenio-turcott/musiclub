import { getPublicCatalog } from './catalog';
import sitemapData from '../utils/sitemapData.cjs';

export async function sitemapResponse(section) {
  try {
    const data = section === 'index' ? null : await getPublicCatalog();
    const xml = section === 'index' ? sitemapData.indexXml() :
      sitemapData.sitemapXml(sitemapData.buildSitemapGroups(data.albums, data.reviews)[section]);
    return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
  } catch {
    return new Response('Sitemap temporalmente no disponible', { status: 503, headers: { 'Retry-After': '300' } });
  }
}
