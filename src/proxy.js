import { NextResponse } from 'next/server';

export function proxy(request) {
  const headers = new Headers(request.headers);
  headers.set('x-musiclub-pathname', request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}
export const config = { matcher: ['/albumes/:path*', '/albums/:path*', '/eps/:path*', '/ep/:path*',
  '/sencillos/:path*', '/singles/:path*', '/single/:path*', '/compilaciones/:path*', '/compilations/:path*',
  '/remixes/:path*', '/remix/:path*', '/release/:path*', '/lanzamiento/:path*',
  '/artista/:path*', '/artistas/:path*', '/artist/:path*', '/artists/:path*'] };
