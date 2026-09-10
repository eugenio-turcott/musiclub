import { NextResponse } from 'next/server';
import { getTrendingReleases } from '../../../services/trendingService';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1 hora de caché en Vercel Edge

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const result = await getTrendingReleases({ forceRefresh, limit });

    return NextResponse.json(
      {
        ...result,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control':
            'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al obtener tendencias musicales',
        releases: [],
      },
      { status: 500 }
    );
  }
}
