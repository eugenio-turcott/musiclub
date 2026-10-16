import { sitemapResponse } from '../../server/sitemaps';
export const dynamic = 'force-dynamic';
export function GET() { return sitemapResponse('artists'); }
