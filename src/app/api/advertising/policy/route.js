import {getCloudflareContext} from '@opennextjs/cloudflare';
import policy from '../../../../utils/advertisingPolicy.cjs';

export const dynamic = 'force-dynamic';

export function GET() {
  let country;
  try { country = getCloudflareContext().cf?.country; } catch {}
  // Trust only the edge context, never user-supplied headers or URL parameters.
  // The response contains no IP, country, account data or advertising identifiers.
  return Response.json({mode:policy.advertisingMode(country)}, {
    headers:{'Cache-Control':'private, no-store, max-age=0', 'CDN-Cache-Control':'no-store'},
  });
}
