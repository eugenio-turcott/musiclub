import { getPublicCatalog, getPublicAlbum, getPublicCollection } from '../../../server/catalog';
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { authorize } from '../../../server/authorize';

export async function GET(request) {
  try {
    const params = new URL(request.url).searchParams;
    if (params.get('view') === 'collection') return NextResponse.json({albums:await getPublicCollection()}, {headers:{'Cache-Control':'public, s-maxage=300, stale-while-revalidate=60'}});
    const slug = params.get('slug');
    const data = slug ? await getPublicAlbum(slug) : await getPublicCatalog();
    if (!data) return NextResponse.json({ error: 'Lanzamiento no encontrado' }, { status: 404 });
    const {rawAlbums,...response}=data;
    return NextResponse.json(slug ? data : response);
  } catch { return NextResponse.json({ error: 'Catálogo temporalmente no disponible' }, { status: 503 }); }
}
export async function POST(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;
  revalidateTag('catalog', { expire: 0 });
  return NextResponse.json({ success: true });
}
