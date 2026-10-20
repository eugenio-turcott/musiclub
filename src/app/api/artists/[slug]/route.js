export const maxDuration = 60;
import { NextResponse } from 'next/server';
import { getPublicArtist } from '../../../../server/catalog';

export async function GET(request, { params }) {
  const { slug } = await params;
  if (!slug || slug.length > 180) return NextResponse.json({ error: 'Artista inválido' }, { status: 400 });
  const artist = await getPublicArtist(slug);
  return artist ? NextResponse.json(artist, { headers: { 'Cache-Control': 'no-store' } })
    : NextResponse.json({ error: 'Artista no encontrado' }, { status: 404 });
}
