import { getPublicCatalog, getPublicAlbum } from '../../../server/catalog';
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { authorize } from '../../../server/authorize';

export async function GET(request) {
  try {
    const slug = new URL(request.url).searchParams.get('slug');
    const data = slug ? await getPublicAlbum(slug) : await getPublicCatalog();
    if (!data) return NextResponse.json({ error: 'Lanzamiento no encontrado' }, { status: 404 });
    return NextResponse.json(data);
  } catch { return NextResponse.json({ error: 'Catálogo temporalmente no disponible' }, { status: 503 }); }
}
export async function POST(request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;
  revalidateTag('catalog', { expire: 0 });
  return NextResponse.json({ success: true });
}
