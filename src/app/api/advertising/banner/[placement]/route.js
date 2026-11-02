import placements from '../../../../../utils/adsterraPlacements.cjs';

export async function GET(_request,{params}) {
  const {placement}=await params;
  const banner=Object.values(placements.BANNERS).find(value=>value.id===placement);
  if(!banner) return new Response('Unknown placement',{status:404});
  // A real document URL works consistently in isolated frames across browsers.
  // Only our fixed, public placement codes can produce this document.
  return new Response(placements.bannerDocument(banner),{headers:{
    'Content-Type':'text/html; charset=utf-8',
    'Cache-Control':'private, no-store',
    'Referrer-Policy':'strict-origin',
    'X-Robots-Tag':'noindex, nofollow',
    'Content-Security-Policy':"frame-ancestors 'self'",
  }});
}
