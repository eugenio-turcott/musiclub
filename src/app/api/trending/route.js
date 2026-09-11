import { NextResponse } from 'next/server';
import {
  getTrendingReleases,
  getMonthlyTrendingReleases,
  getAnticipatedReleases,
} from '../../../services/trendingService';

export const dynamic = 'force-dynamic';
export const revalidate = 1800; // 30 minutos de caché en edge

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'catalog';
    const forceRefresh = searchParams.get('refresh') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let result;
    if (type === 'weekly' || type === 'monthly' || type === 'recordclub') {
      result = await getMonthlyTrendingReleases({ forceRefresh, limit });
    } else if (type === 'anticipated' || type === 'upcoming') {
      const list = await getAnticipatedReleases();
      result = { success: true, releases: Array.isArray(list) ? list : [] };
    } else {
      result = await getTrendingReleases({ forceRefresh, limit });
    }

    return NextResponse.json(
      {
        ...result,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control':
            'public, s-maxage=1800, stale-while-revalidate=86400',
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

