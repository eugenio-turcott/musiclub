import { NextResponse } from 'next/server';
import { enrichAndInsertAlbum } from '../../../../services/albumEnrichmentService';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body || !body.album_name) {
      return NextResponse.json(
        { success: false, error: 'Falta el nombre del álbum (album_name)' },
        { status: 400 }
      );
    }

    const result = await enrichAndInsertAlbum(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Error enriqueciendo álbum' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Error en /api/albums/enrich:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
